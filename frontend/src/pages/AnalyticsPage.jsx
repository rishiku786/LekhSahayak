import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import api from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Activity, CheckCircle2, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import StatsCard from '../components/StatsCard';

const COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981'];

const CustomTooltipStyle = {
  backgroundColor: 'var(--bg-surface-elevated)',
  border: '1px solid var(--border-default)',
  borderRadius: '12px',
  padding: '8px 12px',
  color: 'var(--text-primary)',
  fontSize: '13px',
  boxShadow: 'var(--shadow-md)',
};

const AnalyticsPage = () => {
  const { hasRole } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    overview: null,
    departments: [],
    priority: [],
    trends: [],
    sla: []
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [overviewRes, deptRes, priorityRes, trendsRes, slaRes] = await Promise.all([
          api.get('/analytics/overview'),
          api.get('/analytics/by-department'),
          api.get('/analytics/by-priority'),
          api.get('/analytics/trends'),
          api.get('/analytics/sla-breaches')
        ]);

        setData({
          overview: overviewRes.data,
          departments: deptRes.data,
          priority: priorityRes.data,
          trends: trendsRes.data,
          sla: slaRes.data
        });
      } catch (error) {
        console.error("Failed to load analytics", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (!hasRole(['super_admin', 'department_head'])) {
    return <Navigate to="/admin" />;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-400"></div>
      </div>
    );
  }

  const { overview, departments, priority, trends, sla } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in w-full">
      <div className="mb-8">
        <h1 className="text-title font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>{t('analytics.title')}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>{t('analytics.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard 
          icon={<Activity className="text-brand-400" />}
          title={t('analytics.total_complaints')}
          value={overview?.total || 0}
          trend={t('analytics.trend_week')}
        />
        <StatsCard 
          icon={<CheckCircle2 className="text-emerald-400" />}
          title={t('analytics.resolution_rate')}
          value={`${overview?.resolutionRate || 0}%`}
          desc={t('analytics.resolved_count', { count: overview?.resolved || 0 })}
        />
        <StatsCard 
          icon={<Clock className="text-amber-400" />}
          title={t('analytics.avg_resolution')}
          value={`${overview?.avgResolutionHours || 0}h`}
        />
        <StatsCard 
          icon={<AlertTriangle className="text-red-400" />}
          title={t('analytics.sla_breaches')}
          value={overview?.slaBreaches || 0}
          alert={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="p-6 rounded-2xl" style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 className="text-lg font-bold mb-6 pb-2" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)' }}>{t('analytics.by_department')}</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departments} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="_id" tickFormatter={(val) => t(`dynamic.department.${val}`, { defaultValue: val })?.split(' ')[0] || ''} stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip contentStyle={CustomTooltipStyle} />
                <Bar dataKey="total" fill="#8b5cf6" name="Total" radius={[6, 6, 0, 0]} />
                <Bar dataKey="resolved" fill="#10b981" name="Resolved" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 rounded-2xl" style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 className="text-lg font-bold mb-6 pb-2" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)' }}>{t('analytics.trend_30day')}</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="_id" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip contentStyle={CustomTooltipStyle} />
                <Line type="monotone" dataKey="count" stroke="#06b6d4" strokeWidth={3} dot={{r: 4, fill: '#06b6d4'}} activeDot={{r: 8, fill: '#06b6d4', stroke: 'rgba(6,182,212,0.3)', strokeWidth: 4}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="p-6 rounded-2xl col-span-1" style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 className="text-lg font-bold mb-6 pb-2" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)' }}>{t('analytics.priority_distribution')}</h3>
          <div className="h-64 w-full flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priority}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="_id"
                >
                  {priority.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={
                       entry._id === 'Critical' ? '#ef4444' :
                       entry._id === 'High' ? '#f59e0b' :
                       entry._id === 'Medium' ? '#3b82f6' : '#10b981'
                    } />
                  ))}
                </Pie>
                <Tooltip contentStyle={CustomTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {priority.map(p => (
              <span key={p._id} className="text-xs font-semibold px-2 py-1 rounded-md" style={{ background: 'var(--glass-bg-strong)', color: 'var(--text-secondary)' }}>
                {t(`dynamic.priority.${p._id}`, { defaultValue: p._id })}: {p.count}
              </span>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-2xl col-span-2 overflow-hidden" style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex justify-between items-center pb-2 mb-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
             <h3 className="text-lg font-bold flex items-center" style={{ color: 'var(--text-primary)' }}>
               <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
               {t('analytics.critical_sla')}
             </h3>
             <span className="text-sm font-bold px-2 py-1 rounded-md" style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5' }}>{sla.length} {t('analytics.active')}</span>
          </div>
          
          <div className="overflow-x-auto">
            {sla.length === 0 ? (
               <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>{t('analytics.no_sla')}</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr style={{ background: 'var(--glass-bg)', color: 'var(--text-muted)' }}>
                    <th className="p-3 rounded-tl-lg font-semibold">{t('analytics.col_id')}</th>
                    <th className="p-3 font-semibold">{t('analytics.col_department')}</th>
                    <th className="p-3 font-semibold">{t('analytics.col_status')}</th>
                    <th className="p-3 rounded-tr-lg font-semibold">{t('analytics.col_deadline')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sla.map(c => {
                    const hoursOverdue = Math.round((new Date() - new Date(c.slaDeadline)) / (1000 * 60 * 60));
                    return (
                      <tr key={c._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td className="p-3 font-mono font-medium text-brand-400">{c.trackingId}</td>
                        <td className="p-3" style={{ color: 'var(--text-secondary)' }}>{t(`dynamic.department.${c.department}`, { defaultValue: c.department })}</td>
                        <td className="p-3"><span className="px-2 py-1 rounded-lg text-xs font-bold" style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24' }}>{t(`dynamic.status.${c.status}`, { defaultValue: c.status })}</span></td>
                        <td className="p-3 text-red-400 font-bold">{hoursOverdue} {t('analytics.hrs')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
