import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

// Silence cross-origin CSS SecurityError from Google Fonts
function patchCssRules(): () => void {
  const desc = Object.getOwnPropertyDescriptor(CSSStyleSheet.prototype, 'cssRules');
  if (!desc?.get) return () => {};
  const orig = desc.get;
  Object.defineProperty(CSSStyleSheet.prototype, 'cssRules', {
    get() { try { return orig.call(this); } catch { return [] as unknown as CSSRuleList; } },
    configurable: true,
  });
  return () => Object.defineProperty(CSSStyleSheet.prototype, 'cssRules', desc);
}

// Render header band via Canvas so Vietnamese text renders correctly
async function buildHeaderCanvas(title: string, subtitle: string, width: number, height: number): Promise<HTMLCanvasElement> {
  const dpr = 2;
  const c = document.createElement('canvas');
  c.width = width * dpr; c.height = height * dpr;
  const ctx = c.getContext('2d')!;
  ctx.scale(dpr, dpr);
  const g = ctx.createLinearGradient(0, 0, width, 0);
  g.addColorStop(0, '#4f46e5'); g.addColorStop(1, '#6366f1');
  ctx.fillStyle = g; ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(0, height - 3, width, 3);
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.round(height * 0.3)}px "Inter","Segoe UI",Arial,sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.fillText(title, 20, height * 0.38);
  ctx.font = `${Math.round(height * 0.2)}px "Inter","Segoe UI",Arial,sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillText(subtitle, 20, height * 0.72);
  return c;
}

// Capture a DOM element to an Image
async function captureElement(el: HTMLElement): Promise<HTMLImageElement> {
  const restore = patchCssRules();
  let dataUrl: string;
  try {
    dataUrl = await toPng(el, {
      pixelRatio: 2,
      backgroundColor: '#f8fafc',
      skipFonts: true,
      filter: (node) => {
        if (node instanceof HTMLElement) {
          if (node.getAttribute('role') === 'tooltip') return false;
          if (node.classList.contains('recharts-tooltip-wrapper')) return false;
        }
        return true;
      },
    });
  } finally {
    restore();
  }
  const img = new Image();
  await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; img.src = dataUrl; });
  return img;
}

// Show native OS "Save As" dialog — must be called before heavy async work
async function requestSaveHandle(suggestedName: string): Promise<FileSystemFileHandle | null> {
  if (!('showSaveFilePicker' in window)) return null;
  try {
    return await (window as any).showSaveFilePicker({
      suggestedName,
      types: [{ description: 'PDF Document', accept: { 'application/pdf': ['.pdf'] } }],
    });
  } catch (err: any) {
    if (err?.name === 'AbortError') throw err; // User cancelled
    console.warn('[exportPdf] showSaveFilePicker unavailable:', err?.message);
    return null;
  }
}

// Write blob to handle (native save) or fall back to <a download>
async function savePdf(blob: Blob, handle: FileSystemFileHandle | null, filename: string): Promise<void> {
  if (handle) {
    const w = await handle.createWritable();
    await w.write(blob);
    await w.close();
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 500);
}

// Slice an image across PDF pages
function sliceImageToPdf(
  pdf: jsPDF, img: HTMLImageElement,
  pdfW: number, pdfH: number, margin: number,
  firstTopY: number, addPageBeforeFirst: boolean,
): void {
  const contentW = pdfW - margin * 2;
  const scalePt  = contentW / img.naturalWidth;
  const totalPtH = img.naturalHeight * scalePt;
  let printed = 0, first = true;
  while (printed < totalPtH) {
    if (!first || addPageBeforeFirst) pdf.addPage();
    const topY   = (first && !addPageBeforeFirst) ? firstTopY : margin;
    const availH = pdfH - topY - margin;
    const srcY   = printed / scalePt;
    const srcH   = Math.min(availH / scalePt, img.naturalHeight - srcY);
    const slice  = document.createElement('canvas');
    slice.width = img.naturalWidth; slice.height = Math.ceil(srcH);
    slice.getContext('2d')!.drawImage(img, 0, srcY, img.naturalWidth, srcH, 0, 0, img.naturalWidth, srcH);
    pdf.addImage(slice.toDataURL('image/png'), 'PNG', margin, topY, contentW, srcH * scalePt);
    printed += availH; first = false;
  }
}

// Add page numbers footer
function addFooter(pdf: jsPDF, pdfW: number, pdfH: number): void {
  const total = pdf.getNumberOfPages();
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(150, 150, 150);
  for (let i = 1; i <= total; i++) {
    pdf.setPage(i);
    pdf.text(`Trang ${i} / ${total}  |  Project KHDL - Customer Analytics Dashboard`, pdfW / 2, pdfH - 10, { align: 'center' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: Export both Overview + Segmentation into one combined PDF
// ─────────────────────────────────────────────────────────────────────────────
export async function exportCombinedReport(filename: string): Promise<void> {
  const suggestedName = `${filename}.pdf`;

  // Step 1: Show Save-As dialog FIRST (must be within user gesture window)
  let handle: FileSystemFileHandle | null = null;
  try {
    handle = await requestSaveHandle(suggestedName);
  } catch {
    return; // User cancelled
  }

  // Step 2: Generate PDF (inside try-catch so 0KB file never happens silently)
  try {
    const overviewEl = document.getElementById('overview-pdf-area');
    const segmentEl  = document.getElementById('segment-pdf-area');
    if (!overviewEl && !segmentEl) {
      alert('Không tìm thấy vùng dữ liệu PDF. Vui lòng tải lại trang.');
      return;
    }

    const pdfW = 595.28, pdfH = 841.89, margin = 24;
    const headerH = 72, headerPt = 68;
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const ts  = `${pad(now.getDate())}/${pad(now.getMonth()+1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

    // Cover header
    const coverCanvas = await buildHeaderCanvas(
      'BAO CAO PHAN TICH KHACH HANG TONG HOP',
      `Xuat luc: ${ts}  |  Project KHDL - Customer Analytics Dashboard`,
      Math.round(pdfW), headerH,
    );
    pdf.addImage(coverCanvas.toDataURL('image/png'), 'PNG', 0, 0, pdfW, headerPt);

    // Overview section
    if (overviewEl) {
      const img = await captureElement(overviewEl);
      const contentW = pdfW - margin * 2;
      const scalePt  = contentW / img.naturalWidth;
      const totalPtH = img.naturalHeight * scalePt;
      let printed = 0, first = true;
      while (printed < totalPtH) {
        if (!first) pdf.addPage();
        const topY   = first ? headerPt + 6 : margin;
        const availH = pdfH - topY - margin;
        const srcY   = printed / scalePt;
        const srcH   = Math.min(availH / scalePt, img.naturalHeight - srcY);
        const slice  = document.createElement('canvas');
        slice.width = img.naturalWidth; slice.height = Math.ceil(srcH);
        slice.getContext('2d')!.drawImage(img, 0, srcY, img.naturalWidth, srcH, 0, 0, img.naturalWidth, srcH);
        pdf.addImage(slice.toDataURL('image/png'), 'PNG', margin, topY, contentW, srcH * scalePt);
        printed += availH; first = false;
      }
    }

    // Segment section (starts on new page; image already has banner at top)
    if (segmentEl) {
      const segImg = await captureElement(segmentEl);
      sliceImageToPdf(pdf, segImg, pdfW, pdfH, margin, margin, true);
    }

    addFooter(pdf, pdfW, pdfH);
    await savePdf(pdf.output('blob'), handle, suggestedName);

  } catch (err: any) {
    console.error('[exportPdf] Generation failed:', err);
    alert(`Lỗi khi xuất PDF:\n${err?.message || err}\n\nVui lòng thử lại.`);
  }
}

/**
 * Export a single DOM section to PDF with Save As dialog.
 */
export async function exportSectionToPdf(
  elementId: string,
  filename: string,
  title: string,
): Promise<void> {
  const suggestedName = `${filename}.pdf`;
  let handle: FileSystemFileHandle | null = null;
  try {
    handle = await requestSaveHandle(suggestedName);
  } catch {
    return;
  }

  try {
    const el = document.getElementById(elementId);
    if (!el) { alert(`Không tìm thấy #${elementId}`); return; }

    const pdfW = 595.28, pdfH = 841.89, margin = 24;
    const headerH = 72, headerPt = 68;
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const ts  = `${pad(now.getDate())}/${pad(now.getMonth()+1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const img          = await captureElement(el);
    const headerCanvas = await buildHeaderCanvas(title, `Xuat luc: ${ts}  |  Project KHDL`, Math.round(pdfW), headerH);
    const pdf          = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    pdf.addImage(headerCanvas.toDataURL('image/png'), 'PNG', 0, 0, pdfW, headerPt);
    sliceImageToPdf(pdf, img, pdfW, pdfH, margin, headerPt + 10, false);
    addFooter(pdf, pdfW, pdfH);
    await savePdf(pdf.output('blob'), handle, suggestedName);

  } catch (err: any) {
    console.error('[exportPdf] Section export failed:', err);
    alert(`Lỗi khi xuất PDF:\n${err?.message || err}`);
  }
}
