import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../configs/axios';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<number | null>(null);
  const sessionId = new URLSearchParams(window.location.search).get('session_id');

  useEffect(() => {
    const refreshCredits = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await axiosInstance.get('/api/user/credits');
        setCredits(data.credits ?? 0);
        window.dispatchEvent(new Event('credits-updated'));
      } catch (error) {
        console.error('Failed to refresh credits after payment:', error);
      } finally {
        setLoading(false);
      }
    };

    refreshCredits();
  }, [sessionId]);

  if (!sessionId) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center text-white">
          <h1 className="text-2xl font-semibold">No payment session found.</h1>
          <button
            onClick={() => navigate('/pricing')}
            className="mt-6 w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500 transition"
          >
            Go to Pricing
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 text-white text-lg">
        Processing your payment...
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center text-white shadow-xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-4xl text-emerald-400">
          ✓
        </div>

        <h1 className="text-3xl font-semibold">Payment Successful!</h1>
        <p className="mt-2 text-slate-300">Your credits have been added to your account.</p>

        <div className="mt-6 rounded-lg border border-slate-700 bg-slate-800/70 p-4">
          <p className="text-sm text-slate-400">Updated Credit Balance</p>
          <p className="mt-1 text-3xl font-bold text-indigo-300">{credits ?? 0}</p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => navigate('/')}
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500 transition"
          >
            Start Building
          </button>
          <button
            onClick={() => navigate('/projects')}
            className="w-full rounded-md border border-slate-600 px-4 py-2 text-sm font-medium hover:bg-slate-800 transition"
          >
            View My Projects
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
