import React, { useState, useEffect } from 'react';
import { Bell, Settings, X, Info, AlertTriangle, AlertCircle, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Alert {
    id: string;
    type: string;
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    title: string;
    message: string;
    timestamp: string;
    isRead: boolean;
}

interface HealthStatus {
    isHealthy: boolean;
    statusMessage: string;
    lastUpdate: string;
    totalRecords: number;
    syncErrors: string[];
}

const DashboardHeader: React.FC<{ lastRefresh: string }> = ({ lastRefresh }) => {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [health, setHealth] = useState<HealthStatus | null>(null);
    const [showAlerts, setShowAlerts] = useState(false);
    const unreadCount = alerts.filter(a => !a.isRead).length;

    const fetchAlerts = async () => {
        try {
            const res = await fetch('/api/alert');
            if (res.ok) setAlerts(await res.json());
            
            const hRes = await fetch('/api/alert/health');
            if (hRes.ok) setHealth(await hRes.json());
        } catch (e) {
            console.error("Failed to fetch alerts", e);
        }
    };

    useEffect(() => {
        fetchAlerts();
        const timer = setInterval(fetchAlerts, 60000); // Mỗi phút một lần
        return () => clearInterval(timer);
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await fetch(`/api/alert/${id}/read`, { method: 'POST' });
            setAlerts(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a));
        } catch (e) { /* ignore */ }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'Critical': return <AlertCircle size={16} className="text-rose-500" />;
            case 'High': return <AlertTriangle size={16} className="text-orange-500" />;
            case 'Medium': return <Info size={16} className="text-blue-500" />;
            default: return <Info size={16} className="text-slate-400" />;
        }
    };

    return (
        <header className="h-24 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-50">
            <div className="flex items-center gap-4">
                <div className="relative flex items-center justify-center">
                    <div className={`w-3 h-3 rounded-full animate-ping absolute ${health?.isHealthy ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                    <div className={`w-3 h-3 rounded-full relative z-10 border-2 border-white ${health?.isHealthy ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                </div>
                <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Trạng thái hệ thống</span>
                    <span className={`text-[11px] font-bold ${health?.isHealthy ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {health?.isHealthy ? 'Sẵn sàng / Trực tuyến' : health?.statusMessage || 'Lỗi kết nối'}
                    </span>
                </div>
                
                {!health?.isHealthy && health?.syncErrors?.length && (
                    <div className="group relative">
                        <AlertCircle size={16} className="text-rose-500 cursor-help" />
                        <div className="absolute top-full left-0 mt-2 w-64 p-3 bg-white border border-slate-200 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2">Lỗi đồng bộ dữ liệu</p>
                            <ul className="space-y-1">
                                {health.syncErrors.map((err, i) => (
                                    <li key={i} className="text-[10px] font-medium text-slate-600">• {err}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-8">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <motion.div 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowAlerts(!showAlerts)}
                            className={`p-2.5 rounded-xl transition-all cursor-pointer relative group ${showAlerts ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                        >
                            <Bell size={20} className={showAlerts ? 'text-white' : 'group-hover:text-blue-600'} />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full border-2 border-white flex items-center justify-center animate-bounce">
                                    {unreadCount}
                                </span>
                            )}
                        </motion.div>

                        <AnimatePresence>
                            {showAlerts && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowAlerts(false)} />
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 mt-3 w-[400px] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50"
                                    >
                                        <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Thông báo thông minh</h3>
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-[9px] font-black">{unreadCount} mới</span>
                                                <button onClick={() => setShowAlerts(false)} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
                                                    <X size={14} className="text-slate-400" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="max-h-[480px] overflow-y-auto custom-scrollbar">
                                            {alerts.length === 0 ? (
                                                <div className="p-10 text-center">
                                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                        <Bell size={24} className="text-slate-200" />
                                                    </div>
                                                    <p className="text-xs font-bold text-slate-400 italic">Không có thông báo nào</p>
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-slate-50">
                                                    {alerts.map((alert) => (
                                                        <div 
                                                            key={alert.id} 
                                                            onClick={() => markAsRead(alert.id)}
                                                            className={`p-5 hover:bg-slate-50 transition-colors cursor-pointer relative group ${!alert.isRead ? 'bg-blue-50/20' : ''}`}
                                                        >
                                                            {!alert.isRead && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>}
                                                            <div className="flex gap-4">
                                                                <div className="mt-1">{getSeverityIcon(alert.severity)}</div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center justify-between mb-1">
                                                                        <h4 className={`text-xs font-black truncate ${!alert.isRead ? 'text-slate-800' : 'text-slate-500'}`}>{alert.title}</h4>
                                                                        <span className="text-[9px] font-bold text-slate-400">{new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                    </div>
                                                                    <p className="text-[11px] font-medium text-slate-500 leading-relaxed line-clamp-2">{alert.message}</p>
                                                                    {alert.type === 'Behavior' && (
                                                                        <div className="mt-2 flex items-center gap-2">
                                                                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-black uppercase">Behavior Insight</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                                            <button className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-600 transition-colors">Xem tất cả lịch sử</button>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                    <div className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer group">
                        <Settings size={20} className="group-hover:text-blue-600 transition-colors" />
                    </div>
                </div>
                <div className="h-10 w-[1px] bg-slate-200"></div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cập nhật lúc</p>
                    <p className="text-xs font-black text-slate-800 tabular-nums">
                        {new Date(lastRefresh).toLocaleTimeString()}
                    </p>
                </div>
            </div>
            
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
            `}</style>
        </header>
    );
};

export default DashboardHeader;
