import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import { Building2, Users, FileText, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const DepartmentView = () => {
  const { slug } = useParams();
  const { t } = useTranslation();
  const [dept, setDept] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeptData = async () => {
      try {
        const [deptRes, statsRes] = await Promise.all([
          api.get(`/departments/${slug}`),
          api.get(`/departments/${slug}/stats`)
        ]);
        setDept(deptRes.data);
        setStats(statsRes.data);
      } catch (err) {
        toast.error(t('toast.dept_load_fail'));
      } finally {
        setLoading(false);
      }
    };
    fetchDeptData();
  }, [slug]);

  if (loading) return <div className="p-20 text-center animate-pulse" style={{ color: 'var(--text-muted)' }}>{t('department.loading')}</div>;
  if (!dept) return <div className="p-20 text-center" style={{ color: 'var(--text-muted)' }}>{t('department.not_found')}</div>;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 w-full animate-fade-in">
      <div className="rounded-3xl p-8 mb-8 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--bg-surface-elevated), rgba(124, 58, 237, 0.15))', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-lg), var(--shadow-glow)' }}>
        <div className="absolute right-0 top-0 opacity-5 blur-xl">
          <Building2 className="w-64 h-64 transform translate-x-1/4 -translate-y-1/4" />
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>{dept.name}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>{t('department.dashboard_ops')}</p>
          </div>
          {dept.head && (
            <div className="hidden sm:block text-right">
              <p className="text-xs uppercase tracking-widest font-bold mb-1" style={{ color: 'var(--text-muted)' }}>{t('department.dept_head')}</p>
              <p className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>{dept.head.name}</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-2xl" style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <FileText className="w-6 h-6 text-brand-400 mb-3" />
          <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{t('department.total_issues')}</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>{stats?.total || 0}</p>
        </div>
        <div className="p-5 rounded-2xl" style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <CheckCircle2 className="w-6 h-6 text-emerald-400 mb-3" />
          <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{t('department.resolved')}</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>{stats?.resolved || 0}</p>
        </div>
        <div className="p-5 rounded-2xl" style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <Users className="w-6 h-6 text-purple-400 mb-3" />
          <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{t('department.officers_active')}</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>{dept.officers?.length || 0}</p>
        </div>
        <div className="p-5 rounded-2xl" style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>{t('department.resolution_time')}</p>
          <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>{stats?.avgResolutionHours || 0}<span className="text-lg font-medium" style={{ color: 'var(--text-muted)' }}> {t('analytics.hrs')}</span></p>
        </div>
      </div>

      <div className="rounded-3xl p-6" style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>{t('department.operational_dashboard')}</h2>
          <a href="/admin" className="text-brand-400 font-semibold hover:underline text-sm transition">{t('department.action_center')}</a>
        </div>
        <p className="text-center py-10 font-medium" style={{ color: 'var(--text-muted)' }}>
          {t('department.ops_desc')}
        </p>
      </div>
    </div>
  );
};

export default DepartmentView;
