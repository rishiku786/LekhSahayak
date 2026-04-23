import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import toast from 'react-hot-toast';

const FeedbackForm = ({ trackingId, onSubmitted }) => {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const ratingLabels = {
    1: t('feedback.poor'),
    2: t('feedback.fair'),
    3: t('feedback.good'),
    4: t('feedback.very_good'),
    5: t('feedback.excellent')
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return toast.error(t('feedback.rating_required'));
    
    setLoading(true);
    try {
      await api.put(`/complaint/${trackingId}/feedback`, { rating, comment });
      toast.success(t('feedback.success'));
      onSubmitted();
    } catch (e) {
      toast.error(t('feedback.fail'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl p-6 mt-6" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.06), rgba(6,182,212,0.04))', border: '1px solid rgba(124, 58, 237, 0.12)' }}>
      <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>{t('feedback.title')}</h3>
      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{t('feedback.subtitle')}</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center space-x-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
            >
              <Star 
                className={`w-8 h-8 ${(hoverRating || rating) >= star ? 'fill-amber-400 text-amber-400 drop-shadow-sm' : ''}`}
                style={(hoverRating || rating) >= star ? {} : { color: 'var(--text-muted)' }}
              />
            </button>
          ))}
          <span className="ml-3 text-sm font-bold" style={{ color: 'var(--text-muted)' }}>
            {ratingLabels[hoverRating || rating] || ''}
          </span>
        </div>
        
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('feedback.comment_placeholder')}
          className="w-full h-24 p-3 rounded-xl text-sm resize-none outline-none transition-all"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
          onFocus={e => { e.target.style.borderColor = 'rgba(124,58,237,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)'; }}
          onBlur={e => { e.target.style.borderColor = 'var(--border-default)'; e.target.style.boxShadow = 'none'; }}
        ></textarea>
        
        <button
          type="submit"
          disabled={loading || rating === 0}
          className="px-6 py-2.5 font-bold rounded-xl transition-all disabled:opacity-50 hover:scale-[1.02]"
          style={{ background: 'var(--gradient-primary)', color: 'white', boxShadow: '0 4px 16px rgba(124,58,237,0.3)' }}
        >
          {loading ? t('feedback.submitting') : t('feedback.submit_btn')}
        </button>
      </form>
    </div>
  );
};

export default FeedbackForm;
