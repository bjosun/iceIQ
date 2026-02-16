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
  ArrowRight,
  BrainCircuit, // Ny ikon för AI
  Sparkles,      // Ny ikon för AI
  Bot,           // Ny ikon för AI
  Crown
} from 'lucide-react';

export default function Home() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  
  // State för att växla mellan månad och år
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const isYearly = billingCycle === 'yearly';

  // --- PRISER & DATA ---
  const plans = {
    premium: {
      price: isYearly ? '299' : '29',
      period: isYearly ? (language === 'sv' ? 'SEK/år' : 'SEK/year') : (language === 'sv' ? 'SEK/mån' : 'SEK/month'),
      credits: 15
    },
    elite: {
      price: isYearly ? '899' : '89',
      period: isYearly ? (language === 'sv' ? 'SEK/år' : 'SEK/year') : (language === 'sv' ? 'SEK/mån' : 'SEK/month'),
      credits: 50
    }
  };

  const features = [
    {
      icon: <BrainCircuit className="text-indigo-400" size={24} />,
      title: language === 'sv' ? "AI Coach" : "AI Coach",
      description: language === 'sv' 
        ? "Få taktiska råd och feedback direkt från vår Gemini-drivna AI." 
        : "Get tactical advice and feedback directly from our Gemini-powered AI."
    },
    {
      icon: <BarChart3 className="text-cyan-400" size={24} />,
      title: t('features.analytics.title') || "Advanced Analytics",
      description: t('features.analytics.desc') || "Track player performance with detailed statistics."
    },
    {
      icon: <Cloud className="text-cyan-400" size={24} />,
      title: t('features.cloud.title') || "Cloud Sync",
      description: t('features.cloud.desc') || "Access your data anywhere, on any device."
    },
    {
      icon: <Users className="text-cyan-400" size={24} />,
      title: t('features.teams.title') || "Team Management",
      description: t('features.teams.desc') || "Manage multiple players and teams with ease."
    }
  ];

  return (
    <div className="bg-gray-900">
      
      {/* --- HERO SECTION --- */}
      <section className="relative overflow-hidden pt-24 pb-32 min-h-[90vh] flex flex-col items-center justify-center">
        {/* Bakgrund */}
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${heroBg})` }}
          ></div>
          <div className="absolute inset-0 bg-gray-900/80 bg-gradient-to-b from-gray-900/90 via-gray-900/70 to-gray-900"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
          
          {/* AI Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/20 border border-indigo-500/40 backdrop-blur-md mb-8 animate-fade-in-up">
            <Sparkles size={16} className="text-indigo-400" />
            <span className="text-indigo-200 text-sm font-semibold tracking-wide">
              {language === 'sv' ? "Nu med AI Coach Integration" : "Now with AI Coach Integration"}
            </span>
          </div>

          {/* Rubrik */}
          <h1 className="text-5xl sm:text-7xl font-bold text-white mb-6 tracking-tight drop-shadow-2xl animate-fade-in-up delay-100">
            {language === 'sv' ? "Din personliga" : "Your Personal"}
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">
              {language === 'sv' ? "Hockeyanalytiker" : "Hockey Analyst"}
            </span>
          </h1>

          <p className="text-xl sm:text-2xl text-gray-300 mb-10 leading-relaxed max-w-3xl mx-auto animate-fade-in-up delay-200">
            {language === 'sv' 
              ? "Samla statistik, analysera trender och få taktisk feedback från vår AI-coach." 
              : "Track stats, analyze trends, and get tactical feedback from our AI coach."}
          </p>

          {/* Knappar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in-up delay-300">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-indigo-500/25"
            >
              {user 
                ? (language === 'sv' ? 'Gå till Dashboard' : 'Go to Dashboard')
                : (language === 'sv' ? 'Testa AI Coachen' : 'Try AI Coach')
              }
              <ArrowRight className="ml-2" size={20} />
            </Link>
            <a
              href="#pricing"
              className="inline-flex items-center justify-center px-8 py-4 bg-white/5 hover:bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold text-lg transition-all border border-white/10"
            >
              {t('common.viewPlans') || "View Plans"}
            </a>
          </div>

          {/* Dashboard Preview */}
          <div className="relative mx-auto w-full max-w-5xl animate-fade-in-up delay-500 group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
            <div className="relative rounded-2xl border border-white/10 bg-gray-900/80 backdrop-blur-sm p-2 shadow-2xl">
              <img 
                src={dashboardPreview} 
                alt="Ice IQ Dashboard" 
                className="rounded-xl w-full h-auto shadow-inner"
              />
              
              {/* Flytande AI-kort (Visuell effekt) */}
              <div className="absolute bottom-4 right-4 md:bottom-10 md:right-10 bg-gray-900/90 backdrop-blur-xl border border-indigo-500/50 p-4 rounded-xl shadow-2xl max-w-xs text-left hidden sm:block animate-bounce-slow">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-indigo-500/20 rounded-lg"><Bot size={16} className="text-indigo-400"/></div>
                    <span className="text-white font-bold text-sm">Ice IQ Coach</span>
                </div>
                <p className="text-gray-300 text-xs leading-relaxed">
                    "Bra match! Du hade 85% positiva aktioner i defensiv zon. Fokusera på uppspelen i nästa period."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section className="py-24 bg-gray-900 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              {t('features.mainTitle') || "Everything You Need"}
            </h2>
            <p className="text-gray-400 text-lg">
              {t('features.mainDesc') || "From basic stats to advanced AI analysis."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-gray-800/50 rounded-2xl p-6 hover:bg-gray-800 transition-colors border border-gray-700/50 group">
                <div className="mb-4 p-3 bg-gray-900 w-fit rounded-xl group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- PRICING SECTION --- */}
      <section id="pricing" className="py-24 bg-gray-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold text-white mb-4">
              {t('pricing.title') || "Simple Pricing"}
            </h2>
            <p className="text-gray-400">
               {language === 'sv' ? "Välj nivån som passar din satsning." : "Choose the level that fits your ambition."}
            </p>
            
            {/* Toggle Switch */}
            <div className="flex items-center justify-center space-x-4 mt-8">
              <span className={`text-sm ${!isYearly ? 'text-white font-bold' : 'text-gray-500'}`}>
                {language === 'sv' ? 'Månadsvis' : 'Monthly'}
              </span>
              <button 
                onClick={() => setBillingCycle(isYearly ? 'monthly' : 'yearly')}
                className="w-14 h-7 bg-gray-700 rounded-full relative p-1 transition-colors hover:bg-gray-600 focus:outline-none"
              >
                <div className={`w-5 h-5 bg-cyan-400 rounded-full transition-transform duration-200 transform ${isYearly ? 'translate-x-7' : 'translate-x-0'}`} />
              </button>
              <span className={`text-sm flex items-center ${isYearly ? 'text-white font-bold' : 'text-gray-500'}`}>
                {language === 'sv' ? 'Årsvis' : 'Yearly'}
                <span className="ml-2 bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                  -15%
                </span>
              </span>
            </div>
          </div>

          {/* PRICING CARDS (3 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-12">
            
            {/* 1. FREE PLAN */}
            <div className="bg-gray-800 rounded-3xl p-8 border border-gray-700 flex flex-col hover:border-gray-600 transition-colors">
              <h3 className="text-xl font-bold text-white mb-2">{t('plans.free.name') || "Free"}</h3>
              <p className="text-gray-400 text-xs mb-6">For beginners</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">0</span>
                <span className="text-gray-400 ml-2">SEK</span>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                {["Basic scoring", "Save 1 player", "Simple history", "No AI Access"].map((f, i) => (
                  <li key={i} className="flex items-center text-gray-300 text-sm">
                    {f.includes("No") 
                        ? <span className="w-4 h-4 mr-3 flex items-center justify-center text-gray-600">✕</span> 
                        : <CheckCircle className="text-gray-500 mr-3 shrink-0" size={18} />
                    } 
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/dashboard" className="block text-center py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-all">
                {user ? (language === 'sv' ? 'Öppna' : 'Open') : (t('common.getStarted') || "Start Free")}
              </Link>
            </div>

            {/* 2. PREMIUM PLAN (POPULAR) */}
            <div className="bg-gray-800 rounded-3xl p-8 border-2 border-yellow-500 relative flex flex-col shadow-xl shadow-yellow-900/20 transform md:-translate-y-4">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest flex gap-1">
                <Crown size={12} /> {language === 'sv' ? "Populärast" : "Popular"}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Premium</h3>
              <p className="text-yellow-500/80 text-xs mb-6">For dedicated players</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">{plans.premium.price}</span>
                <span className="text-gray-400 ml-2">{plans.premium.period}</span>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                {[
                    "Unlimited players", 
                    "Cloud sync", 
                    "Advanced charts", 
                    `Includes ${plans.premium.credits} AI Credits/mo`, 
                    "Gemini Flash AI"
                ].map((f, i) => (
                  <li key={i} className="flex items-center text-gray-300 text-sm">
                    {f.includes("AI") || f.includes("Gemini") 
                        ? <Sparkles className="text-yellow-400 mr-3 shrink-0" size={18} />
                        : <CheckCircle className="text-yellow-500 mr-3 shrink-0" size={18} />
                    }
                    <span className={f.includes("AI") ? "text-white font-medium" : ""}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link 
                to={isYearly ? "/dashboard?upgrade=true&plan=premium&interval=yearly" : "/dashboard?upgrade=true&plan=premium"} 
                className="block text-center py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl transition-all"
              >
                {language === 'sv' ? "Välj Premium" : "Get Premium"}
              </Link>
            </div>

            {/* 3. ELITE PLAN (AI POWERHOUSE) */}
            <div className="bg-gradient-to-b from-indigo-900/50 to-gray-800 rounded-3xl p-8 border border-indigo-500/50 flex flex-col relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <BrainCircuit size={100} className="text-indigo-400" />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                Elite <span className="bg-indigo-500 text-white text-[10px] px-2 py-0.5 rounded uppercase">AI Power</span>
              </h3>
              <p className="text-indigo-300 text-xs mb-6">For future pros</p>
              
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">{plans.elite.price}</span>
                <span className="text-gray-400 ml-2">{plans.elite.period}</span>
              </div>
              
              <ul className="space-y-4 mb-8 flex-grow relative z-10">
                {[
                    "Everything in Premium", 
                    `Includes ${plans.elite.credits} AI Credits/mo`, 
                    "Smarter AI (Gemini Pro)",
                    "Chat with Coach (Follow-up)",
                    "Priority Support"
                ].map((f, i) => (
                  <li key={i} className="flex items-center text-gray-200 text-sm">
                    {f.includes("AI") || f.includes("Gemini") || f.includes("Chat")
                        ? <BrainCircuit className="text-indigo-400 mr-3 shrink-0" size={18} />
                        : <CheckCircle className="text-indigo-500 mr-3 shrink-0" size={18} />
                    }
                    <span className={f.includes("AI") || f.includes("Pro") ? "text-white font-bold" : ""}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link 
                to={isYearly ? "/dashboard?upgrade=true&plan=elite&interval=yearly" : "/dashboard?upgrade=true&plan=elite"} 
                className="block text-center py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/25 relative z-10"
              >
                {language === 'sv' ? "Bli Elite" : "Get Elite"}
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-12 border border-gray-700 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
            <div className="relative z-10">
              <Zap className="text-yellow-400 mx-auto mb-6" size={48} />
              <h2 className="text-3xl font-bold text-white mb-4">
                {user 
                  ? (language === 'sv' ? 'Redo att analysera nästa match?' : 'Ready to analyze the next game?')
                  : (t('cta.title') || "Ready to Transform Your Game?")
                }
              </h2>
              <p className="text-gray-300 mb-8 text-lg max-w-lg mx-auto">
                {user
                  ? (language === 'sv' ? 'Din AI-coach väntar på ny data.' : 'Your AI coach is waiting for new data.')
                  : (language === 'sv' ? "Gå med hundratals spelare som redan använder Ice IQ." : "Join hundreds of players already using Ice IQ.")
                }
              </p>
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-900 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
              >
                {user 
                  ? (language === 'sv' ? 'Öppna Dashboard' : 'Open Dashboard')
                  : (t('common.startFreeTrial') || "Start Free")
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