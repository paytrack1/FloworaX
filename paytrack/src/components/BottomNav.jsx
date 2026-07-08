import React from "react";
import { Home, BarChart2, FileText, Settings, TrendingDown, Calendar, Receipt, Users } from "lucide-react";
import { useStore } from "../store/useStore";

const tabs = [
  { id: "home",      label: "Home",      icon: Home },
  { id: "sales",     label: "Sales",     icon: BarChart2 },
  { id: "expenses",  label: "Expenses",  icon: TrendingDown },
  { id: "bookings",  label: "Bookings",  icon: Calendar },
  { id: "invoices",  label: "Invoices",  icon: Receipt },
  { id: "customers", label: "Customers", icon: Users },
  { id: "settings",  label: "Settings",  icon: Settings },
];

const BottomNav = () => {
  const { activeTab, setActiveTab, user } = useStore();
  const hasBookings = ["health_wellness", "complete_business_os"].includes(user?.businessType);
  const visibleTabs = tabs.filter(({ id }) => id !== "bookings" || hasBookings);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] z-40">
      <div className="flex justify-around items-center px-2 py-2 pb-6">
        {visibleTabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button key={id} onClick={() => setActiveTab(id)} className="flex flex-col items-center gap-1 px-2 py-1">
              <div className={`p-1.5 rounded-xl transition-all ${isActive ? "bg-[#EEF4FF]" : "bg-transparent"}`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} className={isActive ? "text-[#2F5FB3]" : "text-slate-400"} />
              </div>
              <span className={`text-[10px] font-bold ${isActive ? "text-[#2F5FB3]" : "text-slate-400"}`}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
