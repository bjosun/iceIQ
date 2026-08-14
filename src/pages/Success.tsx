import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function Success() {
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();

  const isSuccess = searchParams.get('success') === 'true';
  const isCancelled = searchParams.get('cancelled') === 'true';
  // Kreditköp och prenumeration landar på samma sida — utan detta skulle
  // den som köpt krediter få veta att hens "prenumeration är aktiv".
  const boughtCredits = searchParams.get('type') === 'credits';

  // Checkout körs som en helsidesomdirigering, så window.opener är normalt
  // null. Knappen som stänger fönstret visas bara när den faktiskt gör något.
  const openedInPopup = typeof window !== 'undefined' && !!window.opener;

  useEffect(() => {
    if (isSuccess || isCancelled) {
      window.history.replaceState({}, '', window.location.pathname);
    }

    if (window.opener) {
      window.opener.postMessage({ type: 'payment-completed' }, '*');
      setTimeout(() => window.close(), 2000);
    }
  }, [isSuccess, isCancelled]);

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-400" size={48} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">
            {t('success.title')}
          </h1>
          <p className="text-gray-300 mb-2">
            {boughtCredits ? t('success.creditsBody') : t('success.subscriptionBody')}
          </p>
          <p className="text-gray-400 text-sm mb-8">
            {t('success.emailNote')}
          </p>
          <div className="space-y-4">
            <Link
              to="/dashboard"
              className="block py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-semibold transition-colors text-center"
            >
              {t('success.toDashboard')}
            </Link>
            {openedInPopup && (
              <button
                onClick={() => window.close()}
                className="w-full py-3 text-cyan-400 hover:text-cyan-300 font-medium"
              >
                {t('success.backToApp')}
              </button>
            )}
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
            {t('success.cancelledTitle')}
          </h1>
          <p className="text-gray-300 mb-2">
            {t('success.cancelledBody')}
          </p>
          <p className="text-gray-400 text-sm mb-8">
            {t('success.cancelledNote')}
          </p>
          <div className="space-y-4">
            <Link
              to="/dashboard"
              className="block py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors text-center"
            >
              {t('success.toDashboard')}
            </Link>
            <Link
              to="/dashboard?upgrade=true"
              className="block py-3 text-cyan-400 hover:text-cyan-300 font-medium"
            >
              {t('success.tryAgain')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Direktbesök utan parametrar
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="text-cyan-400" size={48} />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">
          {t('success.genericTitle')}
        </h1>
        <p className="text-gray-300 mb-8">
          {t('success.genericBody')}
        </p>
        <Link
          to="/dashboard"
          className="block py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-semibold transition-colors"
        >
          {t('success.toDashboard')}
        </Link>
      </div>
    </div>
  );
}
