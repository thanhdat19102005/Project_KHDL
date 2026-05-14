/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from 'react';
import {
    ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import { motion } from 'framer-motion';
import { 
    Users, 
    Search, 
    Layers, 
    Calendar, 
    Type, 
    Target, 
    BarChart3, 
    PieChart as PieIcon, 
    Info, 
    Filter, 
    ChevronLeft, 
    ChevronRight,
    Crown,
    Star,
    Coffee,
    User,
    Zap,
    Activity,
    X,
    TrendingUp
} from 'lucide-react';
import { useClusterSummaries, useSegmentScatter, useSegmentInsights, useSegmentUsersTable } from '@/hooks/useDashboard';
import { formatNumber } from '../utils/format';
import { useDataSource } from '../hooks/useDashboard';
import { useAuth } from '../contexts/AuthContext';
import UserDetailPanel from '../components/UserDetailPanel';
import type { User360Data } from '@/components/UserDetailPanel';

const getClusterIcon = (id: number, size = 18, className = "") => {
    switch(id) {
        case 0: return <Coffee size={size} className={className || "text-slate-400"} />;
        case 1: return <User size={size} className={className || "text-blue-500"} />;
        case 2: return <Crown size={size} className={className || "text-amber-500"} />;
        case 3: return <Star size={size} className={className || "text-emerald-500"} />;
        default: return <Target size={size} className={className} />;
    }
};

export default function SegmentationPage() {
    const { data: summaries, loading: summaryLoading } = useClusterSummaries();
    const { data: scatter, loading: scatterLoading } = useSegmentScatter();
    const insights = useSegmentInsights(); 
    const { lastRefresh } = useDataSource();
    const { user } = useAuth();
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [clusterFilter, setClusterFilter] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const [userDetail, setUserDetail] = useState<User360Data | null>(null);
    const [loadingUser, setLoadingUser] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);

    const { data: tableUsers, totalCount, loading: tableLoading } = useSegmentUsersTable(search, clusterFilter, page);

    const totalPages = Math.ceil(totalCount / 15);

    const scatterData = useMemo(() => {
        return scatter.map((p: any) => ({
            ...p,
            x: p.x,
            y: p.y,
            fill: summaries.find(s => s.cluster === p.cluster)?.color || '#9ca3af'
        }));
    }, [scatter, summaries]);

    const handleUserClick = async (id: string) => {
        setSelectedUserId(id);
        
        // Ghi lại Audit Log
        if (user) {
            try {
                await fetch('/api/audit/log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: user.username,
                        action: 'Xem chi tiết khách hàng (Phân khúc)',
                        target: id
                    })
                });
            } catch (err) {
                console.error("Failed to log audit action", err);
            }
        }
    };

    const fetchUserDetail = async (id: string) => {
        setLoadingUser(true);
        try {
            const response = await fetch(`/api/dashboard/users/${id}/full-360`);
            const raw = await response.json();
            
            // Map backend model to frontend view model
            const mapped: User360Data = {
                customerId: raw.customerId,
                segment: raw.segmentName,
                clusterId: raw.cluster,
                metrics: {
                    totalSearches: raw.totalSearch,
                    avgSearchPerMonth: raw.avgSearchMonth,
                    topCategory: raw.topCategory,
                    topKeyword: raw.topKeyword,
                    diversityScore: 85
                },
                timeline: raw.timeline.map((t: any) => ({
                    month: t.month,
                    searchCount: t.totalSearch,
                    topKeyword: t.topCategory
                })),
                insights: {
                    behavior: raw.behavioralSummary,
                    meaning: raw.behaviorChange,
                    action: raw.riskOpportunity
                },
                recommendedActions: (raw.recommendedActions || raw.RecommendedActions || []).map((a: any) => ({
                    title: typeof a === 'string' ? a : a.action,
                    description: typeof a === 'string' ? "Hành động được cá nhân hóa dựa trên phân tích hành vi search của khách hàng." : a.reason,
                    impact: typeof a === 'string' ? ((raw.cluster !== undefined ? raw.cluster : raw.Cluster) === 0 ? 'High' : 'Medium') : (a.confidence > 0.85 ? 'High' : 'Medium')
                })),
                aiInsights: raw.aiInsights || raw.AiInsights
            };

            setUserDetail(mapped);
            setShowUserModal(true);
        } catch (error) {
            console.error('Error fetching user detail:', error);
        } finally {
            setLoadingUser(false);
        }
    };

    return (
        <div className="p-1 space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl shadow-xl shadow-blue-500/20">
                    <Target size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none mb-1">Phân khúc Khách hàng</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phân tích Phân khúc Khách hàng</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {summaries.map((s) => (
                    <motion.div 
                        key={s.cluster} 
                        whileHover={{ y: -8, transition: { duration: 0.3 } }}
                        className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 group relative overflow-hidden cursor-default"
                    >
                        <div className="absolute -right-6 -bottom-6 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity duration-500 group-hover:scale-125 group-hover:-rotate-12 transition-transform">
                            {getClusterIcon(s.cluster, 140)}
                        </div>

                        <div className="flex items-center justify-between mb-6 relative z-10">
                            <div className="flex items-center gap-3">
                                <motion.div 
                                    whileHover={{ rotate: 15 }}
                                    className="p-2.5 bg-slate-50 rounded-xl group-hover:bg-white group-hover:shadow-lg transition-all duration-300"
                                >
                                    {getClusterIcon(s.cluster, 20)}
                                </motion.div>
                                <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                                    {s.segmentName}
                                </span>
                            </div>
                            <span className="text-[10px] font-black px-3 py-1 bg-slate-50 rounded-full text-slate-300 border border-slate-100">ID: {s.cluster}</span>
                        </div>

                        <div className="space-y-6 relative z-10">
                            <motion.div 
                                whileHover={{ scale: 1.02 }}
                                className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100 group-hover:bg-white group-hover:border-blue-100 transition-colors"
                            >
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                    <Users size={12} /> Tổng người dùng
                                </p>
                                <p className="text-3xl font-black text-slate-800 tracking-tighter tabular-nums">{formatNumber(s.totalUsers)}</p>
                            </motion.div>

                            <div className="grid grid-cols-2 gap-y-4 gap-x-4 pt-2 border-t border-slate-50">
                                <div className="space-y-1 group/item">
                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1.5 group-hover/item:text-blue-500 transition-colors">
                                        <Search size={10} /> TB Tìm kiếm
                                    </p>
                                    <p className="text-sm font-bold text-slate-600">{s.avgTotalSearch}</p>
                                </div>
                                <div className="space-y-1 group/item">
                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1.5 group-hover/item:text-blue-500 transition-colors">
                                        <Type size={10} /> TB Từ khóa
                                    </p>
                                    <p className="text-sm font-bold text-slate-600">{s.avgUniqueKeywords}</p>
                                </div>
                                <div className="space-y-1 group/item">
                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1.5 group-hover/item:text-blue-500 transition-colors">
                                        <Layers size={10} /> TB Danh mục
                                    </p>
                                    <p className="text-sm font-bold text-slate-600">{s.avgCategories}</p>
                                </div>
                                <div className="space-y-1 group/item">
                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1.5 group-hover/item:text-blue-500 transition-colors">
                                        <Calendar size={10} /> Lượt / Tháng
                                    </p>
                                    <p className="text-sm font-bold text-slate-600">{s.avgSearchPerMonth}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                                <BarChart3 size={20} />
                            </div>
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Ma trận Hoạt động & Đa dạng</h3>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
                            <Activity size={12} className="text-emerald-500" />
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Dữ liệu Trực tiếp</span>
                        </div>
                    </div>
                    <div className="h-[400px]">
                        {scatterLoading ? (
                            <div className="h-full flex items-center justify-center text-gray-400 text-xs italic">Đang xử lý dữ liệu...</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 10, right: 30, bottom: 20, left: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis type="number" dataKey="x" name="Tổng Tìm Kiếm" fontSize={10} axisLine={false} tickLine={false} label={{ value: 'Tổng Tìm Kiếm', position: 'insideBottom', offset: -10, fontSize: 10, fontWeight: '900', fill: '#94a3b8' }} />
                                    <YAxis type="number" dataKey="y" name="Từ Khóa Duy Nhất" fontSize={10} axisLine={false} tickLine={false} label={{ value: 'Từ Khóa Duy Nhất', angle: -90, position: 'insideLeft', fontSize: 10, fontWeight: '900', fill: '#94a3b8' }} />
                                    <ZAxis range={[80, 80]} />
                                    <Tooltip
                                        cursor={{ strokeDasharray: '3 3' }}
                                        contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', padding: '15px' }}
                                        formatter={(value, name, props: any) => [value, props.payload.segmentName]} 
                                    />
                                    <Scatter name="Khách hàng" data={scatterData}>
                                        {scatterData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} opacity={0.65} />
                                        ))}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                            <PieIcon size={20} />
                        </div>
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Tỉ lệ Phân khúc</h3>
                    </div>
                    <div className="h-[400px] flex flex-col items-center justify-center">
                        <ResponsiveContainer width="100%" height="90%">
                            <PieChart>
                                <Pie
                                    data={summaries}
                                    dataKey="totalUsers"
                                    nameKey="segmentName"
                                    innerRadius={80}
                                    outerRadius={110}
                                    paddingAngle={8}
                                    stroke="none"
                                >
                                    {summaries.map((s: any, i: number) => <Cell key={i} fill={s.color} />)}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)' }} />
                                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: '900', paddingTop: '30px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {insights.map((ins: any) => (
                    <motion.div 
                        key={ins.cluster} 
                        whileHover={{ y: -5, scale: 1.02 }}
                        className="bg-white/60 backdrop-blur-md rounded-3xl border border-white p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-300 group relative overflow-hidden cursor-default"
                    >
                        <div className="absolute right-4 top-4 text-blue-500/10 group-hover:text-blue-500/20 transition-colors group-hover:scale-110 transition-transform">
                            <Info size={32} />
                        </div>
                        <div className="flex items-center gap-2 mb-4 relative z-10">
                            <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: ins.color, boxShadow: `0 0 10px ${ins.color}44` }} />
                            <h3 className="text-[11px] font-black text-slate-800 uppercase italic tracking-wider">
                                {ins.segmentName}
                            </h3>
                        </div>
                        <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest mb-2 flex items-center gap-1.5 relative z-10">
                            <Zap size={12} className="fill-blue-500" /> {ins.title}
                        </p>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium relative z-10">{ins.text}</p>
                    </motion.div>
                ))}
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex flex-wrap gap-6 items-center justify-between bg-slate-50/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-xl">
                            <BarChart3 size={20} className="text-slate-600" />
                        </div>
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Chi tiết Khách hàng</h3>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Tìm mã KH..."
                                className="border border-slate-200 rounded-2xl pl-11 pr-6 py-2.5 text-xs font-bold outline-none focus:ring-4 ring-blue-50 focus:border-blue-200 w-64 transition-all bg-white"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            />
                        </div>
                        <div className="relative group">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                            <select
                                className="border border-slate-200 rounded-2xl pl-11 pr-10 py-2.5 text-xs font-bold outline-none focus:ring-4 ring-blue-50 focus:border-blue-200 transition-all appearance-none bg-white min-w-[200px] cursor-pointer"
                                value={clusterFilter ?? ''}
                                onChange={(e) => { setClusterFilter(e.target.value ? parseInt(e.target.value) : null); setPage(1); }}
                            >
                                <option value="">Tất cả phân khúc</option>
                                {summaries.map(s => <option key={s.cluster} value={s.cluster}>{s.segmentName}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-5">Mã Khách Hàng</th>
                                <th className="px-8 py-5 text-center">Tên Phân Khúc</th>
                                <th className="px-8 py-5 text-right">Tổng Tìm Kiếm</th>
                                <th className="px-8 py-5 text-right">Số Từ Khóa</th>
                                <th className="px-8 py-5 text-right">Số Danh Mục</th>
                                <th className="px-8 py-5 text-right">TB / Tháng</th>
                                <th className="px-8 py-5 text-center">AI Risk</th>
                                <th className="px-8 py-5 text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {tableUsers.map((u: any, i: any) => (
                                <tr key={u.customerId} className="hover:bg-blue-50/30 transition-all duration-300 group">
                                    <td className="px-8 py-5 font-mono font-bold text-slate-600 group-hover:text-blue-600 transition-colors">{u.customerId}</td>
                                    <td className="px-8 py-5 text-center">
                                        <span className="px-4 py-1.5 rounded-full text-[10px] font-black text-white uppercase shadow-lg flex items-center justify-center gap-2 w-max mx-auto transition-transform group-hover:scale-105" style={{ backgroundColor: summaries.find(s => s.cluster === u.cluster)?.color, boxShadow: `0 4px 12px ${summaries.find(s => s.cluster === u.cluster)?.color}44` }}>
                                            {getClusterIcon(u.cluster, 14, "text-white")}
                                            <span className="text-white">{u.segmentName}</span>
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right font-black text-slate-800 tabular-nums">{formatNumber(u.totalSearch)}</td>
                                    <td className="px-8 py-5 text-right text-slate-500 font-bold tabular-nums">{u.uniqueKeywords}</td>
                                    <td className="px-8 py-5 text-right text-slate-500 font-bold tabular-nums">{u.totalCategories}</td>
                                    <td className="px-8 py-5 text-right font-mono text-blue-600 font-black tabular-nums">{u.avgSearchMonth}</td>
                                    <td className="px-8 py-5 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${u.riskLevel === 'High' ? 'text-rose-600' : (u.riskLevel === 'Medium' ? 'text-amber-500' : 'text-emerald-500')}`}>
                                                {u.riskLevel}
                                            </span>
                                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                                                <div 
                                                    className={`h-full rounded-full ${u.riskLevel === 'High' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : (u.riskLevel === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500')}`}
                                                    style={{ width: `${(u.churnProb || 0) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <button 
                                            onClick={() => fetchUserDetail(u.customerId)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all font-bold text-[10px] uppercase tracking-wider"
                                        >
                                            <TrendingUp size={12} />
                                            Xem chi tiết
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-[11px] text-slate-400 font-bold italic">
                        Hiển thị <span className="text-slate-700 not-italic">{tableUsers.length}</span> trên <span className="text-slate-700 not-italic">{formatNumber(totalCount)}</span> khách hàng
                    </p>
                    <div className="flex items-center gap-6">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-3">
                            Trang <span className="text-blue-600 bg-white px-3 py-1 rounded-xl border border-slate-200 shadow-sm">{page}</span> / {totalPages}
                        </span>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1 || tableLoading}
                                className="border border-slate-200 p-2 rounded-xl text-slate-400 hover:bg-white hover:text-blue-600 disabled:opacity-50"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages || tableLoading}
                                className="border border-slate-200 p-2 rounded-xl text-slate-400 hover:bg-white hover:text-blue-600 disabled:opacity-50"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {showUserModal && userDetail && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.98, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl h-[80vh] overflow-hidden relative border border-slate-200"
                    >
                        <UserDetailPanel 
                            data={userDetail} 
                            allUsers={tableUsers}
                            onUserSelect={(id) => fetchUserDetail(id)}
                            onClose={() => setShowUserModal(false)}
                        />
                    </motion.div>
                </div>
            )}
        </div>
    );
}