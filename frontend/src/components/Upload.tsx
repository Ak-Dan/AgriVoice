import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface UploadProps {
  onUpload: (file: File) => void;
  onSample: (diseaseKey: string) => void;   // NEW: called when user diagnoses a sample
  loading: boolean;
  error: string | null;
}

const SAMPLES = [
  { key: 'rust',       emoji: '🟤', label: 'diseases.rust',       color: '#92400E', bg: '#FEF3C7', leafEmoji: '🍂' },
  { key: 'cercospora', emoji: '⬜', label: 'diseases.cercospora',  color: '#374151', bg: '#F3F4F6', leafEmoji: '🍃' },
  { key: 'blight',     emoji: '🟠', label: 'diseases.blight',      color: '#9A3412', bg: '#FFF7ED', leafEmoji: '🍁' },
  { key: 'healthy',    emoji: '🟢', label: 'diseases.healthy',     color: '#14532D', bg: '#DCFCE7', leafEmoji: '🌿' },
];

const Upload: React.FC<UploadProps> = ({ onUpload, onSample, loading, error }) => {
  const { t } = useTranslation();
  const [preview, setPreview]           = useState<string | null>(null);
  const [dragging, setDragging]         = useState(false);
  const [localError, setLocalError]     = useState<string | null>(null);
  const [selectedSample, setSelectedSample] = useState<string | null>(null);
  const [pendingFile, setPendingFile]   = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── handle a real file chosen from disk ──
  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setLocalError(t('uploadError'));
      return;
    }
    setLocalError(null);
    setSelectedSample(null);   // clear any sample selection
    setPendingFile(file);
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  // ── selecting a sample chip ──
  const handleChipClick = (key: string) => {
    setSelectedSample(key);
    setPreview(null);          // clear any real image preview
    setPendingFile(null);      // clear any real file
    setLocalError(null);
  };

  // ── clicking the Diagnose button ──
  const handleDiagnose = () => {
    if (loading) return;
    if (pendingFile) {
      // Real image upload
      onUpload(pendingFile);
    } else if (selectedSample) {
      // Sample demo — let App.tsx produce a simulated result
      onSample(selectedSample);
    }
  };

  // Button is ready when either a real file or a sample is selected
  const ready = (!!pendingFile || !!selectedSample) && !loading;

  // What to show inside the drop zone
  const currentSample = SAMPLES.find(s => s.key === selectedSample);

  return (
    <section className="upload-section">
      <h2 className="upload-card-title">🌿 {t('uploadTitle')}</h2>
      <p className="upload-card-sub">{t('uploadHint')}</p>

      {/* ── Drop zone ── */}
      <div
        className={`upload-drop${dragging ? ' drag' : ''}`}
        role="button"
        tabIndex={0}
        aria-label={t('uploadHint')}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && fileRef.current?.click()}
      >
        {preview ? (
          // Real image preview
          <img className="upload-preview" src={preview} alt="Leaf preview" />
        ) : selectedSample && currentSample ? (
          // Sample selected — show a visual cue so the user knows it's ready
          <div style={{ textAlign: 'center', pointerEvents: 'none' }}>
            <div style={{ fontSize: '4rem', lineHeight: 1, marginBottom: 10 }}>
              {currentSample.leafEmoji}
            </div>
            <span style={{
              background: currentSample.bg,
              color: currentSample.color,
              fontWeight: 700,
              borderRadius: 99,
              padding: '4px 16px',
              fontSize: '0.9rem',
              border: `1.5px solid ${currentSample.color}`,
            }}>
              {t(currentSample.label)} — {t('sampleReady')}
            </span>
          </div>
        ) : (
          // Default placeholder
          <>
            <span className="upload-placeholder">🖼️</span>
            <span className="upload-label">{t('uploadHint')}</span>
            <span style={{ color: '#9CA3AF', fontSize: '0.8rem' }}>{t('uploadFormats')}</span>
          </>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          // reset input so same file can be reselected
          e.target.value = '';
        }}
      />

      {/* ── Sample chips ── */}
      <p className="cg-sample-label">{t('sampleLabel')}</p>
      <div className="cg-chips">
        {SAMPLES.map(s => (
          <button
            key={s.key}
            type="button"
            className="cg-chip"
            style={{
              background: s.bg,
              color: s.color,
              borderColor: selectedSample === s.key ? s.color : 'transparent',
              transform: selectedSample === s.key ? 'scale(1.07)' : 'scale(1)',
              boxShadow: selectedSample === s.key
                ? `0 0 0 2px ${s.color}`
                : 'none',
            }}
            onClick={e => {
              e.stopPropagation();   // prevent click bubbling to the drop zone
              handleChipClick(s.key);
            }}
          >
            <span>{s.emoji}</span>
            {t(s.label)}
          </button>
        ))}
      </div>

      {/* Error messages */}
      {(localError || error) && (
        <p className="upload-error">{localError ?? error}</p>
      )}

      {/* ── Diagnose button — centred ── */}
      <div className="cg-diag-wrap">
        <button
          type="button"
          className="diagnose-btn"
          disabled={!ready}
          onClick={handleDiagnose}
        >
          {loading ? (
            <span className="loading-indicator">
              <span>🔬</span> {t('diagnosing')}
            </span>
          ) : (
            `🔬 ${t('diagnose')}`
          )}
        </button>
      </div>
    </section>
  );
};

export default Upload;
