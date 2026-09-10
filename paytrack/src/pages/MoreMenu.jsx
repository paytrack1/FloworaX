import React from 'react';
import { ChevronRight, HelpCircle, Settings, Users } from 'lucide-react';
import { useStore } from '../store/useStore';

const menuItems = [
	{ id: 'team', label: 'Team management', description: 'Manage staff access', icon: Users },
	{ id: 'settings', label: 'Settings', description: 'Manage your business preferences', icon: Settings },
];

const MoreMenu = () => {
	const setActiveTab = useStore((state) => state.setActiveTab);

	return (
		<section className="max-w-2xl py-6 lg:py-2">
			<div className="mb-8">
				<p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">More</p>
				<h1 className="mt-2 text-3xl font-black tracking-tight text-[#0F172A]">More options</h1>
			</div>

			<div className="space-y-3">
				{menuItems.map(({ id, label, description, icon: Icon }) => (
					<button
						key={id}
						type="button"
						onClick={() => setActiveTab(id)}
						className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-[#185FA5]"
					>
						<span className="rounded-xl bg-[#EEF4FF] p-3 text-[#185FA5]">
							<Icon size={20} />
						</span>
						<span className="flex-1">
							<span className="block font-black text-[#0F172A]">{label}</span>
							<span className="mt-1 block text-sm text-slate-500">{description}</span>
						</span>
						<ChevronRight size={20} className="text-slate-400" />
					</button>
				))}

				<a
					href="/contact"
					className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-[#185FA5]"
				>
					<span className="rounded-xl bg-[#EEF4FF] p-3 text-[#185FA5]">
						<HelpCircle size={20} />
					</span>
					<span className="flex-1">
						<span className="block font-black text-[#0F172A]">Help and support</span>
						<span className="mt-1 block text-sm text-slate-500">Get in touch with the Flowora team</span>
					</span>
					<ChevronRight size={20} className="text-slate-400" />
				</a>
			</div>
		</section>
	);
};

export default MoreMenu;
