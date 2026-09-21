import React, { useState, lazy, Suspense } from 'react';
import Header from './Header';
import MobileBottomNav from './MobileBottomNav';
import Footer from './Footer';
import PaymentAlertBanner from './PaymentAlertBanner';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useAuth } from '../../contexts/AuthContext';

// Lazy: Layout wrap:ar hela appen (även den utloggade startsidan), och
// ProfileModal drar in hela Firestore-SDK:t via services/firestore. De
// renderas ändå bara när user finns, så statisk import här skulle tvinga in
// det i huvudbundlen igen (se services/firestore.ts).
const ProfileModal = lazy(() => import('../modals/ProfileModal'));
const SubscriptionModal = lazy(() => import('../modals/SubscriptionModal'));

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
        <Suspense fallback={null}>
          <ProfileModal
            isOpen={showProfile}
            onClose={() => setShowProfile(false)}
            isPremium={isPremium}
          />

          <SubscriptionModal
            isOpen={showSub}
            onClose={() => setShowSub(false)}
          />
        </Suspense>
      )}
    </div>
  );
}