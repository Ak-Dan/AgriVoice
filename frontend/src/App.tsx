import React from 'react';
import { useTranslation } from 'react-i18next';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import AppFooter from './components/AppFooter';
import DashboardPage from './pages/DashboardPage';
import DiagnosePage from './pages/DiagnosePage';
import './App.css';

const App: React.FC = () => {
  const { i18n } = useTranslation();

  const handleLangChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <div className="app-container">
      <Header onLangChange={handleLangChange} currentLang={i18n.language} />

      <Routes>
        {/* Landing page = dashboard (what a subdomain visitor sees first) */}
        <Route path="/" element={<DashboardPage />} />
        {/* The image-upload / diagnosis tool */}
        <Route path="/diagnose" element={<DiagnosePage />} />
      </Routes>

      <AppFooter />
    </div>
  );
};

export default App;
