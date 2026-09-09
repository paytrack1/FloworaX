import React from 'react';
import {
  FileText, TrendingDown, Ticket, Users, MessageSquare, Settings, ChevronRight,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { getModulesForBusinessType } from '../store/modules';
import { getTerminology } from '../utils/terminology';

const BUSINESS_ITEMS = [
  { id: 'customers', labelKey: 'customerPlural', icon: Users },
  { id: 'expenses', label: 'Expenses', icon: TrendingDown },
  { id: 'events', label: 'Events', icon: Ticket },
];

const MANAGEMENT_ITEMS = [
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'communications', label: 'Communications', icon: MessageSquare },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const MenuRow = ({ item, terms, onSelect }) => {
  const Icon = item.icon;
  const label = item.labelKey ? terms[item.labelKey] : item.label;
  return (
    <button
      onClick={() => onSelect(item.id)}
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
};

const MoreMenu = () => {
  const { user, setActiveTab } = useStore();
  const enabledModules = getModulesForBusinessType(user?.businessType);
  const terms = getTerminology(user?.businessType);

  const businessItems = BUSINESS_ITEMS.filter(({ id }) => enabledModules.includes(id));
  const managementItems = MANAGEMENT_ITEMS.filter(({ id }) => id === 'reports' || enabledModules.includes(id));

  return (
    <div className="pb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">More</h1>
        <p className="text-sm text-slate-500 mt-1">Everything else, in one place.</p>
      </div>

      {businessItems.length > 0 && (
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold mb-3 px-1">Business</p>
          <div className="space-y-2">
            {businessItems.map((item) => (
              <MenuRow key={item.id} item={item} terms={terms} onSelect={setActiveTab} />
            ))}
          </div>
        </div>
      )}

      {managementItems.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold mb-3 px-1">Management</p>
          <div className="space-y-2">
            {managementItems.map((item) => (
              <MenuRow key={item.id} item={item} terms={terms} onSelect={setActiveTab} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MoreMenu;
