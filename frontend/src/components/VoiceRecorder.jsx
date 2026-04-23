import React, { useState, useEffect, useRef } from "react";
import { Mic, Square, Loader2, Send } from "lucide-react";
import { useTranslation } from "react-i18next";

const VoiceRecorder = ({ onTextCaptured, isProcessing }) => {
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef("");
  const silenceTimerRef = useRef(null); // auto-stop after silence

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false; // ek baar bolne ke baad khud ruk jaaye
    recognition.interimResults = true;
    recognition.lang = "hi-IN";

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event) => {
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscriptRef.current += result[0].transcript + " ";
        } else {
          interimText += result[0].transcript;
        }
      }

      setTranscript(finalTranscriptRef.current + interimText);

      // Silence detection: 2 sec baad koi result nahi aaya toh stop
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        recognition.stop();
      }, 2000);
    };

    recognition.onerror = (event) => {
      clearTimeout(silenceTimerRef.current);
      if (event.error === "not-allowed") {
        alert(
          t('voice.err_mic_deny')
        );
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      clearTimeout(silenceTimerRef.current);
      setIsRecording(false);
      // Agar kuch bola toh auto submit
      if (finalTranscriptRef.current.trim()) {
        onTextCaptured(finalTranscriptRef.current.trim());
      }
    };

    recognitionRef.current = recognition;

    return () => {
      clearTimeout(silenceTimerRef.current);
      recognition.abort();
    };
  }, [onTextCaptured]);

  const startRecording = () => {
    if (isProcessing) return;
    // Reset
    finalTranscriptRef.current = "";
    setTranscript("");
    clearTimeout(silenceTimerRef.current);
    try {
      recognitionRef.current?.start();
    } catch (e) {
      console.error("Mic start error:", e);
    }
  };

  const stopRecording = () => {
    clearTimeout(silenceTimerRef.current);
    recognitionRef.current?.stop();
  };

  const handleManualSubmit = () => {
    const text = transcript.trim();
    if (text) {
      onTextCaptured(text);
    }
  };

  if (
    typeof window !== "undefined" &&
    !window.SpeechRecognition &&
    !window.webkitSpeechRecognition
  ) {
    return (
      <div className="p-4 rounded-xl text-sm" style={{ background: 'rgba(245, 158, 11, 0.08)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
        {t('voice.err_browser')}
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center space-y-6 animate-fade-in relative z-10">
      {/* Mic Button */}
      <div
        onClick={isRecording ? stopRecording : startRecording}
        className={`relative w-28 h-28 flex items-center justify-center rounded-full cursor-pointer transition-all duration-300 ease-in-out select-none
          ${isProcessing ? "opacity-50 pointer-events-none" : ""}`}
        style={{
          background: isRecording 
            ? 'linear-gradient(135deg, #ef4444, #dc2626)' 
            : 'var(--gradient-primary)',
          boxShadow: isRecording 
            ? '0 0 40px rgba(239, 68, 68, 0.4), 0 0 80px rgba(239, 68, 68, 0.2)' 
            : '0 10px 40px rgba(124, 58, 237, 0.3), 0 0 60px rgba(124, 58, 237, 0.15)',
          transform: isRecording ? 'scale(1.1)' : 'scale(1)',
        }}
        onMouseEnter={e => { if (!isRecording) e.currentTarget.style.transform = 'scale(1.05)'; }}
        onMouseLeave={e => { if (!isRecording) e.currentTarget.style.transform = 'scale(1)'; }}
      >
        {isRecording && (
          <>
            <div className="absolute inset-0 rounded-full animate-ping opacity-50" style={{ background: 'rgba(239, 68, 68, 0.4)' }} />
            <div className="absolute inset-0 rounded-full animate-pulse opacity-30" style={{ background: 'rgba(239, 68, 68, 0.3)', border: '4px solid rgba(255,255,255,0.1)' }} />
          </>
        )}

        {isProcessing ? (
          <Loader2 className="w-12 h-12 text-white animate-spin relative z-10" />
        ) : isRecording ? (
          <Square className="w-10 h-10 text-white fill-white relative z-10" />
        ) : (
          <Mic className="w-12 h-12 text-white relative z-10" />
        )}
      </div>

      {/* Status Text */}
      <div className="text-center">
        <h3 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
          {isProcessing
            ? t("voice.processing")
            : isRecording
              ? t("voice.listening")
              : t("voice.tap_to_speak")}
        </h3>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {isRecording
            ? t("voice.auto_stop_hint")
            : isProcessing
              ? t("voice.wait")
              : t("voice.instruction_idle")}
        </p>
      </div>

      {/* Transcript Box — sirf tab dikhe jab recording ho rahi ho ya text aa gaya ho */}
      {(isRecording || transcript) && (
        <div className="w-full rounded-2xl p-5 flex flex-col" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-sm)' }}>
          <textarea
            className="w-full min-h-[100px] text-lg bg-transparent border-none resize-none outline-none leading-relaxed"
            style={{ color: 'var(--text-primary)' }}
            value={transcript}
            onChange={(e) => {
              setTranscript(e.target.value);
              finalTranscriptRef.current = e.target.value;
            }}
            placeholder={
              isRecording
                ? t("voice.listening_hint")
                : t("voice.type_hint")
            }
            disabled={isProcessing || isRecording}
          />

          {/* Manual submit button — sirf jab recording band ho aur text ho */}
          {!isRecording && !isProcessing && transcript.trim() && (
            <button
              onClick={handleManualSubmit}
              className="w-full mt-4 flex items-center justify-center gap-2 btn-primary py-3 px-6 rounded-xl"
            >
              <Send className="w-4 h-4" />
              {t("voice.submit")}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
