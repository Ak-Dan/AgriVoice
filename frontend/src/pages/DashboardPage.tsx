import React from 'react';
import SurveillanceDashboard from '../components/SurveillanceDashboard';

// Landing page. Dashboard is English-only and fully simulated for now.
// When the system goes live, swap the simulation engine's output for real
// API data (same shape) and optionally feed real /infer diagnoses into the
// farmer-inquiry panel.
const DashboardPage: React.FC = () => {
  return (
    <main className="cg-dash-main">
      <SurveillanceDashboard />
    </main>
  );
};

export default DashboardPage;
