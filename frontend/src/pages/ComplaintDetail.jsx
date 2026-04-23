import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import StatusTimeline from '../components/StatusTimeline';
import ChatWidget from '../components/ChatWidget';
import FeedbackForm from '../components/FeedbackForm';
import toast from 'react-hot-toast';
import { MapPin, Building2, Clock, AlertTriangle, FileText, Download, CheckCircle2 } from 'lucide-react';

const ComplaintDetail = () => {
  const { trackingId } = useParams();
  const { user, hasRole } = useAuth();
  const { t, i18n } = useTranslation();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);

  const [note, setNote] = useState('');
  const [resolving, setResolving] = useState(false);
  const [proofs, setProofs] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [showMasterCopy, setShowMasterCopy] = useState(false);

  useEffect(() => {
    fetchData();
  }, [trackingId]);

  const fetchData = async () => {
    try {
      const res = await api.get(`/complaint/${trackingId}`);
      setComplaint(res.data);
    } catch (error) {
      toast.error(t('tracker.load_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setStatusUpdating(true);
    try {
      await api.put(`/admin/complaint/${complaint._id}`, { status: newStatus });
      toast.success(t('tracker.status_updated', { status: newStatus }));
      fetchData();
    } catch (e) {
      toast.error(t('tracker.status_update_fail'));
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await api.get(`/reports/pdf/${trackingId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `complaint-${trackingId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (e) {
      toast.error(t('tracker.pdf_fail'));
    }
  };

  const submitNote = async () => {
    if (!note.trim()) return;
    try {
      await api.post(`/admin/complaint/${complaint._id}/notes`, { text: note });
      toast.success(t('tracker.note_added'));
      setNote('');
      fetchData();
    } catch (e) {
      toast.error(t('tracker.note_fail'));
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!proofs || proofs.length === 0) {
      return toast.error(t('tracker.resolve_proof_required'));
    }
    setResolving(true);
    try {
      const formData = new FormData();
      Array.from(proofs).forEach(file => formData.append('proofs', file));
      await api.put(`/admin/complaint/${complaint._id}/resolve`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(t('tracker.resolved_success'));
      fetchData();
    } catch (e) {
      toast.error(t('tracker.resolve_fail'));
    } finally {
      setResolving(false);
    }
  };

  if (loading) return <div className="p-20 text-center"><div className="animate-spin w-10 h-10 border-b-2 border-brand-400 mx-auto rounded-full"/></div>;
  if (!complaint) return <div className="p-20 text-center font-bold text-xl" style={{ color: 'var(--text-primary)' }}>{t('tracker.not_found')}</div>;

  const isAdmin = hasRole(['officer', 'department_head', 'super_admin']);
  const isResolved = complaint.status === 'Resolved';

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 w-full animate-fade-in relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <Link to={isAdmin ? "/admin" : "/complaint-form"} className="font-semibold hover:underline mb-2 block text-brand-400 transition">
            {t('tracker.back')}
          </Link>
          <h1 className="text-3xl font-bold font-mono tracking-wider" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
            {complaint.trackingId}
          </h1>
          <p className="font-medium flex items-center mt-1" style={{ color: 'var(--text-secondary)' }}>
            <Clock className="w-4 h-4 mr-1" />
            {t('tracker.filed_on')} {new Date(complaint.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="flex gap-3 mt-4 md:mt-0">
          {isAdmin && (
            <button onClick={handleDownloadPDF} className="flex items-center px-4 py-2 rounded-xl font-medium transition-all duration-200 hover:scale-[1.02]" style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>
              <Download className="w-4 h-4 mr-2" style={{ color: 'var(--text-muted)' }} /> PDF
            </button>
          )}
          <span className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center ${
            complaint.status === 'Pending' ? 'text-amber-300' :
              complaint.status === 'In Progress' ? 'text-blue-300' :
              complaint.status === 'Escalated' ? 'text-red-300' :
              'text-emerald-300'}`}
            style={{ background: complaint.status === 'Pending' ? 'rgba(245,158,11,0.1)' : complaint.status === 'In Progress' ? 'rgba(59,130,246,0.1)' : complaint.status === 'Escalated' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', border: `1px solid ${complaint.status === 'Pending' ? 'rgba(245,158,11,0.2)' : complaint.status === 'In Progress' ? 'rgba(59,130,246,0.2)' : complaint.status === 'Escalated' ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}` }}
          >
            {isResolved && <CheckCircle2 className="w-4 h-4 mr-2" />}
            {t(`dynamic.status.${complaint.status}`, { defaultValue: complaint.status })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {complaint.isMassOutage && (
            <div className="p-4 rounded-xl shadow-sm animate-fade-in flex items-start" style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)', borderLeft: '4px solid rgba(239, 68, 68, 0.6)' }}>
              <AlertTriangle className="w-6 h-6 text-red-400 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-red-300 font-bold text-sm tracking-widest uppercase">Mass Outage Detected 🚨</h4>
                <p className="text-red-400/80 text-sm mt-1 font-medium">Multiple citizens have reported this exact issue in this area. Priority escalated to Critical automatically.</p>
              </div>
            </div>
          )}
          <div className="rounded-2xl p-6" style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
            <h3 className="text-lg font-bold mb-4 pb-2 flex items-center" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)' }}>
              <FileText className="w-5 h-5 mr-2 text-brand-400" />
              {t('tracker.complaint_info')}
            </h3>

            <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{t('tracker.problem_type')}</p>
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{t(`dynamic.problemType.${complaint.problemType}`, { defaultValue: complaint.problemType })}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{t('tracker.priority')}</p>
                <div className="flex items-center space-x-2">
                  <p className={`font-semibold ${complaint.priority === 'Critical' ? 'text-red-400' : ''}`} style={complaint.priority !== 'Critical' ? { color: 'var(--text-primary)' } : {}}>
                    {t(`dynamic.priority.${complaint.priority}`, { defaultValue: complaint.priority })}
                  </p>
                  {complaint.priorityScore !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${complaint.priorityScore >= 80 ? 'text-red-300' : complaint.priorityScore >= 60 ? 'text-orange-300' : ''}`} style={{ background: complaint.priorityScore >= 80 ? 'rgba(239,68,68,0.1)' : complaint.priorityScore >= 60 ? 'rgba(249,115,22,0.1)' : 'var(--glass-bg-strong)', color: complaint.priorityScore < 60 ? 'var(--text-secondary)' : undefined, border: '1px solid var(--border-subtle)' }}>
                      Score: {complaint.priorityScore}/100
                    </span>
                  )}
                </div>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-xs font-bold uppercase tracking-wider mb-1 flex items-center" style={{ color: 'var(--text-muted)' }}>
                  <Building2 className="w-3 h-3 mr-1"/> {t('tracker.department')}
                </p>
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{t(`dynamic.department.${complaint.department}`, { defaultValue: complaint.department })}</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-xs font-bold uppercase tracking-wider mb-1 flex items-center" style={{ color: 'var(--text-muted)' }}>
                  <MapPin className="w-3 h-3 mr-1"/> {t('tracker.location')}
                </p>
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{complaint.location}</p>
              </div>
            </div>

            <div className="p-5 rounded-xl" style={{ background: 'var(--bg-surface)', borderLeft: '4px solid rgba(124, 58, 237, 0.5)' }}>
              <div className="flex justify-between items-center mb-4">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-400">{t('tracker.formal_draft')}</p>
                {i18n.language !== 'en' && complaint.formalTextTranslations?.[i18n.language] && (
                  <button 
                    onClick={() => setShowMasterCopy(!showMasterCopy)}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all duration-200" style={{ background: 'var(--glass-bg-strong)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
                  >
                    {showMasterCopy ? 'Show Translated' : 'View English Master'}
                  </button>
                )}
              </div>
              <p className="font-serif whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
                {showMasterCopy 
                  ? complaint.formalText 
                  : (complaint.formalTextTranslations?.[i18n.language] || complaint.formalText)}
              </p>
            </div>
          </div>

          {/* Attachments */}
          {(complaint.images?.length > 0 || complaint.resolutionProof?.length > 0) && (
            <div className="rounded-2xl p-6" style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
              <h3 className="text-lg font-bold mb-4 pb-2" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)' }}>{t('tracker.attachments')}</h3>

              {complaint.images?.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>{t('tracker.submitted_images')}:</p>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {complaint.images.map((img, idx) => (
                      <a href={img} target="_blank" rel="noreferrer" key={idx}>
                        <img src={img} alt="User submission" className="h-24 w-24 object-cover rounded-lg transition-opacity hover:opacity-80" style={{ border: '1px solid var(--border-default)' }} />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {complaint.resolutionProof?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2 mt-4 flex items-center text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 mr-1"/> {t('tracker.resolution_proof')}:
                  </p>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {complaint.resolutionProof.map((img, idx) => (
                      <a href={img} target="_blank" rel="noreferrer" key={idx}>
                        <img src={img} alt="Resolution proof" className="h-32 w-48 object-cover rounded-lg transition-opacity hover:opacity-80" style={{ border: '2px solid rgba(16, 185, 129, 0.3)' }} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Status Change Buttons */}
          {isAdmin && !isResolved && (
            <div className="rounded-2xl p-6" style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
              <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>{t('tracker.update_status')}</h3>
              <div className="flex flex-wrap gap-3">
                {['Pending', 'In Progress'].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    disabled={statusUpdating || complaint.status === s}
                    className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${complaint.status === s ? 'opacity-40 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
                    style={{ 
                      background: s === 'Pending' ? 'rgba(245,158,11,0.1)' : 'rgba(59,130,246,0.1)',
                      color: s === 'Pending' ? '#fbbf24' : '#60a5fa',
                      border: `1px solid ${s === 'Pending' ? 'rgba(245,158,11,0.2)' : 'rgba(59,130,246,0.2)'}`
                    }}
                  >
                    {statusUpdating ? t('tracker.updating') : t(`dynamic.status.${s}`, { defaultValue: s })}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mark as Resolved with Proof */}
          {isAdmin && !isResolved && (
            <div className="rounded-2xl p-6" style={{ background: 'rgba(16, 185, 129, 0.04)', border: '2px solid rgba(16, 185, 129, 0.15)' }}>
              <h3 className="text-lg font-bold mb-4 text-emerald-400">{t('tracker.mark_resolved')}</h3>
              <form onSubmit={handleResolve}>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>{t('tracker.upload_proof')}</label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full text-sm mb-4 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:cursor-pointer transition-all"
                  style={{ color: 'var(--text-muted)' }}
                  onChange={(e) => setProofs(e.target.files)}
                  required
                />
                <button
                  type="submit"
                  disabled={resolving}
                  className="w-full py-3 rounded-xl font-bold shadow-md transition-all disabled:opacity-50 hover:scale-[1.01]"
                  style={{ background: 'linear-gradient(135deg, #059669, #10b981)', color: 'white', boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}
                >
                  {resolving ? t('tracker.uploading') : t('tracker.confirm_resolution')}
                </button>
              </form>
            </div>
          )}

          {/* Citizen Feedback */}
          {!isAdmin && isResolved && !complaint.feedback?.rating && (
            <FeedbackForm trackingId={complaint.trackingId} onSubmitted={fetchData} />
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="rounded-2xl p-6" style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
            <h3 className="text-lg font-bold mb-6 pb-2" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)' }}>{t('tracker.tracking_timeline')}</h3>
            <StatusTimeline events={complaint.timeline} />
          </div>

          {isAdmin && (
            <div className="rounded-2xl p-6" style={{ background: 'rgba(245, 158, 11, 0.04)', border: '1px solid rgba(245, 158, 11, 0.12)' }}>
              <h3 className="text-md font-bold mb-4 flex items-center text-amber-400">
                <AlertTriangle className="w-4 h-4 mr-1"/> {t('tracker.internal_notes')}
              </h3>

              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {complaint.adminNotes?.length === 0 ? (
                  <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>{t('tracker.no_notes')}</p>
                ) : (
                  complaint.adminNotes?.map((n, i) => (
                    <div key={i} className="p-3 rounded-lg" style={{ background: 'var(--bg-surface-elevated)', border: '1px solid rgba(245, 158, 11, 0.1)' }}>
                      <p className="text-xs text-amber-400/70 font-bold mb-1">{n.author} • {new Date(n.timestamp).toLocaleDateString()}</p>
                      <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{n.text}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder={t('tracker.add_remark')}
                  className="input-dark flex-grow text-sm"
                  style={{ borderColor: 'rgba(245, 158, 11, 0.15)' }}
                />
                <button
                  onClick={submitNote}
                  className="px-4 py-2 rounded-xl font-bold text-sm transition-all hover:scale-[1.02]"
                  style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.2)' }}
                >
                  {t('tracker.save')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {!isAdmin && <ChatWidget trackingId={complaint.trackingId} />}
    </div>
  );
};

export default ComplaintDetail;
