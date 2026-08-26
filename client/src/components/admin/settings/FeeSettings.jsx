import { useState, useEffect } from 'react';
import SettingsCard from './SettingsCard';
import SettingsForm from './SettingsForm';
import { adminApi } from '../../../services/adminApi';

export default function FeeSettings() {
  const [fees, setFees] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadFees(); }, []);

  const loadFees = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getFees();
      setFees(data || {});
    } catch (err) {
      console.error('Failed to load fees:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.updateFees(fees);
      alert('Fees updated');
    } catch (err) {
      alert(err.message || 'Failed to update fees');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2].map((i) => (
          <div key={i} className="h-64 bg-slate-800/50 rounded-3xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <SettingsCard title="Service Fees" subtitle="Manage advertisement and service fees">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SettingsForm label="Featured House Fee (ETB)">
            <input type="number" value={fees.ad_fee_featured_house || ''} onChange={(e) => setFees({ ...fees, ad_fee_featured_house: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" />
          </SettingsForm>
          <SettingsForm label="Tenant Seeking Fee (ETB)">
            <input type="number" value={fees.ad_fee_tenant_seeking || ''} onChange={(e) => setFees({ ...fees, ad_fee_tenant_seeking: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" />
          </SettingsForm>
          <SettingsForm label="Tenant Contact Fee (ETB)">
            <input type="number" value={fees.ad_fee_tenant_contact || ''} onChange={(e) => setFees({ ...fees, ad_fee_tenant_contact: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" />
          </SettingsForm>
          <SettingsForm label="Banner Ad Fee (ETB)">
            <input type="number" value={fees.ad_fee_banner || ''} onChange={(e) => setFees({ ...fees, ad_fee_banner: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" />
          </SettingsForm>
          <div className="md:col-span-2">
            <button type="submit" disabled={saving} className="px-8 py-3 rounded-2xl bg-amber-500 text-black font-bold hover:bg-amber-400 transition disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Fees'}
            </button>
          </div>
        </div>
      </SettingsCard>
    </form>
  );
}
