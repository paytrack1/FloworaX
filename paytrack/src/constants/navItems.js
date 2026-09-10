// Single source of truth for bottom-nav items, shared by BottomNav.jsx and
// MoreMenu.jsx so the two can never drift out of sync (a module id must
// appear in exactly one of "core" or "more", never both, never neither).
import {
  Home, BarChart2, Calendar, Receipt, TrendingDown, Ticket, Users,
  FileText, MessageSquare, Settings, Wallet,
} from 'lucide-react';

// Every navigable module, in priority order for picking the 4 "core" bottom-nav slots.
// 'home' is first and is always enabled, guaranteeing it's always a core slot.
export const NAV_ITEM_PRIORITY = [
  { id: 'home',           labelKey: null,            label: 'Home',      icon: Home },
  { id: 'sales',           labelKey: null,            label: 'Sales',     icon: BarChart2 },
  { id: 'bookings',        labelKey: 'bookingPlural', label: 'Bookings',  icon: Calendar },
  { id: 'invoices',        labelKey: null,            label: 'Invoices',  icon: Receipt },
  { id: 'finance',         labelKey: null,            label: 'Finance',   icon: Wallet },
  { id: 'reports',         labelKey: null,            label: 'Reports',   icon: FileText },
  { id: 'events',          labelKey: null,            label: 'Events',    icon: Ticket },
  { id: 'customers',       labelKey: 'customerPlural', label: 'Customers', icon: Users },
  { id: 'expenses',        labelKey: null,            label: 'Expenses',  icon: TrendingDown },
  { id: 'communications',  labelKey: null,            label: 'Communications', icon: MessageSquare },
  { id: 'settings',        labelKey: null,            label: 'Settings',  icon: Settings },
];

const CORE_SLOT_COUNT = 4;

/**
 * Splits enabled modules into up to 4 "core" bottom-nav items (highest
 * priority first, 'home' guaranteed included) and a "more" bucket containing
 * every other enabled module. Every enabled module lands in exactly one bucket.
 */
export function splitNavItems(enabledModules) {
  const enabledSet = new Set(enabledModules);
  const available = NAV_ITEM_PRIORITY.filter((item) => enabledSet.has(item.id));
  const core = available.slice(0, CORE_SLOT_COUNT);
  const more = available.slice(CORE_SLOT_COUNT);
  return { core, more };
}
