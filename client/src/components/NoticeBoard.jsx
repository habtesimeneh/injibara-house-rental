import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Megaphone, Calendar, ChevronRight, Sparkles, CheckCircle2, ArrowRight, ShieldCheck, HeartHandshake, PhoneCall, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import appConfig from '../config/appConfig';

export default function NoticeBoard({ onPostSeekingRequestClick }) {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [dbAnnouncements, setDbAnnouncements] = useState([]);

  const isAdmin = !!(user && (user.role === 'Admin' || user.role === 'admin') && localStorage.getItem('token'));

  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminForm, setAdminForm] = useState({
    id: null,
    title_en: '',
    title_am: '',
    content_en: '',
    content_am: '',
    badge: 'NEWS',
    is_active: true,
    is_db: false
  });

  useEffect(() => {
    fetchAnnouncements();
  }, [user]);

  const fetchAnnouncements = async () => {
    try {
      const res = await axios.get('/api/announcements?type=homepage_notice');
      if (Array.isArray(res.data)) {
        if (isAdmin) {
          setDbAnnouncements(res.data);
        } else {
          setDbAnnouncements(res.data.filter(a => a.is_active !== false && a.is_active !== 0));
        }
      }
    } catch (err) {
      console.error('Failed to fetch notices:', err);
    }
  };

  const handleAddNewNoticeClick = () => {
    setAdminForm({
      id: null,
      title_en: '',
      title_am: '',
      content_en: '',
      content_am: '',
      badge: 'NEWS',
      is_active: true,
      is_db: false
    });
    setIsAdminModalOpen(true);
  };

  const handleEditNoticeClick = (notice) => {
    setAdminForm({
      id: notice.id,
      title_en: notice.title_en,
      title_am: notice.title_am,
      content_en: notice.content_en,
      content_am: notice.content_am,
      badge: notice.badge,
      is_active: notice.is_active,
      is_db: notice.is_db
    });
    setIsAdminModalOpen(true);
  };

  const handleDeleteNoticeClick = async (id, isDb) => {
    if (!isDb) {
      alert(language === 'am' ? 'ይህ የናሙና ማስታወቂያ ስለሆነ ከዳታቤዝ ሊጠፋ አይችልም። ለማሻሻል ኤዲት (Edit) ያድርጉት።' : 'This is a template notice and cannot be deleted from the database. Try editing it to customize.');
      return;
    }
    if (!window.confirm(language === 'am' ? 'ይህን ማስታወቂያ በእርግጠኝነት ማጥፋት ይፈልጋሉ?' : 'Are you sure you want to delete this notice?')) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/announcements/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAnnouncements();
      alert(language === 'am' ? 'ማስታወቂያው በተሳካ ሁኔታ ተሰርዟል።' : 'Notice deleted successfully.');
    } catch (err) {
      console.error('Delete notice error:', err);
      alert(language === 'am' ? 'ማስታወቂያውን ማጥፋት አልተቻለም።' : 'Failed to delete notice.');
    }
  };

  const handleAdminFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const payload = {
        title_en: adminForm.title_en,
        title_am: adminForm.title_am,
        content_en: adminForm.content_en,
        content_am: adminForm.content_am,
        badge: adminForm.badge,
        is_active: adminForm.is_active ? 1 : 0,
        type: 'homepage_notice'
      };

      if (adminForm.is_db && adminForm.id) {
        await axios.put(`/api/announcements/${adminForm.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert(language === 'am' ? 'ማስታወቂያው በተሳካ ሁኔታ ተሻሽሏል።' : 'Notice updated successfully.');
      } else {
        await axios.post('/api/announcements', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert(language === 'am' ? 'ማስታወቂያው በተሳካ ሁኔታ ተለጥፏል።' : 'Notice published successfully.');
      }
      setIsAdminModalOpen(false);
      fetchAnnouncements();
    } catch (err) {
      console.error('Save notice error:', err);
      alert(language === 'am' ? 'ማስታወቂያውን ማስቀመጥ አልተቻለም።' : 'Failed to save notice.');
    }
  };

  // Sample official platform notices fallback
  const fallbackNotices = [
    {
      id: 1,
      date: '2026-08-07',
      title_am: 'የኤስኤምኤስ (SMS) እና የኢሜይል ማሳወቂያዎች በስራ ላይ ውለዋል!',
      title_en: 'Instant SMS & Email Notifications Now Active!',
      badge: 'NEW',
      content_am: 'አከራዮች እና ተከራዮች በቀጥታ በስልካቸው ላይ የኪራይ ጥያቄዎችን፣ የክፍያ ሁኔታዎችን እና አዳዲስ የቤት ማስታወቂያዎችን በኤስኤምኤስ (SMS) እንዲደርሳቸው የሚያደርግ አዲስ ቴክኖሎጂ ተዘርግቷል። አሁን ግንኙነቱ ይበልጥ ፈጣን ሆኗል!',
      content_en: 'We have launched an advanced SMS & Email alert system. Landlords and tenants will now receive real-time text message alerts for new rental applications, payment approvals, and matching home listings directly on their mobile phones!',
      icon: <Megaphone className="w-5 h-5 text-amber-500" />
    },
    {
      id: 2,
      date: '2026-08-05',
      title_am: 'አስተማማኝ የቤት ፈላጊዎች እና አከራዮች ትስስር ዋስትና',
      title_en: 'Low Commission Landlord-Tenant Matching Guarantee',
      badge: 'OFFER',
      content_am: 'የእንጅባራ የቤት ኪራይ ዋና መስሪያ ቤት በአከራዮች እና በተከራዮች መካከል ምንም ዓይነት አላስፈላጊ መካከለኛ ደላላ ሳይኖር ቀጥታ ትስስር ይፈጥራል። ተከራዮች በአነስተኛ ኮሚሽን እና የአገልግሎት ክፍያ ብቻ ቤቶችን መፈለግ እና ማከራየት ይችላሉ። ከአላስፈላጊ ደላላ ክፍያ ይዳኑ!',
      content_en: 'Injibara House Rentals Head Office offers a direct connection between landlords and house seekers. No unfair middlemen, with low commission and service fee only. Search and secure rental homes easily and affordably!',
      icon: <HeartHandshake className="w-5 h-5 text-emerald-500" />
    },
    {
      id: 3,
      date: '2026-08-01',
      title_am: 'የእንጅባራ የቤት ኪራይ ዋና መስሪያ ቤት አድራሻ እና የቤት ማረጋገጫ ሂደት',
      title_en: 'Injibara House Rentals Head Office & Verification Services',
      badge: 'SUPPORT',
      content_am: `ዋናው ቢሯችን በእንጅባራ ከተማ ቀበሌ 01 ከኢትዮጵያ ንግድ ባንክ (CBE) ጀርባ ይገኛል። ቤቶችን በአካል ሄደን የምናረጋግጥ ሲሆን፣ ደንበኞቻችን ወደ ቢሯችን በመምጣት ወይም በስልክ ቁጥር ${appConfig.supportPhone} ደውለው በአነስተኛ ኮሚሽን እና የአገልግሎት ክፍያ ፈጣን አገልግሎት ማግኘት ይችላሉ።`,
      content_en: `Our head office is located in Injibara, Kebele 01, behind the Commercial Bank of Ethiopia (CBE) branch. We physically verify listed homes for your security. Drop by or call us at ${appConfig.supportPhone} for rapid support with low commission and service fee only.`,
      icon: <ShieldCheck className="w-5 h-5 text-blue-500" />
    }
  ];

  const noticesList = dbAnnouncements.length > 0 
    ? dbAnnouncements.map(item => ({
        id: item.id,
        is_db: true,
        is_active: item.is_active !== false && item.is_active !== 0,
        date: item.created_at ? item.created_at.substring(0, 10) : '2026-08-01',
        title_am: item.title_am || item.title_en,
        title_en: item.title_en || item.title_am,
        badge: item.badge || 'NEWS',
        content_am: item.content_am || item.content_en || '',
        content_en: item.content_en || item.content_am || '',
        icon: item.badge === 'OFFER' ? <HeartHandshake className="w-5 h-5 text-emerald-500" /> : item.badge === 'SUPPORT' ? <ShieldCheck className="w-5 h-5 text-blue-500" /> : <Megaphone className="w-5 h-5 text-amber-500" />
      }))
    : fallbackNotices.map(item => ({
        ...item,
        is_db: false,
        is_active: true
      }));

  const promotionalBanners = [
    {
      titleAm: 'ቤትዎን በደቂቃዎች ውስጥ ያከራዩ!',
      titleEn: 'Rent Your House in Minutes!',
      subtitleAm: 'አስተማማኝ ተከራይ በፈጣን ሰዓት ለማግኘት ማስታወቂያዎን በመጀመሪያ ገጽ ላይ ያሳዩ።',
      subtitleEn: 'Boost your rental listing on top of our homepage for 5x more views and rapid bookings.',
      actionAm: 'አሁኑኑ ያስተዋውቁ',
      actionEn: 'Promote Listing',
      route: '/dashboard'
    },
    {
      titleAm: 'የሚፈልጉትን የቤት ዓይነት አላገኙም?',
      titleEn: 'Looking for a Specific Rental?',
      subtitleAm: 'የሚፈልጉትን የቤት ዓይነት እና ዝርዝር መረጃ በቤት ፈላጊ ሰሌዳ ላይ ይመዝገቡ፤ አከራዮች ያገኙዎታል።',
      subtitleEn: 'Post a "Seeking Ad" on our notice board so landlords with matching homes can call you directly.',
      actionAm: 'ፍላጎትዎን ይመዝግቡ',
      actionEn: 'Post Seeking Request',
      route: '/dashboard'
    }
  ];

  return (
    <section id="notice-board-section" className="bg-white border-t border-gray-100 py-16 sm:py-20 relative overflow-hidden">
      {/* Dynamic Background Accents */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-gray-100 pb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-700 text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full mb-3 border border-amber-500/20">
              <Sparkles size={13} className="animate-pulse" />
              <span>{language === 'am' ? 'የማስታወቂያ ሰሌዳ' : 'Notice & Announcement Board'}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight">
              {language === 'am' ? 'ይፋዊ መግለጫዎች እና የፕሮሞሽን ማስታወቂያዎች' : 'Official Notices & Promotional Advertisements'}
            </h2>
            <p className="text-gray-500 text-sm sm:text-base mt-2 max-w-2xl font-medium">
              {language === 'am' 
                ? 'በእንጅባራ ከተማ እና አካባቢው ያሉ ወቅታዊ መረጃዎችን፣ የቤት ኪራይ ጠቃሚ ምክሮችን እና የተረጋገጡ ማስታወቂያዎችን እዚህ ያግኙ።'
                : 'Stay updated with verified platform updates, direct rental rules, and featured promotion slots in Injibara City.'}
            </p>
          </div>
          <button
            onClick={() => navigate('/contact')}
            className="flex items-center gap-2 bg-gray-100 hover:bg-amber-500 hover:text-slate-950 text-gray-800 font-bold px-5 py-3 rounded-2xl text-xs sm:text-sm transition self-start md:self-auto cursor-pointer"
          >
            <PhoneCall size={16} />
            <span>{language === 'am' ? 'ቢሮአችንን ያግኙ' : 'Contact Office'}</span>
          </button>
        </div>

        {/* Layout Grid: Left Column (Notices) & Right Column (Promos) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column (8 cols): Official Notices List */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between gap-4 mb-3">
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Megaphone className="text-amber-500 w-5 h-5" />
                <span>{language === 'am' ? 'ወቅታዊ የፕላትፎርም መረጃዎች' : 'Platform Notices & Updates'}</span>
              </h3>
              {isAdmin && (
                <button
                  onClick={handleAddNewNoticeClick}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer flex items-center gap-1 shadow-md shadow-amber-500/15"
                >
                  + Add New Notice
                </button>
              )}
            </div>

            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {noticesList.map((notice, index) => (
                  <motion.div 
                    key={notice.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    onClick={() => setSelectedNotice(notice)}
                    className={`bg-slate-50 hover:bg-amber-50/40 border ${!notice.is_active ? 'border-red-200 opacity-75' : 'border-gray-100'} hover:border-amber-500/30 rounded-2xl p-5 transition cursor-pointer flex gap-4 shadow-sm group relative`}
                  >
                  <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition duration-300">
                    {notice.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] sm:text-xs font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                          {notice.badge}
                        </span>
                        {!notice.is_active && (
                          <span className="text-[9px] font-black text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                            INACTIVE
                          </span>
                        )}
                        {notice.is_active && isAdmin && (
                          <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-semibold">
                          <Calendar size={12} />
                          <span>{notice.date}</span>
                        </div>
                        {isAdmin && (
                          <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => handleEditNoticeClick(notice)}
                              className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 rounded-lg text-xs font-black transition cursor-pointer"
                              title="Edit"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteNoticeClick(notice.id, notice.is_db)}
                              className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-800 border border-red-300 rounded-lg text-xs font-black transition cursor-pointer"
                              title="Delete"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <h4 className="font-extrabold text-gray-900 text-sm sm:text-base group-hover:text-amber-600 transition truncate">
                      {language === 'am' ? notice.title_am : notice.title_en}
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-2 leading-relaxed font-medium">
                      {language === 'am' ? notice.content_am : notice.content_en}
                    </p>
                    <span className="text-xs font-black text-amber-600 group-hover:underline inline-flex items-center gap-1 mt-2">
                      <span>{language === 'am' ? 'ሙሉውን አንብብ' : 'Read Full Notice'}</span>
                      <ChevronRight size={14} className="group-hover:translate-x-1 transition duration-200" />
                    </span>
                  </div>
                </motion.div>
              ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Column (5 cols): Promotional Board & Fast Actions */}
          <div className="lg:col-span-5 space-y-6">
            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 mb-2">
              <Sparkles className="text-amber-500 w-5 h-5" />
              <span>{language === 'am' ? 'ማስታወቂያዎችን ይለጥፉ' : 'Sponsor & Promote Ads'}</span>
            </h3>

            <div className="space-y-4">
              {promotionalBanners.map((promo, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.2 }}
                  onClick={() => {
                    if (idx === 1) {
                      if (onPostSeekingRequestClick) {
                        onPostSeekingRequestClick();
                      } else {
                        navigate(promo.route + '?tab=seeking_ads&openForm=true');
                      }
                    } else {
                      navigate(promo.route);
                    }
                  }}
                  className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl relative overflow-hidden group hover:border-amber-500/50 transition duration-300 cursor-pointer"
                >
                  {/* Subtle vector background circle */}
                  <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-amber-500/10 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition duration-500"></div>
                  
                  <div className="flex items-center gap-1.5 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">PROMOTION SLOT</span>
                  </div>

                  <h4 className="text-base sm:text-lg font-black text-white mb-2 leading-snug">
                    {language === 'am' ? promo.titleAm : promo.titleEn}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    {language === 'am' ? promo.subtitleAm : promo.subtitleEn}
                  </p>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (idx === 1) {
                        if (onPostSeekingRequestClick) {
                          onPostSeekingRequestClick();
                        } else {
                          navigate(promo.route + '?tab=seeking_ads&openForm=true');
                        }
                      } else {
                        navigate(promo.route);
                      }
                    }}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10 transition cursor-pointer"
                  >
                    <span>{language === 'am' ? promo.actionAm : promo.actionEn}</span>
                    <ArrowRight size={14} />
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Platform Help desk box */}
            <div className="bg-amber-50 border border-amber-200/50 rounded-2xl p-5">
              <h4 className="font-bold text-slate-900 text-sm mb-1">
                {language === 'am' ? 'የማስታወቂያ ስፓንሰርሽፕ እገዛ ይፈልጋሉ?' : 'Need Help Sponsoring Your Ad?'}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                {language === 'am' 
                  ? 'ቤትዎ ወይም ፍላጎትዎ መጀመሪያ ገጽ ላይ እንዲወጣ መለያ በመክፈት ወይም በእኛ የቴሌግራም/ስልክ ድጋፍ አማካኝነት ማግኘት ይችላሉ።'
                  : 'To list featured banner ads or manage premium tenant spots, you can apply directly in your dashboard or contact our customer support team.'}
              </p>
              <div className="flex items-center justify-between text-xs font-extrabold text-amber-700">
                <span>Telegram: @InjibaraHouseSupport</span>
                <span>Tel: {appConfig.supportPhone}</span>
              </div>
            </div>

          </div>

        </div>

      </motion.div>

      {/* Expandable Notice Detail Modal */}
      {selectedNotice && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-gray-100 shadow-2xl relative text-gray-900 animate-scaleUp">
            
            <button
              onClick={() => setSelectedNotice(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition cursor-pointer"
              title="Close Details"
            >
              &times;
            </button>

            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                {selectedNotice.icon}
              </div>
              <div>
                <span className="text-[11px] font-black text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {selectedNotice.badge}
                </span>
                <p className="text-xs text-gray-400 font-semibold mt-1">Posted: {selectedNotice.date}</p>
              </div>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-gray-900 leading-snug mb-4">
              {language === 'am' ? selectedNotice.title_am : selectedNotice.title_en}
            </h3>

            <div className="bg-slate-50 border border-gray-100 rounded-2xl p-5 mb-6 text-sm text-gray-700 leading-relaxed font-medium whitespace-pre-wrap">
              {language === 'am' ? selectedNotice.content_am : selectedNotice.content_en}
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-gray-100 pt-5">
              <span className="text-xs text-gray-400 font-semibold">Injibara House Rentals Head Office</span>
              <button
                onClick={() => setSelectedNotice(null)}
                className="bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white font-black px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
              >
                {language === 'am' ? 'ዝጋ' : 'Close'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Admin Notice Add/Edit Modal */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-gray-200 shadow-2xl relative text-gray-900 animate-scaleUp max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setIsAdminModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition cursor-pointer font-black text-lg"
              title="Close"
            >
              &times;
            </button>

            <div className="flex items-center gap-2 mb-6">
              <Megaphone className="text-amber-600 w-6 h-6" />
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                {adminForm.id 
                  ? (language === 'am' ? 'ይፋዊ መግለጫን ማሻሻያ' : 'Edit Homepage Notice') 
                  : (language === 'am' ? 'አዲስ ይፋዊ መግለጫ መለጠፊያ' : 'Add New Homepage Notice')}
              </h3>
            </div>

            <form onSubmit={handleAdminFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">
                  {language === 'am' ? 'የማስታወቂያ ባጅ (ለምሳሌ NEWS, OFFER, SUPPORT)' : 'Badge/Tag (e.g. NEWS, OFFER, SUPPORT)'}
                </label>
                <input
                  type="text"
                  required
                  value={adminForm.badge}
                  onChange={e => setAdminForm({ ...adminForm, badge: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none font-extrabold uppercase tracking-wider"
                  placeholder="e.g. NEWS, OFFER, SUPPORT"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    {language === 'am' ? 'ርዕስ (በእንግሊዝኛ)' : 'Title (English)'}
                  </label>
                  <input
                    type="text"
                    required
                    value={adminForm.title_en}
                    onChange={e => setAdminForm({ ...adminForm, title_en: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none font-bold"
                    placeholder="e.g. New SMS service launched!"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    {language === 'am' ? 'ርዕስ (በአማርኛ)' : 'Title (Amharic)'}
                  </label>
                  <input
                    type="text"
                    required
                    value={adminForm.title_am}
                    onChange={e => setAdminForm({ ...adminForm, title_am: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none font-bold"
                    placeholder="ለምሳሌ፡ የኤስኤምኤስ አገልግሎት ተጀመረ!"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">
                  {language === 'am' ? 'ዝርዝር መግለጫ (በእንግሊዝኛ)' : 'Detailed Content (English)'}
                </label>
                <textarea
                  rows={3}
                  required
                  value={adminForm.content_en}
                  onChange={e => setAdminForm({ ...adminForm, content_en: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none leading-relaxed"
                  placeholder="Detailed description of the update..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">
                  {language === 'am' ? 'ዝርዝር መግለጫ (በአማርኛ)' : 'Detailed Content (Amharic)'}
                </label>
                <textarea
                  rows={3}
                  required
                  value={adminForm.content_am}
                  onChange={e => setAdminForm({ ...adminForm, content_am: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none font-medium leading-relaxed"
                  placeholder="የማስታወቂያው ዝርዝር መግለጫ በአማርኛ..."
                />
              </div>

              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="notice-is-active"
                  checked={adminForm.is_active}
                  onChange={e => setAdminForm({ ...adminForm, is_active: e.target.checked })}
                  className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="notice-is-active" className="text-xs sm:text-sm font-bold text-gray-700 cursor-pointer select-none">
                  {language === 'am' ? 'በመጀመሪያ ገጽ ላይ በይፋ ይታይ (Active / Live)' : 'Publish and show active on homepage immediately'}
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAdminModalOpen(false)}
                  className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  {language === 'am' ? 'ውድቅ አድርግ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition cursor-pointer shadow-md shadow-amber-500/10"
                >
                  {adminForm.id 
                    ? (language === 'am' ? 'አሻሽል' : 'Update Notice') 
                    : (language === 'am' ? 'አሁን ልጥፍ' : 'Publish Notice')}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </section>
  );
}
