import React, { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const ImageUploader = ({ onChange, maxFiles = 3, disabled = false }) => {
  const { t } = useTranslation();
  const [previews, setPreviews] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    if (previews.length + files.length > maxFiles) {
      toast.error(t('upload.too_many', { max: maxFiles }));
      return;
    }

    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} ${t('upload.too_large')}`);
        return false;
      }
      return file.type.startsWith('image/');
    });

    if (validFiles.length > 0) {
      const newPreviews = validFiles.map(file => ({
        file,
        url: URL.createObjectURL(file)
      }));
      setPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;

  React.useEffect(() => {
    onChangeRef.current(previews.map(p => p.file));
  }, [previews]); // onChange ko dependency mein mat daalo - loop hota hai

  const removeImage = (indexToRemove) => {
    setPreviews(prev => {
      const newPreviews = [...prev];
      URL.revokeObjectURL(newPreviews[indexToRemove].url);
      newPreviews.splice(indexToRemove, 1);
      return newPreviews;
    });
  };

  return (
    <div className="w-full">
      {previews.length < maxFiles && (
        <div
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`w-full h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          style={{ 
            borderColor: disabled ? 'var(--border-subtle)' : 'var(--border-default)', 
            background: disabled ? 'var(--bg-surface)' : 'var(--bg-surface)'
          }}
          onMouseEnter={e => { if (!disabled) { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'; e.currentTarget.style.background = 'rgba(124,58,237,0.04)'; } }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.background = 'var(--bg-surface)'; }}
        >
          <Upload className="w-8 h-8 mb-2" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{t('upload.click_drag')}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{t('upload.file_limit', { max: maxFiles })}</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
            disabled={disabled}
          />
        </div>
      )}

      {previews.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          {previews.map((preview, idx) => (
            <div key={idx} className="relative group rounded-xl overflow-hidden aspect-square" style={{ border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-sm)' }}>
              <img src={preview.url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
                <button
                  onClick={() => removeImage(idx)}
                  disabled={disabled}
                  className="p-1.5 rounded-full transition hover:scale-110"
                  style={{ background: 'rgba(239,68,68,0.2)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)' }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
