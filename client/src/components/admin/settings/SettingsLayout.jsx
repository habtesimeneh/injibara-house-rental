import { useState } from 'react';

const categories = [
  { id: 'general', label: 'General', icon: 'LayoutDashboard' },
  { id: 'payments', label: 'Payments', icon: 'CreditCard' },
  { id: 'contact', label: 'Contact', icon: 'Phone' },
  { id: 'seo', label: 'SEO', icon: 'Search' },
  { id: 'media', label: 'Media', icon: 'Image' },
  { id: 'content', label: 'Content', icon: 'FileText' },
  { id: 'categories', label: 'Categories', icon: 'Grid' },
  { id: 'locations', label: 'Locations', icon: 'MapPin' },
  { id: 'fees', label: 'Fees', icon: 'DollarSign' },
];

export default function SettingsLayout({ activeTab, onTabChange, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Mobile toggle */}
      <div className="md:hidden flex items-center justify-between">
        <h2 className="text-xl font-black text-white">Settings</h2>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
        >
          {mobileOpen ? 'Close' : 'Menu'}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`${mobileOpen ? 'block' : 'hidden'} md:block w-full md:w-64 flex-shrink-0`}>
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                onTabChange(cat.id);
                setMobileOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                activeTab === cat.id
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className="capitalize">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
