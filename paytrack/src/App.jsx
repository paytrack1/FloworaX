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
import Events from './pages/Events';
import Customers from './pages/Customers';
import Communications from './pages/Communications';
import MoreMenu from './pages/MoreMenu';
import TeamManagement from './pages/TeamManagement';
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
import JoinChurch from './pages/JoinChurch';
import BulkOffering from './pages/BulkOffering';
import VerifyEmail from './pages/VerifyEmail';
import ResetPassword from './pages/ResetPassword';
import EventRegistration from './pages/EventRegistration';
import AdminDashboard from './pages/AdminDashboard';
import NotificationBell from './components/NotificationBell';
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

  // â”€â”€ Public routes â”€â”€
  const path = window.location.pathname;

  if (path.startsWith('/book/') || path.startsWith('/booking/')) {
    return <PublicBooking />;
  }

  if (path.startsWith('/events/')) {
    return <EventRegistration />;
  }

  if (path.startsWith('/join/')) {
    return <JoinChurch />;
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

  // â”€â”€ Not logged in â”€â”€
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

  // â”€â”€ Email not verified â”€â”€
  if (user && !user.emailVerified) {
    return <VerifyEmail />;
  }

  // â”€â”€ Business type not set (ONLY this check â€” not phone/address etc) â”€â”€
  if (user && !user.businessType) {
    return <BusinessTypeOnboarding />;
  }

  if (user?.role === 'admin' && path === '/admin') {
    return <AdminDashboard />;
  }

  return (
    <AuthenticatedApp
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      isSaleModalOpen={isSaleModalOpen}
      setSaleModal={setSaleModal}
      user={user}
    />
  );
};

// URL <-> tab syncing lives in its own component so the early-return public
// routes above never mount this (and never register the popstate listener).
const VALID_TABS = new Set([
  'home', 'sales', 'reports', 'expenses', 'bookings', 'invoices', 'events',
  'customers', 'communications', 'more', 'team', 'settings',
]);

const AuthenticatedApp = ({ activeTab, setActiveTab, isSaleModalOpen, setSaleModal, user }) => {
  // On first mount, if the URL already points at a valid tab (e.g. the person
  // bookmarked /settings or hit back/forward before a reload), honor it.
  useEffect(() => {
    const initialPath = window.location.pathname.replace(/^\//, '');
    // Only honor an explicit deep link (e.g. /settings) - a bare "/" should
    // preserve whatever tab was last active, not force everyone to Home.
    if (initialPath && VALID_TABS.has(initialPath) && initialPath !== activeTab) {
      setActiveTab(initialPath, { skipHistory: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the tab in sync with browser back/forward navigation.
  useEffect(() => {
    const onPopState = () => {
      const tabFromPath = window.location.pathname.replace(/^\//, '') || 'home';
      if (VALID_TABS.has(tabFromPath)) setActiveTab(tabFromPath, { skipHistory: true });
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [setActiveTab]);

  // â”€â”€ Page renderer â”€â”€
  const renderContent = () => {
    if (isSaleModalOpen) return <NewSale onBack={() => setSaleModal(false)} />;
    switch (activeTab) {
      case 'home':      return <Home />;
      case 'sales':     return <SalesHistory />;
      case 'reports':   return <Reports />;
      case 'expenses':  return <Expenses />;
      case 'bookings':  return <Bookings />;
      case 'invoices': return <Invoices />;
      case 'events':    return <Events />;
      case 'customers': return <Customers />;
      case 'communications': return <Communications />;
      case 'more': return <MoreMenu />;
      case 'team': return <TeamManagement />;
      case 'settings':  return <Settings />;
      default:          return <Home />;
    }
  };

  return (
    <div className="flex min-h-screen min-w-0 overflow-x-hidden bg-[#F0F4FF] font-sans">
      <Sidebar />
      <main className="min-w-0 flex-1 lg:ml-64 min-h-screen relative">

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
          <NotificationBell />
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
          <div className="flex items-center gap-2">
            <NotificationBell />
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
        </div>

        {/* Page content */}
        <div className="px-5 lg:px-8 pb-32 lg:pb-20">
          <div className="max-w-5xl mx-auto">{renderContent()}</div>
        </div>

        {/* Mobile FAB */}
        
      </main>
      <BottomNav />
    </div>
  );
};

export default App;
