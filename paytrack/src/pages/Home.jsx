import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import Dashboard from '../components/Dashboard';
import SimpleModeHome from '../components/SimpleModeHome';
import BulkOffering from './BulkOffering';
import { readSimpleMode } from '../store/simpleMode';

const Home = () => {
  const [showBulk, setShowBulk] = useState(false);
  const { user, setActiveTab, setSaleModal } = useStore();

  // Market Mode: the icon-and-number home for low-literacy users replaces
  // the standard dashboard entirely while it's on.
  if (readSimpleMode()) {
    return <SimpleModeHome />;
  }

  if (showBulk) return <BulkOffering onBack={() => setShowBulk(false)} />;

  return (
    <>
      {user?.businessType?.toLowerCase() === 'church' && (
        <div className="mb-6 flex justify-center lg:justify-start">
          <button
            onClick={() => setShowBulk(true)}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-field bg-brand-50 text-brand-600 text-body font-semibold hover:bg-brand-100 active:scale-[0.98] transition-all"
          >
            <span aria-hidden>🙏</span> Bulk Offering Entry
          </button>
        </div>
      )}

      <Dashboard
        onNewSale={() => setSaleModal(true)}
        onNewExpense={() => setActiveTab('expenses')}
        onOpenReports={() => setActiveTab('reports')}
      />
    </>
  );
};

export default Home;
