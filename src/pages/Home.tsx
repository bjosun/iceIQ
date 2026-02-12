import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import heroBg from '../assets/images/hero-bg.jpg';
import dashboardPreview from '../assets/images/dashboard-preview.png';
import { 
  BarChart3, 
  Cloud, 
  Users, 
  Shield, 
  Zap, 
  CheckCircle,
  ArrowRight
} from 'lucide-react';

export default function Home() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  
  // State för att växla mellan månad och år på landningssidan
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const features = [
    {
      icon: <BarChart3 className="text-cyan-400" size={24} />,
      title: t('features.analytics.title') || "Advanced Analytics",
      description: t('features.analytics.desc') || "Track player performance with detailed statistics and visualizations."
    },
    {
      icon: <Cloud className="text-cyan-400" size={24} />,
      title: t('features.cloud.title') || "Cloud Sync",
      description: t('features.cloud.desc') || "Access your data anywhere, on any device. Always backed up."
    },
    {
      icon: <Users className="text-cyan-400" size={24} />,
      title: t('features.teams.title') || "Team Management",
      description: t('features.teams.desc') || "Manage multiple players and teams with ease."
    },
    {
      icon: <Shield className="text-cyan-400" size={24} />,
      title: t('features.security.title') || "Data Security",
      description: t('features.security.desc') || "Your data is encrypted and secure. We never share your information."
    }
  ];

  // Dynamiska priser och texter baserat på val
  const isYearly = billingCycle === 'yearly';
  const premiumPrice = isYearly ? '299' : '29';
  const premiumPeriod = isYearly 
    ? (language === 'sv' ? 'SEK/år' : 'SEK/year') 
    : (language === 'sv' ? 'SEK/mån' : 'SEK/month');

  return (
    <div className="bg-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 lg:pt-32 lg:pb-40 min-h-[90vh] flex flex-col items-center justify-center">
        
        {/* --- BAKGRUNDSBILD & OVERLAY --- */}
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${heroBg})` }}
          ></div>
          <div className="absolute inset-0 bg-gray-900/70 bg-gradient-to-b from-gray-900/80 via-gray-900/60 to-gray-900"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
          <div className="max-w-4xl mx-auto">
            
            {/* Ikon/Logga */}
            <div className="inline-block mb-6 animate-fade-in-up">
              <div className="w-24 h-24 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center mx-auto shadow-2xl">
                <span className="text-5xl filter drop-shadow-lg">🏒</span>
              </div>
            </div>

            {/* Rubrik */}
            <h1 className="text-5xl sm:text-7xl font-bold text-white mb-6 tracking-tight drop-shadow-lg animate-fade-in-up delay-100">
              {t('hero.title') || "Hockey Analytics"}
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-200">
                {t('hero.subtitle') || "Made Simple"}
              </span>
            </h1>

            {/* Underrubrik */}
            <p className="text-xl sm:text-2xl text-gray-200 mb-10 leading-relaxed drop-shadow-md animate-fade-in-up delay-200">
              {t('hero.description') || "Professional scouting tools for coaches, players, and supportive parents."}
            </p>

            {/* Knappar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in-up delay-300">
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-cyan-500/25 border border-cyan-500"
              >
                {user 
                  ? (language === 'sv' ? 'Börja analysera' : 'Start Analyzing')
                  : (t('common.getStarted') || "Get Started Free")
                }
                <ArrowRight className="ml-2" size={20} />
              </Link>
              <a
                href="#pricing"
                className="inline-flex items-center justify-center px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold text-lg transition-all border border-white/20"
              >
                {t('common.viewPlans') || "View Plans"}
              </a>
            </div>

            {/* Dashboard Preview Image */}
            <div className="relative mx-auto w-full max-w-5xl animate-fade-in-up delay-500">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-20"></div>
              <div className="relative rounded-2xl border border-white/10 bg-gray-900/50 backdrop-blur-sm p-2 shadow-2xl ring-1 ring-white/10">
                <img 
                  src={dashboardPreview} 
                  alt="Ice IQ Dashboard Preview" 
                  className="rounded-xl w-full h-auto shadow-inner border border-white/5"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-900 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              {t('features.mainTitle') || "Everything You Need for Player Development"}
            </h2>
            <p className="text-gray-400 text-lg">
              {t('features.mainDesc') || "From grassroots to professional level, we've got you covered."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-gray-800 rounded-2xl p-6 hover:bg-gray-750 transition-colors border border-gray-700/50">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">
              {t('pricing.title') || "Simple, Transparent Pricing"}
            </h2>
            
            {/* Toggle Switch */}
            <div className="flex items-center justify-center space-x-4 mt-8">
              <span className={`text-sm ${!isYearly ? 'text-white font-bold' : 'text-gray-500'}`}>
                {language === 'sv' ? 'Månadsvis' : 'Monthly'}
              </span>
              <button 
                onClick={() => setBillingCycle(isYearly ? 'monthly' : 'yearly')}
                className="w-14 h-7 bg-gray-700 rounded-full relative p-1 transition-colors hover:bg-gray-600"
              >
                <div className={`w-5 h-5 bg-cyan-400 rounded-full transition-transform duration-200 transform ${isYearly ? 'translate-x-7' : 'translate-x-0'}`} />
              </button>
              <span className={`text-sm flex items-center ${isYearly ? 'text-white font-bold' : 'text-gray-500'}`}>
                {language === 'sv' ? 'Årsvis' : 'Yearly'}
                <span className="ml-2 bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                  Save ~15%
                </span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-16">
            {/* Free Plan */}
            <div className="bg-gray-800 rounded-3xl p-8 border border-gray-700 flex flex-col">
              <h3 className="text-xl font-bold text-white mb-4">{t('plans.free.name') || "Free"}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">0</span>
                <span className="text-gray-400 ml-2">SEK / {t('plans.free.period') || "forever"}</span>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                {["Basic scoring", "Save 1 player", "Simple match history", "Basic statistics"].map((f, i) => (
                  <li key={i} className="flex items-center text-gray-300 text-sm">
                    <CheckCircle className="text-cyan-500 mr-3 shrink-0" size={18} /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/dashboard" className="block text-center py-4 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-all">
                {user ? (language === 'sv' ? 'Öppna Dashboard' : 'Open Dashboard') : (t('common.getStarted') || "Get Started")}
              </Link>
            </div>

            {/* Premium Plan */}
            <div className="bg-gray-800 rounded-3xl p-8 border-2 border-yellow-500 relative shadow-2xl shadow-yellow-500/10 flex flex-col">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                {t('common.recommended') || "Recommended"}
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Premium</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">{premiumPrice}</span>
                <span className="text-gray-400 ml-2">{premiumPeriod}</span>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                {["Unlimited players", "Advanced analytics", "Customizable templates", "Cloud sync", "Priority support"].map((f, i) => (
                  <li key={i} className="flex items-center text-gray-300 text-sm">
                    <CheckCircle className="text-yellow-500 mr-3 shrink-0" size={18} /> {f}
                  </li>
                ))}
              </ul>
              <Link 
                to={isYearly ? "/dashboard?upgrade=true&interval=yearly" : "/dashboard?upgrade=true"} 
                className="block text-center py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-black rounded-xl transition-all shadow-lg"
              >
                {t('common.upgradeNow') || "Upgrade Now"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-12 border border-gray-700 shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <Zap className="text-yellow-400 mx-auto mb-6" size={48} />
              <h2 className="text-3xl font-bold text-white mb-4">
                {user 
                  ? (language === 'sv' ? 'Redo att fortsätta scoutingen?' : 'Ready to Continue Scouting?')
                  : (t('cta.title') || "Ready to Transform Your Coaching?")
                }
              </h2>
              <p className="text-gray-300 mb-8 text-lg">
                {user
                  ? (language === 'sv' ? 'Dina spelare väntar. Fortsätt analysera prestationerna idag.' : 'Your players are waiting. Continue analyzing performances today.')
                  : (t('cta.desc') || "Join hundreds of coaches already using Ice IQ.")
                }
              </p>
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity shadow-lg"
              >
                {user 
                  ? (language === 'sv' ? 'Gå till Dashboard' : 'Go to Dashboard')
                  : (t('common.startFreeTrial') || "Start Free Trial")
                }
                <ArrowRight className="ml-2" size={20} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}