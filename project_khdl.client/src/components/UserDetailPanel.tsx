import { 
    User, Search, ChevronRight, Activity, TrendingUp, Star,
    Layers, Hash, Clock, Calendar, Filter, UserPlus, X, Shield
} from 'lucide-react';
import { formatNumber } from '../utils/format';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

export interface User360Data {
    customerId: string;
    segment: string;
    clusterId: number;
    metrics: {
        totalSearches: number;
        avgSearchPerMonth: number;
        topCategory: string;
        topKeyword: string;
        diversityScore: number;
    };
    timeline: Array<{
        month: string;
        searchCount: number;
        topKeyword: string;
    }>;
    insights: {
        behavior: string;
        meaning: string;
        action: string;
    };
    recommendedActions: Array<{
        title: string;
        description: string;
        impact: 'High' | 'Medium' | 'Low';
    }>;
    aiInsights?: {
        churnRisk: number;
        riskLevel: string;
        predictedCLV: number;
        recommendations: any[];
    };
}

interface UserDetailPanelProps {
    data: User360Data;
    allUsers?: any[];
    onUserSelect?: (id: string) => void;
    onClose: () => void;
}

const segmentMap: Record<number, { label: string; color: string }> = {
    0: { label: 'VIP', color: '#6366f1' },
    1: { label: 'Potential', color: '#3b82f6' },
    2: { label: 'Interested', color: '#f59e0b' },
    3: { label: 'Churn Risk', color: '#ef4444' },
};

const UserDetailPanel: React.FC<UserDetailPanelProps> = ({ data, allUsers = [], onUserSelect, onClose }) => {
    const { user } = useAuth();

    return (
        <div className="flex h-full bg-[#f8f9fd] text-slate-700 font-sans relative overflow-hidden">
            
            {/* 1. LEFT SIDEBAR (25%) */}
            <div className="w-[260px] border-r border-slate-100 bg-white flex flex-col shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                <div className="p-7 pb-4">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-sm font-black text-slate-800 tracking-tight">Danh sách khách hàng</h3>
                        <UserPlus size={16} className="text-indigo-600" />
                    </div>

                    <div className="space-y-3 mb-5">
                        <div className="relative group">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Tìm User ID..." 
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-9 pr-4 py-2 text-[10px] font-bold outline-none focus:bg-white focus:border-indigo-200 transition-all"
                            />
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <select className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-3 pr-8 py-2 text-[8px] font-black text-slate-500 appearance-none outline-none cursor-pointer">
                                    <option>Phân khúc</option>
                                </select>
                                <Filter size={9} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                            <div className="flex-1 relative">
                                <select className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-3 pr-8 py-2 text-[8px] font-black text-slate-500 appearance-none outline-none cursor-pointer">
                                    <option>Category</option>
                                </select>
                                <Filter size={9} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-6 custom-scrollbar space-y-2">
                    {allUsers.map((user) => (
                        <div 
                            key={user.customerId}
                            onClick={() => onUserSelect?.(user.customerId)}
                            className={`p-3.5 rounded-2xl cursor-pointer transition-all border ${
                                data.customerId === user.customerId 
                                ? 'bg-[#5a4cf4] border-[#5a4cf4] text-white shadow-lg shadow-indigo-100' 
                                : 'bg-white border-transparent hover:bg-slate-50'
                            }`}
                        >
                            <div className="flex justify-between items-center mb-1.5">
                                <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-wider ${
                                    data.customerId === user.customerId ? 'bg-white/20' : 'bg-indigo-50 text-indigo-600'
                                }`}>
                                    {segmentMap[user.cluster]?.label || 'VIP'}
                                </span>
                                <ChevronRight size={12} className={data.customerId === user.customerId ? 'text-white/40' : 'text-slate-300'} />
                            </div>
                            <h4 className="text-[11px] font-black mb-2.5 tracking-tight">{user.customerId}</h4>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                    <Search size={10} className={data.customerId === user.customerId ? 'text-white/60' : 'text-slate-400'} />
                                    <span className="text-[10px] font-black">{formatNumber(user.totalSearch)}</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black ${
                                    data.customerId === user.customerId ? 'bg-white/20' : 'bg-slate-100 text-slate-500'
                                }`}>
                                    {user.topCategory || 'Other'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 2. MIDDLE CONTENT (Fluid) */}
            <div id="user-profile-main-content" className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-white">
                <div className="p-7 space-y-5">
                    
                    {/* Header Card */}
                    <div className="bg-white rounded-[1.75rem] p-5 border border-slate-100 shadow-sm text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500"></div>
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-blue-100 shadow-inner">
                            <User size={24} className="text-blue-500" />
                        </div>
                        
                        {/* CLOSE BUTTON */}
                        <div className="absolute top-5 right-5 flex gap-2">
                            <button 
                                onClick={onClose}
                                className="p-2 bg-slate-100 text-slate-400 rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-all border border-slate-100"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="flex items-center justify-center gap-2 mb-0.5">
                            <h2 className="text-lg font-black text-slate-800 tracking-tight">Khách hàng #{data.customerId}</h2>
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[8px] font-black uppercase tracking-wider">{data.segment}</span>
                            {data.aiInsights?.riskLevel === 'High' && (
                                <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full text-[8px] font-black uppercase tracking-wider animate-pulse border border-rose-100">⚠️ Nguy cơ rời bỏ</span>
                            )}
                        </div>
                        <p className="text-slate-400 text-[10px] font-bold">{data.insights.behavior}</p>
                    </div>

                    {/* Metric Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm flex items-center gap-3 transition-transform hover:scale-[1.02]">
                            <div className="p-3 bg-blue-50 text-blue-500 rounded-xl">
                                <Search size={18} />
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">TỔNG LƯỢT SEARCH</p>
                                <p className="text-base font-black text-slate-800 tracking-tight">{formatNumber(data.metrics.totalSearches)}</p>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm flex items-center gap-3 transition-transform hover:scale-[1.02]">
                            <div className="p-3 bg-purple-50 text-purple-500 rounded-xl">
                                <Layers size={18} />
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">DANH MỤC HÀNG ĐẦU</p>
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-600 rounded text-[9px] font-black uppercase tracking-wider">
                                    {data.metrics.topCategory || 'Other'}
                                </span>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm flex items-center gap-3 transition-transform hover:scale-[1.02]">
                            <div className="p-3 bg-indigo-50 text-indigo-500 rounded-xl">
                                <Hash size={18} />
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">TỪ KHÓA HÀNG ĐẦU</p>
                                <p className="text-base font-black text-slate-800 tracking-tight truncate max-w-[120px]">{data.metrics.topKeyword || 'angelina'}</p>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm flex items-center gap-3 transition-transform hover:scale-[1.02]">
                            <div className="p-3 bg-cyan-50 text-cyan-500 rounded-xl">
                                <Clock size={18} />
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">TB / THÁNG</p>
                                <p className="text-base font-black text-slate-800 tracking-tight">{data.metrics.avgSearchPerMonth || 0}</p>
                            </div>
                        </div>
                    </div>

                    {/* Timeline Section */}
                    <div className="bg-white rounded-[1.75rem] p-5 border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-2.5 mb-5">
                            <Calendar size={16} className="text-indigo-500" />
                            <h3 className="text-[13px] font-black text-slate-800">Lịch trình khách hàng</h3>
                        </div>
                        <div className="space-y-3.5">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">A. BẢNG LỊCH TRÌNH</p>
                            <div className="overflow-hidden border border-slate-50 rounded-xl">
                                <table className="w-full text-left text-[11px]">
                                    <thead className="bg-slate-50 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                        <tr>
                                            <th className="px-4 py-2.5">THÁNG</th>
                                            <th className="px-4 py-2.5">DANH MỤC</th>
                                            <th className="px-4 py-2.5 text-right">SEARCH</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {data.timeline.map((t, i) => (
                                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-4 py-3 font-bold text-slate-500">{t.month}</td>
                                                <td className="px-4 py-3">
                                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-500 rounded text-[9px] font-black">
                                                        {t.topKeyword || 'Category'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-black text-slate-700">{formatNumber(t.searchCount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* AI PREDICTIVE SECTION (UPDATED: WHITE THEME + VIETNAMESE) */}
                    {(data.aiInsights || (data as any).AiInsights) && (() => {
                        const ai = data.aiInsights || (data as any).AiInsights;
                        const churnRisk = ai.churnRisk !== undefined ? ai.churnRisk : ai.ChurnRisk;
                        const riskLevel = ai.riskLevel || ai.RiskLevel;
                        const clv = ai.predictedCLV !== undefined ? ai.predictedCLV : ai.PredictedCLV;
                        const recs = ai.recommendations || ai.Recommendations || [];

                        const getRiskLevelVN = (level: string) => {
                            switch(level?.toUpperCase()) {
                                case 'HIGH': return 'CAO';
                                case 'MEDIUM': return 'TRUNG BÌNH';
                                case 'LOW': return 'THẤP';
                                default: return level;
                            }
                        };

                        return (
                            <div className="bg-white rounded-[1.75rem] p-6 text-slate-800 border border-slate-100 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[60px] rounded-full group-hover:bg-blue-500/10 transition-all duration-700"></div>
                                
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                                        <TrendingUp size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black tracking-tight uppercase">PHÂN TÍCH DỰ BÁO AI</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dự báo dựa trên Machine Learning</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8 relative z-10">
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">XÁC SUẤT RỜI BỎ</p>
                                        <div className="flex items-end gap-3">
                                            <span className="text-3xl font-black tracking-tighter text-slate-800">{(churnRisk * 100).toFixed(0)}%</span>
                                            <div className="h-4 w-24 bg-slate-100 rounded-full overflow-hidden mb-1.5 flex items-center px-0.5 border border-slate-50">
                                                <div 
                                                    className={`h-2.5 rounded-full ${churnRisk > 0.7 ? 'bg-rose-500' : (churnRisk > 0.4 ? 'bg-amber-500' : 'bg-emerald-500')}`}
                                                    style={{ width: `${churnRisk * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                        <p className={`text-[10px] font-bold ${churnRisk > 0.7 ? 'text-rose-600' : (churnRisk > 0.4 ? 'text-amber-600' : 'text-emerald-600')}`}>
                                            Mức độ rủi ro: <span className="uppercase font-black">{getRiskLevelVN(riskLevel)}</span>
                                        </p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GIÁ TRỊ VÒNG ĐỜI DỰ KIẾN (12 THÁNG)</p>
                                        <div className="flex items-end gap-1.5">
                                            <span className="text-3xl font-black tracking-tighter text-blue-600">{formatNumber(clv)}</span>
                                            <span className="text-[10px] font-black text-blue-600 mb-1.5">VNĐ</span>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 italic">Giá trị dự kiến trong 1 năm tới</p>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-slate-50">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <div className="w-1 h-3 bg-indigo-500 rounded-full"></div>
                                        HÀNH ĐỘNG AI GỢI Ý (MODEL-DRIVEN)
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        {recs.map((rec: any, idx: number) => {
                                            // Handle both string (old) and object (new) cases + property casing
                                            const isObject = typeof rec === 'object' && rec !== null;
                                            const action = isObject ? (rec.action || rec.Action) : rec;
                                            const confidence = isObject ? (rec.confidence || rec.Confidence || 0) : 0.85;
                                            const type = isObject ? (rec.type || rec.Type) : 'Engagement';
                                            const reason = isObject ? (rec.reason || rec.Reason) : 'Phân tích dựa trên hành vi tìm kiếm thực tế.';

                                            return (
                                                <div key={idx} className="flex flex-col gap-2 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-xl hover:border-indigo-100 transition-all group/rec relative overflow-hidden">
                                                    <div className="flex items-start justify-between">
                                                        <div className={`p-1.5 rounded-lg ${type === 'Retention' || type === 'Urgent' ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-500'}`}>
                                                            {type === 'Retention' || type === 'Urgent' ? <Shield size={14} /> : <Star size={14} />}
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Confidence</p>
                                                            <p className={`text-[10px] font-black ${confidence > 0.9 ? 'text-emerald-500' : 'text-indigo-500'}`}>
                                                                {Math.round(confidence * 100)}%
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-black text-slate-800 leading-tight mb-1">{action}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 leading-tight italic">{reason}</p>
                                                    </div>
                                                    <div className="absolute bottom-0 right-0 p-2 opacity-0 group-hover/rec:opacity-100 transition-opacity">
                                                        <div className="px-2 py-0.5 bg-slate-900 text-white text-[7px] font-black rounded-full uppercase tracking-widest">Execute</div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}


                </div>
            </div>

            {/* 3. RIGHT SIDEBAR (25%) */}
            <div className="w-[280px] bg-white border-l border-slate-100 p-7 flex flex-col shrink-0 shadow-[-4px_0_24px_rgba(0,0,0,0.02)] overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-3 mb-8">
                    <Activity size={18} className="text-indigo-500" />
                    <h3 className="text-sm font-bold text-slate-800">Phân tích AI / Doanh nghiệp</h3>
                </div>

                <div className="space-y-8 flex-1">
                    <div className="flex gap-4">
                        <div className="p-2.5 bg-blue-50 text-blue-500 rounded-xl h-max mt-0.5">
                            <Activity size={16} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">TÓM TẮT HÀNH VI:</p>
                            <p className="text-xs font-bold text-slate-600 leading-relaxed">
                                {data.insights.behavior || 'Đang phân tích hành vi...'}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="p-2.5 bg-indigo-50 text-indigo-500 rounded-xl h-max mt-0.5">
                            <TrendingUp size={16} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">THAY ĐỔI HÀNH VI:</p>
                            <p className="text-xs font-bold text-slate-600 leading-relaxed">
                                {data.insights.meaning || 'Đang phân tích hành vi...'}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="p-2.5 bg-amber-50 text-amber-500 rounded-xl h-max mt-0.5">
                            <Star size={16} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">RỦI RO / CƠ HỘI:</p>
                            <p className="text-xs font-bold text-slate-600 leading-relaxed">
                                {data.insights.action || 'Đang phân tích hành vi...'}
                            </p>
                        </div>
                    </div>

                </div>
            </div>

            {/* SUBTLE CLOSE BUTTON */}
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-slate-300 hover:text-slate-500 transition-colors z-50"
            >
                <X size={20} />
            </button>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </div>
    );
};

export default UserDetailPanel;
