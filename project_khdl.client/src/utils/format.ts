export function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined) return '0';
  return n.toLocaleString('vi-VN');
}

export function formatCompact(n: number | null | undefined): string {
  if (n === null || n === undefined) return '0';
  return new Intl.NumberFormat('vi-VN', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(n);
}
