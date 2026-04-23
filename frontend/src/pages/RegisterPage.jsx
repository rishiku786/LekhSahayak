import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { UserPlus, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const RegisterPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.passwords_mismatch'));
      return;
    }

    setLoading(true);
    try {
      await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: 'citizen'
      });
      navigate('/complaint-form');
    } catch (err) {
      setError(err.response?.data?.error || t('auth.register_fail'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden relative">
      {/* Background orbs */}
      <div className="orb orb-violet w-[400px] h-[400px] top-[5%] right-[5%]"></div>
      <div className="orb orb-cyan w-[350px] h-[350px] bottom-[10%] left-[5%]"></div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-md w-full space-y-8 p-10 rounded-3xl relative overflow-hidden flex flex-col"
        style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-lg), var(--shadow-glow)' }}
      >

        {/* Decorative blurs */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-2xl" style={{ background: 'rgba(124, 58, 237, 0.08)' }}></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full blur-2xl" style={{ background: 'rgba(6, 182, 212, 0.06)' }}></div>

        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center relative z-10 mb-2"
        >
          <div className="mx-auto w-12 h-12 rounded-xl flex items-center justify-center shadow-lg mb-4" style={{ background: 'var(--gradient-primary)' }}>
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
            {t('auth.register_btn')}
          </h2>
          <p className="mt-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {t('auth.join')}
          </p>
        </motion.div>

        {error && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="p-4 rounded-xl text-sm flex items-start space-x-2 relative z-10 m-0" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" />
            <p className="font-medium">{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleRegister} className="space-y-5 relative z-10 m-0">
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>{t('auth.full_name')}</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input-dark"
              placeholder="Ramesh Kumar"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>{t('auth.email')}</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input-dark"
              placeholder="ramesh@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>{t('auth.phone')}</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="input-dark"
              placeholder="+91 9876543210"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>{t('auth.password')}</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input-dark"
                required
                minLength="6"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>{t('auth.confirm_password')}</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input-dark"
                required
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center mt-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white btn-primary disabled:opacity-50"
          >
            {loading ? t('auth.creating') : t('auth.sign_up')}
          </motion.button>
        </form>

        <div className="text-center relative z-10 m-0 mt-4">
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {t('auth.have_account')}{' '}
            <Link to="/login" className="font-bold text-brand-400 hover:text-brand-300 hover:underline transition">
              {t('auth.log_in')}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
