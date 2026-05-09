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
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="px-6 py-6 text-center border-b border-gray-100">
          <h1 className="text-xl font-bold tracking-wide text-blue-900">Project_KHDL</h1>
        </div>
        <div className="px-4 py-4 flex-1">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Menu</p>
          <nav className="space-y-1.5">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                }`
              }
            >
              <div className="p-1.5 bg-blue-100/80 rounded-lg text-blue-600 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>
              </div>
              Tổng quan
            </NavLink>
            <NavLink
              to="/segmentation"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                }`
              }
            >
              <div className="p-1.5 bg-amber-100/80 rounded-lg text-amber-600 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
              </div>
              Phân khúc
            </NavLink>
          </nav>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 text-xs text-gray-400 text-center bg-gray-50">
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
