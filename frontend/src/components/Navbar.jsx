import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { LogOut, Menu, X, PenLine } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const getInitials = (name) => name ? name.charAt(0).toUpperCase() : 'U';

  const isCitizen = user?.role === 'citizen';
  const isAdmin = user && ['super_admin', 'department_head', 'officer'].includes(user.role);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300" style={{ background: 'rgba(9, 9, 15, 0.7)', backdropFilter: 'blur(20px) saturate(1.2)', WebkitBackdropFilter: 'blur(20px) saturate(1.2)', borderBottom: '1px solid var(--border-subtle)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link to={isAuthenticated ? (isAdmin ? '/admin' : '/complaint-form') : '/'} className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md" style={{ background: 'var(--gradient-primary)' }}>
              <PenLine className="w-5 h-5 text-white transition-transform duration-200 group-hover:scale-110" />
            </div>
            <span className="text-xl font-bold tracking-tight hidden sm:block" style={{ fontFamily: 'var(--font-heading)' }}>
              <span className="gradient-text">Lekh</span>
              <span style={{ color: 'var(--text-primary)' }}>Sahayak</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-5">
            <LanguageSwitcher />

            <Link to="/track" className="text-sm font-semibold transition-colors duration-200 hover:text-brand-400" style={{ color: 'var(--text-secondary)' }}>
              {t('nav.track')}
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                {/* Citizen ke liye complaint button */}
                {isCitizen && (
                  <Link to="/complaint-form" className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all duration-200 hover:scale-[1.02]" style={{ background: 'rgba(124, 58, 237, 0.15)', color: '#a78bfa', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
                    <PenLine className="w-4 h-4" /> {t('nav.report_issue')}
                  </Link>
                )}

                {/* Admin ke liye dashboard link */}
                {isAdmin && (
                  <Link to="/admin" className="text-sm font-semibold transition-colors duration-200 hover:text-brand-400" style={{ color: 'var(--text-secondary)' }}>
                    {t('nav.dashboard')}
                  </Link>
                )}

                <div className="h-4 w-px" style={{ background: 'var(--border-default)' }}></div>

                {/* User avatar + dropdown */}
                <div className="flex items-center space-x-2 cursor-pointer group relative">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'var(--gradient-primary)', color: 'white' }}>
                    {getInitials(user?.name)}
                  </div>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{user?.name?.split(' ')[0]}</span>

                  <div className="absolute top-full right-0 mt-2 w-48 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200" style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-default)' }}>
                    <button onClick={handleLogout} className="flex items-center w-full px-4 py-3 text-sm text-red-400 hover:text-red-300 rounded-xl transition font-medium" style={{ background: 'transparent' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      <LogOut className="w-4 h-4 mr-2" /> {t('nav.logout')}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Logged out — Login/Register dikhao
              <div className="flex flex-row items-center space-x-3">
                <Link to="/login" className="px-4 py-2 font-bold text-sm rounded-xl transition-all duration-200 hover:text-brand-400" style={{ color: 'var(--text-secondary)' }}>
                  {t('nav.login')}
                </Link>
                <Link to="/register" className="btn-primary px-5 py-2 text-sm rounded-xl">
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center space-x-4">
            <LanguageSwitcher />
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="focus:outline-none" style={{ color: 'var(--text-secondary)' }}>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute w-full animate-fade-in px-4 pt-2 pb-4 space-y-1" style={{ background: 'rgba(9, 9, 15, 0.95)', backdropFilter: 'blur(24px)', borderBottom: '1px solid var(--border-subtle)' }}>
          <Link to="/track" onClick={() => setIsMenuOpen(false)} className="block px-3 py-3 rounded-xl text-base font-bold transition-colors" style={{ color: 'var(--text-secondary)' }}>
            {t('nav.track')}
          </Link>

          {isAuthenticated ? (
            <>
              {isCitizen && (
                <Link to="/complaint-form" onClick={() => setIsMenuOpen(false)} className="block px-3 py-3 rounded-xl text-base font-bold" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#a78bfa' }}>
                  {t('nav.report_issue')}
                </Link>
              )}
              {isAdmin && (
                <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="block px-3 py-3 rounded-xl text-base font-bold" style={{ color: 'var(--text-secondary)' }}>
                  {t('nav.dashboard')}
                </Link>
              )}
              <div className="my-2" style={{ borderTop: '1px solid var(--border-subtle)' }}></div>
              <div className="px-3 py-3 flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'var(--gradient-primary)', color: 'white' }}>
                  {getInitials(user?.name)}
                </div>
                <div className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{user?.name}</div>
              </div>
              <button onClick={handleLogout} className="w-full text-left px-3 py-3 rounded-xl text-base font-bold text-red-400 flex items-center hover:bg-red-500/10 transition">
                <LogOut className="w-4 h-4 mr-2" /> {t('nav.logout')}
              </button>
            </>
          ) : (
            <>
              <div className="my-2" style={{ borderTop: '1px solid var(--border-subtle)' }}></div>
              <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block px-3 py-3 rounded-xl text-base font-bold" style={{ color: 'var(--text-secondary)' }}>
                {t('nav.login')}
              </Link>
              <Link to="/register" onClick={() => setIsMenuOpen(false)} className="block px-3 py-3 rounded-xl text-base font-bold text-center mt-2 btn-primary">
                {t('nav.register')}
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
