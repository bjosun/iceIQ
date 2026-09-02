import React, { useState } from 'react';
import Header from './Header';
import MobileBottomNav from './MobileBottomNav';
import Footer from './Footer';
import PaymentAlertBanner from './PaymentAlertBanner';
import ProfileModal from '../modals/ProfileModal';
import SubscriptionModal from '../modals/SubscriptionModal';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useAuth } from '../../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  
  // Centralt state för globala modaler
  const [showProfile, setShowProfile] = useState(false);
  const [showSub, setShowSub] = useState(false);

  // Beräkna premiumstatus en gång här
  const isPremium = subscription?.plan === 'premium';

  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
      {/* Headern får nu funktionerna för att styra 
         de globala modalerna som bor här i Layouten.
      */}
      <Header 
        onOpenProfile={() => setShowProfile(true)} 
        onOpenSubscription={() => setShowSub(true)} 
      />

      {/* Betalningsvarning ligger utanför <main> så den syns direkt under
         headern på varje inloggad sida, inte bara på dashboarden. */}
      {user && <PaymentAlertBanner />}

      <main className={`flex-grow ${user ? 'pb-20 md:pb-0' : ''}`}>
        {children}
      </main>

      <Footer />

      {/* Global mobilnavigering (bara inloggade) */}
      {user && <MobileBottomNav onPremiumClick={() => setShowSub(true)} />}

      {/* GLOBAL MODALS
         Dessa renderas bara om användaren är inloggad och 
         de triggas från Headern (Desktop/Mobil).
      */}
      {user && (
        <>
          <ProfileModal 
            isOpen={showProfile} 
            onClose={() => setShowProfile(false)} 
            isPremium={isPremium} 
          />
          
          <SubscriptionModal 
            isOpen={showSub} 
            onClose={() => setShowSub(false)} 
          />
        </>
      )}
    </div>
  );
}