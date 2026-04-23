import React, { useState, useEffect } from 'react';
import { RefreshCw, Filter, List, Clock, Download, PieChart, Users, Zap, AlertTriangle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import StatsCard from '../components/StatsCard';

import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const navigate = useNavigate();

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/complaints');
      setComplaints(res.data);
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
    // Auto-refresh every 30 seconds to catch escalations
    const interval = setInterval(fetchComplaints, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredComplaints = filter === 'All'
    ? complaints
    : complaints.filter(c => c.status === filter);

  const pendingCount = complaints.filter(c => c.status === 'Pending').length;
  const criticalCount = complaints.filter(c => c.priority === 'Critical').length;
  const resolvedCount = complaints.filter(c => c.status === 'Resolved').length;

  const canViewAnalytics = user && ['super_admin', 'department_head'].includes(user.role);

  return (
    <div className="w-full max-w-7xl mx-auto py-10 animate-fade-in px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-title tracking-tight" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
            {t('admin.dashboard_title')} {user?.department && `- ${user.department}`}
          </h2>
          <p className="mt-1 font-medium" style={{ color: 'var(--text-secondary)' }}>{t('admin.dashboard_subtitle')}</p>
        </div>

        {canViewAnalytics && (
          <div className="flex gap-3">
            <Link to="/admin/analytics" className="px-4 py-2.5 font-bold rounded-xl flex items-center transition-all duration-200 hover:scale-[1.02] text-sm" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#a78bfa', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
              <PieChart className="w-4 h-4 mr-2" /> {t('admin.analytics')}
            </Link>
            <a
              href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/reports/csv`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 font-bold rounded-xl flex items-center transition-all duration-200 hover:scale-[1.02] text-sm" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.15)' }}
            >
              <Download className="w-4 h-4 mr-2" /> {t('admin.export_csv')}
            </a>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard icon={<Clock className="text-amber-400"/>} title={t('admin.pending')} value={pendingCount} />
        <StatsCard icon={<Zap className="text-red-400"/>} title={t('admin.critical')} value={criticalCount} alert={criticalCount > 5} />
        <StatsCard icon={<CheckCircle2 className="text-emerald-400"/>} title={t('admin.resolved')} value={resolvedCount} />
      </div>

      <div className="rounded-3xl overflow-hidden" style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-md)' }}>

        <div className="flex justify-between items-center p-6" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--glass-bg)' }}>
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-transparent border-none font-bold cursor-pointer text-sm outline-none" style={{ color: 'var(--text-primary)' }}
            >
              <option value="All" style={{ background: 'var(--bg-surface)' }}>{t('admin.all_issues')}</option>
              <option value="Pending" style={{ background: 'var(--bg-surface)' }}>{t('admin.status_pending')}</option>
              <option value="In Progress" style={{ background: 'var(--bg-surface)' }}>{t('admin.status_in_progress')}</option>
              <option value="Escalated" style={{ background: 'var(--bg-surface)' }}>{t('admin.status_escalated')}</option>
              <option value="Resolved" style={{ background: 'var(--bg-surface)' }}>{t('admin.status_resolved')}</option>
            </select>
          </div>
          <button onClick={fetchComplaints} className="p-2 rounded-full transition-colors duration-200" style={{ color: 'var(--text-muted)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--glass-bg-strong)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="p-20 text-center flex flex-col items-center" style={{ color: 'var(--text-muted)' }}>
            <RefreshCw className="w-8 h-8 animate-spin mb-4 text-brand-400" />
            {t('admin.loading')}
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center" style={{ color: 'var(--text-muted)' }}>
            <List className="w-12 h-12 mb-4" style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
            <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('admin.no_issues_title')}</h3>
            <p>{t('admin.no_issues_desc', { filter: filter })}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs uppercase tracking-wider" style={{ background: 'var(--glass-bg)', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th className="p-5 font-bold">{t('admin.tracking_id')}</th>
                  <th className="p-5 font-bold">{t('admin.details')}</th>
                  <th className="p-5 font-bold">{t('tracker.department')}</th>
                  <th className="p-5 font-bold">{t('admin.priority_status')}</th>
                  <th className="p-5 font-bold">{t('admin.date')}</th>
                  <th className="p-5 font-bold text-center">{t('admin.action')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map(c => {
                  const isBreach = c.slaDeadline && new Date(c.slaDeadline) < new Date() && !['Resolved', 'Closed'].includes(c.status);
                  return (
                    <tr key={c._id} className="transition-colors group" style={{ borderBottom: '1px solid var(--border-subtle)', background: isBreach ? 'rgba(239, 68, 68, 0.04)' : 'transparent' }} onMouseEnter={e => e.currentTarget.style.background = isBreach ? 'rgba(239,68,68,0.08)' : 'var(--glass-bg)'} onMouseLeave={e => e.currentTarget.style.background = isBreach ? 'rgba(239,68,68,0.04)' : 'transparent'}>
                      <td className="p-5">
                        <span className="font-mono font-bold px-3 py-1 rounded-lg whitespace-nowrap" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#a78bfa', border: '1px solid rgba(124, 58, 237, 0.15)' }}>
                          {c.trackingId}
                        </span>
                      </td>
                      <td className="p-5 min-w-[250px]">
                        <p className="font-semibold mb-1 flex items-center" style={{ color: 'var(--text-primary)' }}>
                          {t(`dynamic.problemType.${c.problemType}`, { defaultValue: c.problemType })}
                          {c.language && <span className="ml-2 text-[10px] uppercase font-bold px-1.5 rounded" style={{ background: 'var(--glass-bg-strong)', color: 'var(--text-muted)' }}>{c.language}</span>}
                        </p>
                        <p className="text-sm truncate max-w-sm line-clamp-1" style={{ color: 'var(--text-muted)' }}>{c.location}</p>
                      </td>
                      <td className="p-5">
                        <span className="font-medium whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{t(`dynamic.department.${c.department}`, { defaultValue: c.department })}</span>
                      </td>
                      <td className="p-5">
                        <div className="flex flex-col space-y-2 items-start">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                            c.priority === 'Critical' ? 'text-red-300' :
                              c.priority === 'High' ? 'text-orange-300' :
                              c.priority === 'Medium' ? 'text-amber-300' :
                              'text-slate-300'}`}
                            style={{ background: c.priority === 'Critical' ? 'rgba(239,68,68,0.12)' : c.priority === 'High' ? 'rgba(249,115,22,0.12)' : c.priority === 'Medium' ? 'rgba(245,158,11,0.12)' : 'var(--glass-bg-strong)', border: `1px solid ${c.priority === 'Critical' ? 'rgba(239,68,68,0.2)' : c.priority === 'High' ? 'rgba(249,115,22,0.2)' : c.priority === 'Medium' ? 'rgba(245,158,11,0.2)' : 'var(--border-subtle)'}` }}
                          >
                            {t(`dynamic.priority.${c.priority}`, { defaultValue: c.priority })}
                          </span>
                          {c.priorityScore !== undefined && (
                            <span className="text-[10px] font-bold whitespace-nowrap mt-1" style={{ color: 'var(--text-muted)' }}>
                              Score: {c.priorityScore}/100 {c.isMassOutage && '🚨'}
                            </span>
                          )}
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                            c.status === 'Pending' ? 'text-amber-300' :
                              c.status === 'In Progress' ? 'text-blue-300' :
                              c.status === 'Escalated' ? 'text-red-300' :
                              'text-emerald-300'}`}
                            style={{ background: c.status === 'Pending' ? 'rgba(245,158,11,0.1)' : c.status === 'In Progress' ? 'rgba(59,130,246,0.1)' : c.status === 'Escalated' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)' }}
                          >
                            {t(`dynamic.status.${c.status}`, { defaultValue: c.status })}
                          </span>
                        </div>
                      </td>
                      <td className="p-5 text-sm whitespace-nowrap">
                        <div className="flex flex-col items-start">
                          <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{new Date(c.createdAt).toLocaleDateString()}</span>
                          {isBreach && (
                            <span className="text-xs font-bold text-red-400 mt-1 flex items-center">
                              <AlertTriangle className="w-3 h-3 mr-1"/> {t('admin.sla_breach')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-5 text-center">
                        <button
                          onClick={() => navigate(`/complaint/${c.trackingId}`)}
                          className="px-4 py-2 font-bold rounded-xl text-sm transition-all duration-200 hover:scale-[1.02]"
                          style={{ background: 'var(--gradient-primary)', color: 'white', boxShadow: '0 4px 12px rgba(124,58,237,0.25)' }}
                        >
                          {t('admin.review')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const CheckCircle2 = ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>

export default AdminDashboard;
