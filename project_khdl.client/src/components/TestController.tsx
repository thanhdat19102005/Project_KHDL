import { useState, useEffect } from 'react';
import { useDataSource } from '@/hooks/useDashboard';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Play, Square, RefreshCcw, CheckCircle2, AlertCircle } from 'lucide-react';

export default function TestController() {
    const { source, switchSource, lastRefresh } = useDataSource();
    const [isOpen, setIsOpen] = useState(false);
    const [countdown, setCountdown] = useState(30);

    useEffect(() => {
        const timer = setInterval(() => {
            const nextRefresh = 30 - Math.floor((Date.now() - lastRefresh) / 1000) % 30;
            setCountdown(nextRefresh);
        }, 1000);
        return () => clearInterval(timer);
    }, [lastRefresh]);

    return (
        <div className="fixed bottom-20 right-8 z-[9999]">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="mb-4 bg-white/90 backdrop-blur-xl border border-slate-200 rounded-[2rem] p-6 shadow-2xl shadow-slate-300/50 w-80 overflow-hidden relative"
                    >
                        {/* DECORATIVE BLOB */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
                        
                        <div 
                            className="flex items-center justify-between mb-6 relative z-10 cursor-pointer group/header"
                            onClick={() => setIsOpen(false)}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20 group-hover/header:scale-110 transition-transform">
                                    <Database size={20} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tighter">Test Controller</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Near Real-time Simulator</p>
                                </div>
                            </div>
                            <div className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
                                <RefreshCcw size={14} className="rotate-45" />
                            </div>
                        </div>

                        <div className="space-y-3 relative z-10">
                            <button
                                onClick={() => switchSource('api')}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                                    source === 'api' 
                                    ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' 
                                    : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-1.5 rounded-lg ${source === 'api' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                        <Play size={14} />
                                    </div>
                                    <span className="text-xs font-black uppercase">Live Production</span>
                                </div>
                                {source === 'api' && <CheckCircle2 size={16} />}
                            </button>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => switchSource('v1')}
                                    className={`flex items-center gap-3 p-4 rounded-2xl border transition-all duration-300 ${
                                        source === 'v1' 
                                        ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm' 
                                        : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'
                                    }`}
                                >
                                    <div className={`p-1.5 rounded-lg ${source === 'v1' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                        <Square size={14} />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-tighter">Mock V1</span>
                                </button>

                                <button
                                    onClick={() => switchSource('v2')}
                                    className={`flex items-center gap-3 p-4 rounded-2xl border transition-all duration-300 ${
                                        source === 'v2' 
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm' 
                                        : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'
                                    }`}
                                >
                                    <div className={`p-1.5 rounded-lg ${source === 'v2' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                        <Play size={14} />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-tighter">Mock V2</span>
                                </button>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-2">
                                <RefreshCcw size={14} className="text-blue-500 animate-spin" style={{ animationDuration: '3s' }} />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auto-refresh</span>
                            </div>
                            <span className="text-xs font-black text-slate-700 tabular-nums bg-slate-100 px-3 py-1 rounded-full">{countdown}s</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.1, rotate: isOpen ? 90 : 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`p-4 rounded-full shadow-2xl transition-all duration-500 ${
                    isOpen 
                    ? 'bg-slate-800 text-white rotate-180' 
                    : 'bg-blue-600 text-white shadow-blue-500/30 hover:shadow-blue-500/50'
                }`}
            >
                {isOpen ? <RefreshCcw size={24} className="rotate-45" /> : <Database size={24} />}
            </motion.button>
        </div>
    );
}
