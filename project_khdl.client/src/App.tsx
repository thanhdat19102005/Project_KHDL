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
        <nav className="flex-1 px-4 py-4 space-y-1 text-center">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `block px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            Tổng quan
          </NavLink>
          <NavLink
            to="/segmentation"
            className={({ isActive }) =>
              `block px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
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
