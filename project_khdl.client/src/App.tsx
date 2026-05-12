import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  ShieldCheck, 
  Bell, 
  Settings, 
  LogOut,
  ChevronRight,
  Target
} from 'lucide-react';
import OverviewPage from './pages/OverviewPage';
import SegmentationPage from './pages/SegmentationPage';
import TestController from './components/TestController';
import { useDataSource } from './hooks/useDashboard';

export default function App() {
  const { lastRefresh } = useDataSource();

  const menuItems = [
    { path: '/', label: 'Tổng quan', icon: LayoutDashboard },
    { path: '/segmentation', label: 'Phân khúc', icon: Target },
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
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Analytics OS</p>
            </div>
          </motion.div>

          <nav className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-2">Main Menu</p>
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
        </div>

        <div className="mt-auto p-8 border-t border-slate-100">
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors cursor-pointer group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 font-bold">
              AD
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-black text-slate-800 truncate">Admin Team</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Project Group</p>
            </div>
            <LogOut size={16} className="text-slate-400 group-hover:text-red-500 transition-colors" />
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] relative">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-1/2 h-96 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-1/2 h-96 bg-gradient-to-t from-indigo-50/50 to-transparent pointer-events-none"></div>

        <header className="h-24 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping absolute"></div>
              <div className="w-3 h-3 bg-emerald-500 rounded-full relative z-10 border-2 border-white"></div>
            </div>
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">System Live</span>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="relative p-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer group">
                <Bell size={20} className="text-slate-600 group-hover:text-blue-600 transition-colors" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer group">
                <Settings size={20} className="text-slate-600 group-hover:text-blue-600 transition-colors" />
              </div>
            </div>
            <div className="h-10 w-[1px] bg-slate-200"></div>
            <p className="text-xs font-bold text-slate-400 italic">
              Data Updated: <span className="text-slate-800 not-italic font-black">
                {new Date(lastRefresh).toLocaleTimeString()} {new Date(lastRefresh).toLocaleDateString()}
              </span>
            </p>
          </div>
        </header>

        <div className="p-10 flex-1 overflow-auto relative z-0">
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/segmentation" element={<SegmentationPage />} />
          </Routes>
        </div>

        {/* TEST CONTROLLER */}
        <TestController />
      </main>
    </div>
  );
}
