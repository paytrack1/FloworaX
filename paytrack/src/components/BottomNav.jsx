import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getEnabledModules } from '../store/modules';
import { getTerminology } from '../utils/terminology';
import { splitNavItems } from '../constants/navItems';

const BottomNav = () => {
  const { activeTab, setActiveTab, user } = useStore();
  const enabledModules = getEnabledModules(user);
  const terms = getTerminology(user?.businessType);
  const { core, more } = splitNavItems(enabledModules);

  const moreIds = new Set(more.map((item) => item.id));
  const isMoreActive = activeTab === 'more' || moreIds.has(activeTab);

  const renderTab = (id, label, Icon, isActive, onClick) => (
    <button
      key={id}
      onClick={onClick}
      className="flex flex-col items-center gap-1 px-2 py-1"
    >
      <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-[#EEF4FF]' : 'bg-transparent'}`}>
        <Icon
          size={20}
          strokeWidth={isActive ? 2.5 : 1.8}
          className={isActive ? 'text-[#185FA5]' : 'text-slate-400'}
        />
      </div>
      <span className={`text-[10px] font-bold ${isActive ? 'text-[#185FA5]' : 'text-slate-400'}`}>
        {label}
      </span>
    </button>
  );

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] z-40">
      <div className="flex justify-around items-center px-1 py-2 pb-6">
        {core.map(({ id, label, labelKey, icon: Icon }) =>
          renderTab(id, labelKey ? terms[labelKey] : label, Icon, activeTab === id, () => setActiveTab(id))
        )}
        {more.length > 0 &&
          renderTab('more', 'More', MoreHorizontal, isMoreActive, () => setActiveTab('more'))}
      </div>
    </nav>
  );
};

export default BottomNav;
