import React, { useState } from 'react';
import { Check, Crown, Sparkles, Shield, Cloud, Users, BarChart3, BrainCircuit } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { currencyForLanguage, formatPrice, priceFor } from '../../utils/pricing';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  const { t, language } = useLanguage();
  
  // Hämta de nya funktionerna från context
  const { subscription, upgradeSubscription, manageSubscription } = useSubscription();
  
  const { user } = useAuth();
  
  // State för val
  const [selectedPlan, setSelectedPlan] = useState<'premium' | 'elite'>('premium');
  const [selectedInterval, setSelectedInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [processing, setProcessing] = useState(false);

  const handleAction = async () => {
    if (!user) {
      alert('Please log in first');
      return;
    }

    setProcessing(true);
    try {
      // Om man redan har den valda planen -> Hantera (öppna portal)
      if (subscription.plan === selectedPlan) {
        if (manageSubscription) {
            await manageSubscription();
        }
      } else {
        // Annars -> Köp (Uppgradera/Nedgradera)
        // Här skickar vi med både plan och interval
        await upgradeSubscription(selectedPlan, selectedInterval);
      }
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  // Priserna kommer från src/utils/pricing.ts. Tidigare stod de hårdkodade
  // här också, och hade hunnit glida isär från startsidan: Elite år låg som
  // 899 här och 890 där (och 890 i Stripe).
  const currency = currencyForLanguage(language);
  const shownPrice = (plan: 'premium' | 'elite', interval: 'monthly' | 'yearly') =>
    formatPrice(priceFor(plan, interval, currency), currency, language);

  // Data för planerna
  const plansData = {
    premium: {
      name: 'Premium',
      priceMonthly: shownPrice('premium', 'monthly'),
      priceYearly: shownPrice('premium', 'yearly'),
      features: [
        { icon: Check, text: t('premiumFeaturePlus') || "Everything in Free", included: true },
        { icon: Users, text: t('premiumFeature3') || "Unlimited players", included: true },
        { icon: Cloud, text: t('premiumFeature1') || "Cloud sync", included: true },
        { icon: BarChart3, text: t('premiumFeature2') || "Advanced stats", included: true },
        { icon: Sparkles, text: language === 'sv' ? "50 AI Coach Krediter / mån" : "50 AI Coach Credits / month", included: true },
      ]
    },
    elite: {
      name: 'Elite',
      priceMonthly: shownPrice('elite', 'monthly'),
      priceYearly: shownPrice('elite', 'yearly'),
      features: [
        { icon: Check, text: language === 'sv' ? "Allt i Premium" : "Everything in Premium", included: true },
        { icon: BrainCircuit, text: t('plans.elite.f3'), included: true },
        { icon: Sparkles, text: language === 'sv' ? "500 AI Coach Krediter / mån" : "500 AI Coach Credits / month", included: true },
        { icon: Shield, text: language === 'sv' ? "Prioriterad Support" : "Priority Support", included: true },
      ]
    }
  };

  const currentPlanData = plansData[selectedPlan];
  const price = selectedInterval === 'monthly' ? currentPlanData.priceMonthly : currentPlanData.priceYearly;
  const period = selectedInterval === 'monthly' ? (language === 'en' ? '/mo' : '/mån') : (language === 'en' ? '/yr' : '/år');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('selectYourPlan') || "Select Your Plan"}
      size="lg"
    >
      <div className="p-6">
        {/* Header / Current Plan Status */}
        {user && (
          <div className="flex items-center justify-between bg-gray-800 p-4 rounded-xl mb-6 border border-gray-700">
            <div>
              <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">
                {language === 'sv' ? 'Din nuvarande plan' : 'Current Plan'}
              </p>
              <h3 className="text-white font-bold capitalize">
                {subscription.plan} Plan
              </h3>
            </div>
            {subscription.plan !== 'free' && (
              <div className="bg-green-500/20 text-green-400 text-xs font-bold px-3 py-1 rounded-full border border-green-500/30">
                ACTIVE
              </div>
            )}
          </div>
        )}

        {/* PLAN SELECTOR (Tabs) */}
        <div className="flex bg-gray-900 rounded-xl p-1 mb-6 border border-gray-700">
          <button
            onClick={() => setSelectedPlan('premium')}
            className={`flex-1 py-3 rounded-lg font-bold transition-all text-sm flex items-center justify-center gap-2 ${
              selectedPlan === 'premium'
                ? 'bg-gray-700 text-white shadow-md border border-gray-600'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Crown size={16} className={selectedPlan === 'premium' ? "text-yellow-400" : ""} />
            Premium
          </button>
          <button
            onClick={() => setSelectedPlan('elite')}
            className={`flex-1 py-3 rounded-lg font-bold transition-all text-sm flex items-center justify-center gap-2 ${
              selectedPlan === 'elite'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md border border-indigo-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles size={16} className={selectedPlan === 'elite' ? "text-cyan-200" : ""} />
            Elite (AI)
          </button>
        </div>

        {/* MAIN CARD */}
        <Card className={`relative border-2 transition-colors ${selectedPlan === 'elite' ? 'border-indigo-500 bg-indigo-900/10' : 'border-yellow-500'}`}>
          
          {/* Recommended Badge (Endast för Premium) */}
          {selectedPlan === 'premium' && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="px-4 py-1 rounded-full text-xs font-bold flex items-center shadow-lg uppercase tracking-wider bg-yellow-500 text-black">
                <Crown size={12} className="mr-1"/>
                {t('recommended') || "Recommended"}
              </span>
            </div>
          )}

          <div className="mb-8 mt-2 text-center">
            <h3 className="text-2xl font-bold text-white mb-2">
              {currentPlanData.name}
            </h3>
            <div className="flex items-baseline justify-center mb-2">
              <span className={`text-4xl font-black ${selectedPlan === 'elite' ? 'text-indigo-400' : 'text-yellow-400'}`}>
                {price}
              </span>
              <span className="text-gray-400 ml-1 font-medium">{period}</span>
            </div>
            
            {/* Interval Toggle inside card */}
            <div className="flex justify-center gap-4 text-sm mt-4">
               <button 
                 onClick={() => setSelectedInterval('monthly')}
                 className={`px-3 py-1 rounded-full border transition-colors ${selectedInterval === 'monthly' ? 'bg-white/10 border-white/30 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
               >
                 {language === 'sv' ? 'Månadsvis' : 'Monthly'}
               </button>
               <button 
                 onClick={() => setSelectedInterval('yearly')}
                 className={`px-3 py-1 rounded-full border transition-colors flex items-center gap-1 ${selectedInterval === 'yearly' ? 'bg-white/10 border-white/30 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
               >
                 {language === 'sv' ? 'Årsvis' : 'Yearly'} <span className="text-[10px] bg-green-500 text-black px-1 rounded font-bold">-15%</span>
               </button>
            </div>
          </div>

          <ul className="space-y-4 mb-8 max-w-sm mx-auto">
            {currentPlanData.features.map((feature, index) => (
              <li key={index} className="flex items-center">
                <div className={`p-1 rounded-full mr-3 ${feature.included ? (selectedPlan === 'elite' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-yellow-500/20 text-yellow-400') : 'bg-gray-700 text-gray-500'}`}>
                  <feature.icon size={14} />
                </div>
                <span className={feature.included ? 'text-gray-200' : 'text-gray-500'}>
                  {feature.text}
                </span>
              </li>
            ))}
          </ul>

          <Button
            variant="primary" // Standard-variant så vi inte får fel
            className={
              selectedPlan === 'elite' 
                ? 'bg-indigo-600 hover:bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                : 'bg-yellow-500 hover:bg-yellow-400 border-yellow-500 text-black shadow-lg shadow-yellow-500/20'
            }
            loading={processing}
            onClick={handleAction}
            icon={selectedPlan === 'elite' ? Sparkles : Crown}
            fullWidth
            size="lg"
          >
            {subscription.plan === selectedPlan 
              ? (language === 'sv' ? 'Hantera Prenumeration' : 'Manage Subscription') 
              : (language === 'sv' ? `Uppgradera till ${currentPlanData.name}` : `Upgrade to ${currentPlanData.name}`)
            }
          </Button>
        </Card>

        {/* Guarantee */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center text-gray-500 text-xs">
            <Shield size={12} className="mr-1.5" />
            {language === 'sv' ? 'Säker betalning via Stripe • Avbryt när du vill' : 'Secure payment via Stripe • Cancel anytime'}
          </div>
        </div>
      </div>
    </Modal>
  );
}