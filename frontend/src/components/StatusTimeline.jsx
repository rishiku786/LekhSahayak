import React from 'react';
import { CheckCircle2, Circle, Clock, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const StatusTimeline = ({ events = [] }) => {
  const { t } = useTranslation();

  if (!events || events.length === 0) return <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>{t('timeline.no_events')}</p>;

  return (
    <div className="relative pl-4 space-y-8">
      {/* Vertical line connector */}
      <div className="absolute left-[27px] top-4 bottom-4 w-0.5 rounded-full" style={{ background: 'var(--border-default)' }}></div>

      {events.map((event, index) => {
        const isCurrent = index === events.length - 1;
        
        let dotColor = 'var(--text-muted)';
        let dotBg = 'var(--glass-bg-strong)';
        let borderColor = 'var(--border-default)';
        if (event.status === 'Resolved' || event.status === 'Closed') { dotColor = '#10b981'; dotBg = 'rgba(16,185,129,0.1)'; borderColor = 'rgba(16,185,129,0.3)'; }
        else if (event.status === 'In Progress') { dotColor = '#3b82f6'; dotBg = 'rgba(59,130,246,0.1)'; borderColor = 'rgba(59,130,246,0.3)'; }
        else if (event.status === 'Escalated') { dotColor = '#ef4444'; dotBg = 'rgba(239,68,68,0.1)'; borderColor = 'rgba(239,68,68,0.3)'; }
        else if (isCurrent) { dotColor = '#8b5cf6'; dotBg = 'rgba(139,92,246,0.1)'; borderColor = 'rgba(139,92,246,0.3)'; }

        return (
          <div key={index} className="relative flex items-start group">
            {/* Dot */}
            <div className="z-10 w-6 h-6 flex items-center justify-center rounded-full" style={{ background: 'var(--bg-surface-elevated)', border: `2px solid ${borderColor}`, boxShadow: isCurrent ? `0 0 12px ${dotBg}` : 'none' }}>
               {event.status === 'Resolved' || String(event.status).includes('Closed') ? (
                 <CheckCircle2 className="w-4 h-4 text-emerald-400" />
               ) : (
                 <div className="w-2 h-2 rounded-full" style={{ background: dotColor }}></div>
               )}
            </div>

            {/* Content */}
            <div className={`ml-6 flex-grow ${isCurrent ? 'animate-fade-in' : ''}`}>
               <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-1">
                 <h4 className={`text-md font-bold ${isCurrent ? '' : ''}`} style={{ color: isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                   {t(`dynamic.status.${event.status}`, { defaultValue: event.status })}
                 </h4>
                 <span className="text-xs font-semibold font-mono" style={{ color: 'var(--text-muted)' }}>
                   {new Date(event.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                 </span>
               </div>
               
               {event.note && (
                 <p className="text-sm mt-1 pl-4" style={{ color: 'var(--text-secondary)', borderLeft: '2px solid var(--border-subtle)' }}>
                   {t(`dynamic.timeline.${event.note}`, { defaultValue: event.note })}
                 </p>
               )}
               
               {event.actor && (
                 <p className="text-xs font-medium mt-2" style={{ color: 'var(--text-muted)' }}>
                   {t('timeline.updated_by')} {t(`dynamic.timeline.${event.actor}`, { defaultValue: event.actor })}
                 </p>
               )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatusTimeline;
