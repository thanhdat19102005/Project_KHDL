/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from 'react';
import {
    ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import { useClusterSummaries, useSegmentScatter, useSegmentInsights, useSegmentUsersTable } from '@/hooks/useDashboard';
import { formatNumber } from '@/utils/format';

export default function SegmentationPage() {
    // Lấy dữ liệu từ các Hook (Backend đã trả về segmentName nhờ Mapping Layer)
    const { data: summaries, loading: summaryLoading } = useClusterSummaries();
    const { data: scatter, loading: scatterLoading } = useSegmentScatter();
    const insights = useSegmentInsights();

    // State cho Section 5: Bảng dữ liệu
    const [search, setSearch] = useState('');
    const [clusterFilter, setClusterFilter] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const { data: tableUsers, totalCount, loading: tableLoading } = useSegmentUsersTable(search, clusterFilter, page);

    const totalPages = Math.ceil(totalCount / 15);

    // Xử lý dữ liệu Scatter Plot (Section 2)
    const scatterData = useMemo(() => {
        return scatter.map((p: any) => ({
            ...p,
            x: p.x,
            y: p.y,
            // mapping màu từ summaries dựa trên cluster id
            fill: summaries.find(s => s.cluster === p.cluster)?.color || '#9ca3af'
        }));
    }, [scatter, summaries]);

    return (
        <div className="p-1 space-y-6">
            <h1 className="text-xl font-bold text-slate-800 mb-4 uppercase tracking-tighter">Customer Segmentation Dashboard</h1>

            {/* SECTION 1 — Cluster Summary Cards (Đã map Segment Name) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {summaries.map((s) => (
                    <div key={s.cluster} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm border-t-4" style={{ borderTopColor: s.color }}>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                                {s.segmentName} {/* HIỂN THỊ BUSINESS NAME TỪ BACKEND MAPPING */}
                            </span>
                            <span className="text-[9px] font-bold px-2 py-0.5 bg-gray-100 rounded text-gray-400">ID: {s.cluster}</span>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">Total Users</p>
                                <p className="text-2xl font-black text-slate-700">{formatNumber(s.totalUsers)}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-y-2 border-t border-gray-50 pt-3">
                                <div>
                                    <p className="text-[9px] text-gray-400 font-bold uppercase">Avg Search</p>
                                    <p className="text-xs font-bold text-slate-600">{s.avgTotalSearch}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] text-gray-400 font-bold uppercase">Avg Keywords</p>
                                    <p className="text-xs font-bold text-slate-600">{s.avgUniqueKeywords}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] text-gray-400 font-bold uppercase">Avg Categories</p>
                                    <p className="text-xs font-bold text-slate-600">{s.avgCategories}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] text-gray-400 font-bold uppercase">Avg Search/Mo</p>
                                    <p className="text-xs font-bold text-slate-600">{s.avgSearchPerMonth}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* SECTION 2 — Scatter Plot (Tooltip dùng segmentName) */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-700 mb-6 uppercase tracking-tight">Hành vi người dùng: Search Activity & Diversity</h3>
                    <div className="h-[400px]">
                        {scatterLoading ? (
                            <div className="h-full flex items-center justify-center text-gray-400 text-xs">Đang xử lý dữ liệu...</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 10, right: 30, bottom: 20, left: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis type="number" dataKey="x" name="Total Search" fontSize={10} axisLine={false} tickLine={false} />
                                    <YAxis type="number" dataKey="y" name="Unique Keywords" fontSize={10} axisLine={false} tickLine={false} />
                                    <ZAxis range={[60, 60]} />
                                    <Tooltip
                                        cursor={{ strokeDasharray: '3 3' }}
                                        formatter={(value, name, props: any) => [value, props.payload.segmentName]} // HIỂN THỊ BUSINESS NAME TRONG TOOLTIP
                                    />
                                    <Scatter name="Customers" data={scatterData}>
                                        {scatterData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} opacity={0.6} />
                                        ))}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* SECTION 3 — Segment Distribution (Donut Chart dùng nameKey từ mapping) */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-700 mb-6 uppercase tracking-tight">Phân bổ quy mô phân khúc</h3>
                    <div className="h-[400px] flex flex-col items-center justify-center">
                        <ResponsiveContainer width="100%" height="80%">
                            <PieChart>
                                <Pie
                                    data={summaries}
                                    dataKey="totalUsers"
                                    nameKey="segmentName" // HIỂN THỊ TÊN PHÂN KHÚC TRÊN BIỂU ĐỒ
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={5}
                                >
                                    {summaries.map((s: any, i: number) => <Cell key={i} fill={s.color} />)}
                                </Pie>
                                <Tooltip />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* SECTION 4 — Segment Insight Box (Tên phân khúc in nghiêng) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {insights.map((ins: any) => (
                    <div key={ins.cluster} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ins.color }} />
                            <h3 className="text-[10px] font-black text-slate-800 uppercase italic">
                                {ins.segmentName} {/* BUSINESS NAME TỪ BACKEND */}
                            </h3>
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">{ins.title}</p>
                        <p className="text-xs text-gray-500 leading-relaxed italic">{ins.text}</p>
                    </div>
                ))}
            </div>

            {/* SECTION 5 — Segment Customer Table (Chỉ hiển thị Name, không hiển thị ID) */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex flex-wrap gap-4 items-center justify-between bg-slate-50/50">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight">Danh sách chi tiết theo nhóm</h3>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Tìm mã KH..."
                            className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 ring-blue-50 w-48"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        />
                        <select
                            className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 ring-blue-50"
                            value={clusterFilter ?? ''}
                            onChange={(e) => { setClusterFilter(e.target.value ? parseInt(e.target.value) : null); setPage(1); }}
                        >
                            <option value="">Tất cả phân khúc</option>
                            {summaries.map(s => <option key={s.cluster} value={s.cluster}>{s.segmentName}</option>)}
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4">Customer ID</th>
                                <th className="px-6 py-4 text-center">Segment Name</th> {/* TIÊU ĐỀ CỘT BUSINESS */}
                                <th className="px-6 py-4 text-right">Total Search</th>
                                <th className="px-6 py-4 text-right">Unique Keywords</th>
                                <th className="px-6 py-4 text-right">Total Categories</th>
                                <th className="px-6 py-4 text-right">Avg Search/Mo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {tableUsers.map((u: any) => (
                                <tr key={u.customerId} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="px-6 py-4 font-mono font-bold text-slate-600">{u.customerId}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="px-3 py-1 rounded-full text-[9px] font-black text-white uppercase shadow-sm" style={{ backgroundColor: summaries.find(s => s.cluster === u.cluster)?.color }}>
                                            {u.segmentName} {/* CHỈ HIỂN THỊ BUSINESS NAME */}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-700">{formatNumber(u.totalSearch)}</td>
                                    <td className="px-6 py-4 text-right text-gray-500">{u.uniqueKeywords}</td>
                                    <td className="px-6 py-4 text-right text-gray-500">{u.totalCategories}</td>
                                    <td className="px-6 py-4 text-right font-mono text-blue-600 font-bold">{u.avgSearchMonth}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Table Pagination */}
                <div className="p-4 bg-slate-50 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-[10px] text-gray-400 italic">Hiển thị {tableUsers.length} trên {formatNumber(totalCount)} khách hàng</p>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Trang {page} / {totalPages}</span>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1 || tableLoading}
                                className="px-3 py-1 border border-gray-200 rounded bg-white text-[10px] font-black uppercase disabled:opacity-30"
                            >
                                Trước
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages || tableLoading}
                                className="px-3 py-1 border border-gray-200 rounded bg-white text-[10px] font-black uppercase disabled:opacity-30"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}