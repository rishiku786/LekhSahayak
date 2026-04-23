import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Search, MapPin, Navigation } from 'lucide-react';

const TrackComplaint = () => {
  const { t } = useTranslation();
  const [id, setId] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!id.trim()) return;
    
    // Ensure format matches SS-XXXXXX
    const formattedId = id.trim().toUpperCase();
    
    setLoading(true);
    try {
      await api.get(`/complaint/${formattedId}`);
      // If we don't catch an error, it means it exists
      navigate(`/complaint/${formattedId}`);
    } catch (e) {
      toast.error(t('track_page.not_found'));
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex-grow flex flex-col items-center justify-center py-16 px-4 animate-fade-in relative">
      {/* Background orbs */}
      <div className="orb orb-violet w-[350px] h-[350px] top-[15%] left-[10%]"></div>
      <div className="orb orb-cyan w-[250px] h-[250px] bottom-[20%] right-[15%]"></div>

      <div className="text-center mb-10 relative z-10">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-glow-pulse" style={{ background: 'rgba(124, 58, 237, 0.12)', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
          <Navigation className="w-8 h-8 text-brand-400" />
        </div>
        <h1 className="text-display tracking-tight" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>{t('track_page.title')}</h1>
        <p className="mt-3 font-medium" style={{ color: 'var(--text-secondary)' }}>{t('track_page.subtitle')}</p>
      </div>

      <div className="w-full max-w-lg p-8 rounded-3xl relative z-10" style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-lg)' }}>
        <form onSubmit={handleTrack}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6" style={{ color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              value={id}
              onChange={e => setId(e.target.value)}
              placeholder={t('track_page.placeholder')}
              className="w-full pl-14 pr-4 py-4 rounded-xl text-xl tracking-wider uppercase font-mono font-semibold outline-none transition-all"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              onFocus={(e) => { e.target.style.borderColor = 'rgba(124,58,237,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border-default)'; e.target.style.boxShadow = 'none'; }}
              maxLength="10"
              required
            />
          </div>
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full mt-6 btn-primary py-4 rounded-xl text-base disabled:opacity-50"
          >
            {loading ? t('track_page.searching') : t('track_page.track_btn')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TrackComplaint;
