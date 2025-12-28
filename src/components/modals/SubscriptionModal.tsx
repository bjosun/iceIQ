import React, { useState } from 'react';
import { Check, Crown, Sparkles, Shield, Cloud, Users, BarChart3 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  const { t, language } = useLanguage();
  const { subscription, upgradeToPremium } = useSubscription();
  const { user } = useAuth();
  const [selectedInterval, setSelectedInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [processing, setProcessing] = useState(false);

  const handleUpgrade = async () => {
    if (!user) {
      alert('Please log in to upgrade');
      return;
    }

    setProcessing(true);
    try {
      await upgradeToPremium(selectedInterval);
    } catch (error) {
      console.error('Upgrade failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  const plans = {
    free: {
      name: t('free'),
      price: '0',
      period: t('perMonth'),
      features: [
        { icon: Check, text: t('freeFeature1'), included: true },
        { icon: Check, text: t('freeFeature2Player'), included: true },
        { icon: Check, text: t('freeFeature3'), included: true },
        { icon: Shield, text: t('premiumFeature1'), included: false },
        { icon: BarChart3, text: t('premiumFeature2'), included: false },
      ]
    },
    premium: {
      name: 'Premium',
      price: language === 'en' ? '2.90' : '29',
      period: t('perMonth'),
      yearlyPrice: language === 'en' ? '29' : '299',
      yearlyPeriod: language === 'en' ? '/year' : '/år',
      features: [
        { icon: Check, text: t('premiumFeaturePlus'), included: true },
        { icon: Users, text: t('premiumFeature3'), included: true },
        { icon: Cloud, text: t('premiumFeature1'), included: true },
        { icon: BarChart3, text: t('premiumFeature2'), included: true },
        { icon: Shield, text: t('premiumFeature4'), included: true },
      ]
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('selectYourPlan')}
      size="lg"
    >
      <div className="p-6">
        {/* Current Plan Status */}
        {user && (
          <Card className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  {t('currentPlan')}
                </h3>
                <p className="text-gray-400">
                  {subscription.plan === 'premium' ? 'Premium Plan' : 'Free Plan'}
                </p>
              </div>
              {subscription.plan === 'premium' && (
                <div className="premium-badge">
                  ACTIVE
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Plans Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free Plan */}
          <Card>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-2">
                {plans.free.name}
              </h3>
              <div className="flex items-baseline mb-1">
                <span className="text-3xl font-bold text-white">
                  {plans.free.price}
                </span>
                <span className="text-gray-400 ml-2">{plans.free.period}</span>
              </div>
              <p className="text-gray-400 text-sm">
                Perfect for getting started
              </p>
            </div>

            <ul className="space-y-3 mb-6">
              {plans.free.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <feature.icon 
                    size={18} 
                    className={`mr-3 ${feature.included ? 'text-green-400' : 'text-gray-600'}`}
                  />
                  <span className={feature.included ? 'text-gray-300' : 'text-gray-600'}>
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>

            <Button
              variant={subscription.plan === 'free' ? 'primary' : 'secondary'}
              disabled={subscription.plan === 'free'}
              fullWidth
            >
              {subscription.plan === 'free' ? 'Current Plan' : 'Downgrade'}
            </Button>
          </Card>

          {/* Premium Plan */}
          <Card className="relative border-2 border-yellow-500">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-yellow-500 text-black px-4 py-1 rounded-full text-sm font-bold flex items-center">
                <Crown size={14} className="mr-1" />
                {t('recommended')}
              </span>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-2">
                {plans.premium.name}
              </h3>
              <div className="flex items-baseline mb-1">
                <span className="text-3xl font-bold text-yellow-400">
                  {selectedInterval === 'monthly' ? plans.premium.price : plans.premium.yearlyPrice}
                </span>
                <span className="text-gray-400 ml-2">
                  {selectedInterval === 'monthly' ? plans.premium.period : plans.premium.yearlyPeriod}
                </span>
              </div>
              <p className="text-cyan-400 text-sm">
                {selectedInterval === 'yearly' ? t('chooseYearlySimple') : t('chooseMonthlySimple')}
              </p>
            </div>

            {/* Interval Selector */}
            <div className="flex mb-6 bg-gray-800 rounded-xl p-1">
              <button
                onClick={() => setSelectedInterval('monthly')}
                className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                  selectedInterval === 'monthly'
                    ? 'bg-cyan-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setSelectedInterval('yearly')}
                className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                  selectedInterval === 'yearly'
                    ? 'bg-cyan-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Yearly (Save 20%)
              </button>
            </div>

            <ul className="space-y-3 mb-6">
              {plans.premium.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <feature.icon size={18} className="text-green-400 mr-3" />
                  <span className="text-white">{feature.text}</span>
                </li>
              ))}
            </ul>

            <Button
              variant="premium"
              loading={processing}
              onClick={handleUpgrade}
              icon={Sparkles}
              fullWidth
            >
              {subscription.plan === 'premium' ? 'Manage Subscription' : 'Upgrade to Premium'}
            </Button>
          </Card>
        </div>

        {/* Guarantee */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center text-gray-400 text-sm">
            <Shield size={16} className="mr-2" />
            30-day money-back guarantee • Cancel anytime
          </div>
        </div>
      </div>
    </Modal>
  );
}