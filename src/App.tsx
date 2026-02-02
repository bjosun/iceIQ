import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SubscriptionProvider } from './contexts/SubscriptionContext'
import { TemplateProvider } from './contexts/TemplateContext'
import { LanguageProvider } from './contexts/LanguageContext'

import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import Success from './pages/Success'

// 1. LÄGG TILL IMPORTEN HÄR:
import MatchTracker from './pages/MatchTracker' 

import Layout from './components/layout/Layout'
import './index.css'

function AppContent() {
  const location = useLocation();
  
  // Check if we should hide layout for success pages
  const hideLayout = location.pathname === '/success';
  
  return hideLayout ? (
    <Routes>
      <Route path="/success" element={<Success />} />
    </Routes>
  ) : (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* 2. LÄGG TILL ROUTEN HÄR: */}
        {/* Nu kan du nå sidan via din-url.com/match */}
        <Route path="/match" element={<MatchTracker />} />

        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
      </Routes>
    </Layout>
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