import { useState, useEffect } from 'react';
import SettingsCard from './SettingsCard';
import SettingsForm from './SettingsForm';
import SettingsModal from './SettingsModal';
import SettingsTable from './SettingsTable';
import { adminApi } from '../../../services/adminApi';

export default function SEOSettings() {
  const [seo, setSeo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ route_path: '', title: '', description: '', keywords: '', og_image: '' });

  useEffect(() => { loadSeo(); }, []);

  const loadSeo = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getSeoMeta();
      setSeo(data || []);
    } catch (err) {
      console.error('Failed to load SEO:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminApi.updateSeo(form);
      alert('SEO updated');
      setModalOpen(false);
      setEditing(null);
      setForm({ route_path: '', title: '', description: '', keywords: '', og_image: '' });
      loadSeo();
    } catch (err) {
      alert(err.message || 'Failed to update SEO');
    }
  };

  const handleEdit = (row) => {
    setEditing(row);
    setForm({ route_path: row.route_path || '', title: row.title || '', description: row.description || '', keywords: row.keywords || '', og_image: row.og_image || '' });
    setModalOpen(true);
  };

  const handleDelete = async (row) => {
    if (!confirm(`Delete SEO for "${row.route_path}"?`)) return;
    try {
      await adminApi.deleteSeo(row.id);
      alert('SEO deleted');
      loadSeo();
    } catch (err) {
      alert(err.message || 'Failed to delete SEO');
    }
  };

  const columns = [
    { key: 'route_path', label: 'Route Path' },
    { key: 'title', label: 'Title' },
    { key: 'description', label: 'Description', render: (val) => val ? (val.length > 60 ? val.slice(0, 60) + '...' : val) : '' },
    { key: 'keywords', label: 'Keywords', render: (val) => val ? (val.length > 40 ? val.slice(0, 40) + '...' : val) : '' },
  ];

  return (
    <div className="space-y-6">
      <SettingsCard title="SEO Metadata" subtitle="Per-route SEO settings" actions={
        <button onClick={() => { setEditing(null); setForm({ route_path: '', title: '', description: '', keywords: '', og_image: '' }); setModalOpen(true); }} className="px-6 py-2.5 rounded-2xl bg-amber-500 text-black font-bold hover:bg-amber-400 transition">Add SEO</button>
      }>
        <SettingsTable columns={columns} data={seo} loading={loading} emptyMessage="No SEO records found" onEdit={handleEdit} onDelete={handleDelete} />
      </SettingsCard>

      <SettingsModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? 'Edit SEO' : 'Add SEO'} onSubmit={handleSubmit}>
        <SettingsForm label="Route Path" required><input value={form.route_path} onChange={(e) => setForm({ ...form, route_path: e.target.value })} disabled={!!editing} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none disabled:opacity-50" /></SettingsForm>
        <SettingsForm label="Title" required><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
        <SettingsForm label="Description"><textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
        <SettingsForm label="Keywords"><input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
        <SettingsForm label="OG Image URL"><input value={form.og_image} onChange={(e) => setForm({ ...form, og_image: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
      </SettingsModal>
    </div>
  );
}
