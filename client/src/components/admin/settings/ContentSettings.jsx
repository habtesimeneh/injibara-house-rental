import { useState, useEffect } from 'react';
import SettingsCard from './SettingsCard';
import SettingsForm from './SettingsForm';
import SettingsModal from './SettingsModal';
import SettingsTable from './SettingsTable';
import { adminApi } from '../../../services/adminApi';

export default function ContentSettings() {
  const [tab, setTab] = useState('announcements');
  const [announcements, setAnnouncements] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [about, setAbout] = useState({});
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [annModalOpen, setAnnModalOpen] = useState(false);
  const [editingAnn, setEditingAnn] = useState(null);
  const [annForm, setAnnForm] = useState({ title_en: '', title_am: '', content_en: '', content_am: '', badge: 'NEWS', is_active: true, type: 'promotional_notice' });

  const [testModalOpen, setTestModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [testForm, setTestForm] = useState({ name: '', role_en: '', role_am: '', location_en: '', location_am: '', avatar: '', rating: 5, comment_en: '', comment_am: '', badge_en: '', badge_am: '', is_approved: true });

  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [aboutForm, setAboutForm] = useState({ title_en: '', title_am: '', subtitle_en: '', subtitle_am: '', content_en: '', content_am: '', mission_en: '', mission_am: '', vision_en: '', vision_am: '', values_en: '', values_am: '', image_url: '', banner_image_url: '' });

  const [faqModalOpen, setFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [faqForm, setFaqForm] = useState({ question_en: '', question_am: '', answer_en: '', answer_am: '', display_order: 0 });

  useEffect(() => { loadContent(); }, []);

  const loadContent = async () => {
    setLoading(true);
    try {
      const [annData, testData, aboutData, faqData] = await Promise.all([
        adminApi.getAnnouncements(),
        adminApi.getTestimonials(),
        adminApi.getAbout(),
        adminApi.getAboutFaqs()
      ]);
      setAnnouncements(annData || []);
      setTestimonials(testData || []);
      setAbout(aboutData || {});
      setFaqs(faqData || []);
    } catch (err) {
      console.error('Failed to load content:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnnSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAnn) await adminApi.updateAnnouncement(editingAnn.id, annForm);
      else await adminApi.createAnnouncement({ ...annForm, type: annForm.type });
      alert('Announcement saved');
      setAnnModalOpen(false);
      setEditingAnn(null);
      setAnnForm({ title_en: '', title_am: '', content_en: '', content_am: '', badge: 'NEWS', is_active: true, type: 'promotional_notice' });
      loadContent();
    } catch (err) {
      alert(err.message || 'Failed to save announcement');
    }
  };

  const handleTestSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTest) await adminApi.updateTestimonial(editingTest.id, testForm);
      else await adminApi.createTestimonial(testForm);
      alert('Testimonial saved');
      setTestModalOpen(false);
      setEditingTest(null);
      loadContent();
    } catch (err) {
      alert(err.message || 'Failed to save testimonial');
    }
  };

  const handleAboutSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminApi.saveAbout(aboutForm);
      alert('About page saved');
      setAboutModalOpen(false);
      loadContent();
    } catch (err) {
      alert(err.message || 'Failed to save about page');
    }
  };

  const handleFaqSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingFaq) await adminApi.updateFaq(editingFaq.id, faqForm);
      else await adminApi.createFaq(faqForm);
      alert('FAQ saved');
      setFaqModalOpen(false);
      setEditingFaq(null);
      setFaqForm({ question_en: '', question_am: '', answer_en: '', answer_am: '', display_order: 0 });
      loadContent();
    } catch (err) {
      alert(err.message || 'Failed to save FAQ');
    }
  };

  const handleDeleteAnn = async (ann) => {
    if (!confirm(`Delete announcement "${ann.title_en}"?`)) return;
    try {
      await adminApi.deleteAnnouncement(ann.id);
      alert('Announcement deleted');
      loadContent();
    } catch (err) {
      alert(err.message || 'Failed to delete announcement');
    }
  };

  const handleDeleteTest = async (test) => {
    if (!confirm(`Delete testimonial from "${test.name}"?`)) return;
    try {
      await adminApi.deleteTestimonial(test.id);
      alert('Testimonial deleted');
      loadContent();
    } catch (err) {
      alert(err.message || 'Failed to delete testimonial');
    }
  };

  const handleDeleteFaq = async (faq) => {
    if (!confirm(`Delete FAQ?`)) return;
    try {
      await adminApi.deleteFaq(faq.id);
      alert('FAQ deleted');
      loadContent();
    } catch (err) {
      alert(err.message || 'Failed to delete FAQ');
    }
  };

  const annColumns = [
    { key: 'title_en', label: 'Title (EN)' },
    { key: 'badge', label: 'Badge' },
    { key: 'type', label: 'Type' },
    { key: 'is_active', label: 'Active', render: (val) => val ? 'Yes' : 'No' },
  ];

  const testColumns = [
    { key: 'name', label: 'Name' },
    { key: 'role_en', label: 'Role' },
    { key: 'rating', label: 'Rating' },
    { key: 'is_approved', label: 'Approved', render: (val) => val ? 'Yes' : 'No' },
  ];

  const faqColumns = [
    { key: 'question_en', label: 'Question (EN)' },
    { key: 'display_order', label: 'Order' },
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
      <div className="flex gap-2 border-b border-slate-800 pb-4">
        {['announcements', 'testimonials', 'about', 'faqs'].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-2xl text-sm font-bold capitalize transition ${tab === t ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'announcements' && (
        <SettingsCard title="Announcements" subtitle="Homepage notices and promotions" actions={
          <button onClick={() => { setEditingAnn(null); setAnnForm({ title_en: '', title_am: '', content_en: '', content_am: '', badge: 'NEWS', is_active: true, type: 'promotional_notice' }); setAnnModalOpen(true); }} className="px-6 py-2.5 rounded-2xl bg-amber-500 text-black font-bold hover:bg-amber-400 transition">Add Announcement</button>
        }>
          <SettingsTable columns={annColumns} data={announcements} loading={loading} emptyMessage="No announcements found" onEdit={(ann) => { setEditingAnn(ann); setAnnForm({ title_en: ann.title_en, title_am: ann.title_am, content_en: ann.content_en, content_am: ann.content_am, badge: ann.badge, is_active: ann.is_active, type: ann.type || 'promotional_notice' }); setAnnModalOpen(true); }} onDelete={handleDeleteAnn} />
        </SettingsCard>
      )}

      {tab === 'testimonials' && (
        <SettingsCard title="Testimonials" subtitle="Customer reviews and feedback" actions={
          <button onClick={() => { setEditingTest(null); setTestForm({ name: '', role_en: '', role_am: '', location_en: '', location_am: '', avatar: '', rating: 5, comment_en: '', comment_am: '', badge_en: '', badge_am: '', is_approved: true }); setTestModalOpen(true); }} className="px-6 py-2.5 rounded-2xl bg-amber-500 text-black font-bold hover:bg-amber-400 transition">Add Testimonial</button>
        }>
          <SettingsTable columns={testColumns} data={testimonials} loading={loading} emptyMessage="No testimonials found" onEdit={(test) => { setEditingTest(test); setTestForm({ name: test.name, role_en: test.role_en, role_am: test.role_am, location_en: test.location_en, location_am: test.location_am, avatar: test.avatar, rating: test.rating, comment_en: test.comment_en, comment_am: test.comment_am, badge_en: test.badge_en, badge_am: test.badge_am, is_approved: test.is_approved }); setTestModalOpen(true); }} onDelete={handleDeleteTest} />
        </SettingsCard>
      )}

      {tab === 'about' && (
        <SettingsCard title="About Page" subtitle="Company information and mission" actions={
          <button onClick={() => { setAboutForm({ title_en: about.title_en || '', title_am: about.title_am || '', subtitle_en: about.subtitle_en || '', subtitle_am: about.subtitle_am || '', content_en: about.content_en || '', content_am: about.content_am || '', mission_en: about.mission_en || '', mission_am: about.mission_am || '', vision_en: about.vision_en || '', vision_am: about.vision_am || '', values_en: about.values_en || '', values_am: about.values_am || '', image_url: about.image_url || '', banner_image_url: about.banner_image_url || '' }); setAboutModalOpen(true); }} className="px-6 py-2.5 rounded-2xl bg-amber-500 text-black font-bold hover:bg-amber-400 transition">Edit About</button>
        }>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">Title (EN)</label><p className="text-white mt-1">{about.title_en || '-'}</p></div>
            <div><label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">Title (AM)</label><p className="text-white mt-1 font-amharic">{about.title_am || '-'}</p></div>
            <div className="md:col-span-2"><label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">Content (EN)</label><p className="text-slate-300 mt-1 text-sm">{about.content_en || '-'}</p></div>
            <div className="md:col-span-2"><label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">Content (AM)</label><p className="text-slate-300 mt-1 text-sm font-amharic">{about.content_am || '-'}</p></div>
          </div>
        </SettingsCard>
      )}

      {tab === 'faqs' && (
        <SettingsCard title="FAQs" subtitle="Frequently asked questions" actions={
          <button onClick={() => { setEditingFaq(null); setFaqForm({ question_en: '', question_am: '', answer_en: '', answer_am: '', display_order: 0 }); setFaqModalOpen(true); }} className="px-6 py-2.5 rounded-2xl bg-amber-500 text-black font-bold hover:bg-amber-400 transition">Add FAQ</button>
        }>
          <SettingsTable columns={faqColumns} data={faqs} loading={loading} emptyMessage="No FAQs found" onEdit={(faq) => { setEditingFaq(faq); setFaqForm({ question_en: faq.question_en, question_am: faq.question_am, answer_en: faq.answer_en, answer_am: faq.answer_am, display_order: faq.display_order }); setFaqModalOpen(true); }} onDelete={handleDeleteFaq} />
        </SettingsCard>
      )}

      <SettingsModal isOpen={annModalOpen} onClose={() => { setAnnModalOpen(false); setEditingAnn(null); }} title={editingAnn ? 'Edit Announcement' : 'Add Announcement'} onSubmit={handleAnnSubmit}>
        <SettingsForm label="Title (EN)" required><input value={annForm.title_en} onChange={(e) => setAnnForm({ ...annForm, title_en: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
        <SettingsForm label="Title (AM)" required><input value={annForm.title_am} onChange={(e) => setAnnForm({ ...annForm, title_am: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none font-amharic" /></SettingsForm>
        <SettingsForm label="Content (EN)"><textarea rows={3} value={annForm.content_en} onChange={(e) => setAnnForm({ ...annForm, content_en: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
        <SettingsForm label="Content (AM)"><textarea rows={3} value={annForm.content_am} onChange={(e) => setAnnForm({ ...annForm, content_am: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none font-amharic" /></SettingsForm>
        <SettingsForm label="Badge"><input value={annForm.badge} onChange={(e) => setAnnForm({ ...annForm, badge: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
        <SettingsForm label="Active"><label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={annForm.is_active} onChange={(e) => setAnnForm({ ...annForm, is_active: e.target.checked })} className="w-5 h-5 rounded accent-amber-500" /><span className="text-sm text-slate-300">Enabled</span></label></SettingsForm>
      </SettingsModal>

      <SettingsModal isOpen={testModalOpen} onClose={() => { setTestModalOpen(false); setEditingTest(null); }} title={editingTest ? 'Edit Testimonial' : 'Add Testimonial'} onSubmit={handleTestSubmit}>
        <SettingsForm label="Name" required><input value={testForm.name} onChange={(e) => setTestForm({ ...testForm, name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
        <SettingsForm label="Role (EN)"><input value={testForm.role_en} onChange={(e) => setTestForm({ ...testForm, role_en: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
        <SettingsForm label="Role (AM)"><input value={testForm.role_am} onChange={(e) => setTestForm({ ...testForm, role_am: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none font-amharic" /></SettingsForm>
        <SettingsForm label="Comment (EN)"><textarea rows={3} value={testForm.comment_en} onChange={(e) => setTestForm({ ...testForm, comment_en: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
        <SettingsForm label="Comment (AM)"><textarea rows={3} value={testForm.comment_am} onChange={(e) => setTestForm({ ...testForm, comment_am: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none font-amharic" /></SettingsForm>
        <SettingsForm label="Avatar URL"><input value={testForm.avatar} onChange={(e) => setTestForm({ ...testForm, avatar: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
        <SettingsForm label="Rating"><input type="number" min="1" max="5" value={testForm.rating} onChange={(e) => setTestForm({ ...testForm, rating: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
        <SettingsForm label="Approved"><label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={testForm.is_approved} onChange={(e) => setTestForm({ ...testForm, is_approved: e.target.checked })} className="w-5 h-5 rounded accent-amber-500" /><span className="text-sm text-slate-300">Enabled</span></label></SettingsForm>
      </SettingsModal>

      <SettingsModal isOpen={aboutModalOpen} onClose={() => setAboutModalOpen(false)} title="Edit About Page" onSubmit={handleAboutSubmit}>
        <SettingsForm label="Title (EN)" required><input value={aboutForm.title_en} onChange={(e) => setAboutForm({ ...aboutForm, title_en: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
        <SettingsForm label="Title (AM)" required><input value={aboutForm.title_am} onChange={(e) => setAboutForm({ ...aboutForm, title_am: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none font-amharic" /></SettingsForm>
        <SettingsForm label="Content (EN)" required><textarea rows={4} value={aboutForm.content_en} onChange={(e) => setAboutForm({ ...aboutForm, content_en: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
        <SettingsForm label="Content (AM)" required><textarea rows={4} value={aboutForm.content_am} onChange={(e) => setAboutForm({ ...aboutForm, content_am: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none font-amharic" /></SettingsForm>
      </SettingsModal>

      <SettingsModal isOpen={faqModalOpen} onClose={() => { setFaqModalOpen(false); setEditingFaq(null); }} title={editingFaq ? 'Edit FAQ' : 'Add FAQ'} onSubmit={handleFaqSubmit}>
        <SettingsForm label="Question (EN)" required><input value={faqForm.question_en} onChange={(e) => setFaqForm({ ...faqForm, question_en: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
        <SettingsForm label="Question (AM)" required><input value={faqForm.question_am} onChange={(e) => setFaqForm({ ...faqForm, question_am: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none font-amharic" /></SettingsForm>
        <SettingsForm label="Answer (EN)"><textarea rows={3} value={faqForm.answer_en} onChange={(e) => setFaqForm({ ...faqForm, answer_en: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
        <SettingsForm label="Answer (AM)"><textarea rows={3} value={faqForm.answer_am} onChange={(e) => setFaqForm({ ...faqForm, answer_am: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none font-amharic" /></SettingsForm>
        <SettingsForm label="Display Order"><input type="number" value={faqForm.display_order} onChange={(e) => setFaqForm({ ...faqForm, display_order: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" /></SettingsForm>
      </SettingsModal>
    </div>
  );
}
