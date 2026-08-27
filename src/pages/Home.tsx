import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import heroBg from '../assets/images/hero-bg.jpg';
import RinkLines from '../components/ui/RinkLines';
import HeroPreview from '../components/home/HeroPreview';
import {
  BarChart3,
  Cloud,
  Users,
  Zap,
  CheckCircle,
  ArrowRight,
  BrainCircuit,
  Wind,
  Sparkles,
  Bot,
  Crown,
  Banknote,
  SlidersHorizontal,
  PiggyBank,
  TrendingUp
} from 'lucide-react';

export default function Home() {
  const { t } = useLanguage();
  const { user } = useAuth();

  // State för att växla mellan månad och år
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const isYearly = billingCycle === 'yearly';

  // --- PRISER & DATA ---
  const plans = {
    premium: {
      price: isYearly ? '299' : '29',
      period: isYearly ? t('pricing.perYear') : t('pricing.perMonth'),
    },
    elite: {
      price: isYearly ? '890' : '89',
      period: isYearly ? t('pricing.perYear') : t('pricing.perMonth'),
    }
  };

  const features = [
    {
      icon: <BrainCircuit className="text-indigo-400" size={24} />,
      title: t('features.ai.title'),
      description: t('features.ai.desc')
    },
    {
      icon: <BarChart3 className="text-cyan-400" size={24} />,
      title: t('features.analytics.title'),
      description: t('features.analytics.desc')
    },
    {
      icon: <Cloud className="text-cyan-400" size={24} />,
      title: t('features.cloud.title'),
      description: t('features.cloud.desc')
    },
    {
      icon: <Users className="text-cyan-400" size={24} />,
      title: t('features.teams.title'),
      description: t('features.teams.desc')
    },
    {
      icon: <Wind className="text-cyan-400" size={24} />,
      title: t('features.mental.title'),
      description: t('features.mental.desc')
    }
  ];

  // Planernas punktlistor: nyckel + om raden ska lyftas fram (AI-relaterad)
  const freeFeatures = [
    { key: 'plans.free.f1', highlight: false },
    { key: 'plans.free.f2', highlight: false },
    { key: 'plans.free.f3', highlight: false },
    { key: 'plans.free.f4', highlight: true },
  ];
  const premiumFeatures = [
    { key: 'plans.premium.f1', highlight: false },
    { key: 'plans.premium.f2', highlight: false },
    { key: 'plans.premium.f3', highlight: false },
    { key: 'plans.premium.f4', highlight: true },
    { key: 'plans.premium.f5', highlight: true },
  ];
  const eliteFeatures = [
    { key: 'plans.elite.f1', highlight: false },
    { key: 'plans.elite.f2', highlight: true },
    { key: 'plans.elite.f3', highlight: true },
    { key: 'plans.elite.f4', highlight: true },
    { key: 'plans.elite.f5', highlight: false },
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
          {/* Rink-linjer som identitetsbärande dekor */}
          <RinkLines className="absolute inset-x-0 bottom-0 w-full h-[70%] opacity-40" />
          {/* Iskänsla: kall ton + frost längs nederkanten */}
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-cyan-950/40 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">

          {/* AI Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/20 border border-indigo-500/40 backdrop-blur-md mb-8 animate-fade-in-up">
            <Sparkles size={16} className="text-indigo-400" />
            <span className="text-indigo-200 text-sm font-semibold tracking-wide">
              {t('home.badge')}
            </span>
          </div>

          {/* Rubrik */}
          <h1 className="text-5xl sm:text-7xl font-bold text-white mb-6 tracking-tight drop-shadow-2xl animate-fade-in-up delay-100">
            {t('home.heroTitle1')}
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">
              {t('home.heroTitle2')}
            </span>
          </h1>

          <p className="text-xl sm:text-2xl text-gray-300 mb-10 leading-relaxed max-w-3xl mx-auto animate-fade-in-up delay-200">
            {t('home.heroDesc')}
          </p>

          {/* Knappar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in-up delay-300">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-indigo-500/25"
            >
              {user ? t('home.goToDashboard') : t('home.tryAiCoach')}
              <ArrowRight className="ml-2" size={20} />
            </Link>
            <a
              href="#pricing"
              className="inline-flex items-center justify-center px-8 py-4 bg-white/5 hover:bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold text-lg transition-all border border-white/10"
            >
              {t('common.viewPlans')}
            </a>
          </div>

          {/* Dashboard Preview */}
          <div className="relative mx-auto w-full max-w-5xl animate-fade-in-up delay-500 group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
            <div className="relative rounded-2xl border border-white/10 bg-gray-900/80 backdrop-blur-sm p-2 shadow-2xl">
              <HeroPreview />

              {/* Flytande AI-kort (Visuell effekt) */}
              <div className="absolute bottom-4 right-4 md:bottom-10 md:right-10 bg-gray-900/90 backdrop-blur-xl border border-indigo-500/50 p-4 rounded-xl shadow-2xl max-w-xs text-left hidden sm:block animate-bounce-slow">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-indigo-500/20 rounded-lg"><Bot size={16} className="text-indigo-400"/></div>
                    <span className="text-white font-bold text-sm">Ice IQ Coach</span>
                </div>
                <p className="text-gray-300 text-xs leading-relaxed">
                    {t('home.aiCardQuote')}
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
              {t('features.mainTitle')}
            </h2>
            <p className="text-gray-400 text-lg">
              {t('features.mainDesc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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

      {/* --- MONEY MODE SECTION --- */}
      <section className="py-24 bg-gray-800/20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Text-sidan (riktad till föräldern/tränaren) */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 mb-6">
                <Banknote size={14} className="text-yellow-500" />
                <span className="text-yellow-500 text-xs font-bold uppercase tracking-widest">
                  {t('moneyMode.badge')}
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                {t('moneyMode.title')}
              </h2>
              <p className="text-xl text-cyan-300 font-semibold mb-4">
                {t('moneyMode.heading')}
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                {t('moneyMode.desc')}
              </p>
              <p className="text-white font-semibold mb-8">
                {t('moneyMode.example')}
              </p>

              <ul className="space-y-5 mb-8">
                <li className="flex gap-4">
                  <div className="p-2 bg-gray-900 rounded-lg h-fit"><SlidersHorizontal size={20} className="text-cyan-400" /></div>
                  <div>
                    <p className="text-white font-semibold">{t('moneyMode.point1Title')}</p>
                    <p className="text-gray-400 text-sm">{t('moneyMode.point1Desc')}</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="p-2 bg-gray-900 rounded-lg h-fit"><PiggyBank size={20} className="text-cyan-400" /></div>
                  <div>
                    <p className="text-white font-semibold">{t('moneyMode.point2Title')}</p>
                    <p className="text-gray-400 text-sm">{t('moneyMode.point2Desc')}</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="p-2 bg-gray-900 rounded-lg h-fit"><TrendingUp size={20} className="text-cyan-400" /></div>
                  <div>
                    <p className="text-white font-semibold">{t('moneyMode.point3Title')}</p>
                    <p className="text-gray-400 text-sm">{t('moneyMode.point3Desc')}</p>
                  </div>
                </li>
              </ul>

              <p className="text-gray-500 text-xs italic">
                {t('moneyMode.note')}
              </p>
            </div>

            {/* Mock av Money Mode i dashboarden */}
            <div className="relative mx-auto w-full max-w-md">
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500/40 to-cyan-500/40 rounded-3xl blur opacity-30"></div>
              <div className="relative bg-gray-900 border border-gray-700 rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-white font-bold">{t('moneyMode.mockTitle')}</span>
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-yellow-500/50 text-yellow-500 bg-yellow-500/10 text-[10px] font-bold uppercase tracking-wider">
                    <Banknote size={12} /> {t('moneyMode.title')}
                  </span>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3">
                    <span className="text-gray-300 text-sm">{t('moneyMode.mockGoal')} × 2</span>
                    <span className="text-green-400 font-bold text-sm">+20 kr</span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3">
                    <span className="text-gray-300 text-sm">{t('moneyMode.mockAssist')} × 1</span>
                    <span className="text-green-400 font-bold text-sm">+5 kr</span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3">
                    <span className="text-gray-300 text-sm">{t('moneyMode.mockBackcheck')} × 4</span>
                    <span className="text-green-400 font-bold text-sm">+20 kr</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-gray-700 pt-4">
                  <span className="text-gray-400 text-sm">{t('moneyMode.mockBalance')}</span>
                  <span className="text-2xl font-black text-yellow-400">145 kr</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- PRICING SECTION --- */}
      <section id="pricing" className="py-24 bg-gray-800/30 relative overflow-hidden">
        <RinkLines className="absolute inset-0 w-full h-full opacity-[0.13]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold text-white mb-4">
              {t('pricing.title')}
            </h2>
            <p className="text-gray-400">
               {t('pricing.desc')}
            </p>

            {/* Toggle Switch */}
            <div className="flex items-center justify-center space-x-4 mt-8">
              <span className={`text-sm ${!isYearly ? 'text-white font-bold' : 'text-gray-500'}`}>
                {t('monthly')}
              </span>
              <button
                onClick={() => setBillingCycle(isYearly ? 'monthly' : 'yearly')}
                className="w-14 h-7 bg-gray-700 rounded-full relative p-1 transition-colors hover:bg-gray-600 focus:outline-none"
              >
                <div className={`w-5 h-5 bg-cyan-400 rounded-full transition-transform duration-200 transform ${isYearly ? 'translate-x-7' : 'translate-x-0'}`} />
              </button>
              <span className={`text-sm flex items-center ${isYearly ? 'text-white font-bold' : 'text-gray-500'}`}>
                {t('yearly')}
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
              <h3 className="text-xl font-bold text-white mb-2">{t('plans.free.name')}</h3>
              <p className="text-gray-400 text-xs mb-6">{t('plans.free.tagline')}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">0</span>
                <span className="text-gray-400 ml-2">SEK</span>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                {freeFeatures.map(({ key, highlight }) => (
                  <li key={key} className="flex items-center text-gray-300 text-sm">
                    {highlight
                        ? <Sparkles className="text-cyan-400 mr-3 shrink-0" size={18} />
                        : <CheckCircle className="text-gray-500 mr-3 shrink-0" size={18} />
                    }
                    <span className={highlight ? "text-white font-bold" : ""}>{t(key)}</span>
                  </li>
                ))}
              </ul>
              <Link to="/dashboard" className="block text-center py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-all">
                {user ? t('common.open') : t('common.getStarted')}
              </Link>
            </div>

            {/* 2. PREMIUM PLAN (POPULAR) */}
            <div className="bg-gray-800 rounded-3xl p-8 border-2 border-yellow-500 relative flex flex-col shadow-xl shadow-yellow-900/20 transform md:-translate-y-4">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest flex gap-1">
                <Crown size={12} /> {t('pricing.popular')}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Premium</h3>
              <p className="text-yellow-500/80 text-xs mb-6">{t('plans.premium.tagline')}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">{plans.premium.price}</span>
                <span className="text-gray-400 ml-2">{plans.premium.period}</span>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                {premiumFeatures.map(({ key, highlight }) => (
                  <li key={key} className="flex items-center text-gray-300 text-sm">
                    {highlight
                        ? <Sparkles className="text-yellow-400 mr-3 shrink-0" size={18} />
                        : <CheckCircle className="text-yellow-500 mr-3 shrink-0" size={18} />
                    }
                    <span className={highlight ? "text-white font-medium" : ""}>{t(key)}</span>
                  </li>
                ))}
              </ul>
              <Link
                to={isYearly ? "/dashboard?upgrade=true&plan=premium&interval=yearly" : "/dashboard?upgrade=true&plan=premium"}
                className="block text-center py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl transition-all"
              >
                {t('plans.premium.cta')}
              </Link>
            </div>

            {/* 3. ELITE PLAN (AI POWERHOUSE) */}
            <div className="bg-gradient-to-b from-indigo-900/50 to-gray-800 rounded-3xl p-8 border border-indigo-500/50 flex flex-col relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <BrainCircuit size={100} className="text-indigo-400" />
              </div>

              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                Elite <span className="bg-indigo-500 text-white text-[10px] px-2 py-0.5 rounded uppercase">{t('plans.elite.badge')}</span>
              </h3>
              <p className="text-indigo-300 text-xs mb-6">{t('plans.elite.tagline')}</p>

              <div className="mb-6">
                <span className="text-4xl font-bold text-white">{plans.elite.price}</span>
                <span className="text-gray-400 ml-2">{plans.elite.period}</span>
              </div>

              <ul className="space-y-4 mb-8 flex-grow relative z-10">
                {eliteFeatures.map(({ key, highlight }) => (
                  <li key={key} className="flex items-center text-gray-200 text-sm">
                    {highlight
                        ? <BrainCircuit className="text-indigo-400 mr-3 shrink-0" size={18} />
                        : <CheckCircle className="text-indigo-500 mr-3 shrink-0" size={18} />
                    }
                    <span className={highlight ? "text-white font-bold" : ""}>{t(key)}</span>
                  </li>
                ))}
              </ul>
              <Link
                to={isYearly ? "/dashboard?upgrade=true&plan=elite&interval=yearly" : "/dashboard?upgrade=true&plan=elite"}
                className="block text-center py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/25 relative z-10"
              >
                {t('plans.elite.cta')}
              </Link>
            </div>

          </div>

          {/* --- JÄMFÖRELSETABELL --- */}
          <div className="max-w-4xl mx-auto mt-20">
            <h3 className="text-2xl font-bold text-white text-center mb-8">{t('compare.title')}</h3>
            <div className="overflow-x-auto rounded-2xl border border-gray-700">
              <table className="w-full text-sm bg-gray-900/60">
                <thead>
                  <tr className="border-b border-gray-700 text-left">
                    <th className="py-4 px-4 text-gray-400 font-medium">{t('compare.feature')}</th>
                    <th className="py-4 px-4 text-white font-bold text-center">{t('plans.free.name')}</th>
                    <th className="py-4 px-4 text-yellow-400 font-bold text-center">Premium</th>
                    <th className="py-4 px-4 text-indigo-400 font-bold text-center">Elite</th>
                  </tr>
                </thead>
                <tbody>
                  {([
                    { label: t('compare.players'), free: '3', premium: t('compare.unlimited'), elite: t('compare.unlimited') },
                    { label: t('compare.aiCredits'), free: '3', premium: '50', elite: '500' },
                    { label: t('compare.scoring'), free: true, premium: true, elite: true },
                    { label: t('compare.history'), free: true, premium: true, elite: true },
                    { label: t('compare.moneyMode'), free: true, premium: true, elite: true },
                    { label: t('compare.cloud'), free: false, premium: true, elite: true },
                    { label: t('compare.charts'), free: false, premium: true, elite: true },
                    { label: t('compare.followUp'), free: false, premium: false, elite: true },
                    { label: t('compare.support'), free: false, premium: false, elite: true },
                    { label: t('compare.price'), free: t('compare.freePrice'), premium: `${plans.premium.price} ${plans.premium.period}`, elite: `${plans.elite.price} ${plans.elite.period}` },
                  ] as { label: string; free: string | boolean; premium: string | boolean; elite: string | boolean }[]).map((row) => (
                    <tr key={row.label} className="border-b border-gray-800 last:border-0">
                      <td className="py-3.5 px-4 text-gray-300">{row.label}</td>
                      {[row.free, row.premium, row.elite].map((value, i) => (
                        <td key={i} className="py-3.5 px-4 text-center">
                          {typeof value === 'boolean'
                            ? (value
                                ? <CheckCircle size={16} className="text-green-400 inline" />
                                : <span className="text-gray-600">—</span>)
                            : <span className="text-white font-medium">{value}</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
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
                {user ? t('cta.titleUser') : t('cta.title')}
              </h2>
              <p className="text-gray-300 mb-8 text-lg max-w-lg mx-auto">
                {user ? t('cta.descUser') : t('cta.desc')}
              </p>
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-900 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
              >
                {user ? t('common.openDashboard') : t('common.startFreeTrial')}
                <ArrowRight className="ml-2" size={20} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
