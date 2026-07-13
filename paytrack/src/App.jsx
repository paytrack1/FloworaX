import React from 'react';
import { useStore } from './store/useStore';
import Login from './pages/Login';
import Welcome from './pages/Welcome';
import Home from './pages/Home';
import NewSale from './pages/NewSale';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import SalesHistory from './pages/SalesHistory';
import Expenses from './pages/Expenses';
import Bookings from './pages/Bookings';
import Invoices from './pages/Invoices';
import Customers from './pages/Customers';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import PublicBooking from './pages/PublicBooking';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Cookies from './pages/Cookies';
import Contact from './pages/Contact';
import Waitlist from './pages/Waitlist';
import NotFound from './pages/NotFound';
import BusinessTypeOnboarding from './pages/BusinessTypeOnboarding';
import VerifyEmail from './pages/VerifyEmail';
import ResetPassword from './pages/ResetPassword';
import { useEffect } from 'react';

const App = () => {
  const [screen, setScreen] = React.useState('welcome');
  const {
    isAuthenticated,
    activeTab,
    setActiveTab,
    isSaleModalOpen,
    setSaleModal,
    init,
    user,
  } = useStore();

  useEffect(() => {
    if (isAuthenticated) init();
  }, [isAuthenticated, init]);

  // ── Public routes ──
  const path = window.location.pathname;

  if (path.startsWith('/book/') || path.startsWith('/booking/')) {
    return <PublicBooking />;
  }

  if (path === '/terms') return <Terms />;
  if (path === '/privacy') return <Privacy />;
  if (path === '/cookies') return <Cookies />;
  if (path === '/contact') return <Contact />;
  if (path === '/waitlist') return <Waitlist />;

  if (path === '/reset-password') {
    const token = new URLSearchParams(window.location.search).get('token');
    if (token) return <ResetPassword token={token} />;
  }

  // ── Not logged in ──
  if (!isAuthenticated) {
    if (screen === 'welcome') {
      return (
        <Welcome
          onGetStarted={() => setScreen('register')}
          onSignIn={() => setScreen('login')}
        />
      );
    }
    return <Login mode={screen} />;
  }

  // ── Email not verified ──
  if (user && !user.emailVerified) {
    return <VerifyEmail />;
  }

  // ── Business type not set (ONLY this check — not phone/address etc) ──
  if (user && !user.businessType) {
    return <BusinessTypeOnboarding />;
  }

  // ── Page renderer ──
  const renderContent = () => {
    if (isSaleModalOpen) return <NewSale onBack={() => setSaleModal(false)} />;
    switch (activeTab) {
      case 'home':      return <Home />;
      case 'sales':     return <SalesHistory />;
      case 'reports':   return <Reports />;
      case 'expenses':  return <Expenses />;
      case 'bookings':  return <Bookings />;
      case 'invoices': return <Invoices />;
      case 'customers': return <Customers />;
      case 'customers': return <Customers />;
      case 'settings':  return <Settings />;
      default:          return <Home />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F0F4FF] font-sans">
      <Sidebar />
      <main className="flex-1 lg:ml-64 min-h-screen relative">

        {/* Desktop header */}
        <div className="hidden lg:flex max-w-5xl mx-auto px-8 pt-12 pb-8 justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                Live System
              </p>
            </div>
            <p className="text-2xl font-black text-[#0F172A] tracking-tighter">
              {user?.businessName || 'Dashboard'}
            </p>
          </div>
        </div>

        {/* Mobile header */}
        <div className="lg:hidden px-5 pt-10 pb-4 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Live</p>
            </div>
            <p className="text-xl font-black text-[#0F172A] tracking-tighter">
              {user?.businessName || 'Dashboard'}
            </p>
          </div>
          <div
            onClick={() => setActiveTab('settings')}
            className="w-9 h-9 rounded-xl bg-[#185FA5] flex items-center justify-center overflow-hidden cursor-pointer active:scale-95 transition-transform"
          >
            {user?.profileImage ? (
              <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-black text-sm">
                {user?.businessName?.charAt(0).toUpperCase() || 'M'}
              </span>
            )}
          </div>
        </div>

        {/* Page content */}
        <div className="px-5 lg:px-8 pb-32 lg:pb-20">
          <div className="max-w-5xl mx-auto">{renderContent()}</div>
        </div>

        {/* Mobile FAB */}
        {!isSaleModalOpen && (
          <button
            onClick={() => setSaleModal(true)}
            className="lg:hidden fixed bottom-24 right-5 w-14 h-14 bg-[#185FA5] text-white rounded-2xl shadow-2xl shadow-blue-300/50 flex items-center justify-center z-50 active:scale-90 transition-transform"
          >
            <span className="text-3xl font-light leading-none">+</span>
          </button>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default App;