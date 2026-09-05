import React, { useEffect, useState } from 'react';
import { LogOut, Building2 } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

// Staff never get a `User` account or go through useStore's owner-centric
// auth — they carry their own JWT (issued by POST /api/staff/login) with
// { staffId, ownerId, role, permissions, branchId, isStaff: true } baked
// in. We decode that payload client-side rather than adding a "whoami"
// endpoint — the token itself is the source of truth here, same as how
// most of this app already treats JWTs.
function decodeJwtPayload(token) {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const TAB_LABELS = {
  sales: 'Sales', bookings: 'Bookings', customers: 'Customers',
  events: 'Events', invoices: 'Invoices', expenses: 'Expenses', reports: 'Reports',
};

const StaffDashboard = () => {
  const [claims, setClaims] = useState(null);
  const [activeTab, setActiveTab] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('staffToken');
    if (!token) { window.location.href = '/staff-login'; return; }
    const decoded = decodeJwtPayload(token);
    if (!decoded || decoded.isStaff !== true) {
      localStorage.removeItem('staffToken');
      window.location.href = '/staff-login';
      return;
    }
    // Basic expiry check so a stale token doesn't sit around looking valid.
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem('staffToken');
      window.location.href = '/staff-login';
      return;
    }
    setClaims(decoded);
    const availableTabs = decoded.role === 'manager' ? Object.keys(TAB_LABELS) : (decoded.permissions || []);
    setActiveTab(availableTabs[0] || null);
  }, []);

  const logout = () => {
    localStorage.removeItem('staffToken');
    localStorage.removeItem('staffOwnerId');
    window.location.href = '/staff-login';
  };

  if (!claims) return null;

  const availableTabs = claims.role === 'manager' ? Object.keys(TAB_LABELS) : (claims.permissions || []);

  return (
    <div className="min-h-screen bg-[#F0F4FF] font-sans">
      <header className="bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            {claims.role === 'manager' ? 'Branch Manager' : 'Staff'}
          </p>
          {claims.branchId ? (
            <p className="flex items-center gap-1.5 text-sm font-bold text-[#0F172A] mt-0.5">
              <Building2 size={14} className="text-[#185FA5]" /> Branch assigned
            </p>
          ) : (
            <p className="text-sm font-bold text-[#0F172A] mt-0.5">No branch assigned</p>
          )}
        </div>
        <button onClick={logout} className="flex items-center gap-1.5 text-sm font-bold text-slate-500">
          <LogOut size={16} /> Sign out
        </button>
      </header>

      {availableTabs.length === 0 ? (
        <div className="max-w-md mx-auto text-center py-20 px-6">
          <p className="font-black text-[#0F172A]">No permissions assigned yet</p>
          <p className="text-sm text-slate-500 mt-2">Ask the business owner to assign you access from Team Management.</p>
        </div>
      ) : (
        <>
          <div className="flex gap-1 px-5 py-3 overflow-x-auto bg-white border-b border-slate-50">
            {availableTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${
                  activeTab === tab ? 'bg-[#185FA5] text-white' : 'text-slate-500 bg-slate-50'
                }`}
              >
                {TAB_LABELS[tab] || tab}
              </button>
            ))}
          </div>
          <div className="max-w-3xl mx-auto px-5 py-8">
            <p className="text-sm text-slate-500">
              {TAB_LABELS[activeTab] || activeTab} view goes here — wire this tab to the existing {TAB_LABELS[activeTab] || activeTab} page/API,
              scoped to this staff member's branch automatically on the backend.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default StaffDashboard;
