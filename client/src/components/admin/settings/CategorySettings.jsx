import { useState, useEffect } from 'react';
import SettingsCard from './SettingsCard';
import SettingsForm from './SettingsForm';
import SettingsModal from './SettingsModal';
import SettingsTable from './SettingsTable';
import { adminApi } from '../../../services/adminApi';

export default function CategorySettings() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', name_am: '', description: '', description_am: '', font_size: 'text-xl md:text-2xl', image_url: '' });

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getCategories();
      setCategories(data || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) await adminApi.updateCategory(editing.id, form);
      else await adminApi.createCategory(form);
      alert('Category saved');
      setModalOpen(false);
      setEditing(null);
      setForm({ name: '', name_am: '', description: '', description_am: '', font_size: 'text-xl md:text-2xl', image_url: '' });
      loadCategories();
    } catch (err) {
      alert(err.message || 'Failed to save category');
    }
  };

  const handleDelete = async (cat) => {
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    try {
      await adminApi.deleteCategory(cat.id);
      alert('Category deleted');
      loadCategories();
    } catch (err) {
      alert(err.message || 'Failed to delete category');
    }
  };

  const columns = [
    { key: 'name', label: 'Name (EN)' },
    { key: 'name_am', label: 'Name (AM)' },
    { key: 'description', label: 'Description', render: (val) => val ? (val.length > 40 ? val.slice(0, 40) + '...' : val) : '-' },
    { key: 'font_size', label: 'Font Size' },
  ];

  return (
    <div className="space-y-6">
      <SettingsCard title="Property Categories" subtitle="Manage house categories" actions={
        <button onClick={() => { setEditing(null); setForm({ name: '', name_am: '', description: '', description_am: '', font_size: 'text-xl md:text-2xl', image_url: '' }); setModalOpen(true); }} className="px-6 py-2.5 rounded-2xl bg-amber-500 text-black font-bold hover:bg-amber-400 transition">Add Category</button>
      }>
        <SettingsTable columns={columns} data={categories} loading={loading} emptyMessage="No categories found" onEdit={(cat) => { setEditing(cat); setForm({ name: cat.name, name_am: cat.name_am, description: cat.description || '', description_am: cat.description_am || '', font_size: cat.font_size || 'text-xl md:text-2xl', image_url: cat.image_url || '' }); setModalOpen(true); }} onDelete={handleDelete} />
      </SettingsCard>

      <SettingsModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? 'Edit Category' : 'Add Category'} onSubmit={handleSubmit}>
        <SettingsForm label="Name (EN)" required><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
        <SettingsForm label="Name (AM)" required><input value={form.name_am} onChange={(e) => setForm({ ...form, name_am: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none font-amharic" /></SettingsForm>
        <SettingsForm label="Description (EN)"><textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
        <SettingsForm label="Description (AM)"><textarea rows={2} value={form.description_am} onChange={(e) => setForm({ ...form, description_am: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none font-amharic" /></SettingsForm>
        <SettingsForm label="Font Size (Tailwind classes)"><input value={form.font_size} onChange={(e) => setForm({ ...form, font_size: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
        <SettingsForm label="Image URL"><input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
      </SettingsModal>
    </div>
  );
}
