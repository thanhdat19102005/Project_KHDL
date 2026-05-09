import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Agentation } from 'agentation';
import OverviewPage from '@/pages/OverviewPage';
import SegmentationPage from '@/pages/SegmentationPage';
import { useKpi } from '@/hooks/useDashboard';

function Layout() {
  const { data, loading } = useKpi();

  useEffect(() => {
    console.log('[DEBUG] KPI Data:', data);
    console.log('[DEBUG] KPI Loading:', loading);
  }, [data, loading]);

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-slate-700 text-center">
          <h1 className="text-lg font-bold tracking-wide">Project_KHDL</h1>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><rect width="7" height="7" x="14" y="14"/><rect width="7" height="7" x="3" y="14"/><rect width="7" height="7" x="14" y="3"/><rect width="7" height="7" x="3" y="3"/></svg>
            Tổng quan
          </NavLink>
          <NavLink
            to="/segmentation"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Phân khúc
          </NavLink>
        </nav>
        <div className="px-6 py-4 border-t border-slate-700 text-xs text-slate-400 text-center">
          Data Updated: {data?.updatedAt ? new Date(data.updatedAt).toLocaleString('vi-VN') : '...'}
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
          <h2 className="text-base font-semibold text-gray-800">Dashboard</h2>
          <div className="text-sm text-gray-500">
            Data Updated: {data?.updatedAt ? new Date(data.updatedAt).toLocaleString('vi-VN') : '...'}
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6">
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/segmentation" element={<SegmentationPage />} />
          </Routes>
        </div>
      </main>
      <Agentation />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}
