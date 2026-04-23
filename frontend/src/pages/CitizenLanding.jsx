import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import VoiceRecorder from '../components/VoiceRecorder';
import ImageUploader from '../components/ImageUploader';
import { AlertTriangle, MapPin, Navigation, ArrowRight, Mic, Pen, Camera, X, ArrowLeft, ChevronDown } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const CitizenLanding = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('voice');
  const [typedText, setTypedText] = useState('');
  const [images, setImages] = useState([]);
  const [location, setLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [photoLocationDetecting, setPhotoLocationDetecting] = useState(false);
  const [photoLocationResult, setPhotoLocationResult] = useState(null);

  // Cascading Location States
  const [district, setDistrict] = useState('');
  const [tehsil, setTehsil] = useState('');
  const [village, setVillage] = useState('');
  const [colony, setColony] = useState('');
  const [showManualAddress, setShowManualAddress] = useState(false);

  const locationData = {
    'Rewari': {
      'Rewari': ['Rewari City', 'Beriawas', 'Dharuhera', 'Gokalgarh', 'Khatawali', 'Majra Sheoraj', 'Kanina', 'Gudha'],
      'Kosli': ['Kosli', 'Jatusana', 'Guraora', 'Nahar', 'Bhojawas', 'Khori'],
      'Bawal': ['Bawal City', 'Asahi', 'Banipur', 'Kasola', 'Bohtwas', 'Shahjahanpur']
    },
    'Gurugram': {
      'Gurgaon': ['Sector 14', 'Sector 56', 'Cyber City', 'Sushant Lok', 'DLF Phase 1', 'Sector 29'],
      'Pataudi': ['Pataudi City', 'Jatauli', 'Bhora Kalan', 'Haily Mandi'],
      'Sohna': ['Sohna City', 'Bhondsi', 'Damdama', 'Raisina'],
      'Manesar': ['IMT Manesar', 'Sector 8 Manesar', 'Kasan']
    },
    'Faridabad': {
      'Faridabad': ['NIT', 'Ballabgarh', 'Old Faridabad', 'Surajkund', 'Sector 21', 'Sector 16A'],
      'Tigaon': ['Tigaon', 'Mohna', 'Dayalpur']
    },
    'Hisar': {
      'Hisar': ['Hisar City', 'Sector 14', 'Sector 15', 'Model Town'],
      'Hansi': ['Hansi City', 'Umra', 'Sisai'],
      'Barwala': ['Barwala City', 'Dhana Kalan']
    },
    'Rohtak': {
      'Rohtak': ['Rohtak City', 'Asthal Bohar', 'Kalanaur'],
      'Meham': ['Meham', 'Dighal', 'Beri']
    },
    'Karnal': {
      'Karnal': ['Karnal City', 'Sector 6', 'NDRI Campus', 'Kunjpura'],
      'Nilokheri': ['Nilokheri', 'Indri'],
      'Gharaunda': ['Gharaunda', 'Bastli']
    },
    'Panipat': {
      'Panipat': ['Panipat City', 'Sector 25', 'Model Town', 'GT Road Area'],
      'Samalkha': ['Samalkha', 'Israna']
    },
    'Ambala': {
      'Ambala City': ['Ambala City', 'Ambala Cantt', 'Panjokhra'],
      'Barara': ['Barara', 'Naraingarh']
    },
    'Sonipat': {
      'Sonipat': ['Sonipat City', 'Kundli', 'Rai', 'Murthal'],
      'Ganaur': ['Ganaur', 'Gohana']
    },
    'Jhajjar': {
      'Jhajjar': ['Jhajjar City', 'Machhrauli', 'Beri'],
      'Bahadurgarh': ['Bahadurgarh City', 'Sector 6', 'Sector 11']
    },
    'Mahendragarh': {
      'Mahendragarh': ['Mahendragarh City', 'Ateli', 'Kanina'],
      'Narnaul': ['Narnaul City', 'Nangal Chaudhary']
    },
    'Bhiwani': {
      'Bhiwani': ['Bhiwani City', 'Loharu', 'Tosham'],
      'Charkhi Dadri': ['Charkhi Dadri', 'Badhra']
    }
  };

  if (user && ['super_admin', 'department_head', 'officer'].includes(user.role)) {
    return <Navigate to="/admin" replace />;
  }

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    return () => newSocket.close();
  }, []);

  const captureLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        position => {
          setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
          toast.success(t('toast.location_captured'));
          setIsLocating(false);
          setShowLocationPopup(false);
        },
        () => {
          toast.error(t('toast.location_denied'));
          setIsLocating(false);
        }
      );
    } else {
      toast.error(t('toast.location_unsupported'));
      setIsLocating(false);
    }
  };

  const lastDetectedFileRef = useRef(null);

  const handlePhotoUpload = useCallback(async (newImages) => {
    setImages(newImages);

    if (newImages.length === 0) {
      setPhotoLocationResult(null);
      lastDetectedFileRef.current = null;
      return;
    }

    const firstFile = newImages[0];
    const fileKey = firstFile.name + firstFile.size;
    if (lastDetectedFileRef.current === fileKey) return;
    lastDetectedFileRef.current = fileKey;

    setPhotoLocationDetecting(true);
    setPhotoLocationResult(null);
    try {
      const formData = new FormData();
      formData.append('image', firstFile);
      const res = await api.post('/detect-location', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.found) {
        setPhotoLocationResult(res.data);

        if (res.data.lat && res.data.lng) {
          setLocation(prev => {
            if (!prev || (prev.lat === 0 && prev.lng === 0) || prev.aiText) {
              return { lat: res.data.lat, lng: res.data.lng };
            }
            return prev;
          });
          toast.success(t('toast.location_from_photo', { address: res.data.address }));
        } else {
          setLocation(prev => {
            if (!prev) {
              return { lat: 0, lng: 0, aiText: res.data.address };
            }
            return prev;
          });
          toast.success(t('toast.ai_guess', { address: res.data.address }));
        }
      } else {
        setPhotoLocationResult({ found: false });
      }
    } catch (err) {
      console.error('Photo location detection failed:', err);
    } finally {
      setPhotoLocationDetecting(false);
    }
  }, []);

  const submitComplaint = async (text) => {
    const hasText = text && text.trim().length > 0;
    const hasLocation = location || (photoLocationResult && photoLocationResult.address) || hasText;
    
    if (!hasLocation) {
      setShowLocationPopup(true);
      return;
    }

    if (activeTab === 'photo' && images.length === 0) {
      toast.error(t('voice.err_no_photo'));
      return;
    }

    setIsProcessing(true);
    setError('');
    try {
      const formData = new FormData();
      if (text && text.trim()) formData.append('message', text.trim());
      else formData.append('message', '');

      if (location && location.lat !== 0 && location.lng !== 0) {
        formData.append('lat', location.lat);
        formData.append('lng', location.lng);
      } else if (location && location.aiText) {
        formData.append('locationText', location.aiText);
      } else if (photoLocationResult && photoLocationResult.lat) {
        formData.append('lat', photoLocationResult.lat);
        formData.append('lng', photoLocationResult.lng);
      } else if (photoLocationResult && photoLocationResult.address) {
        formData.append('locationText', photoLocationResult.address);
      }

      images.forEach(img => formData.append('images', img));

      const response = await api.post('/complaint', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const result = response.data;
      if (result.isDuplicate) {
        toast.error(t('toast.duplicate_issue'), { duration: 5000 });
      } else {
        toast.success(t('toast.complaint_filed'));
      }
      navigate(`/complaint/${result.trackingId}`);
    } catch (err) {
      setError(err.response?.data?.error || err.message || t('toast.submit_fail'));
    } finally {
      setIsProcessing(false);
    }
  };

  const tabs = [
    { id: 'voice', label: t('voice.tab_voice'), icon: <Mic className="w-4 h-4" /> },
    { id: 'type',  label: t('voice.tab_type'),  icon: <Pen className="w-4 h-4" /> },
    { id: 'photo', label: t('voice.tab_photo'), icon: <Camera className="w-4 h-4" /> },
  ];

  const selectStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-default)',
    background: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    fontWeight: 500,
    outline: 'none',
    transition: 'all 0.2s ease',
  };

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} className="w-full flex-grow flex flex-col items-center justify-center py-12 px-2 relative">

      {/* Background orbs */}
      <div className="orb orb-violet w-[350px] h-[350px] top-[5%] left-[5%]"></div>
      <div className="orb orb-cyan w-[250px] h-[250px] bottom-[10%] right-[5%]"></div>

      {/* Location Popup */}
      {showLocationPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="rounded-3xl p-8 max-w-sm w-full animate-fade-in max-h-[90vh] overflow-y-auto" style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-lg)' }}>
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                <MapPin className="w-6 h-6 text-red-400" />
              </div>
              <button onClick={() => setShowLocationPopup(false)} style={{ color: 'var(--text-muted)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>{t('voice.loc_title')}</h3>
            <p className="mb-6 leading-relaxed text-sm" style={{ color: 'var(--text-secondary)' }}>
              {t('voice.loc_desc')}
            </p>

            <button
              onClick={captureLocation}
              disabled={isLocating}
              className="w-full py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2 mb-4 hover:scale-[1.02]"
              style={{ background: 'var(--gradient-primary)', color: 'white', boxShadow: '0 4px 16px rgba(124,58,237,0.3)' }}
            >
              {isLocating
                ? <><Navigation className="w-4 h-4 animate-spin" /> {t('toast.locating')}</>
                : <><MapPin className="w-4 h-4" /> {t('voice.loc_btn')}</>
              }
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow" style={{ borderTop: '1px solid var(--border-subtle)' }}></div>
              <span className="flex-shrink-0 mx-4 text-xs uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>{t('location.or_manual')}</span>
              <div className="flex-grow" style={{ borderTop: '1px solid var(--border-subtle)' }}></div>
            </div>

            <div className="space-y-3 mt-4">
              <select value={district} onChange={e => { setDistrict(e.target.value); setTehsil(''); setVillage(''); setColony(''); }} style={selectStyle}>
                <option value="">{t('location.select_district')}</option>
                {Object.keys(locationData).map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              {district && (
                <select value={tehsil} onChange={e => { setTehsil(e.target.value); setVillage(''); setColony(''); }} style={selectStyle} className="animate-fade-in">
                  <option value="">{t('location.select_tehsil')}</option>
                  {Object.keys(locationData[district]).map(teh => <option key={teh} value={teh}>{teh}</option>)}
                </select>
              )}

              {tehsil && (
                <select value={village} onChange={e => setVillage(e.target.value)} style={selectStyle} className="animate-fade-in">
                  <option value="">{t('location.select_village')}</option>
                  {locationData[district][tehsil].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              )}

              {village && (
                <input type="text" value={colony} onChange={e => setColony(e.target.value)} placeholder={t('location.colony_placeholder')} className="input-dark animate-fade-in text-sm" />
              )}

              {village && (
                <button
                  onClick={() => {
                    const addrItems = [colony.trim(), village, tehsil, district, 'Haryana'].filter(Boolean);
                    setLocation({ lat: 0, lng: 0, aiText: addrItems.join(', ') });
                    setShowLocationPopup(false);
                    toast.success(t('location.manual_saved'));
                  }}
                  className="w-full py-2.5 mt-2 font-bold rounded-xl transition-all animate-fade-in hover:scale-[1.01]"
                  style={{ background: 'linear-gradient(135deg, #059669, #10b981)', color: 'white' }}
                >
                  ✅ {t('location.confirm_location')}
                </button>
              )}
            </div>

            <button onClick={() => setShowLocationPopup(false)} className="w-full py-2 mt-4 text-sm rounded-xl transition" style={{ color: 'var(--text-muted)' }}>
              {t('voice.loc_later')}
            </button>
          </div>
        </div>
      )}

      {/* Back */}
      <div className="w-full max-w-xl px-2 mb-4 relative z-10">
        <button onClick={() => navigate(-1)} className="inline-flex items-center text-sm transition font-medium hover:text-brand-400" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft className="w-4 h-4 mr-1" /> {t('nav.back_home')}
        </button>
      </div>

      <div className="text-center space-y-4 mb-10 max-w-2xl px-4 relative z-10">
        <h2 className="text-display tracking-tight leading-tight" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
          {t('app.subtitle')}
        </h2>
        <p className="text-lg leading-relaxed font-medium" style={{ color: 'var(--text-secondary)' }}>
          {t('app.description')}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl flex items-center space-x-3 w-full max-w-lg relative z-10" style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-400" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }} className="w-full rounded-3xl max-w-xl mx-auto flex flex-col relative overflow-hidden z-10" style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-lg), var(--shadow-glow)' }}>

        {/* 3 Tabs */}
        <div className="flex" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-brand-400 text-brand-400'
                  : 'border-transparent hover:text-brand-400'
              }`}
              style={activeTab !== tab.id ? { color: 'var(--text-muted)' } : {}}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="p-8 flex flex-col items-center">

          {/* Voice Tab */}
          {activeTab === 'voice' && (
            <VoiceRecorder onTextCaptured={submitComplaint} isProcessing={isProcessing} />
          )}

          {/* Type Tab */}
          {activeTab === 'type' && (
            <div className="w-full flex flex-col space-y-4">
              <div>
                <p className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{t('voice.describe_problem')}</p>
                <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>{t('voice.write_hint')}</p>
                <div className="relative">
                  <textarea
                    className="w-full min-h-[120px] p-4 rounded-xl resize-none text-base leading-relaxed outline-none transition-all"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(124,58,237,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border-default)'; e.target.style.boxShadow = 'none'; }}
                    placeholder={t('voice.type_placeholder')}
                    value={typedText}
                    onChange={(e) => setTypedText(e.target.value)}
                    disabled={isProcessing}
                    maxLength={1000}
                  />
                  <span className="absolute bottom-3 right-3 text-xs" style={{ color: 'var(--text-muted)' }}>{typedText.length}/1000</span>
                </div>
              </div>
              <button
                onClick={() => submitComplaint(typedText)}
                disabled={isProcessing || !typedText.trim()}
                className="w-full py-3 btn-primary rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? <><span className="animate-spin">⏳</span> {t('voice.processing')}</> : t('voice.submit')}
              </button>
            </div>
          )}

          {/* Photo Tab */}
          {activeTab === 'photo' && (
            <div className="w-full flex flex-col space-y-4">
              <div className="text-center mb-2">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(124, 58, 237, 0.1)', border: '1px solid rgba(124, 58, 237, 0.15)' }}>
                  <Camera className="w-7 h-7 text-brand-400" />
                </div>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{t('voice.tab_photo_title')}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{t('voice.tab_photo_subtitle')}</p>
              </div>

              <ImageUploader onChange={handlePhotoUpload} maxFiles={3} disabled={isProcessing} />

              {photoLocationDetecting && (
                <div className="rounded-xl p-3 text-sm font-medium text-center flex items-center justify-center gap-2" style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
                  <span className="animate-spin">🔍</span> {t('voice.loc_detecting')}
                </div>
              )}

              {photoLocationResult && !photoLocationDetecting && (
                <div className={`rounded-xl p-3 text-sm font-medium`} style={{
                  background: photoLocationResult.found === false ? 'rgba(239,68,68,0.08)' : photoLocationResult.lat ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                  border: `1px solid ${photoLocationResult.found === false ? 'rgba(239,68,68,0.15)' : photoLocationResult.lat ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)'}`,
                  color: photoLocationResult.found === false ? '#fca5a5' : photoLocationResult.lat ? '#6ee7b7' : '#fcd34d'
                }}>
                  {photoLocationResult.found === false ? (
                    t('voice.loc_fail')
                  ) : (
                    <>
                      {photoLocationResult.lat ? '📍' : '🔍'} {photoLocationResult.lat ? `Lat: ${photoLocationResult.lat}, Lng: ${photoLocationResult.lng}` : photoLocationResult.address}
                      {!photoLocationResult.lat && (
                        <span className="block text-xs mt-1 opacity-75">
                          AI guess ({photoLocationResult.confidence} confidence) — {t('voice.loc_gps_confirm')}
                        </span>
                      )}
                    </>
                  )}
                </div>
              )}

              {images.length > 0 && !photoLocationDetecting && (
                <div className="rounded-xl p-3 text-sm font-medium text-center" style={{ background: 'rgba(124, 58, 237, 0.08)', border: '1px solid rgba(124, 58, 237, 0.15)', color: '#a78bfa' }}>
                  ✅ {images.length} {t('voice.photos_ready')}
                </div>
              )}

              <button
                onClick={() => submitComplaint(typedText)}
                disabled={isProcessing || images.length === 0}
                className="w-full py-3 btn-primary rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing
                  ? <><span className="animate-spin">⏳</span> {t('voice.processing')}</>
                  : t('voice.submit')
                }
              </button>

              <div className="w-full">
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>{t('voice.opt_detail_title')}</p>
                <textarea
                  className="w-full min-h-[80px] p-3 rounded-xl resize-none text-sm leading-relaxed outline-none transition-all"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(124,58,237,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border-default)'; e.target.style.boxShadow = 'none'; }}
                  placeholder={t('voice.opt_detail_hint')}
                  value={typedText}
                  onChange={(e) => setTypedText(e.target.value)}
                  disabled={isProcessing}
                  maxLength={500}
                />
              </div>
            </div>
          )}

          {/* Location + Extra photo (voice/type tabs ke liye) */}
          {activeTab !== 'photo' && (
            <div className="w-full mt-8 pt-6 flex flex-col space-y-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <button
                onClick={captureLocation}
                disabled={isProcessing}
                className="w-full flex items-center justify-center py-3 px-4 rounded-xl font-bold text-sm transition-all"
                style={{
                  background: location && (location.lat !== 0 || location.aiText) ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.06)',
                  color: location && (location.lat !== 0 || location.aiText) ? '#6ee7b7' : '#fca5a5',
                  border: `1px solid ${location && (location.lat !== 0 || location.aiText) ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`
                }}
              >
                {isLocating ? <Navigation className="w-4 h-4 mr-2 animate-spin" /> : <MapPin className="w-4 h-4 mr-2" />}
                {location && location.aiText
                  ? `✓ ${location.aiText}`
                  : location ? t('voice.location_added') : t('voice.add_location')}
                {!location && <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}>{t('voice.mandatory')}</span>}
              </button>

              {/* Manual Address Entry — Inline Cascading */}
              {!location && (
                <div className="w-full">
                  <button
                    onClick={() => setShowManualAddress(!showManualAddress)}
                    className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl font-bold text-sm transition-all gap-2"
                    style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${showManualAddress ? 'rotate-180' : ''}`} />
                    {t('location.enter_manually')}
                  </button>

                  {showManualAddress && (
                    <div className="mt-3 space-y-2.5 animate-fade-in">
                      <select value={district} onChange={e => { setDistrict(e.target.value); setTehsil(''); setVillage(''); setColony(''); }} style={selectStyle}>
                        <option value="">{t('location.select_district')}</option>
                        {Object.keys(locationData).map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      {district && (
                        <select value={tehsil} onChange={e => { setTehsil(e.target.value); setVillage(''); setColony(''); }} style={selectStyle} className="animate-fade-in">
                          <option value="">{t('location.select_tehsil')}</option>
                          {Object.keys(locationData[district]).map(teh => <option key={teh} value={teh}>{teh}</option>)}
                        </select>
                      )}
                      {tehsil && (
                        <select value={village} onChange={e => setVillage(e.target.value)} style={selectStyle} className="animate-fade-in">
                          <option value="">{t('location.select_village')}</option>
                          {locationData[district][tehsil].map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      )}
                      {village && (
                        <input type="text" value={colony} onChange={e => setColony(e.target.value)} placeholder={t('location.colony_placeholder')} className="input-dark animate-fade-in text-sm" />
                      )}
                      {village && (
                        <button
                          onClick={() => {
                            const addrItems = [colony.trim(), village, tehsil, district, 'Haryana'].filter(Boolean);
                            setLocation({ lat: 0, lng: 0, aiText: addrItems.join(', ') });
                            setShowManualAddress(false);
                            toast.success(t('location.manual_saved'));
                          }}
                          className="w-full py-2.5 font-bold rounded-xl transition-all animate-fade-in hover:scale-[1.01]"
                          style={{ background: 'linear-gradient(135deg, #059669, #10b981)', color: 'white' }}
                        >
                          ✅ {t('location.confirm_location')}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="w-full">
                <p className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center" style={{ color: 'var(--text-muted)' }}>
                  <Camera className="w-3 h-3 mr-1" /> {t('voice.photo_evidence')}
                </p>
                <ImageUploader onChange={handlePhotoUpload} maxFiles={3} disabled={isProcessing} />
                
                {photoLocationDetecting && (
                  <div className="mt-3 rounded-xl p-2 text-xs font-medium flex items-center justify-center gap-2" style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
                    <span className="animate-spin">🔍</span> {t('voice.loc_detecting')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Photo tab ke liye GPS location button + manual address */}
          {activeTab === 'photo' && (
            <div className="w-full mt-6 pt-6 space-y-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <button
                onClick={captureLocation}
                disabled={isProcessing}
                className="w-full flex items-center justify-center py-3 px-4 rounded-xl font-bold text-sm transition-all"
                style={{
                  background: location && (location.lat !== 0 || location.aiText) ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.06)',
                  color: location && (location.lat !== 0 || location.aiText) ? '#6ee7b7' : '#fca5a5',
                  border: `1px solid ${location && (location.lat !== 0 || location.aiText) ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`
                }}
              >
                {isLocating ? <Navigation className="w-4 h-4 mr-2 animate-spin" /> : <MapPin className="w-4 h-4 mr-2" />}
                {location && location.lat !== 0
                  ? t('voice.location_added')
                  : location && location.aiText
                  ? `✓ ${location.aiText}`
                  : t('voice.add_location')
                }
                {!location && <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}>{t('voice.mandatory')}</span>}
              </button>

              {/* Inline manual address for photo tab */}
              {!location && (
                <div className="w-full">
                  <button
                    onClick={() => setShowManualAddress(!showManualAddress)}
                    className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl font-bold text-sm transition-all gap-2"
                    style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${showManualAddress ? 'rotate-180' : ''}`} />
                    {t('location.enter_manually')}
                  </button>
                  {showManualAddress && (
                    <div className="mt-3 space-y-2.5 animate-fade-in">
                      <select value={district} onChange={e => { setDistrict(e.target.value); setTehsil(''); setVillage(''); setColony(''); }} style={selectStyle}>
                        <option value="">{t('location.select_district')}</option>
                        {Object.keys(locationData).map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      {district && (
                        <select value={tehsil} onChange={e => { setTehsil(e.target.value); setVillage(''); setColony(''); }} style={selectStyle} className="animate-fade-in">
                          <option value="">{t('location.select_tehsil')}</option>
                          {Object.keys(locationData[district]).map(teh => <option key={teh} value={teh}>{teh}</option>)}
                        </select>
                      )}
                      {tehsil && (
                        <select value={village} onChange={e => setVillage(e.target.value)} style={selectStyle} className="animate-fade-in">
                          <option value="">{t('location.select_village')}</option>
                          {locationData[district][tehsil].map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      )}
                      {village && (
                        <input type="text" value={colony} onChange={e => setColony(e.target.value)} placeholder={t('location.colony_placeholder')} className="input-dark animate-fade-in text-sm" />
                      )}
                      {village && (
                        <button
                          onClick={() => {
                            const addrItems = [colony.trim(), village, tehsil, district, 'Haryana'].filter(Boolean);
                            setLocation({ lat: 0, lng: 0, aiText: addrItems.join(', ') });
                            setShowManualAddress(false);
                            toast.success(t('location.manual_saved'));
                          }}
                          className="w-full py-2.5 font-bold rounded-xl transition-all animate-fade-in hover:scale-[1.01]"
                          style={{ background: 'linear-gradient(135deg, #059669, #10b981)', color: 'white' }}
                        >
                          ✅ {t('location.confirm_location')}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      <div className="mt-8 text-center relative z-10">
        <Link to="/track" className="flex items-center justify-center space-x-1 group text-sm font-medium transition hover:text-brand-400" style={{ color: 'var(--text-muted)' }}>
          <span>{t('voice.already_filed')}</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </motion.div>
  );
};

export default CitizenLanding;
