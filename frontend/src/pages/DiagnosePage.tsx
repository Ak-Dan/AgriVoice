import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Upload from '../components/Upload';
import Result from '../components/Result';
import History from '../components/History';
import VideoSection from '../components/VideoSection';
import { diagnoseLeaf } from '../api';
import type { DiagnosisResult, HistoryEntry, SeverityKey } from '../types';

// Simulated results for the maize sample chips (38-class-aware shape).
const SAMPLE_RESULTS: Record<string, DiagnosisResult> = {
  rust: {
    disease: 'rust', rawLabel: 'Corn_(maize)___Common_rust_',
    healthy: false, recognized: true,
    confidence: 0.97, severity: 'high' as SeverityKey,
  },
  cercospora: {
    disease: 'cercospora', rawLabel: 'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot',
    healthy: false, recognized: true,
    confidence: 0.91, severity: 'medium' as SeverityKey,
  },
  blight: {
    disease: 'blight', rawLabel: 'Corn_(maize)___Northern_Leaf_Blight',
    healthy: false, recognized: true,
    confidence: 0.94, severity: 'high' as SeverityKey,
  },
  healthy: {
    disease: 'healthy', rawLabel: 'Corn_(maize)___healthy',
    healthy: true, recognized: true,
    confidence: 0.99, severity: 'low' as SeverityKey,
  },
};

const DiagnosePage: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState<string | null>(null);
  const [result, setResult]                 = useState<DiagnosisResult | null>(null);
  const [uploadedImg, setUploadedImg]       = useState<string | null>(null);
  const [history, setHistory]               = useState<HistoryEntry[]>([]);
  const [selectedVideoKey, setSelectedVideoKey] = useState('default');

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

  const handleSample = (diseaseKey: string) => {
    const diagnosis = SAMPLE_RESULTS[diseaseKey];
    if (!diagnosis) return;
    setError(null);
    setUploadedImg(null);
    commitResult(diagnosis, null);
  };

  const handleHistorySelect = (entry: HistoryEntry) => {
    setResult(entry);
    setUploadedImg(entry.previewUrl ?? null);
    setSelectedVideoKey(entry.disease);
  };

  return (
    <>
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

      <main className="cg-main">
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

        <div className="cg-secondary">
          <History
            history={history}
            onSelect={handleHistorySelect}
            onClear={() => setHistory([])}
          />
          <VideoSection activeDisease={selectedVideoKey} />
        </div>
      </main>
    </>
  );
};

export default DiagnosePage;
