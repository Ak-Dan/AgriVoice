import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Header from './components/Header';
import Upload from './components/Upload';
import Result from './components/Result';
import History from './components/History';
import VideoSection from './components/VideoSection';
import AppFooter from './components/AppFooter';
import { diagnoseLeaf } from './api';
import type { DiagnosisResult, HistoryEntry, DiseaseKey, SeverityKey } from './types';
import './App.css';

// ── Simulated results for sample chips ──────────────────────────
// When a user picks a sample we return a realistic fixed result
// so the full result flow (treatment, video, history) still works.
const SAMPLE_RESULTS: Record<string, DiagnosisResult> = {
  rust: {
    disease:    'rust'       as DiseaseKey,
    confidence: 0.97,
    severity:   'high'       as SeverityKey,
  },
  cercospora: {
    disease:    'cercospora' as DiseaseKey,
    confidence: 0.91,
    severity:   'medium'     as SeverityKey,
  },
  blight: {
    disease:    'blight'     as DiseaseKey,
    confidence: 0.94,
    severity:   'high'       as SeverityKey,
  },
  healthy: {
    disease:    'healthy'    as DiseaseKey,
    confidence: 0.99,
    severity:   'low'        as SeverityKey,
  },
};

const App: React.FC = () => {
  const { i18n, t } = useTranslation();
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState<string | null>(null);
  const [result, setResult]                 = useState<DiagnosisResult | null>(null);
  const [uploadedImg, setUploadedImg]       = useState<string | null>(null);
  const [history, setHistory]               = useState<HistoryEntry[]>([]);
  const [selectedVideoKey, setSelectedVideoKey] = useState('default');

  // ── Helper: commit a diagnosis to state + history ──
  const commitResult = (diagnosis: DiagnosisResult, previewUrl: string | null) => {
    setResult(diagnosis);
    setSelectedVideoKey(diagnosis.disease);
    setHistory(prev => [
      {
        ...diagnosis,
        timestamp:  new Date().toISOString(),
        previewUrl: previewUrl ?? undefined,
      },
      ...prev,
    ]);
  };

  // ── Real image upload → Express /infer ──
  const handleUpload = (file: File) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setUploadedImg(null);

    const reader = new FileReader();
    reader.onload = async e => {
      const previewUrl = e.target?.result as string;
      setUploadedImg(previewUrl);

      try {
        const res = await diagnoseLeaf(file);
        setLoading(false);
        if (res.error) {
          setError(res.error);
          return;
        }
        if (res.diagnosis) {
          commitResult(res.diagnosis, previewUrl);
        }
      } catch {
        setLoading(false);
        setError('Unexpected error — make sure the backend is running.');
      }
    };
    reader.readAsDataURL(file);
  };

  // ── Sample chip → simulated result (no API call) ──
  const handleSample = (diseaseKey: string) => {
    const diagnosis = SAMPLE_RESULTS[diseaseKey];
    if (!diagnosis) return;
    setError(null);
    setUploadedImg(null);   // no real image for samples
    commitResult(diagnosis, null);
  };

  const handleHistorySelect = (entry: HistoryEntry) => {
    setResult(entry);
    setUploadedImg(entry.previewUrl ?? null);
    setSelectedVideoKey(entry.disease);
  };

  const handleLangChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <div className="app-container">
      <Header onLangChange={handleLangChange} currentLang={i18n.language} />

      {/* ── HERO BANNER ── */}
      <section className="cg-hero">
        <p className="cg-hero-tag">{t('heroTag')}</p>
        <h1 className="cg-hero-title">{t('appName')}</h1>
        <p className="cg-hero-sub">{t('tagline')}</p>
        <div className="cg-pills">
          <span className="cg-pill">{t('heroStat1')}</span>
          <span className="cg-pill">{t('heroStat2')}</span>
          <span className="cg-pill">{t('heroStat3')}</span>
        </div>
      </section>

      {/* ── CENTRED MAIN COLUMN ── */}
      <main className="cg-main">

        {/* Upload OR Result — only one visible at a time */}
        {!result ? (
          <Upload
            onUpload={handleUpload}
            onSample={handleSample}
            loading={loading}
            error={error}
          />
        ) : (
          <Result
            result={result}
            imageUrl={uploadedImg ?? undefined}
            onBack={() => { setResult(null); setUploadedImg(null); }}
          />
        )}

        {/* Secondary row: History + Video */}
        <div className="cg-secondary">
          <History
            history={history}
            onSelect={handleHistorySelect}
            onClear={() => setHistory([])}
          />
          <VideoSection activeDisease={selectedVideoKey} />
        </div>
      </main>

      <AppFooter />
    </div>
  );
};

export default App;
