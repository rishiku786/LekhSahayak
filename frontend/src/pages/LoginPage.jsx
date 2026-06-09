import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { LogIn, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, user } = useAuth();

  const [isCitizen, setIsCitizen] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Saare hooks ke baad redirect
  if (user) {
    if (['super_admin', 'department_head', 'officer'].includes(user.role)) {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/complaint-form" replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      if (['super_admin', 'department_head', 'officer'].includes(data.user.role)) {
        navigate('/admin');
      } else {
        navigate('/complaint-form');
      }
    } catch (err) {
      setError(err.response?.data?.error || t('auth.login_fail'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden relative">
      {/* Background orbs */}
      <div className="orb orb-violet w-[400px] h-[400px] top-[10%] left-[5%]"></div>
      <div className="orb orb-cyan w-[300px] h-[300px] bottom-[10%] right-[10%]"></div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-md w-full space-y-8 p-10 rounded-3xl relative overflow-hidden"
        style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-lg), var(--shadow-glow)' }}
      >

        {/* Decorative corners */}
        <div className="absolute top-0 right-0 w-32 h-32 rounded-bl-full" style={{ background: 'rgba(124, 58, 237, 0.06)' }}></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-tr-full" style={{ background: 'rgba(6, 182, 212, 0.04)' }}></div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center relative z-10"
        >
          <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-3xl shadow-lg mb-6" style={{ background: 'var(--gradient-primary)', color: 'white' }}>
            S
          </div>
          <h2 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
            {t('nav.login')}
          </h2>
          <p className="mt-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {t('auth.access_portal')}
          </p>
        </motion.div>

        <div className="flex p-1 rounded-xl relative z-10" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => {
              setIsCitizen(true);
              setEmail('');
              setPassword('');
              setError('');
            }}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ${isCitizen ? 'text-white shadow-md' : 'hover:text-brand-400'
              }`}
            style={isCitizen ? { background: 'var(--gradient-primary)' } : { color: 'var(--text-muted)' }}
          >
            {t('auth.citizen')}
          </button>
          <button
            onClick={() => {
              setIsCitizen(false);
              setEmail('');
              setPassword('');
              setError('');
            }}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ${!isCitizen ? 'text-white shadow-md' : 'hover:text-brand-400'
              }`}
            style={!isCitizen ? { background: 'var(--bg-surface-hover)', color: 'var(--text-primary)' } : { color: 'var(--text-muted)' }}
          >
            {t('auth.official')}
          </button>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="p-4 rounded-xl text-sm flex items-start space-x-2 relative z-10" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
            <p className="font-medium mt-0.5">{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="mt-8 space-y-6 relative z-10">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>{t('auth.email')}</label>
              <input
                key={isCitizen ? 'citizen-email' : 'official-email'}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-dark"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>{t('auth.password')}</label>
              <input
                key={isCitizen ? 'citizen-password' : 'official-password'}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-dark"
                placeholder="••••••••"
                required
              />
            </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center items-center space-x-2 py-3.5 px-4 rounded-xl shadow-md text-sm font-bold text-white transition-all disabled:opacity-50 ${isCitizen
                ? 'btn-primary'
                : ''
              }`}
            style={!isCitizen ? { background: 'var(--bg-surface-hover)', border: '1px solid var(--border-default)' } : {}}
          >
            <LogIn className="w-5 h-5 mr-2" />
            <span>{loading ? t('auth.signing_in') : t('auth.login_btn')}</span>
          </motion.button>
        </form>

        {isCitizen && (
          <div className="text-center mt-6 relative z-10">
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              {t('auth.no_account')}{' '}
              <Link to="/register" className="font-bold text-brand-400 hover:text-brand-300 hover:underline transition">
                {t('auth.register_btn')}
              </Link>
            </p>
          </div>
        )}

        {/* Recruiter Quick Demo Login Helper */}
        {!isCitizen && (
          <div className="mt-6 p-4 rounded-2xl relative z-10 text-xs text-left animate-fade-in" style={{ background: 'var(--bg-surface)', border: '1px dashed var(--border-strong)' }}>
            <p className="font-bold mb-2 flex items-center" style={{ color: 'var(--text-accent)', fontSize: '11px' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 mr-1.5 animate-pulse" />
              Quick Demo Accounts (For Recruiters)
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsCitizen(false);
                  setEmail('superadmin@lekhsahayak.gov.in');
                  setPassword('password123');
                }}
                className="flex justify-between items-center p-2 rounded-xl transition hover:bg-white/5 cursor-pointer text-[11px] text-left border border-white/5"
              >
                <span>🔑 <strong>Super Admin:</strong> superadmin@lekhsahayak.gov.in</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 font-bold border border-brand-500/20">Auto Fill</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCitizen(false);
                  setEmail('pwd_head@lekhsahayak.gov.in');
                  setPassword('password123');
                }}
                className="flex justify-between items-center p-2 rounded-xl transition hover:bg-white/5 cursor-pointer text-[11px] text-left border border-white/5"
              >
                <span>🏢 <strong>Dept Head:</strong> pwd_head@lekhsahayak.gov.in</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">Auto Fill</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCitizen(false);
                  setEmail('officer1@lekhsahayak.gov.in');
                  setPassword('password123');
                }}
                className="flex justify-between items-center p-2 rounded-xl transition hover:bg-white/5 cursor-pointer text-[11px] text-left border border-white/5"
              >
                <span>👮 <strong>Officer:</strong> officer1@lekhsahayak.gov.in</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">Auto Fill</span>
              </button>
            </div>
          </div>
        )}

        <div className="text-center mt-4 relative z-10">
          <Link to="/" className="text-sm transition hover:text-brand-400" style={{ color: 'var(--text-muted)' }}>
            ← {t('nav.back_home')}
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
