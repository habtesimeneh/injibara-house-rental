import { useState, useEffect } from 'react';
import SettingsCard from './SettingsCard';
import SettingsForm from './SettingsForm';
import SettingsModal from './SettingsModal';
import SettingsTable from './SettingsTable';
import { adminApi } from '../../../services/adminApi';

export default function MediaSettings() {
  const [heroSlides, setHeroSlides] = useState([]);
  const [authSlides, setAuthSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [type, setType] = useState('hero');
  const [form, setForm] = useState({ title_en: '', title_am: '', subtitle_en: '', subtitle_am: '', description_en: '', description_am: '', button_text_en: '', button_text_am: '', button_url: '', image_url: '', is_active: true, display_order: 0 });

  useEffect(() => { loadSlides(); }, []);

  const loadSlides = async () => {
    setLoading(true);
    try {
      const [hero, auth] = await Promise.all([
        adminApi.getHeroSlides(),
        adminApi.getAuthSlides()
      ]);
      setHeroSlides(hero || []);
      setAuthSlides(auth || []);
    } catch (err) {
      console.error('Failed to load slides:', err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (slideType, slide = null) => {
    setType(slideType);
    setEditing(slide);
    if (slide) {
      setForm({
        title_en: slide.title_en || '',
        title_am: slide.title_am || '',
        subtitle_en: slide.subtitle_en || '',
        subtitle_am: slide.subtitle_am || '',
        description_en: slide.description_en || '',
        description_am: slide.description_am || '',
        button_text_en: slide.button_text_en || '',
        button_text_am: slide.button_text_am || '',
        button_url: slide.button_url || '',
        image_url: slide.image_url || '',
        is_active: slide.is_active,
        display_order: slide.display_order || 0
      });
    } else {
      setForm({ title_en: '', title_am: '', subtitle_en: '', subtitle_am: '', description_en: '', description_am: '', button_text_en: '', button_text_am: '', button_url: '', image_url: '', is_active: true, display_order: 0 });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (type === 'hero') {
        if (editing) await adminApi.updateHeroSlide(editing.id, form);
        else await adminApi.createHeroSlide(form);
      } else {
        if (editing) await adminApi.updateAuthSlide(editing.id, form);
        else await adminApi.createAuthSlide(form);
      }
      alert('Slide saved');
      setModalOpen(false);
      setEditing(null);
      loadSlides();
    } catch (err) {
      alert(err.message || 'Failed to save slide');
    }
  };

  const handleDelete = async (slide) => {
    if (!confirm(`Delete this slide?`)) return;
    try {
      if (type === 'hero') await adminApi.deleteHeroSlide(slide.id);
      else await adminApi.deleteAuthSlide(slide.id);
      alert('Slide deleted');
      loadSlides();
    } catch (err) {
      alert(err.message || 'Failed to delete slide');
    }
  };

  const heroColumns = [
    { key: 'title_en', label: 'Title (EN)' },
    { key: 'subtitle_en', label: 'Subtitle' },
    { key: 'button_text_en', label: 'Button' },
    { key: 'is_active', label: 'Active', render: (val) => val ? 'Yes' : 'No' },
  ];

  const authColumns = [
    { key: 'title_en', label: 'Title (EN)' },
    { key: 'badge_en', label: 'Badge' },
    { key: 'is_active', label: 'Active', render: (val) => val ? 'Yes' : 'No' },
  ];

  return (
    <div className="space-y-6">
      <SettingsCard title="Hero Slides" subtitle="Homepage carousel" actions={
        <button onClick={() => openModal('hero')} className="px-6 py-2.5 rounded-2xl bg-amber-500 text-black font-bold hover:bg-amber-400 transition">Add Slide</button>
      }>
        <SettingsTable columns={heroColumns} data={heroSlides} loading={loading} emptyMessage="No hero slides found" onEdit={(s) => openModal('hero', s)} onDelete={(s) => handleDelete(s)} />
      </SettingsCard>

      <SettingsCard title="Auth Slides" subtitle="Login/register carousel" actions={
        <button onClick={() => openModal('auth')} className="px-6 py-2.5 rounded-2xl bg-amber-500 text-black font-bold hover:bg-amber-400 transition">Add Slide</button>
      }>
        <SettingsTable columns={authColumns} data={authSlides} loading={loading} emptyMessage="No auth slides found" onEdit={(s) => openModal('auth', s)} onDelete={(s) => handleDelete(s)} />
      </SettingsCard>

      <SettingsModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? 'Edit Slide' : 'Add Slide'} onSubmit={handleSubmit}>
        <SettingsForm label="Title (EN)" required><input value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
        <SettingsForm label="Title (AM)"><input value={form.title_am} onChange={(e) => setForm({ ...form, title_am: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none font-amharic" /></SettingsForm>
        {type === 'hero' ? (
          <>
            <SettingsForm label="Subtitle (EN)"><input value={form.subtitle_en} onChange={(e) => setForm({ ...form, subtitle_en: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
            <SettingsForm label="Subtitle (AM)"><input value={form.subtitle_am} onChange={(e) => setForm({ ...form, subtitle_am: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none font-amharic" /></SettingsForm>
            <SettingsForm label="Description (EN)"><textarea rows={2} value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
            <SettingsForm label="Description (AM)"><textarea rows={2} value={form.description_am} onChange={(e) => setForm({ ...form, description_am: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none font-amharic" /></SettingsForm>
            <SettingsForm label="Button Text (EN)"><input value={form.button_text_en} onChange={(e) => setForm({ ...form, button_text_en: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
            <SettingsForm label="Button Text (AM)"><input value={form.button_text_am} onChange={(e) => setForm({ ...form, button_text_am: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none font-amharic" /></SettingsForm>
            <SettingsForm label="Button URL"><input value={form.button_url} onChange={(e) => setForm({ ...form, button_url: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
          </>
        ) : (
          <>
            <SettingsForm label="Description (EN)"><textarea rows={2} value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
            <SettingsForm label="Description (AM)"><textarea rows={2} value={form.description_am} onChange={(e) => setForm({ ...form, description_am: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none font-amharic" /></SettingsForm>
            <SettingsForm label="Badge (EN)"><input value={form.button_text_en} onChange={(e) => setForm({ ...form, button_text_en: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
            <SettingsForm label="Badge (AM)"><input value={form.button_text_am} onChange={(e) => setForm({ ...form, button_text_am: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none font-amharic" /></SettingsForm>
          </>
        )}
        <SettingsForm label="Image URL" required><input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
        <SettingsForm label="Display Order"><input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
        <SettingsForm label="Active"><label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-5 h-5 rounded accent-amber-500" /><span className="text-sm text-slate-300">Enabled</span></label></SettingsForm>
      </SettingsModal>
    </div>
  );
}
