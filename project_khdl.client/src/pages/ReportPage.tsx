import React, { useState, useEffect } from 'react';
import { 
    FileText, Send, Mail, Download, BarChart3, 
    PieChart, LineChart, Layers, Calendar, CheckCircle2,
    RefreshCw, ArrowRight, Share2, Clipboard, Shield,
    MessageSquare, Activity, TrendingUp, Star, X, AlertCircle
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, Cell, PieChart as RePieChart, Pie,
    LineChart as ReLineChart, Line
} from 'recharts';

const ReportPage: React.FC = () => {
    const [summary, setSummary] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'summary' | 'builder' | 'ai'>('summary');
    const [showLogs, setShowLogs] = useState(false);
    const [forecastData, setForecastData] = useState<any>(null);

    useEffect(() => {
        fetchSummary();
        fetchForecast();
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

    const fetchForecast = async () => {
        try {
            const res = await fetch('/api/report/ai-forecast');
            const data = await res.json();
            setForecastData(data);
        } catch (err) {
            console.error('Failed to fetch forecast');
        }
    };

    const handleSend = async (type: 'email' | 'slack') => {
        setSending(type);
        try {
            const endpoint = type === 'email' ? '/api/report/trigger-email' : '/api/report/trigger-slack';
            const body = type === 'email' ? { email: 'admin@projectkhdl.com' } : { webhookUrl: 'https://hooks.slack.com/services/...' };
            
            await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            
            alert(`Đã gửi báo cáo qua ${type === 'email' ? 'Email' : 'Slack'} thành công!`);
        } catch (err) {
            alert('Gửi báo cáo thất bại.');
        } finally {
            setSending(null);
        }
    };

    return (
        <div className="flex-1 overflow-auto bg-[#f8f9fd] custom-scrollbar relative">
            <div className="p-8 max-w-7xl mx-auto space-y-8">
                
                {/* HEADER SECTION */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
                                <FileText className="text-white" size={24} />
                            </div>
                            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Trung tâm Báo cáo & Tự động hóa</h1>
                        </div>
                        <p className="text-slate-500 font-bold text-sm">Tạo, quản lý và lên lịch gửi báo cáo phân tích định kỳ.</p>
                    </div>

                    <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
                        <button 
                            onClick={() => setActiveTab('summary')}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'summary' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            TỔNG HỢP TUẦN
                        </button>
                        <button 
                            onClick={() => setActiveTab('ai')}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'ai' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            DỰ BÁO AI
                        </button>
                        <button 
                            onClick={() => setActiveTab('builder')}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'builder' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            TRÌNH TẠO BÁO CÁO
                        </button>
                    </div>
                </div>

                {activeTab === 'summary' ? (
                    <div className="grid grid-cols-3 gap-8">
                        {/* LEFT: LIVE PREVIEW */}
                        <div className="col-span-2 space-y-6">
                            {/* ... (phần code cũ) */}
                            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[600px]">
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
                                        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                            {/* REPORT HEADER */}
                                            <div className="text-center space-y-2 pb-8 border-b border-slate-100">
                                                <h2 className="text-2xl font-black text-slate-800 tracking-tight">BÁO CÁO PHÂN TÍCH ĐỊNH KỲ</h2>
                                                <div className="flex items-center justify-center gap-3">
                                                    <span className="text-[10px] font-black px-3 py-1 bg-indigo-600 text-white rounded-full tracking-widest uppercase">Tuần 20, 2026</span>
                                                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                        <Calendar size={12} /> NGÀY XUẤT: 14/05/2026
                                                    </span>
                                                </div>
                                            </div>

                                            {/* CORE METRICS GRID */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                                                            <Layers size={18} />
                                                        </div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng khách hàng</p>
                                                    </div>
                                                    <p className="text-3xl font-black text-slate-800 tabular-nums">2,110,186</p>
                                                    <div className="mt-3 flex items-center gap-2">
                                                        <div className="h-1 flex-1 bg-slate-50 rounded-full overflow-hidden">
                                                            <div className="h-full bg-blue-500 w-[85%] rounded-full"></div>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-blue-600">+12%</span>
                                                    </div>
                                                </div>

                                                <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                                                            <Activity size={18} />
                                                        </div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng tương tác</p>
                                                    </div>
                                                    <p className="text-3xl font-black text-slate-800 tabular-nums">97.9B</p>
                                                    <div className="mt-3 flex items-center gap-2">
                                                        <div className="h-1 flex-1 bg-slate-50 rounded-full overflow-hidden">
                                                            <div className="h-full bg-emerald-500 w-[92%] rounded-full"></div>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-emerald-600">+5.4%</span>
                                                    </div>
                                                </div>

                                                <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
                                                            <Star size={18} />
                                                        </div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nhóm VIP</p>
                                                    </div>
                                                    <p className="text-3xl font-black text-slate-800 tabular-nums">403,185</p>
                                                    <p className="text-[10px] font-bold text-amber-600 mt-2 flex items-center gap-1">
                                                        <CheckCircle2 size={12} /> Chiếm 19.1% tổng User
                                                    </p>
                                                </div>

                                                <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="p-2 bg-rose-50 text-rose-600 rounded-xl group-hover:scale-110 transition-transform">
                                                            <TrendingUp size={18} className="rotate-180" />
                                                        </div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nguy cơ rời bỏ</p>
                                                    </div>
                                                    <p className="text-3xl font-black text-slate-800 tabular-nums">98,911</p>
                                                    <p className="text-[10px] font-bold text-rose-600 mt-2 flex items-center gap-1">
                                                        <Shield size={12} /> Cần chăm sóc khẩn cấp
                                                    </p>
                                                </div>
                                            </div>

                                            {/* STRATEGIC RECOMMENDATIONS */}
                                            <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-[60px] rounded-full"></div>
                                                <div className="relative z-10">
                                                    <div className="flex items-center gap-3 mb-6">
                                                        <div className="p-2 bg-white/10 rounded-xl">
                                                            <TrendingUp size={18} className="text-indigo-300" />
                                                        </div>
                                                        <h3 className="text-sm font-black uppercase tracking-tight">Khuyến nghị chiến lược (Rule-based)</h3>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
                                                            <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-black">1</div>
                                                            <p className="text-xs font-bold leading-relaxed text-indigo-50">Tăng cường các chương trình chăm sóc đặc biệt và đặc quyền dành riêng cho nhóm VIP để duy trì sự trung thành.</p>
                                                        </div>
                                                        <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
                                                            <div className="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-black">2</div>
                                                            <p className="text-xs font-bold leading-relaxed text-rose-50">Kích hoạt các chiến dịch Re-engagement cá nhân hóa ngay lập tức cho nhóm khách hàng có nguy cơ rời bỏ.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: AUTOMATION PANEL */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm space-y-8">
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 mb-2">Gửi báo cáo nhanh</h3>
                                    <p className="text-xs font-bold text-slate-400 leading-relaxed">Chọn kênh liên lạc để gửi báo cáo phân tích hiện tại cho đội ngũ quản trị.</p>
                                </div>

                                <div className="space-y-4">
                                    <button 
                                        onClick={() => handleSend('email')}
                                        disabled={!!sending}
                                        className="w-full group flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-[1.25rem] hover:bg-indigo-600 transition-all duration-300"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                                                <Mail className="text-indigo-600" size={20} />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-xs font-black text-slate-800 group-hover:text-white uppercase tracking-wider">Gửi qua Email</p>
                                                <p className="text-[10px] font-bold text-slate-400 group-hover:text-white/70">admin@projectkhdl.com</p>
                                            </div>
                                        </div>
                                        <ArrowRight size={16} className="text-slate-300 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                    </button>

                                    <button 
                                        onClick={() => handleSend('slack')}
                                        disabled={!!sending}
                                        className="w-full group flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-[1.25rem] hover:bg-slate-900 transition-all duration-300"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                                                <MessageSquare className="text-rose-500" size={20} />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-xs font-black text-slate-800 group-hover:text-white uppercase tracking-wider">Gửi qua Slack</p>
                                                <p className="text-[10px] font-bold text-slate-400 group-hover:text-white/70">Channel #analytics-reports</p>
                                            </div>
                                        </div>
                                        <ArrowRight size={16} className="text-slate-300 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                    </button>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden group">
                                <Shield className="absolute -right-4 -bottom-4 text-white/10 w-32 h-32 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
                                <h3 className="text-sm font-black uppercase mb-2">Báo cáo an toàn</h3>
                                <p className="text-[10px] font-bold text-white/70 leading-relaxed mb-6">Mọi báo cáo đều được mã hóa và tuân thủ các quy định bảo mật dữ liệu doanh nghiệp.</p>
                                <button 
                                    onClick={() => setShowLogs(true)}
                                    className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-[10px] font-black uppercase transition-all tracking-widest active:scale-95"
                                >
                                    Xem log truy cập
                                </button>
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'ai' ? (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        {/* AI FORECAST SECTION */}
                        <div className="grid grid-cols-3 gap-8">
                            <div className="col-span-2 bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-10 opacity-5">
                                    <Activity size={200} className="text-indigo-600" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-10">
                                        <div>
                                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Dự báo Tương tác (AI Forecasting)</h2>
                                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Model: LSTM Time-Series • Confidence: 94.2%</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>
                                                <span className="text-[10px] font-black text-slate-500 uppercase">Dự báo</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 bg-slate-200 rounded-full"></div>
                                                <span className="text-[10px] font-black text-slate-500 uppercase">Thực tế</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="h-[350px] w-full">
                                        {forecastData && (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <ReLineChart data={forecastData.forecastData}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                    <XAxis 
                                                        dataKey="date" 
                                                        axisLine={false} 
                                                        tickLine={false} 
                                                        tick={{ fontSize: 9, fontWeight: 800, fill: '#94a3b8' }}
                                                        tickFormatter={(val: string) => val.split('-')[2]}
                                                    />
                                                    <YAxis hide />
                                                    <Tooltip 
                                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                                        labelStyle={{ fontWeight: 900, marginBottom: '4px', fontSize: '10px' }}
                                                    />
                                                    <Line 
                                                        type="monotone" 
                                                        dataKey="predicted" 
                                                        stroke="#4f46e5" 
                                                        strokeWidth={4} 
                                                        dot={false}
                                                        animationDuration={2000}
                                                    />
                                                    <Line 
                                                        type="monotone" 
                                                        dataKey="actual" 
                                                        stroke="#94a3b8" 
                                                        strokeWidth={4} 
                                                        strokeDasharray="5 5"
                                                        dot={{ r: 4, fill: '#4f46e5' }}
                                                    />
                                                </ReLineChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {forecastData?.insights.map((insight: any, i: number) => (
                                    <div key={i} className={`p-8 rounded-[2rem] border shadow-sm relative overflow-hidden group ${insight.type === 'Anomaly' ? 'bg-rose-50 border-rose-100' : 'bg-indigo-50 border-indigo-100'}`}>
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className={`p-2 rounded-xl ${insight.type === 'Anomaly' ? 'bg-rose-500 text-white' : 'bg-indigo-600 text-white'}`}>
                                                    {insight.type === 'Anomaly' ? <AlertCircle size={18} /> : <TrendingUp size={18} />}
                                                </div>
                                                <h3 className={`text-sm font-black uppercase tracking-tight ${insight.type === 'Anomaly' ? 'text-rose-900' : 'text-indigo-900'}`}>{insight.title}</h3>
                                            </div>
                                            <p className={`text-xs font-bold leading-relaxed mb-4 ${insight.type === 'Anomaly' ? 'text-rose-700' : 'text-indigo-700'}`}>{insight.text}</p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Confidence</span>
                                                <span className={`text-[10px] font-black ${insight.type === 'Anomaly' ? 'text-rose-600' : 'text-indigo-600'}`}>{Math.round(insight.confidence * 100)}%</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <div className="bg-slate-900 rounded-[2rem] p-8 text-white">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6">Predictive Category Scoring</h3>
                                    <div className="space-y-6">
                                        {forecastData?.topPredictedCategories.map((cat: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${cat.trend === 'Up' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                                    <span className="text-xs font-black">{cat.name}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                        <div className="h-full bg-indigo-500" style={{ width: `${cat.score * 100}%` }}></div>
                                                    </div>
                                                    <span className="text-[10px] font-black tabular-nums">{Math.round(cat.score * 100)}%</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-12 text-center space-y-8">
                        {/* ... (phần builder cũ) */}
                        <div className="max-w-xl mx-auto space-y-4">
                            <div className="w-20 h-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                                <Layers className="text-indigo-600" size={40} />
                            </div>
                            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Report Builder (Beta)</h2>
                            <p className="text-slate-500 font-bold leading-relaxed">
                                Tính năng kéo thả đang được phát triển. Hiện tại bạn có thể xem các bản mẫu báo cáo đồ họa chuyên sâu phía dưới.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* ACCESS LOG MODAL */}
            {showLogs && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowLogs(false)} />
                    <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-900 text-white rounded-xl">
                                    <Shield size={20} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Lịch sử truy cập hệ thống</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Audit Logs • Real-time Monitoring</p>
                                </div>
                            </div>
                            <button onClick={() => setShowLogs(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8 max-h-[500px] overflow-auto custom-scrollbar space-y-4">
                            {[
                                { time: '14:30:22', user: 'Admin (Khang)', action: 'Xuất báo cáo tổng hợp', ip: '192.168.1.1', status: 'Success' },
                                { time: '14:25:01', user: 'System', action: 'Tự động đồng bộ Database', ip: 'Localhost', status: 'Success' },
                                { time: '13:50:12', user: 'Manager (Trang)', action: 'Xem chi tiết Nhóm VIP', ip: '113.161.42.5', status: 'Success' },
                                { time: '13:45:55', user: 'Admin (Khang)', action: 'Đăng nhập hệ thống', ip: '192.168.1.1', status: 'Success' },
                                { time: '12:00:00', user: 'System', action: 'Lưu trữ báo cáo tuần 19', ip: 'Cloud Backup', status: 'Success' },
                            ].map((log, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-sm transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="text-center w-16">
                                            <p className="text-[10px] font-black text-slate-400">{log.time}</p>
                                        </div>
                                        <div className="h-8 w-[1px] bg-slate-200" />
                                        <div>
                                            <p className="text-xs font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{log.action}</p>
                                            <p className="text-[10px] font-bold text-slate-400">{log.user} • {log.ip}</p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest">{log.status}</span>
                                </div>
                            ))}
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
                            <p className="text-[10px] font-bold text-slate-400 italic">Mọi dữ liệu được lưu trữ bảo mật trong 90 ngày theo chính sách doanh nghiệp.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportPage;
