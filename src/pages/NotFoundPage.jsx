import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto mb-6 shadow-md shadow-emerald-600/20">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Page Not Found</h1>
        <p className="text-slate-500 mb-8 text-sm">
          The page you are looking for does not exist or has been moved.
        </p>
        <Button variant="primary" onClick={() => navigate('/')} icon={ArrowLeft}>
          Back to Home
        </Button>
      </div>
    </div>
  );
};
