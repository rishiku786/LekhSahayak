import React, { useState } from 'react';
import { Send, Loader2, PenLine, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const EXAMPLE_PROMPTS = [
  'input.example_1',
  'input.example_2',
  'input.example_3',
  'input.example_4',
];

const TextComplaint = ({ onTextCaptured, isProcessing }) => {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const charLimit = 1000;

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (trimmed.length < 10) return;
    onTextCaptured(trimmed);
  };

  const handleExample = (example) => {
    setText(example);
  };

  const handleKeyDown = (e) => {
    // Ctrl+Enter or Cmd+Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full flex flex-col space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(124, 58, 237, 0.12)', border: '1px solid rgba(124, 58, 237, 0.15)' }}>
          <PenLine className="w-5 h-5 text-brand-400" />
        </div>
        <div>
          <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{t('input.text_heading')}</h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('input.text_subheading')}</p>
        </div>
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          className="w-full min-h-[160px] text-base p-4 resize-none rounded-2xl leading-relaxed outline-none transition-all"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', boxShadow: 'var(--shadow-sm)' }}
          onFocus={e => { e.target.style.borderColor = 'rgba(124,58,237,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)'; }}
          onBlur={e => { e.target.style.borderColor = 'var(--border-default)'; e.target.style.boxShadow = 'var(--shadow-sm)'; }}
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, charLimit))}
          onKeyDown={handleKeyDown}
          placeholder={t('input.text_placeholder')}
          disabled={isProcessing}
        />
        {/* Clear button */}
        {text && !isProcessing && (
          <button
            onClick={() => setText('')}
            className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition hover:scale-110"
            style={{ background: 'var(--glass-bg-strong)', color: 'var(--text-muted)' }}
          >
            <X className="w-3 h-3" />
          </button>
        )}
        {/* Char count */}
        <div className={`absolute bottom-3 right-3 text-xs font-medium ${text.length > charLimit * 0.9 ? 'text-orange-400' : ''}`} style={text.length <= charLimit * 0.9 ? { color: 'var(--text-muted)' } : {}}>
          {text.length}/{charLimit}
        </div>
      </div>

      {/* Example prompts */}
      {!text && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
            {t('input.examples_label')}
          </p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((ex, i) => (
              <button
                key={i}
                onClick={() => handleExample(t(ex))}
                disabled={isProcessing}
                className="text-xs px-3 py-2 rounded-lg font-medium transition-all text-left"
                style={{ background: 'var(--glass-bg-strong)', color: 'var(--text-secondary)', border: '1px solid transparent' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.1)'; e.currentTarget.style.color = '#a78bfa'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--glass-bg-strong)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'transparent'; }}
              >
                {t(ex)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={isProcessing || text.trim().length < 10}
        className="w-full flex items-center justify-center gap-2 btn-primary disabled:opacity-40 disabled:cursor-not-allowed py-3.5 px-6 rounded-xl"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('voice.processing')}
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            {t('voice.submit')}
          </>
        )}
      </button>

      <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>{t('input.ctrl_enter_hint')}</p>
    </div>
  );
};

export default TextComplaint;
