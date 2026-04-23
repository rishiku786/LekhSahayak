import React from 'react';

const StatsCard = ({ icon, title, value, desc, trend, alert }) => {
  return (
    <div 
      className="p-6 rounded-2xl flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] group"
      style={{ 
        background: alert ? 'rgba(239, 68, 68, 0.06)' : 'var(--bg-surface-elevated)', 
        border: `1px solid ${alert ? 'rgba(239, 68, 68, 0.15)' : 'var(--border-subtle)'}`,
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 rounded-xl" style={{ background: alert ? 'rgba(239, 68, 68, 0.1)' : 'var(--glass-bg-strong)', border: '1px solid var(--border-subtle)' }}>
          {icon}
        </div>
        {trend && (
          <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
            {trend}
          </span>
        )}
      </div>
      
      <div>
        <h4 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>{title}</h4>
        <div className="flex items-baseline space-x-2">
          <p className={`text-3xl font-bold ${alert ? 'text-red-400' : ''}`} style={!alert ? { color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' } : { fontFamily: 'var(--font-heading)' }}>
            {value}
          </p>
          {desc && (
            <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              {desc}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
