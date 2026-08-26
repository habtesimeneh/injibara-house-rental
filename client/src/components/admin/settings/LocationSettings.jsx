import { useState, useEffect } from 'react';
import SettingsCard from './SettingsCard';
import SettingsForm from './SettingsForm';
import SettingsModal from './SettingsModal';
import SettingsTable from './SettingsTable';
import { adminApi } from '../../../services/adminApi';

export default function LocationSettings() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ region: '', city: '' });

  useEffect(() => { loadLocations(); }, []);

  const loadLocations = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getLocations();
      setLocations(data || []);
    } catch (err) {
      console.error('Failed to load locations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) await adminApi.updateLocation(editing.id, form);
      else await adminApi.createLocation(form);
      alert('Location saved');
      setModalOpen(false);
      setEditing(null);
      setForm({ region: '', city: '' });
      loadLocations();
    } catch (err) {
      alert(err.message || 'Failed to save location');
    }
  };

  const handleDelete = async (loc) => {
    if (!confirm(`Delete location "${loc.region} - ${loc.city}"? This cannot be undone if houses reference it.`)) return;
    try {
      await adminApi.deleteLocation(loc.id);
      alert('Location deleted');
      loadLocations();
    } catch (err) {
      alert(err.message || 'Failed to delete location');
    }
  };

  const columns = [
    { key: 'region', label: 'Region' },
    { key: 'city', label: 'City' },
  ];

  return (
    <div className="space-y-6">
      <SettingsCard title="Locations" subtitle="Manage regions and cities" actions={
        <button onClick={() => { setEditing(null); setForm({ region: '', city: '' }); setModalOpen(true); }} className="px-6 py-2.5 rounded-2xl bg-amber-500 text-black font-bold hover:bg-amber-400 transition">Add Location</button>
      }>
        <SettingsTable columns={columns} data={locations} loading={loading} emptyMessage="No locations found" onEdit={(loc) => { setEditing(loc); setForm({ region: loc.region, city: loc.city }); setModalOpen(true); }} onDelete={handleDelete} />
      </SettingsCard>

      <SettingsModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? 'Edit Location' : 'Add Location'} onSubmit={handleSubmit}>
        <SettingsForm label="Region" required><input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
        <SettingsForm label="City" required><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
      </SettingsModal>
    </div>
  );
}
