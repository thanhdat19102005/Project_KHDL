import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCallback, useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  ShieldCheck, 
  Bell, 
  Settings, 
  LogOut,
  ChevronRight,
  Target,
  FileBarChart,
  FileDown,
  Loader2,
} from 'lucide-react';
import OverviewPage from './pages/OverviewPage';
import SegmentationPage from './pages/SegmentationPage';
import ReportPage from './pages/ReportPage';
import { useDataSource } from './hooks/useDashboard';
import DashboardHeader from './components/DashboardHeader';
import TestController from './components/TestController';
import CombinedPdfCapture from './components/CombinedPdfCapture';
import { exportCombinedReport } from './utils/exportPdf';

function AppContent() {
  const { lastRefresh } = useDataSource();
  const location = useLocation();
  const [isPdfExporting, setIsPdfExporting] = useState(false);

  const handleExportCombined = useCallback(async () => {
    setIsPdfExporting(true);
    try {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const datePart = `${pad(now.getDate())}-${pad(now.getMonth()+1)}-${now.getFullYear()}`;
      await exportCombinedReport(`KHDL_BaoCaoTongHop_${datePart}`);
    } finally {
      setIsPdfExporting(false);
    }
  }, []);



  const menuItems = [
    { path: '/', label: 'Tổng quan', icon: LayoutDashboard },
    { path: '/segmentation', label: 'Phân khúc', icon: Target },
    { path: '/reports', label: 'Báo cáo', icon: FileBarChart },
  ];

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* SIDEBAR */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shadow-xl shadow-slate-200/50 relative z-20">
        <div className="p-8">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-4 mb-10 group cursor-pointer"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <motion.div 
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                className="relative w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/20 animate-float"
              >
                <ShieldCheck className="text-white w-8 h-8" />
              </motion.div>
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tighter leading-none mb-1">
                Project<span className="text-blue-600">_KHDL</span>
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hệ điều hành Phân tích</p>
            </div>
          </motion.div>

          <nav className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-2">Menu chính</p>
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <item.icon size={22} className={isActive ? 'text-white' : 'group-hover:text-blue-600 transition-colors'} />
                    <span className="font-bold text-sm tracking-tight">{item.label}</span>
                  </div>
                  {isActive && <ChevronRight size={16} className="text-white/70" />}
                </Link>
              );
            })}
          </nav>

          {/* ── Export PDF button ── */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={handleExportCombined}
              disabled={isPdfExporting}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isPdfExporting ? (
                <><Loader2 size={16} className="animate-spin" /><span>Đang xuất...</span></>
              ) : (
                <><FileDown size={16} /><span>Xuất PDF Tổng hợp</span></>
              )}
            </button>
          </div>
        </div>


      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] relative">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-1/2 h-96 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-1/2 h-96 bg-gradient-to-t from-indigo-50/50 to-transparent pointer-events-none"></div>

        <DashboardHeader lastRefresh={lastRefresh} />

        {/* Hidden off-screen capture area – always mounted for combined PDF export */}
        <CombinedPdfCapture />

        <div className="p-10 flex-1 overflow-auto relative z-0">
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/segmentation" element={<SegmentationPage />} />
            <Route path="/reports" element={<ReportPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        {/* TEST CONTROLLER */}
        <TestController />
      </main>
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
