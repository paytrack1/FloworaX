import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getModulesForBusinessType } from '../store/modules';
import { getTerminology } from '../utils/terminology';
import { splitNavItems } from '../constants/navItems';

const MoreMenu = () => {
  const { user, setActiveTab } = useStore();
  const enabledModules = getModulesForBusinessType(user?.businessType);
  const terms = getTerminology(user?.businessType);
  const { more } = splitNavItems(enabledModules);

  return (
    <div className="pb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">More</h1>
        <p className="text-sm text-slate-500 mt-1">Everything else, in one place.</p>
      </div>

      <div className="space-y-2">
        {more.map((item) => {
          const Icon = item.icon;
          const label = item.labelKey ? terms[item.labelKey] : item.label;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="w-full flex items-center justify-between px-4 py-3.5 bg-white rounded-2xl border border-slate-100 active:scale-[0.98] transition-transform"
            >
              <span className="flex items-center gap-3">
                <span className="bg-[#EEF4FF] text-[#185FA5] p-2 rounded-xl">
                  <Icon size={18} strokeWidth={2} />
                </span>
                <span className="font-bold text-[#0F172A] text-sm">{label}</span>
              </span>
              <ChevronRight size={16} className="text-slate-300" />
            </button>
          );
        })}
        {more.length === 0 && (
          <p className="text-sm text-slate-400 px-1">Nothing else to show here.</p>
        )}
      </div>
    </div>
  );
};

export default MoreMenu;
