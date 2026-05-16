import React, { useState, useEffect } from 'react';
import { 
    FileText, Send, Mail, Download, BarChart3, 
    PieChart, LineChart, Layers, Calendar, CheckCircle2,
    RefreshCw, ArrowRight, Share2, Clipboard, Shield,
    MessageSquare, Activity, TrendingUp, Star, X, Plus
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, Cell, PieChart as RePieChart, Pie,
    LineChart as ReLineChart, Line
} from 'recharts';
import { formatNumber } from '../utils/format';


const ReportPage: React.FC = () => {
    const [summary, setSummary] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSummary();
    }, []);

    const fetchSummary = async () => {
        try {
            const res = await fetch('/api/report/summary');
            const data = await res.json();
            setSummary(data.text);
        } catch (err) {
            console.error('Failed to fetch summary');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 overflow-auto bg-[#f8f9fd] custom-scrollbar relative">
            <div className="p-8 max-w-5xl mx-auto space-y-8">
                
                {/* HEADER SECTION */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
                                <FileText className="text-white" size={24} />
                            </div>
                            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Trung tâm Báo cáo Phân tích</h1>
                        </div>
                        <p className="text-slate-500 font-bold text-sm">Tổng hợp dữ liệu và insight khách hàng tự động.</p>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[700px]">
                    <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Bản thảo báo cáo gần nhất</span>
                        </div>
                        <button 
                            onClick={fetchSummary}
                            className="p-2 hover:bg-white rounded-lg transition-all text-slate-400 hover:text-indigo-600"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                    <div className="flex-1 p-8 overflow-auto custom-scrollbar bg-slate-50/30">
                        {loading ? (
                            <div className="h-full flex items-center justify-center">
                                <div className="text-center space-y-3">
                                    <div className="relative">
                                        <RefreshCw className="mx-auto text-indigo-200 animate-spin" size={48} />
                                        <BarChart3 className="absolute inset-0 m-auto text-indigo-500" size={20} />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Đang trích xuất dữ liệu thông minh...</p>
                                </div>
                            </div>
                        ) : (
                            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                {/* REPORT HEADER */}
                                <div className="text-center space-y-2 pb-8 border-b border-slate-100">
                                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">BÁO CÁO PHÂN TÍCH ĐỊNH KỲ</h2>
                                    <div className="flex items-center justify-center gap-3">
                                        <span className="text-[10px] font-black px-3 py-1 bg-indigo-600 text-white rounded-full tracking-widest uppercase">Tuần 20, 2026</span>
                                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                            <Calendar size={12} /> NGÀY XUẤT: {new Date().toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>
                                </div>

                                {/* CORE METRICS GRID */}
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                                                <Layers size={20} />
                                            </div>
                                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Tổng khách hàng</p>
                                        </div>
                                        <p className="text-4xl font-black text-slate-800 tabular-nums">{formatNumber(2110186)}</p>
                                        <div className="mt-4 flex items-center gap-2">
                                            <div className="h-1.5 flex-1 bg-slate-50 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500 w-[85%] rounded-full"></div>
                                            </div>
                                            <span className="text-[11px] font-black text-blue-600">+12%</span>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                                                <Activity size={20} />
                                            </div>
                                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Tổng tương tác</p>
                                        </div>
                                        <p className="text-4xl font-black text-slate-800 tabular-nums">97.9B</p>
                                        <div className="mt-4 flex items-center gap-2">
                                            <div className="h-1.5 flex-1 bg-slate-50 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500 w-[92%] rounded-full"></div>
                                            </div>
                                            <span className="text-[11px] font-black text-emerald-600">+5.4%</span>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
                                                <Star size={20} />
                                            </div>
                                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Nhóm VIP</p>
                                        </div>
                                        <p className="text-4xl font-black text-slate-800 tabular-nums">{formatNumber(403185)}</p>
                                        <p className="text-[11px] font-black text-amber-600 mt-4 flex items-center gap-1.5">
                                            <CheckCircle2 size={14} /> Chiếm 19,1% tổng User
                                        </p>
                                    </div>

                                    <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl group-hover:scale-110 transition-transform">
                                                <TrendingUp size={20} className="rotate-180" />
                                            </div>
                                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Nguy cơ rời bỏ</p>
                                        </div>
                                        <p className="text-4xl font-black text-slate-800 tabular-nums">{formatNumber(98911)}</p>
                                        <p className="text-[11px] font-black text-rose-600 mt-4 flex items-center gap-1.5">
                                            <Shield size={14} /> Cần chăm sóc khẩn cấp
                                        </p>
                                    </div>
                                </div>

                                {/* STRATEGIC RECOMMENDATIONS */}
                                <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 blur-[80px] rounded-full"></div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                                <TrendingUp size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black tracking-tight text-slate-800 uppercase">Khuyến nghị chiến lược</h3>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phân tích dựa trên dữ liệu tuần</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="flex flex-col gap-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:bg-white hover:shadow-xl hover:border-indigo-100 transition-all group">
                                                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 text-xs font-black text-white shadow-lg shadow-indigo-200">1</div>
                                                <p className="text-sm font-bold leading-relaxed text-slate-600">Tăng cường các chương trình chăm sóc đặc biệt và đặc quyền dành riêng cho nhóm VIP để duy trì sự trung thành.</p>
                                            </div>
                                            <div className="flex flex-col gap-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:bg-white hover:shadow-xl hover:border-rose-100 transition-all group">
                                                <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center shrink-0 text-xs font-black text-white shadow-lg shadow-rose-200">2</div>
                                                <p className="text-sm font-bold leading-relaxed text-slate-600">Kích hoạt các chiến dịch Re-engagement cá nhân hóa ngay lập tức cho nhóm khách hàng có nguy cơ rời bỏ.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-10 border-t border-slate-50 flex items-center justify-between opacity-50">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Project KHDL Management System</p>
                                    <p className="text-[9px] font-bold text-slate-400">Trang 1 / 1</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportPage;
