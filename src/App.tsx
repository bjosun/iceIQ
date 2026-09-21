import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SubscriptionProvider } from './contexts/SubscriptionContext'
import { TemplateProvider } from './contexts/TemplateContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { captureUtmParams } from './utils/helpers'

// 1. Importera Toaster och CSS
import { Toaster } from 'react-hot-toast'

// Home laddas eagerly eftersom det är sidan flest besökare landar på direkt
// (och den statiska SEO-fallbacken i index.html speglar just den) — att
// lazy-loada den skulle bara lägga till ännu en nätverksomgång för first paint.
// Alla andra routes lazy-loadas så att t.ex. charts.js (Dashboard) och
// firebase-tunga sidor inte blockerar den initiala bundlen.
import Home from './pages/Home'
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Terms = lazy(() => import('./pages/Terms'))
const Privacy = lazy(() => import('./pages/Privacy'))
const Success = lazy(() => import('./pages/Success'))
const MatchTracker = lazy(() => import('./pages/MatchTracker'))
const PlayerLinkPage = lazy(() => import('./pages/PlayerLinkPage'))
const HockeyTrackingApp = lazy(() => import('./pages/landing/HockeyTrackingApp'))
const YouthHockeyStats = lazy(() => import('./pages/landing/YouthHockeyStats'))
const HockeyScoutingTemplate = lazy(() => import('./pages/landing/HockeyScoutingTemplate'))
const CorsiYouthHockey = lazy(() => import('./pages/landing/CorsiYouthHockey'))
const GameTrackingTemplate = lazy(() => import('./pages/landing/GameTrackingTemplate'))

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

  // /p/:token är spelarens egen, inloggningsfria sida (se PlayerLinkPage) —
  // ska aldrig visa förälderns Header/nav.
  const hideLayout = location.pathname === '/success' || location.pathname.startsWith('/p/');

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
        <Suspense fallback={null}>
          <Routes>
            <Route path="/success" element={<Success />} />
            <Route path="/p/:token" element={<PlayerLinkPage />} />
          </Routes>
        </Suspense>
      ) : (
        <Layout>
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/match" element={<MatchTracker />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              {/* Engelska nyckelordslandningssidor. Egna title/description/canonical
                 sätts via useSEO (se LandingPage.tsx) eftersom index.html annars
                 delar samma tre taggar för alla routes. */}
              <Route path="/hockey-tracking-app" element={<HockeyTrackingApp />} />
              <Route path="/youth-hockey-stats" element={<YouthHockeyStats />} />
              <Route path="/hockey-scouting-template" element={<HockeyScoutingTemplate />} />
              <Route path="/measure-corsi-youth-hockey" element={<CorsiYouthHockey />} />
              {/* Bilingual lead-magnet page (not English-only like the ones above) —
                 för FB-grupp-distribution i både engelska och svenska communities. */}
              <Route path="/game-tracking-template" element={<GameTrackingTemplate />} />
            </Routes>
          </Suspense>
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