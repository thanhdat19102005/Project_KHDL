/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useMemo } from 'react';

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
    Label,
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

const generateSparklineData = (seedStr: string, baseVal: number) => {
    let seed = baseVal + (seedStr ? seedStr.charCodeAt(0) + seedStr.charCodeAt(seedStr.length - 1) : 0);
    const data = [];
    for(let i=0; i<7; i++) {
        seed = (seed * 9301 + 49297) % 233280;
        const val = seed / 233280;
        const trend = (i * (seed % 10 - 4)); 
        data.push({ day: i, value: Math.max(1, Math.floor(val * 50) + trend + 20) });
    }
    return data;
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

    const processedPlatformData = useMemo(() => {
        if (!platformData || platformData.length === 0) return [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sorted = [...platformData].sort((a: any, b: any) => b.total_search - a.total_search);
        
        const top10 = sorted.slice(0, 10).map((item: any) => ({
            ...item,
            platform: item.platform.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        }));

        if (sorted.length <= 10) return top10;

        const others = sorted.slice(10);
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const othersTotal = others.reduce((sum: number, item: any) => sum + item.total_search, 0);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const othersPercentage = others.reduce((sum: number, item: any) => sum + parseFloat(item.percentage || "0"), 0).toFixed(2);

        return [
            ...top10,
            { platform: "Khác", total_search: othersTotal, percentage: othersPercentage }
        ];
    }, [platformData]);

    const [search, setSearch] = useState('');
    const [clusterFilter, setClusterFilter] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const [keywordLimit, setKeywordLimit] = useState(10);
    const [keywordSearch, setKeywordSearch] = useState('');

    const formatKeyword = (text: string) => {
        if (!text) return '';
        // Viết hoa chữ cái đầu mỗi từ
        const capitalized = text.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        // Cắt chuỗi nếu quá dài
        const truncated = capitalized.length > 18 ? capitalized.substring(0, 18) + '...' : capitalized;
        // Dùng non-breaking space để Recharts không tự rớt dòng
        return truncated.replace(/ /g, '\u00A0');
    };

    // Lọc và format từ khóa
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filteredKeywords = keywords
        .filter((k: any) => k.keyword.toLowerCase().includes(keywordSearch.toLowerCase()))
        .map((k: any) => ({ ...k, formattedKeyword: formatKeyword(k.keyword) }))
        .slice(0, keywordLimit);

    // Lấy dữ liệu người dùng & Phân trang
    const { data: users, totalCount, loading: usersLoading } = useUsers(search, clusterFilter, null, page);
    const totalPages = Math.ceil(totalCount / 16);

    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const { data: userDetail } = useUserDetail(selectedUserId);
    const { data: userInsight } = useUserInsight(selectedUserId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentUser = users?.find((u: any) => u.customerId === selectedUserId);

    return (
        <div className="space-y-6">
            {/* KPI SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-full ring-4 ring-blue-50/50">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 mb-0.5">Tổng người dùng</p>
                        <p className="text-2xl font-bold text-slate-800">{kpi ? formatNumber(kpi.totalUsers) : '...'}</p>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full ring-4 ring-emerald-50/50">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 mb-0.5">Tổng lượt tìm kiếm</p>
                        <p className="text-2xl font-bold text-slate-800">{kpi ? formatNumber(kpi.totalSearch) : '...'}</p>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-full ring-4 ring-purple-50/50">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><rect width="4" height="7" x="7" y="10" rx="1"/><rect width="4" height="12" x="15" y="5" rx="1"/></svg>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 mb-0.5">Trung bình tìm kiếm / người</p>
                        <p className="text-2xl font-bold text-slate-800">{kpi ? formatNumber(Math.round(kpi.avgSearchPerUser)) : '...'}</p>
                    </div>
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
                {/* 1. Keyword phổ biến */}
                <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm min-h-[650px] flex flex-col">
                    <div className="flex flex-col gap-3 mb-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-800">Keyword phổ biến</h3>
                            <select 
                                className="border rounded-md px-2 py-1 text-xs outline-none text-gray-600 cursor-pointer"
                                value={keywordLimit}
                                onChange={(e) => setKeywordLimit(Number(e.target.value))}
                            >
                                <option value={10}>Top 10</option>
                                <option value={20}>Top 20</option>
                            </select>
                        </div>
                        <input 
                            type="text" 
                            placeholder="Tìm Keyword..." 
                            className="w-full border rounded-md px-3 py-1.5 text-xs outline-none bg-gray-50 focus:bg-white focus:border-blue-400 transition-colors"
                            value={keywordSearch}
                            onChange={(e) => setKeywordSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex-1 min-h-0 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={filteredKeywords} layout="vertical">
                                <XAxis type="number" hide />
                                <YAxis 
                                    dataKey="formattedKeyword" 
                                    type="category" 
                                    width={130} 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#1f2937', fontWeight: 'bold', fontSize: 12 }}
                                />
                                <Tooltip cursor={{ fill: '#f9fafb' }} />
                                <Bar dataKey="searchCount" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={18} />
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
                                    data={processedPlatformData}
                                    cx="50%"
                                    cy="45%" // Kéo vòng tròn xuống trung tâm hơn
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={2}
                                    dataKey="total_search"
                                    nameKey="platform"
                                    stroke="none"
                                >
                                    {processedPlatformData.map((_e: any, index: number) => (
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
                    <div className="flex-1 min-h-0 w-full">
                        {categoryLoading ? <div className="flex h-full items-center justify-center text-gray-400">Đang tải...</div> : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={categoryData} layout="vertical">
                                    <XAxis type="number" hide />
                                    <YAxis 
                                        dataKey="category_name" 
                                        type="category" 
                                        width={100} 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#1f2937', fontWeight: 'bold', fontSize: 12 }}
                                    />
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
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase font-black">Mã khách hàng</p>
                                    <p className="text-xl font-bold text-slate-800">{userDetail.customerId}</p>
                                </div>
                                {currentUser && (
                                    <div className="flex flex-col items-end">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">7 ngày qua</p>
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-16">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={generateSparklineData(userDetail.customerId, currentUser.totalSearch)}>
                                                        <Line type="monotone" dataKey="value" stroke={currentUser.cluster === 0 ? "#10b981" : currentUser.cluster === 1 ? "#f59e0b" : "#6b7280"} strokeWidth={2} dot={false} isAnimationActive={false} />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <p className="text-sm font-bold text-slate-700">{formatNumber(currentUser.totalSearch)}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-3 pt-2">
                                <div className="p-2.5 bg-emerald-50/50 border-l-4 border-emerald-400 rounded-r">
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <svg className="w-3.5 h-3.5 text-emerald-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                                        <p className="font-bold text-[12px] text-emerald-800 uppercase tracking-wider">Hành vi</p>
                                    </div>
                                    <p className="text-[12px] text-gray-700 leading-relaxed">{userInsight?.behavior}</p>
                                </div>
                                <div className="p-2.5 bg-blue-50/50 border-l-4 border-blue-400 rounded-r">
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <svg className="w-3.5 h-3.5 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
                                        <p className="font-bold text-[12px] text-blue-800 uppercase tracking-wider">Ý nghĩa</p>
                                    </div>
                                    <p className="text-[12px] text-gray-700 leading-relaxed">{userInsight?.meaning}</p>
                                </div>
                                <div className="p-2.5 bg-purple-50/50 border-l-4 border-purple-400 rounded-r">
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <svg className="w-3.5 h-3.5 text-purple-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                                        <p className="font-bold text-[12px] text-purple-800 uppercase tracking-wider">Hành động</p>
                                    </div>
                                    <p className="text-[12px] text-gray-700 leading-relaxed">{userInsight?.action}</p>
                                </div>
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