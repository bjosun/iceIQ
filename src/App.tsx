import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SubscriptionProvider } from './contexts/SubscriptionContext'
import { TemplateProvider } from './contexts/TemplateContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { captureUtmParams } from './utils/helpers'

// 1. Importera Toaster och CSS
import { Toaster } from 'react-hot-toast'

import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import Success from './pages/Success'
import MatchTracker from './pages/MatchTracker'

import Layout from './components/layout/Layout'
import './index.css'

function AppContent() {
  const location = useLocation();

  // Fångar utm_*-parametrar på varje sidladdning (inte bara "/") eftersom
  // annonser kan länka rakt in till t.ex. /dashboard. Ingen effekt om inget
  // finns i URL:en, eller om en källa redan sparats sedan tidigare.
  useEffect(() => {
    captureUtmParams();
  }, [location.search]);

  const hideLayout = location.pathname === '/success';

  return (
    <>
      {/* 2. Toaster placeras här så den ligger "över" allt annat */}
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937', // Grå mörk bakgrund (gray-800)
            color: '#fff',
            border: '1px solid rgba(34, 211, 238, 0.3)', // Cyan-kant
          },
          success: {
            iconTheme: {
              primary: '#22d3ee', // Cyan färg för ikonen
              secondary: '#1f2937',
            },
          },
        }} 
      />
      
      {hideLayout ? (
        <Routes>
          <Route path="/success" element={<Success />} />
        </Routes>
      ) : (
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/match" element={<MatchTracker />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
          </Routes>
        </Layout>
      )}
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <LanguageProvider>
          <SubscriptionProvider>
            <TemplateProvider>
              <AppContent />
            </TemplateProvider>
          </SubscriptionProvider>
        </LanguageProvider>
      </AuthProvider>
    </Router>
  )
}

export default App