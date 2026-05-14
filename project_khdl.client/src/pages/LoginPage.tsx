import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, User, ChevronRight, AlertCircle, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Đăng nhập thất bại');
            }

            const data = await response.json();
            login(data.token, data.user);
        } catch (err: any) {
            setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full"></div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[440px] relative z-10"
            >
                {/* Logo & Branding */}
                <div className="flex flex-col items-center mb-10 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-500/20 mb-6">
                        <ShieldCheck className="text-white w-10 h-10" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tighter mb-2">
                        Project<span className="text-blue-600">_KHDL</span>
                    </h1>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Hệ thống bảo mật & Định danh</p>
                </div>

                {/* Login Card */}
                <div className="bg-white/70 backdrop-blur-xl border border-white rounded-[2.5rem] p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                    
                    <div className="mb-8">
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Chào mừng trở lại</h2>
                        <p className="text-xs font-bold text-slate-400">Đăng nhập để truy cập hệ thống phân tích doanh nghiệp.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tên đăng nhập</label>
                            <div className="relative group">
                                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input 
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Nhập tên đăng nhập..."
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:bg-white focus:border-blue-200 focus:ring-4 ring-blue-500/5 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mật khẩu</label>
                            <div className="relative group">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input 
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:bg-white focus:border-blue-200 focus:ring-4 ring-blue-500/5 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600"
                            >
                                <AlertCircle size={18} className="shrink-0" />
                                <p className="text-[11px] font-bold">{error}</p>
                            </motion.div>
                        )}

                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span>Đăng nhập ngay</span>
                                    <ChevronRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Demo Credentials */}
                <div className="mt-8 p-6 bg-slate-100/50 backdrop-blur-sm border border-slate-200/50 rounded-[2rem] flex items-start gap-4">
                    <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                        <Info size={16} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Tài khoản trải nghiệm:</p>
                        <div className="grid grid-cols-1 gap-1 text-[10px] font-bold text-slate-600">
                            <p>• <span className="text-indigo-600 font-black uppercase">Admin:</span> admin / admin123</p>
                            <p>• <span className="text-indigo-600 font-black uppercase">Marketer:</span> marketer / market123</p>
                            <p>• <span className="text-indigo-600 font-black uppercase">Analyst:</span> analyst / analyst123</p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
