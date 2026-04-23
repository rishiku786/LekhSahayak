import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Mic, MapPin, Zap, Shield, Globe, ChevronRight, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const LandingPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="w-full flex flex-col" style={{ background: 'var(--bg-primary)' }}>

      {/* Hero Section */}
      <section className="w-full min-h-[92vh] flex flex-col items-center justify-center px-4 py-24 text-center relative overflow-hidden">
        {/* Animated background orbs */}
        <div className="orb orb-violet w-[500px] h-[500px] top-[-100px] left-[-100px]" style={{ animation: 'float 8s ease-in-out infinite' }}></div>
        <div className="orb orb-cyan w-[400px] h-[400px] bottom-[-50px] right-[-50px]" style={{ animation: 'float 10s ease-in-out infinite reverse' }}></div>
        <div className="orb orb-rose w-[300px] h-[300px] top-[40%] right-[20%]" style={{ animation: 'float 12s ease-in-out infinite' }}></div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 -z-5" style={{ backgroundImage: 'radial-gradient(rgba(124, 58, 237, 0.06) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

        <motion.div 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="flex flex-col items-center relative z-10"
        >
          {/* Badge */}
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold mb-10" style={{ background: 'rgba(124, 58, 237, 0.12)', color: '#a78bfa', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
            <Zap className="w-4 h-4" />
            {t('landing.badge')}
          </motion.div>

          {/* Title */}
          <motion.h1 variants={fadeUp} className="text-hero max-w-5xl mb-6" style={{ fontFamily: 'var(--font-heading)' }}>
            <span className="gradient-text-glow">
             {t('landing.title_main')}
            </span>
            <span style={{ color: 'var(--text-primary)' }}>
              {t('landing.title_sub')}
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-lg md:text-xl font-semibold mb-3 max-w-2xl" style={{ color: 'var(--text-primary)', opacity: 0.9 }}>
            {t('app.subtitle')}
          </motion.p>

          <motion.p variants={fadeUp} className="text-base max-w-2xl mb-14 leading-relaxed" style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
            {t('app.description')}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 mb-20">
                <Link
                  to="/register"
                  className="btn-primary px-8 py-4 text-lg rounded-2xl flex items-center gap-2"
                >
                  {t('auth.register_btn')} <ChevronRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/login"
                  className="btn-secondary px-8 py-4 text-lg rounded-2xl flex items-center gap-2"
                >
                  {t('nav.login')} <ChevronRight className="w-5 h-5" />
                </Link>
          </motion.div>

          {/* Stats */}
          <motion.div variants={staggerContainer} className="flex flex-wrap justify-center gap-8 md:gap-16">
            {[
              { number: '8+', label: t('landing.stat_langs') },
              { number: '5', label: t('landing.stat_ai') },
              { number: '7', label: t('landing.stat_depts') },
              { number: '24/7', label: t('landing.stat_monitor') },
            ].map((stat, i) => (
              <motion.div key={i} variants={fadeUp} className="text-center">
                <p className="text-3xl font-bold gradient-text" style={{ fontFamily: 'var(--font-heading)' }}>{stat.number}</p>
                <p className="text-sm font-semibold mt-1" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* How it works */}
      <section className="w-full py-24 px-4 overflow-hidden relative" style={{ background: 'var(--bg-secondary)' }}>
        <div className="absolute inset-0" style={{ background: 'var(--gradient-surface)' }}></div>
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="max-w-5xl mx-auto relative z-10"
        >
          <motion.h2 variants={fadeUp} className="text-display text-center mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
            {t('landing.how_title')}
          </motion.h2>
          <motion.p variants={fadeUp} className="text-center text-lg mb-16" style={{ color: 'var(--text-secondary)' }}>{t('landing.how_subtitle')}</motion.p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: <Mic className="w-8 h-8 text-brand-400" />,
                title: t('landing.step1_title'),
                desc: t('landing.step1_desc')
              },
              {
                step: '02',
                icon: <Zap className="w-8 h-8 text-accent-400" />,
                title: t('landing.step2_title'),
                desc: t('landing.step2_desc')
              },
              {
                step: '03',
                icon: <CheckCircle className="w-8 h-8 text-emerald-400" />,
                title: t('landing.step3_title'),
                desc: t('landing.step3_desc')
              }
            ].map((item, i) => (
              <motion.div 
                key={i}
                variants={fadeUp}
                whileHover={{ y: -8, scale: 1.02 }}
                className="relative p-8 rounded-3xl card-dark overflow-hidden group"
              >
                <span className="absolute top-6 right-6 text-5xl font-bold" style={{ color: 'rgba(255,255,255,0.04)', fontFamily: 'var(--font-heading)' }}>{item.step}</span>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'var(--glass-bg-strong)', border: '1px solid var(--border-subtle)' }}>
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>{item.title}</h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>{item.desc}</p>
                {/* Hover glow */}
                <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(124,58,237,0.06), transparent 70%)' }}></div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="w-full py-24 px-4 overflow-hidden relative" style={{ background: 'var(--bg-primary)' }}>
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="max-w-5xl mx-auto relative z-10"
        >
          <motion.h2 variants={fadeUp} className="text-display text-center mb-16" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
            {t('landing.features_title')}
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <Mic className="w-6 h-6" />, title: t('landing.feat1_title'), desc: t('landing.feat1_desc'), color: 'text-brand-400', bg: 'rgba(124,58,237,0.12)' },
              { icon: <Globe className="w-6 h-6" />, title: t('landing.feat2_title'), desc: t('landing.feat2_desc'), color: 'text-accent-400', bg: 'rgba(6,182,212,0.12)' },
              { icon: <MapPin className="w-6 h-6" />, title: t('landing.feat3_title'), desc: t('landing.feat3_desc'), color: 'text-emerald-400', bg: 'rgba(16,185,129,0.12)' },
              { icon: <Zap className="w-6 h-6" />, title: t('landing.feat4_title'), desc: t('landing.feat4_desc'), color: 'text-amber-400', bg: 'rgba(245,158,11,0.12)' },
              { icon: <Shield className="w-6 h-6" />, title: t('landing.feat5_title'), desc: t('landing.feat5_desc'), color: 'text-rose-400', bg: 'rgba(244,63,94,0.12)' },
              { icon: <CheckCircle className="w-6 h-6" />, title: t('landing.feat6_title'), desc: t('landing.feat6_desc'), color: 'text-purple-400', bg: 'rgba(168,85,247,0.12)' },
            ].map((f, i) => (
              <motion.div 
                key={i} 
                variants={fadeUp}
                whileHover={{ scale: 1.03, y: -4 }}
                className="p-6 rounded-2xl card-dark flex items-start gap-4 group"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${f.color}`} style={{ background: f.bg }}>
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA Bottom */}
      <section className="w-full py-24 px-4 text-center overflow-hidden relative" style={{ background: 'var(--bg-secondary)' }}>
        {/* Gradient overlay */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.15), transparent 70%)' }}></div>
        <motion.div
           initial="hidden"
           whileInView="visible"
           viewport={{ once: true }}
           variants={fadeUp}
           className="relative z-10"
        >
          <h2 className="text-display mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>{t('landing.cta_title')}</h2>
          <p className="text-xl mb-12" style={{ color: 'var(--text-secondary)' }}>{t('landing.cta_desc')}</p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
            <Link
              to="/register"
              className="btn-primary inline-flex items-center gap-2 px-10 py-4 text-lg rounded-2xl"
            >
              {t('auth.register_btn')} <ChevronRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="w-full py-10 px-4 text-center" style={{ background: 'var(--bg-primary)', borderTop: '1px solid var(--border-subtle)' }}>
        <p className="font-bold text-lg mb-2 gradient-text" style={{ fontFamily: 'var(--font-heading)' }}>{t('landing.footer_title')}</p>
        <p style={{ color: 'var(--text-secondary)' }}>{t('landing.footer_subtitle')}</p>
        <p className="mt-2" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{t('landing.footer_made')}</p>
      </footer>
    </div>
  );
};

export default LandingPage;
