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

export default function OverviewPage() {
    const { data: kpi } = useKpi();

    // Dữ liệu Biểu đồ trái (Tháng)
    const factSearchTrend = useSearchDistribution() ?? [];

    // Dữ liệu Biểu đồ phải (Giờ)
    const monthlyTrendRaw = useMonthlyTrend() ?? [];
    const keywords = useTopKeywords() ?? [];

    const { data: categoryDataRaw, loading: categoryLoading } = useTopCategories();
    const categoryData = categoryDataRaw ?? [];

    // Logic sắp xếp dữ liệu giờ (0h-23h) cho biểu đồ bên phải
    const hourData = [...monthlyTrendRaw].sort((a, b) => a.search_hour - b.search_hour);

    const [search, setSearch] = useState('');
    const [clusterFilter, setClusterFilter] = useState<number | null>(null);
    const [topCategoryFilter, setTopCategoryFilter] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    // Phần phân trang của bạn đây
    const { data: users, totalCount, loading: usersLoading } = useUsers(search, clusterFilter, topCategoryFilter, page);
    const totalPages = Math.ceil(totalCount / 16);

    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const { data: userDetail, loading: userDetailLoading } = useUserDetail(selectedUserId);
    const { data: userInsight, loading: userInsightLoading } = useUserInsight(selectedUserId);

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

            {/* CHARTS ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4">Xu hướng hoạt động tìm kiếm (Dữ liệu Fact)</h3>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={factSearchTrend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="search_month" fontSize={11} stroke="#9ca3af" />
                                <YAxis fontSize={11} stroke="#9ca3af" />
                                <Tooltip formatter={(v) => [formatNumber(Number(v)), 'Lượt tìm kiếm']} />
                                <Legend verticalAlign="top" align="right" height={36} />
                                <Line name="Số lượng tìm kiếm" type="monotone" dataKey="total_search" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4">Phân bổ tìm kiếm theo giờ (Tổng hợp)</h3>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={hourData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="search_hour" fontSize={11} stroke="#9ca3af" tickFormatter={(h) => `${h}h`} />
                                <YAxis fontSize={11} stroke="#9ca3af" />
                                <Tooltip formatter={(v) => [formatNumber(Number(v)), 'Lượt tìm kiếm']} />
                                <Legend verticalAlign="top" align="right" height={36} />
                                <Line name="Lượt tìm theo giờ" type="monotone" dataKey="total_search" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* KEYWORDS & CATEGORIES */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4">Từ khóa phổ biến</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={keywords.slice(0, 10)} layout="vertical">
                                <XAxis type="number" hide />
                                <YAxis dataKey="keyword" type="category" width={150} fontSize={12} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: '#f9fafb' }} formatter={(v) => [formatNumber(Number(v)), 'Lượt tìm']} />
                                <Bar dataKey="searchCount" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4">Top 10 Danh mục tìm kiếm</h3>
                    <div className="h-80">
                        {categoryLoading ? <div className="flex h-full items-center justify-center">Đang tải...</div> : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={categoryData} layout="vertical">
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="category_name" type="category" width={100} fontSize={11} axisLine={false} tickLine={false} />
                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                    <Tooltip formatter={(v, _n, props) => [`${formatNumber(Number(v))} (${(props as any).payload?.percentage}%)`, 'Tìm kiếm']} />
                                    <Bar dataKey="total_search" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            {/* USER LIST & INSIGHT - PHẦN BẠN CẦN GIỮ LẠI */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="xl:col-span-2 bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4">Danh sách khách hàng</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                        <input
                            type="text" placeholder="Tìm khách hàng..."
                            className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        />
                        <select
                            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm outline-none"
                            value={clusterFilter ?? ''}
                            onChange={(e) => { setClusterFilter(e.target.value ? parseInt(e.target.value) : null); setPage(1); }}
                        >
                            <option value="">Phân khúc</option>
                            <option value="0">VIP</option>
                            <option value="1">Nguy cơ rời bỏ</option>
                            <option value="2">Không hoạt động</option>
                        </select>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-gray-600 font-medium">
                                <tr>
                                    <th className="text-left px-3 py-2 border-b">Mã KH</th>
                                    <th className="text-right px-3 py-2 border-b">Tìm kiếm</th>
                                    <th className="text-center px-3 py-2 border-b">Phân khúc</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {usersLoading ? (
                                    <tr><td colSpan={3} className="py-8 text-center text-gray-400 italic">Đang tải dữ liệu...</td></tr>
                                ) : (
                                    users.map((u: UserItem) => {
                                        const cfg = clusterConfig[u.cluster] ?? clusterConfig[2];
                                        return (
                                            <tr
                                                key={u.customerId}
                                                onClick={() => setSelectedUserId(u.customerId)}
                                                className={`cursor-pointer transition-colors ${selectedUserId === u.customerId ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                                            >
                                                <td className="px-3 py-2.5 font-medium">{u.customerId}</td>
                                                <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-700">{formatNumber(u.totalSearch)}</td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.text}`}>
                                                        {cfg.label}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINATION LAYOUT CỦA BẠN ĐÂY */}
                    <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                        <p className="text-xs text-gray-500 italic">
                            Trang <span className="font-bold text-gray-700">{page}</span> / {totalPages || 1}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1 || usersLoading}
                                className="px-3 py-1 text-xs font-semibold border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Trước
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages || usersLoading}
                                className="px-3 py-1 text-xs font-semibold border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                </div>

                {/* SIDEBAR DETAIL & INSIGHT */}
                <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4">Chi tiết & Insight</h3>
                    {!selectedUserId ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400 italic text-sm">Chọn khách hàng để xem phân tích</div>
                    ) : userDetailLoading || !userDetail ? (
                        <p className="text-sm text-gray-500 animate-pulse">Đang tải...</p>
                    ) : (
                        <div className="space-y-5">
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Mã khách hàng</p>
                                <p className="text-xl font-bold text-slate-800">{userDetail.customerId}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white border border-gray-100 p-3 rounded-md shadow-sm">
                                    <p className="text-gray-400 text-[11px] mb-1 font-medium">Lượt tìm kiếm</p>
                                    <p className="font-bold text-blue-600">{formatNumber(userDetail.totalSearch)}</p>
                                </div>
                                <div className="bg-white border border-gray-100 p-3 rounded-md shadow-sm">
                                    <p className="text-gray-400 text-[11px] mb-1 font-medium">Từ khóa chính</p>
                                    <p className="font-bold truncate text-indigo-600">{userDetail.topKeyword}</p>
                                </div>
                            </div>
                            <div className="pt-5 border-t border-gray-100 space-y-4">
                                <h4 className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">● Phân tích chuyên sâu</h4>
                                {userInsightLoading ? <div className="animate-pulse h-20 bg-gray-100 rounded"></div> : (
                                    <div className="space-y-4 text-[13px] leading-relaxed text-slate-600">
                                        <div className="bg-emerald-50/20 p-3 rounded-lg border border-emerald-100/30">
                                            <p className="font-bold text-slate-800 mb-1 italic">Hành vi đặc trưng</p>
                                            <p className="text-xs">{userInsight?.behavior}</p>
                                        </div>
                                        <div className="bg-blue-50/20 p-3 rounded-lg border border-blue-100/30">
                                            <p className="font-bold text-slate-800 mb-1 italic">Ý nghĩa dữ liệu</p>
                                            <p className="text-xs">{userInsight?.meaning}</p>
                                        </div>
                                        <div className="bg-purple-50/20 p-3 rounded-lg border border-purple-100/30">
                                            <p className="font-bold text-slate-800 mb-1 italic">Hành động gợi ý</p>
                                            <p className="text-xs">{userInsight?.action}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}