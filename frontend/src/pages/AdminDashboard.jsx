import React, { useState, useEffect } from 'react';
import { RefreshCw, Filter, List, Clock, Download, PieChart, Users, Zap, AlertTriangle, UserPlus, Shield, Building, Mail, Phone, Key, User } from 'lucide-react';
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

  // Manage Officials State
  const [activeTab, setActiveTab] = useState('complaints');
  const [officials, setOfficials] = useState([]);
  const [loadingOfficials, setLoadingOfficials] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'officer',
    department: '',
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

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

  const fetchOfficials = async () => {
    if (user?.role !== 'super_admin') return;
    setLoadingOfficials(true);
    try {
      const res = await api.get('/auth/officials');
      setOfficials(res.data);
    } catch (err) {
      console.error('Failed to fetch officials:', err);
    } finally {
      setLoadingOfficials(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      setDepartments(res.data);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  };

  const handleAddOfficial = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setCreating(true);

    try {
      await api.post('/auth/create-official', {
        ...formData,
        department: formData.department || null
      });
      setFormSuccess(t('admin.success_official_created'));
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'officer',
        department: '',
      });
      fetchOfficials();
    } catch (err) {
      setFormError(err.response?.data?.error || t('admin.fail_official_created'));
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
    // Auto-refresh every 30 seconds to catch escalations
    const interval = setInterval(fetchComplaints, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user?.role === 'super_admin') {
      fetchOfficials();
      fetchDepartments();
    }
  }, [user]);

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

      {user?.role === 'super_admin' && (
        <div className="flex border-b border-subtle mb-8 gap-6" style={{ borderColor: 'var(--border-subtle)' }}>
          <button
            onClick={() => setActiveTab('complaints')}
            className="pb-3 font-bold text-sm transition-all duration-200 relative cursor-pointer"
            style={{ color: activeTab === 'complaints' ? 'var(--text-accent)' : 'var(--text-muted)' }}
          >
            {t('admin.tab_complaints')}
            {activeTab === 'complaints' && (
              <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 rounded-t-full" style={{ background: 'var(--gradient-primary)' }} />
            )}
          </button>
          <button
            onClick={() => setActiveTab('officials')}
            className="pb-3 font-bold text-sm transition-all duration-200 relative cursor-pointer"
            style={{ color: activeTab === 'officials' ? 'var(--text-accent)' : 'var(--text-muted)' }}
          >
            {t('admin.tab_officials')}
            {activeTab === 'officials' && (
              <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 rounded-t-full" style={{ background: 'var(--gradient-primary)' }} />
            )}
          </button>
        </div>
      )}

      {activeTab === 'complaints' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fade-in">
            <StatsCard icon={<Clock className="text-amber-400"/>} title={t('admin.pending')} value={pendingCount} />
            <StatsCard icon={<Zap className="text-red-400"/>} title={t('admin.critical')} value={criticalCount} alert={criticalCount > 5} />
            <StatsCard icon={<CheckCircle2 className="text-emerald-400"/>} title={t('admin.resolved')} value={resolvedCount} />
          </div>

          <div className="rounded-3xl overflow-hidden animate-slide-up" style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-md)' }}>

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
              <button onClick={fetchComplaints} className="p-2 rounded-full transition-colors duration-200 cursor-pointer" style={{ color: 'var(--text-muted)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--glass-bg-strong)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
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
                              className="px-4 py-2 font-bold rounded-xl text-sm transition-all duration-200 hover:scale-[1.02] cursor-pointer"
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
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-up">
          {/* Add Official Form */}
          <div className="lg:col-span-1">
            <div className="rounded-3xl p-6 relative overflow-hidden" style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-md)' }}>
              {/* Decorative background glow */}
              <div className="absolute top-[-50px] right-[-50px] w-32 h-32 rounded-full filter blur-[40px] opacity-10" style={{ background: 'var(--gradient-primary)' }} />

              <h3 className="text-lg font-bold mb-6 flex items-center" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                <UserPlus className="w-5 h-5 mr-2 text-brand-400" /> {t('admin.add_official')}
              </h3>

              {formError && (
                <div className="mb-4 p-4 rounded-xl text-sm font-semibold text-red-300 bg-red-950/20 border border-red-900/30">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="mb-4 p-4 rounded-xl text-sm font-semibold text-emerald-300 bg-emerald-950/20 border border-emerald-900/30">
                  {formSuccess}
                </div>
              )}

              <form onSubmit={handleAddOfficial} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                    {t('admin.official_name')}
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      required
                      placeholder={t('admin.official_name')}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-dark pl-11"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                    {t('admin.official_email')}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="email"
                      required
                      placeholder="e.g. officer@lekhsahayak.gov.in"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input-dark pl-11"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                    {t('admin.official_password')}
                  </label>
                  <div className="relative">
                    <Key className="absolute left-4 top-3.5 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="password"
                      required
                      placeholder="Minimum 6 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="input-dark pl-11"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                    {t('admin.official_phone')}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-3.5 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="10-digit number"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input-dark pl-11"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                    {t('admin.official_role')}
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-4 top-3.5 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="input-dark pl-11 appearance-none cursor-pointer"
                    >
                      <option value="officer" style={{ background: 'var(--bg-surface)' }}>{t('admin.role_officer')}</option>
                      <option value="department_head" style={{ background: 'var(--bg-surface)' }}>{t('admin.role_dept_head')}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                    {t('admin.official_department')}
                  </label>
                  <div className="relative">
                    <Building className="absolute left-4 top-3.5 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="input-dark pl-11 appearance-none cursor-pointer"
                      required
                    >
                      <option value="" style={{ background: 'var(--bg-surface)' }}>-- {t('admin.official_department')} --</option>
                      {departments.map((d) => (
                        <option key={d._id} value={d._id} style={{ background: 'var(--bg-surface)' }}>
                          {t(`dynamic.department.${d.name}`, { defaultValue: d.name })}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary w-full mt-4 flex items-center justify-center cursor-pointer disabled:opacity-50"
                >
                  {creating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      {t('admin.creating_official')}
                    </>
                  ) : (
                    t('admin.submit_add_official')
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Officials List */}
          <div className="lg:col-span-2">
            <div className="rounded-3xl p-6" style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-md)' }}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold flex items-center" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                  <Users className="w-5 h-5 mr-2 text-accent-400" /> {t('admin.list_officials_title')}
                </h3>
                <button
                  onClick={fetchOfficials}
                  className="p-2 rounded-full transition-colors duration-200 cursor-pointer"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--glass-bg-strong)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <RefreshCw className={`w-5 h-5 ${loadingOfficials ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {loadingOfficials ? (
                <div className="p-20 text-center flex flex-col items-center" style={{ color: 'var(--text-muted)' }}>
                  <RefreshCw className="w-8 h-8 animate-spin mb-4 text-brand-400" />
                  {t('admin.loading')}
                </div>
              ) : officials.length === 0 ? (
                <div className="p-20 text-center flex flex-col items-center" style={{ color: 'var(--text-muted)' }}>
                  <Users className="w-12 h-12 mb-4" style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                  <p>{t('admin.no_officials')}</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {officials.map((off) => {
                    const deptObj = departments.find(d => d._id === off.department);
                    const deptName = deptObj ? deptObj.name : off.department;

                    return (
                      <div
                        key={off._id}
                        className="p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200 group"
                        style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'var(--glass-bg-strong)';
                          e.currentTarget.style.borderColor = 'var(--border-default)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'var(--glass-bg)';
                          e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm"
                            style={{ background: 'var(--gradient-primary)', color: 'white' }}
                          >
                            {off.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm sm:text-base flex items-center" style={{ color: 'var(--text-primary)' }}>
                              {off.name}
                              <span
                                className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wider"
                                style={{
                                  background: off.role === 'super_admin' ? 'rgba(239, 68, 68, 0.12)' : off.role === 'department_head' ? 'rgba(249, 115, 22, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                                  color: off.role === 'super_admin' ? '#fca5a5' : off.role === 'department_head' ? '#fdba74' : '#93c5fd',
                                  border: `1px solid ${off.role === 'super_admin' ? 'rgba(239, 68, 68, 0.2)' : off.role === 'department_head' ? 'rgba(249, 115, 22, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`
                                }}
                              >
                                {off.role === 'super_admin' ? 'Admin' : off.role === 'department_head' ? 'Head' : 'Officer'}
                              </span>
                            </h4>
                            <p className="text-xs sm:text-sm font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>
                              {off.email} {off.phone && `• ${off.phone}`}
                            </p>
                          </div>
                        </div>

                        {deptName && (
                          <div className="self-start sm:self-center">
                            <span
                              className="px-3 py-1 rounded-xl text-xs font-bold"
                              style={{ background: 'rgba(167, 139, 250, 0.1)', color: '#c4b5fd', border: '1px solid rgba(167, 139, 250, 0.15)' }}
                            >
                              {t(`dynamic.department.${deptName}`, { defaultValue: deptName })}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CheckCircle2 = ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>

export default AdminDashboard;
