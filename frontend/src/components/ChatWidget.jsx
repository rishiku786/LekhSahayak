import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';

const ChatWidget = ({ trackingId }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: t('chat.welcome'), sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { text: userMsg, sender: 'user' }]);
    setLoading(true);

    try {
      const res = await api.post('/chat', {
        trackingId,
        question: userMsg
      });
      setMessages(prev => [...prev, { text: res.data.response, sender: 'bot' }]);
    } catch (error) {
      setMessages(prev => [...prev, { text: t('chat.error'), sender: 'bot', isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center text-white z-50 transition-all duration-300 hover:scale-110 animate-glow-pulse"
          style={{ background: 'var(--gradient-primary)', boxShadow: '0 8px 32px rgba(124, 58, 237, 0.4)' }}
        >
          <MessageCircle className="w-7 h-7" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[350px] h-[500px] rounded-3xl flex flex-col z-50 overflow-hidden animate-scale-in origin-bottom-right" style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-lg), var(--shadow-glow)' }}>
          
          {/* Header */}
          <div className="h-16 flex items-center justify-between px-4 text-white" style={{ background: 'var(--gradient-primary)' }}>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">{t('chat.support_title')}</h3>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>{t('chat.online')}</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="transition" style={{ color: 'rgba(255,255,255,0.7)' }} onMouseEnter={e => e.currentTarget.style.color = 'white'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-grow overflow-y-auto p-4 space-y-4" style={{ background: 'var(--bg-surface)' }}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === 'bot' && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1" style={{ background: 'var(--glass-bg-strong)' }}>
                    <Bot className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                  </div>
                )}
                
                <div className={`max-w-[75%] rounded-2xl p-3 text-sm flex flex-col ${
                  msg.sender === 'user' 
                    ? 'rounded-br-sm text-white' 
                    : msg.isError 
                      ? 'rounded-bl-sm'
                      : 'rounded-bl-sm'
                }`} style={
                  msg.sender === 'user' 
                    ? { background: 'var(--gradient-primary)', boxShadow: '0 2px 8px rgba(124,58,237,0.3)' }
                    : msg.isError
                      ? { background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.15)' }
                      : { background: 'var(--bg-surface-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }
                }>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1" style={{ background: 'var(--glass-bg-strong)' }}>
                  <Bot className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                </div>
                <div className="rounded-2xl rounded-bl-sm p-3 px-4 flex space-x-1.5 items-center" style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)' }}>
                  <div className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3" style={{ background: 'var(--bg-surface-elevated)', borderTop: '1px solid var(--border-subtle)' }}>
            <form onSubmit={handleSend} className="flex items-center space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('chat.placeholder')}
                className="flex-grow px-4 py-2.5 rounded-full text-sm outline-none transition-all"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                onFocus={e => { e.target.style.borderColor = 'rgba(124,58,237,0.5)'; e.target.style.boxShadow = '0 0 0 2px rgba(124,58,237,0.1)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border-default)'; e.target.style.boxShadow = 'none'; }}
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-50 transition-all duration-200 text-white hover:scale-105"
                style={{ background: 'var(--gradient-primary)', boxShadow: '0 2px 8px rgba(124,58,237,0.3)' }}
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
