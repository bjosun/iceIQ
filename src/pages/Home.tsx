import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
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
  const { t } = useLanguage();

  const features = [
    {
      icon: <BarChart3 className="text-cyan-400" size={24} />,
      title: "Advanced Analytics",
      description: "Track player performance with detailed statistics and visualizations."
    },
    {
      icon: <Cloud className="text-cyan-400" size={24} />,
      title: "Cloud Sync",
      description: "Access your data anywhere, on any device. Always backed up."
    },
    {
      icon: <Users className="text-cyan-400" size={24} />,
      title: "Team Management",
      description: "Manage multiple players and teams with ease."
    },
    {
      icon: <Shield className="text-cyan-400" size={24} />,
      title: "Data Security",
      description: "Your data is encrypted and secure. We never share your information."
    }
  ];

  const pricingPlans = [
    {
      name: "Free",
      price: "0",
      period: "forever",
      features: [
        "Basic scoring system",
        "Save 1 player",
        "Simple match history",
        "Basic statistics"
      ],
      cta: "Get Started",
      color: "from-gray-600 to-gray-700"
    },
    {
      name: "Premium",
      price: "29",
      period: "month",
      features: [
        "Everything in Free",
        "Unlimited players",
        "Advanced analytics",
        "Customizable templates",
        "Cloud sync across devices",
        "Priority support"
      ],
      cta: "Upgrade Now",
      color: "from-yellow-500 to-yellow-600",
      popular: true
    }
  ];

  return (
    <div className="bg-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-block mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto">
                <span className="text-4xl">🏒</span>
              </div>
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6">
              Hockey Analytics
              <span className="block text-cyan-400">Made Simple</span>
            </h1>
            <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto">
              Professional scouting tools for coaches, players, and supportive parents.
              Track performance, visualize progress, and make data-driven decisions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center px-8 py-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-semibold text-lg transition-colors"
              >
                Get Started Free
                <ArrowRight className="ml-2" size={20} />
              </Link>
              <a
                href="#pricing"
                className="inline-flex items-center justify-center px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold text-lg transition-colors"
              >
                View Plans
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              Everything You Need for Player Development
            </h2>
            <p className="text-gray-400 text-lg">
              From grassroots to professional level, we've got you covered.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-gray-800 rounded-2xl p-6 hover:bg-gray-750 transition-colors"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-gray-400 text-lg">
              Choose the plan that fits your needs. No hidden fees.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`bg-gray-800 rounded-2xl p-8 relative ${
                  plan.popular ? 'border-2 border-yellow-500' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-yellow-500 text-black px-4 py-1 rounded-full text-sm font-bold">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline mb-4">
                    <span className="text-4xl font-bold text-white">
                      {plan.price}
                    </span>
                    <span className="text-gray-400 ml-2">
                      SEK/{plan.period}
                    </span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <CheckCircle className="text-green-400 mr-3" size={20} />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={plan.name === 'Free' ? '/dashboard' : '/dashboard?upgrade=true'}
                  className={`block text-center py-3 rounded-xl font-semibold transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:opacity-90'
                      : 'bg-cyan-600 hover:bg-cyan-700 text-white'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-12 border border-gray-700">
            <Zap className="text-yellow-400 mx-auto mb-6" size={48} />
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Transform Your Coaching?
            </h2>
            <p className="text-gray-300 mb-8 text-lg">
              Join hundreds of coaches already using Ice IQ to improve their
              team's performance.
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity"
            >
              Start Your Free Trial
              <ArrowRight className="ml-2" size={20} />
            </Link>
            <p className="text-gray-500 text-sm mt-4">
              No credit card required. Cancel anytime.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}