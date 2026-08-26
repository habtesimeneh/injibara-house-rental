import { useState, useEffect } from 'react';
import SettingsCard from './SettingsCard';
import SettingsForm from './SettingsForm';
import SettingsModal from './SettingsModal';
import SettingsTable from './SettingsTable';
import { adminApi } from '../../../services/adminApi';

export default function ContactSettings() {
  const [contactPage, setContactPage] = useState({ title_en: '', title_am: '', subtitle_en: '', subtitle_am: '', address_en: '', address_am: '', phone_1: '', phone_2: '', phone_3: '', email: '', working_hours_en: '', working_hours_am: '', facebook_url: '', telegram_url: '', tiktok_url: '', youtube_url: '', banner_image_url: '' });
  const [offices, setOffices] = useState([]);
  const [phones, setPhones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [officeModalOpen, setOfficeModalOpen] = useState(false);
  const [editingOffice, setEditingOffice] = useState(null);
  const [officeForm, setOfficeForm] = useState({ name_en: '', name_am: '', address_en: '', address_am: '', phone: '', agent_name: '', working_hours: '', is_active: true, display_order: 0 });

  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [editingPhone, setEditingPhone] = useState(null);
  const [phoneForm, setPhoneForm] = useState({ department_en: '', department_am: '', phone_number: '', telegram_username: '', contact_person: '', is_whatsapp: false, is_active: true, display_order: 0 });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [contact, officesData, phonesData] = await Promise.all([
        adminApi.getContact(),
        adminApi.getOffices(),
        adminApi.getPhones()
      ]);
      setContactPage(contact || {});
      setOffices(officesData || []);
      setPhones(phonesData || []);
    } catch (err) {
      console.error('Failed to load contact settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.saveContact(contactPage);
      alert('Contact page saved');
    } catch (err) {
      alert(err.message || 'Failed to save contact page');
    } finally {
      setSaving(false);
    }
  };

  const handleOfficeSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingOffice) {
        await adminApi.updateOffice(editingOffice.id, officeForm);
        alert('Office updated');
      } else {
        await adminApi.createOffice(officeForm);
        alert('Office created');
      }
      setOfficeModalOpen(false);
      setEditingOffice(null);
      setOfficeForm({ name_en: '', name_am: '', address_en: '', address_am: '', phone: '', agent_name: '', working_hours: '', is_active: true, display_order: 0 });
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to save office');
    }
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPhone) {
        await adminApi.updatePhone(editingPhone.id, phoneForm);
        alert('Phone updated');
      } else {
        await adminApi.createPhone(phoneForm);
        alert('Phone created');
      }
      setPhoneModalOpen(false);
      setEditingPhone(null);
      setPhoneForm({ department_en: '', department_am: '', phone_number: '', telegram_username: '', contact_person: '', is_whatsapp: false, is_active: true, display_order: 0 });
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to save phone');
    }
  };

  const handleDeleteOffice = async (office) => {
    if (!confirm(`Delete office "${office.name_en}"?`)) return;
    try {
      await adminApi.deleteOffice(office.id);
      alert('Office deleted');
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete office');
    }
  };

  const handleDeletePhone = async (phone) => {
    if (!confirm(`Delete phone "${phone.department_en}"?`)) return;
    try {
      await adminApi.deletePhone(phone.id);
      alert('Phone deleted');
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete phone');
    }
  };

  const officeColumns = [
    { key: 'name_en', label: 'Name (EN)' },
    { key: 'name_am', label: 'Name (AM)' },
    { key: 'phone', label: 'Phone' },
    { key: 'agent_name', label: 'Agent' },
    { key: 'is_active', label: 'Active', render: (val) => val ? 'Yes' : 'No' },
  ];

  const phoneColumns = [
    { key: 'department_en', label: 'Department (EN)' },
    { key: 'department_am', label: 'Department (AM)' },
    { key: 'phone_number', label: 'Phone Number' },
    { key: 'contact_person', label: 'Contact Person' },
    { key: 'is_whatsapp', label: 'WhatsApp', render: (val) => val ? 'Yes' : 'No' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 bg-slate-800/50 rounded-3xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SettingsCard title="Contact Page" subtitle="Global contact page content">
        <form onSubmit={handleContactSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SettingsForm label="Title (EN)"><input value={contactPage.title_en} onChange={(e) => setContactPage({ ...contactPage, title_en: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
          <SettingsForm label="Title (AM)"><input value={contactPage.title_am} onChange={(e) => setContactPage({ ...contactPage, title_am: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none font-amharic" /></SettingsForm>
          <SettingsForm label="Subtitle (EN)"><input value={contactPage.subtitle_en} onChange={(e) => setContactPage({ ...contactPage, subtitle_en: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
          <SettingsForm label="Subtitle (AM)"><input value={contactPage.subtitle_am} onChange={(e) => setContactPage({ ...contactPage, subtitle_am: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none font-amharic" /></SettingsForm>
          <SettingsForm label="Address (EN)"><textarea rows={2} value={contactPage.address_en} onChange={(e) => setContactPage({ ...contactPage, address_en: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
          <SettingsForm label="Address (AM)"><textarea rows={2} value={contactPage.address_am} onChange={(e) => setContactPage({ ...contactPage, address_am: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none font-amharic" /></SettingsForm>
          <SettingsForm label="Phone 1"><input value={contactPage.phone_1} onChange={(e) => setContactPage({ ...contactPage, phone_1: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
          <SettingsForm label="Phone 2"><input value={contactPage.phone_2} onChange={(e) => setContactPage({ ...contactPage, phone_2: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
          <SettingsForm label="Phone 3"><input value={contactPage.phone_3} onChange={(e) => setContactPage({ ...contactPage, phone_3: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
          <SettingsForm label="Email"><input type="email" value={contactPage.email} onChange={(e) => setContactPage({ ...contactPage, email: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
          <SettingsForm label="Working Hours (EN)"><input value={contactPage.working_hours_en} onChange={(e) => setContactPage({ ...contactPage, working_hours_en: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
          <SettingsForm label="Working Hours (AM)"><input value={contactPage.working_hours_am} onChange={(e) => setContactPage({ ...contactPage, working_hours_am: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none font-amharic" /></SettingsForm>
          <SettingsForm label="Facebook URL"><input value={contactPage.facebook_url} onChange={(e) => setContactPage({ ...contactPage, facebook_url: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
          <SettingsForm label="Telegram URL"><input value={contactPage.telegram_url} onChange={(e) => setContactPage({ ...contactPage, telegram_url: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
          <SettingsForm label="TikTok URL"><input value={contactPage.tiktok_url} onChange={(e) => setContactPage({ ...contactPage, tiktok_url: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
          <SettingsForm label="YouTube URL"><input value={contactPage.youtube_url} onChange={(e) => setContactPage({ ...contactPage, youtube_url: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
          <SettingsForm label="Banner Image URL"><input value={contactPage.banner_image_url} onChange={(e) => setContactPage({ ...contactPage, banner_image_url: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
          <div className="md:col-span-2">
            <button type="submit" disabled={saving} className="px-8 py-3 rounded-2xl bg-amber-500 text-black font-bold hover:bg-amber-400 transition disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Contact Page'}
            </button>
          </div>
        </form>
      </SettingsCard>

      <SettingsCard title="Offices" subtitle="Branch offices" actions={
        <button onClick={() => { setEditingOffice(null); setOfficeForm({ name_en: '', name_am: '', address_en: '', address_am: '', phone: '', agent_name: '', working_hours: '', is_active: true, display_order: 0 }); setOfficeModalOpen(true); }} className="px-6 py-2.5 rounded-2xl bg-amber-500 text-black font-bold hover:bg-amber-400 transition">Add Office</button>
      }>
        <SettingsTable columns={officeColumns} data={offices} loading={loading} emptyMessage="No offices found" onEdit={(office) => { setEditingOffice(office); setOfficeForm({ name_en: office.name_en, name_am: office.name_am, address_en: office.address_en, address_am: office.address_am, phone: office.phone, agent_name: office.agent_name, working_hours: office.working_hours, is_active: office.is_active, display_order: office.display_order }); setOfficeModalOpen(true); }} onDelete={handleDeleteOffice} />
      </SettingsCard>

      <SettingsCard title="Phone Hotlines" subtitle="Department contact numbers" actions={
        <button onClick={() => { setEditingPhone(null); setPhoneForm({ department_en: '', department_am: '', phone_number: '', telegram_username: '', contact_person: '', is_whatsapp: false, is_active: true, display_order: 0 }); setPhoneModalOpen(true); }} className="px-6 py-2.5 rounded-2xl bg-amber-500 text-black font-bold hover:bg-amber-400 transition">Add Phone</button>
      }>
        <SettingsTable columns={phoneColumns} data={phones} loading={loading} emptyMessage="No phone numbers found" onEdit={(phone) => { setEditingPhone(phone); setPhoneForm({ department_en: phone.department_en, department_am: phone.department_am, phone_number: phone.phone_number, telegram_username: phone.telegram_username, contact_person: phone.contact_person, is_whatsapp: phone.is_whatsapp, is_active: phone.is_active, display_order: phone.display_order }); setPhoneModalOpen(true); }} onDelete={handleDeletePhone} />
      </SettingsCard>

      <SettingsModal isOpen={officeModalOpen} onClose={() => { setOfficeModalOpen(false); setEditingOffice(null); }} title={editingOffice ? 'Edit Office' : 'Add Office'} onSubmit={handleOfficeSubmit}>
        <SettingsForm label="Name (EN)" required><input value={officeForm.name_en} onChange={(e) => setOfficeForm({ ...officeForm, name_en: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
        <SettingsForm label="Name (AM)" required><input value={officeForm.name_am} onChange={(e) => setOfficeForm({ ...officeForm, name_am: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none font-amharic" /></SettingsForm>
        <SettingsForm label="Address (EN)"><textarea rows={2} value={officeForm.address_en} onChange={(e) => setOfficeForm({ ...officeForm, address_en: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
        <SettingsForm label="Address (AM)"><textarea rows={2} value={officeForm.address_am} onChange={(e) => setOfficeForm({ ...officeForm, address_am: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none font-amharic" /></SettingsForm>
        <SettingsForm label="Phone"><input value={officeForm.phone} onChange={(e) => setOfficeForm({ ...officeForm, phone: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
        <SettingsForm label="Agent Name"><input value={officeForm.agent_name} onChange={(e) => setOfficeForm({ ...officeForm, agent_name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
        <SettingsForm label="Working Hours"><input value={officeForm.working_hours} onChange={(e) => setOfficeForm({ ...officeForm, working_hours: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
        <SettingsForm label="Active"><label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={officeForm.is_active} onChange={(e) => setOfficeForm({ ...officeForm, is_active: e.target.checked })} className="w-5 h-5 rounded accent-amber-500" /><span className="text-sm text-slate-300">Enabled</span></label></SettingsForm>
      </SettingsModal>

      <SettingsModal isOpen={phoneModalOpen} onClose={() => { setPhoneModalOpen(false); setEditingPhone(null); }} title={editingPhone ? 'Edit Phone' : 'Add Phone'} onSubmit={handlePhoneSubmit}>
        <SettingsForm label="Department (EN)" required><input value={phoneForm.department_en} onChange={(e) => setPhoneForm({ ...phoneForm, department_en: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
        <SettingsForm label="Department (AM)" required><input value={phoneForm.department_am} onChange={(e) => setPhoneForm({ ...phoneForm, department_am: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none font-amharic" /></SettingsForm>
        <SettingsForm label="Phone Number" required><input value={phoneForm.phone_number} onChange={(e) => setPhoneForm({ ...phoneForm, phone_number: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
        <SettingsForm label="Telegram Username"><input value={phoneForm.telegram_username} onChange={(e) => setPhoneForm({ ...phoneForm, telegram_username: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
        <SettingsForm label="Contact Person"><input value={phoneForm.contact_person} onChange={(e) => setPhoneForm({ ...phoneForm, contact_person: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
        <SettingsForm label="WhatsApp"><label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={phoneForm.is_whatsapp} onChange={(e) => setPhoneForm({ ...phoneForm, is_whatsapp: e.target.checked })} className="w-5 h-5 rounded accent-amber-500" /><span className="text-sm text-slate-300">Enabled</span></label></SettingsForm>
        <SettingsForm label="Active"><label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={phoneForm.is_active} onChange={(e) => setPhoneForm({ ...phoneForm, is_active: e.target.checked })} className="w-5 h-5 rounded accent-amber-500" /><span className="text-sm text-slate-300">Enabled</span></label></SettingsForm>
      </SettingsModal>
    </div>
  );
}
