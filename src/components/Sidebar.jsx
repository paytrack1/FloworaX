import React from 'react';
import { Home, BarChart2, FileText, Settings, LogOut, Plus, Zap, TrendingDown, Calendar } from 'lucide-react';
import { useStore } from '../store/useStore';

const tabs = [
  { id: 'home',     label: 'Home',     icon: Home },
  { id: 'sales',    label: 'Sales',    icon: BarChart2 },
  { id: 'reports',  label: 'Reports',  icon: FileText },
  { id: 'expenses', label: 'Expenses', icon: TrendingDown },
  { id: 'bookings', label: 'Bookings', icon: Calendar },
  { id: 'bookings', label: 'Bookings', icon: Calendar },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const Sidebar = () => {
  const { activeTab, setActiveTab, setSaleModal, logout, user } = useStore();

  return (
    <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-64 bg-[#0F172A] flex-col z-50">

      {/* LOGO */}
      <div className="px-6 py-8">
        <div className="flex items-center gap-3">
          <div className="bg-[#2F5FB3] p-2 rounded-xl">
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <p className="text-white font-black text-lg leading-none tracking-tight">
              Flowora
            </p>
            <p className="text-[#2F5FB3] font-black text-sm leading-none">
              Lite
            </p>
          </div>
        </div>
      </div>

      {/* NEW SALE BUTTON */}
      <div className="px-4 mb-6">
        <button
          onClick={() => setSaleModal(true)}
          className="w-full bg-[#2F5FB3] hover:bg-[#3668c7] text-white py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-900/30"
        >
          <Plus size={18} strokeWidth={3} />
          NEW SALE
        </button>
      </div>

      {/* DIVIDER */}
      <div className="px-4 mb-4">
        <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">
          Navigation
        </p>
      </div>

      {/* NAV LINKS */}
      <nav className="flex-1 px-3 space-y-1">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                isActive
                  ? 'bg-[#2F5FB3] text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon
                size={18}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span className="font-bold text-sm">{label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />
              )}
            </button>
          );
        })}
      </nav>

      {/* BOTTOM: USER INFO + LOGOUT */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-2 py-3">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-xl bg-[#2F5FB3] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-sm">
              {user?.businessName?.charAt(0).toUpperCase() || 'M'}
            </span>
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm truncate leading-none mb-0.5">
              {user?.businessName || 'My Store'}
            </p>
            <p className="text-slate-500 text-[10px] font-bold truncate">
              {user?.email || ''}
            </p>
          </div>
          {/* Logout */}
          <button
            onClick={logout}
            className="p-1.5 text-slate-500 hover:text-red-400 transition-colors flex-shrink-0"
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;