import { useState, useEffect } from 'react';
import SettingsCard from './SettingsCard';
import SettingsForm from './SettingsForm';
import SettingsModal from './SettingsModal';
import SettingsTable from './SettingsTable';
import { adminApi } from '../../../services/adminApi';

export default function GeneralSettings() {
  const [settings, setSettings] = useState({
    brand_name_en: '', brand_name_am: '', brand_tagline_en: '', brand_tagline_am: '',
    primary_color: '#f59e0b', secondary_color: '#1e293b', accent_color: '#f59e0b',
    footer_desc_en: '', footer_desc_am: '',
    social_facebook_url: '', social_twitter_url: '', social_instagram_url: '', social_linkedin_url: '',
    contact_map_url: '', services_title_en: '', services_title_am: '',
    faq_title_en: '', faq_title_am: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getSettings();
      setSettings((prev) => ({ ...prev, ...data }));
    } catch (err) {
      console.error('Failed to load general settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.updateSettings(settings);
      alert('General settings saved successfully');
    } catch (err) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SettingsCard title="General Settings" subtitle="Brand, colors, and social links">
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-slate-800/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      </SettingsCard>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <SettingsCard
        title="General Settings"
        subtitle="Brand, colors, and social links"
        actions={
          <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-2xl bg-amber-500 text-black font-bold hover:bg-amber-400 transition disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SettingsForm label="Brand Name (EN)">
            <input value={settings.brand_name_en} onChange={(e) => setSettings({ ...settings, brand_name_en: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" />
          </SettingsForm>
          <SettingsForm label="Brand Name (AM)">
            <input value={settings.brand_name_am} onChange={(e) => setSettings({ ...settings, brand_name_am: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none font-amharic" />
          </SettingsForm>
          <SettingsForm label="Tagline (EN)">
            <input value={settings.brand_tagline_en} onChange={(e) => setSettings({ ...settings, brand_tagline_en: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" />
          </SettingsForm>
          <SettingsForm label="Tagline (AM)">
            <input value={settings.brand_tagline_am} onChange={(e) => setSettings({ ...settings, brand_tagline_am: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none font-amharic" />
          </SettingsForm>
          <SettingsForm label="Primary Color">
            <input type="color" value={settings.primary_color} onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })} className="w-full h-14 bg-slate-950 border border-slate-800 rounded-2xl p-2" />
          </SettingsForm>
          <SettingsForm label="Secondary Color">
            <input type="color" value={settings.secondary_color} onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })} className="w-full h-14 bg-slate-950 border border-slate-800 rounded-2xl p-2" />
          </SettingsForm>
          <SettingsForm label="Accent Color">
            <input type="color" value={settings.accent_color} onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })} className="w-full h-14 bg-slate-950 border border-slate-800 rounded-2xl p-2" />
          </SettingsForm>
          <SettingsForm label="Services Title (EN)">
            <input value={settings.services_title_en} onChange={(e) => setSettings({ ...settings, services_title_en: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" />
          </SettingsForm>
          <SettingsForm label="Services Title (AM)">
            <input value={settings.services_title_am} onChange={(e) => setSettings({ ...settings, services_title_am: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none font-amharic" />
          </SettingsForm>
          <SettingsForm label="FAQ Title (EN)">
            <input value={settings.faq_title_en} onChange={(e) => setSettings({ ...settings, faq_title_en: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" />
          </SettingsForm>
          <SettingsForm label="FAQ Title (AM)">
            <input value={settings.faq_title_am} onChange={(e) => setSettings({ ...settings, faq_title_am: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none font-amharic" />
          </SettingsForm>
          <SettingsForm label="Facebook URL">
            <input value={settings.social_facebook_url} onChange={(e) => setSettings({ ...settings, social_facebook_url: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" />
          </SettingsForm>
          <SettingsForm label="Twitter/X URL">
            <input value={settings.social_twitter_url} onChange={(e) => setSettings({ ...settings, social_twitter_url: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" />
          </SettingsForm>
          <SettingsForm label="Instagram URL">
            <input value={settings.social_instagram_url} onChange={(e) => setSettings({ ...settings, social_instagram_url: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" />
          </SettingsForm>
          <SettingsForm label="LinkedIn URL">
            <input value={settings.social_linkedin_url} onChange={(e) => setSettings({ ...settings, social_linkedin_url: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" />
          </SettingsForm>
          <SettingsForm label="Google Map Embed URL">
            <input value={settings.contact_map_url} onChange={(e) => setSettings({ ...settings, contact_map_url: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" />
          </SettingsForm>
          <SettingsForm label="Footer Description (EN)">
            <textarea rows={2} value={settings.footer_desc_en} onChange={(e) => setSettings({ ...settings, footer_desc_en: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" />
          </SettingsForm>
          <SettingsForm label="Footer Description (AM)">
            <textarea rows={2} value={settings.footer_desc_am} onChange={(e) => setSettings({ ...settings, footer_desc_am: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none font-amharic" />
          </SettingsForm>
        </div>
      </SettingsCard>
    </form>
  );
}
