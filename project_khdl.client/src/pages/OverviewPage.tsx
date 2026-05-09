/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from 'react';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Legend,
    PieChart,
    Pie,
    Cell,
} from 'recharts';

import {
    useKpi,
    useSearchDistribution,
    useMonthlyTrend,
    useTopKeywords,
    useUsers,
    useUserDetail,
    useUserInsight,
    useTopCategories,
    usePlatformDistribution,
} from '@/hooks/useDashboard';

import type { UserItem } from '@/types';
import { formatNumber } from '@/utils/format';

const clusterConfig: Record<
    number,
    { label: string; bg: string; text: string }
> = {
    0: { label: 'VIP', bg: 'bg-emerald-100', text: 'text-emerald-700' },
    1: { label: 'Nguy cơ rời bỏ', bg: 'bg-amber-100', text: 'text-amber-700' },
    2: { label: 'Không hoạt động', bg: 'bg-gray-200', text: 'text-gray-700' },
};

const PLATFORM_COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#f43f5e', '#ec4899', '#d946ef', '#a855f7',
    '#22c55e', '#eab308', '#6366f1', '#f97316', '#ec4899'
];

// Hàm vẽ chú thích "đám mây" chấm tròn tự xuống hàng
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderCustomLegend = (props: any) => {
    const { payload } = props;
    return (
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-2 px-2 mt-4 pb-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {payload.map((entry: any, index: number) => (
                <div key={`item-${index}`} className="flex items-center space-x-1">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-[10px] font-semibold" style={{ color: entry.color }}>{entry.value}</span>
                </div>
            ))}
        </div>
    );
};

export default function OverviewPage() {
    const { data: kpi } = useKpi();
    const factSearchTrend = useSearchDistribution() ?? [];
    const monthlyTrendRaw = useMonthlyTrend() ?? [];
    const hourData = [...monthlyTrendRaw].sort((a, b) => a.search_hour - b.search_hour);
    const keywords = useTopKeywords() ?? [];
    const { data: categoryDataRaw, loading: categoryLoading } = useTopCategories();
    const categoryData = categoryDataRaw ?? [];
    const { data: platformDataRaw } = usePlatformDistribution();
    const platformData = platformDataRaw ?? [];

    const [search, setSearch] = useState('');
    const [clusterFilter, setClusterFilter] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const [keywordLimit, setKeywordLimit] = useState(10);

    // Lấy dữ liệu người dùng & Phân trang
    const { data: users, totalCount, loading: usersLoading } = useUsers(search, clusterFilter, null, page);
    const totalPages = Math.ceil(totalCount / 16);

    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const { data: userDetail } = useUserDetail(selectedUserId);
    const { data: userInsight } = useUserInsight(selectedUserId);

    return (
        <div className="space-y-6">
            {/* KPI SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Tổng người dùng</p>
                    <p className="text-2xl font-bold text-gray-900">{kpi ? formatNumber(kpi.totalUsers) : '...'}</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Tổng lượt tìm kiếm</p>
                    <p className="text-2xl font-bold text-gray-900">{kpi ? formatNumber(kpi.totalSearch) : '...'}</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Trung bình tìm kiếm / người</p>
                    <p className="text-2xl font-bold text-gray-900">{kpi ? formatNumber(Math.round(kpi.avgSearchPerUser)) : '...'}</p>
                </div>
            </div>

            {/* ROW 1: CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm h-[400px]">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4">Xu hướng tìm kiếm theo tháng</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={factSearchTrend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="search_month" fontSize={11} stroke="#9ca3af" />
                                <YAxis fontSize={11} stroke="#9ca3af" />
                                <Tooltip formatter={(v) => [formatNumber(Number(v)), 'Lượt']} />
                                <Line type="monotone" dataKey="total_search" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm h-[400px]">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4">Phân bổ tìm kiếm theo giờ</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={hourData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="search_hour" fontSize={11} stroke="#9ca3af" tickFormatter={(h) => `${h}h`} />
                                <YAxis fontSize={11} stroke="#9ca3af" />
                                <Tooltip formatter={(v) => [formatNumber(Number(v)), 'Lượt']} />
                                <Line type="monotone" dataKey="total_search" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* ROW 2: 3 BOXES EQUAL HEIGHT (650px) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* 1. Từ khóa phổ biến */}
                <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm min-h-[650px] flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-gray-800">Từ khóa phổ biến</h3>
                        <select 
                            className="border rounded-md px-2 py-1 text-xs outline-none text-gray-600 cursor-pointer"
                            value={keywordLimit}
                            onChange={(e) => setKeywordLimit(Number(e.target.value))}
                        >
                            <option value={10}>Top 10</option>
                            <option value={20}>Top 20</option>
                        </select>
                    </div>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={keywords.slice(0, keywordLimit)} layout="vertical">
                                <XAxis type="number" hide /><YAxis dataKey="keyword" type="category" width={120} fontSize={10} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: '#f9fafb' }} /><Bar dataKey="searchCount" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={18} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. BIỂU ĐỒ DONUT (PLATFORM) - ĐÃ KÉO XỊT XUỐNG DƯỚI */}
                <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm min-h-[650px] flex flex-col">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4">Phân bổ Thiết bị (Platform)</h3>
                    <div className="flex-1 overflow-hidden">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={platformData}
                                    cx="50%"
                                    cy="45%" // Kéo vòng tròn xuống trung tâm hơn
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={2}
                                    dataKey="total_search"
                                    nameKey="platform"
                                    stroke="none"
                                >
                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                    {platformData.map((_e: any, index: number) => (
                                        <Cell key={index} fill={PLATFORM_COLORS[index % PLATFORM_COLORS.length]} />
                                    ))}
                                </Pie>
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                <Tooltip formatter={(v, n, p) => [`${formatNumber(Number(v))} lượt (${(p as any).payload?.percentage}%)`, n]} />
                                <Legend content={renderCustomLegend} verticalAlign="bottom" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. Top Danh mục tìm kiếm */}
                <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm min-h-[650px] flex flex-col">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4">Top 10 Danh mục tìm kiếm</h3>
                    <div className="flex-1">
                        {categoryLoading ? <div className="flex h-full items-center justify-center text-gray-400">Đang tải...</div> : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={categoryData} layout="vertical">
                                    <XAxis type="number" hide /><YAxis dataKey="category_name" type="category" width={100} fontSize={10} axisLine={false} tickLine={false} />
                                    <Tooltip /><Bar dataKey="total_search" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            {/* ROW 3: LIST & INSIGHT */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="xl:col-span-2 bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4">Danh sách khách hàng</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                        <input type="text" placeholder="Tìm mã KH..." className="flex-1 border rounded-md px-3 py-1.5 text-sm outline-none" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                        <select className="border rounded-md px-3 py-1.5 text-sm outline-none" value={clusterFilter ?? ''} onChange={(e) => { setClusterFilter(e.target.value ? parseInt(e.target.value) : null); setPage(1); }}>
                            <option value="">Tất cả phân khúc</option><option value="0">VIP</option><option value="1">Nguy cơ rời bỏ</option><option value="2">Không hoạt động</option>
                        </select>
                    </div>

                    <div className="overflow-x-auto text-sm">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                                <tr><th className="px-3 py-2">Mã KH</th><th className="px-3 py-2 text-right">Tổng tìm kiếm</th><th className="px-3 py-2 text-center">Phân khúc</th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {users.map((u: UserItem) => (
                                    <tr key={u.customerId} onClick={() => setSelectedUserId(u.customerId)} className={`cursor-pointer hover:bg-gray-50 transition-colors ${selectedUserId === u.customerId ? 'bg-blue-50' : ''}`}>
                                        <td className="px-3 py-2.5 font-medium">{u.customerId}</td>
                                        <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-700">{formatNumber(u.totalSearch)}</td>
                                        <td className="px-3 py-2.5 text-center">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${clusterConfig[u.cluster]?.bg} ${clusterConfig[u.cluster]?.text}`}>{clusterConfig[u.cluster]?.label}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                        <p className="text-xs text-gray-500 italic">Trang <span className="font-bold text-gray-700">{page}</span> / {totalPages || 1}</p>
                        <div className="flex gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-xs font-semibold border rounded hover:bg-gray-50 disabled:opacity-50 transition-colors">Trước</button>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 text-xs font-semibold border rounded hover:bg-gray-50 disabled:opacity-50 transition-colors">Sau</button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4">Chi tiết & Insight</h3>
                    {userDetail ? (
                        <div className="space-y-4">
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <p className="text-[10px] text-gray-400 uppercase font-black">Mã khách hàng</p>
                                <p className="text-xl font-bold text-slate-800">{userDetail.customerId}</p>
                            </div>
                            <div className="space-y-3 pt-2">
                                <div className="p-2 bg-emerald-50/50 border-l-4 border-emerald-400 rounded-r text-[12px]"><p className="font-bold text-emerald-800 mb-1 italic">Hành vi</p><p>{userInsight?.behavior}</p></div>
                                <div className="p-2 bg-blue-50/50 border-l-4 border-blue-400 rounded-r text-[12px]"><p className="font-bold text-blue-800 mb-1 italic">Ý nghĩa</p><p>{userInsight?.meaning}</p></div>
                                <div className="p-2 bg-purple-50/50 border-l-4 border-purple-400 rounded-r text-[12px]"><p className="font-bold text-purple-800 mb-1 italic">Hành động</p><p>{userInsight?.action}</p></div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-400 italic text-sm">Chọn khách hàng để xem phân tích</div>
                    )}
                </div>
            </div>
        </div>
    );
}