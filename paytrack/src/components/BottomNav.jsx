import React from "react";
import { Home, BarChart2, Settings, TrendingDown, Calendar, CalendarDays, Receipt, Users } from "lucide-react";
import { useStore } from "../store/useStore";


const allTabs = [
  { id: "home",      label: "Home",     icon: Home,         alwaysShow: true },
  { id: "sales",     label: "Sales",    icon: BarChart2,    module: "sales" },
  { id: "expenses",  label: "Expenses", icon: TrendingDown, alwaysShow: true },
  { id: "bookings",  label: "Bookings", icon: Calendar,     module: "bookings" },
  { id: "invoices",  label: "Invoices", icon: Receipt,      module: "invoices" },
  { id: "customers", label: "Clients",  icon: Users,        alwaysShow: true },
  { id: "settings",  label: "Settings", icon: Settings,     alwaysShow: true },
];

const BottomNav = () => {
  const { activeTab, setActiveTab, user } = useStore();
  const modules = user?.modules || ["sales"];

  const visibleTabs = allTabs.filter(({ alwaysShow, module }) => {
    if (alwaysShow) return true;
    if (module) return modules.includes(module);
    return false;
  });

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] z-40">
      <div className="flex justify-around items-center px-1 py-2 pb-6">
        {visibleTabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex flex-col items-center gap-1 px-2 py-1"
            >
              <div className={`p-1.5 rounded-xl transition-all ${isActive ? "bg-[#EEF4FF]" : "bg-transparent"}`}>
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  className={isActive ? "text-[#185FA5]" : "text-slate-400"}
                />
              </div>
              <span className={`text-[10px] font-bold ${isActive ? "text-[#185FA5]" : "text-slate-400"}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;