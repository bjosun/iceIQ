import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function Success() {
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  
  const isSuccess = searchParams.get('success') === 'true';
  const isCancelled = searchParams.get('cancelled') === 'true';

  useEffect(() => {
    // Clean up URL
    if (isSuccess || isCancelled) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }

    // Refresh subscription status in parent window if this was opened in a popup
    if (window.opener) {
      window.opener.postMessage({ type: 'payment-completed' }, '*');
      setTimeout(() => window.close(), 2000);
    }
  }, [isSuccess, isCancelled]);

  const handleBackToApp = () => {
    if (window.opener) {
      window.close();
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-400" size={48} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">
            {t('paymentSuccess')}
          </h1>
          <p className="text-gray-300 mb-2">
            Your subscription is now active. Welcome to Premium!
          </p>
          <p className="text-gray-400 text-sm mb-8">
            You'll receive a confirmation email shortly.
          </p>
          <div className="space-y-4">
            <button
              onClick={handleBackToApp}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-semibold transition-colors"
            >
              Back to App
            </button>
            <Link
              to="/dashboard"
              className="block py-3 text-cyan-400 hover:text-cyan-300 font-medium"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isCancelled) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="text-red-400" size={48} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">
            {t('paymentCancelled')}
          </h1>
          <p className="text-gray-300 mb-2">
            Your payment was cancelled. No charges were made.
          </p>
          <p className="text-gray-400 text-sm mb-8">
            You can try again whenever you're ready.
          </p>
          <div className="space-y-4">
            <Link
              to="/dashboard"
              className="block py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors text-center"
            >
              Back to Dashboard
            </Link>
            <Link
              to="/dashboard?upgrade=true"
              className="block py-3 text-cyan-400 hover:text-cyan-300 font-medium"
            >
              Try Again
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Default view for direct access
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="text-cyan-400" size={48} />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">
          Thank You!
        </h1>
        <p className="text-gray-300 mb-8">
          Your payment has been processed successfully.
        </p>
        <Link
          to="/dashboard"
          className="block py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-semibold transition-colors"
        >
          Return to App
        </Link>
      </div>
    </div>
  );
}