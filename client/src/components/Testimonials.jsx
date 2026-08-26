import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Star, ChevronLeft, ChevronRight, Quote, ShieldCheck, Building2, UserCheck, Heart, X, CheckCircle2 } from 'lucide-react';
import OptimizedImage from './OptimizedImage';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';

export const defaultTestimonialsData = [
  {
    id: 1,
    name: 'Dr. Yared Assefa',
    roleEn: 'Medical Specialist',
    roleAm: 'የህክምና ባለሙያ',
    locationEn: 'Injibara (Hospital Area)',
    locationAm: 'እንጅባራ (ሆስፒታል አካባቢ)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80',
    rating: 5,
    houseTypeEn: '3-Bedroom Luxury Apartment',
    houseTypeAm: 'ባለ 3 መኝታ ቅንጡ አፓርታማ',
    commentEn: 'Finding a fully furnished apartment near Agni Hospital in Injibara was seamless. The direct chat feature allowed me to contact the landlord immediately without middleman delay!',
    commentAm: 'በእንጅባራ ሆስፒታል አካባቢ የተሟላ ቤት ማግኘት በጣም ቀላል ነበር። ያለ ደላላ በቀጥታ ከቤት ባለቤቱ ጋር መነጋገር መቻሌ በጣም ጠቅሞኛል!',
    badgeEn: 'Verified Tenant',
    badgeAm: 'የተረጋገጠ ተከራይ',
  },
  {
    id: 2,
    name: 'Woyneshet Girma',
    roleEn: 'Boutique Business Owner',
    roleAm: 'የንግድ ስራ ባለቤት',
    locationEn: 'Injibara (Kebele 01 City Center)',
    locationAm: 'እንጅባራ (ቀበሌ 01 መሃል ከተማ)',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80',
    rating: 5,
    houseTypeEn: 'Prime Commercial Retail Shop',
    houseTypeAm: 'የንግድ ሱቅ ቦታ',
    commentEn: 'I expanded my clothing shop in Injibara town center and found an ideal commercial space through Injibara House Broker. Clear terms gave me total peace of mind.',
    commentAm: 'የልብስ ሱቄን በእንጅባራ ከተማ መሃል ለማስፋፋት በጣም ተስማሚ ቦታ አግኝቻለሁ። ግልጽ አሰራር ስላለው በጣም ደስተኛ ነኝ።',
    badgeEn: 'Commercial Tenant',
    badgeAm: 'የንግድ ተከራይ',
  },
  {
    id: 3,
    name: 'Ato Solomon Worku',
    roleEn: 'Property Owner & Investor',
    roleAm: 'የቤት ባለቤት',
    locationEn: 'Injibara (Kebele 02 & Bus Station)',
    locationAm: 'እንጅባራ (ቀበሌ 02 አውቶቡስ ተራ)',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80',
    rating: 5,
    houseTypeEn: '2 Private Family Villas',
    houseTypeAm: '2 የግል ቪላ ቤቶች',
    commentEn: 'As a landlord in Injibara, listing my properties here connected me with reliable tenants in under 3 days. The tenant request tracking and contract generation are top notch!',
    commentAm: 'እንደ ቤት ባለቤት ቤቴን በዚህ መድረክ ላይ ካወጣሁ በ3 ቀናት ውስጥ አስተማማኝ ተከራይ አግኝቻለሁ። አሰራሩ በጣም ዘመናዊና አስተማማኝ ነው።',
    badgeEn: 'Property Owner',
    badgeAm: 'የቤት ባለቤት',
  },
  {
    id: 4,
    name: 'Bethlehem Tadesse',
    roleEn: 'Lecturer',
    roleAm: 'መምህር',
    locationEn: 'Injibara University Area',
    locationAm: 'እንጅባራ ዩኒቨርሲቲ አካባቢ',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80',
    rating: 5,
    houseTypeEn: 'Modern Studio Apartment',
    houseTypeAm: 'ዘመናዊ ስቱዲዮ አፓርታማ',
    commentEn: 'The location filter for Injibara University area works flawlessly. I joined the university and found my cozy studio apartment on day one.',
    commentAm: 'የዩኒቨርሲቲው አካባቢ ማጣሪያ በጣም ጠቃሚ ነው። ስራ እንደጀመርኩ ወዲያውኑ ምቹ የሆነ ቤት አግኝቻለሁ።',
    badgeEn: 'Verified Tenant',
    badgeAm: 'የተረጋገጠ ተከራይ',
  },
];

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [settings, setSettings] = useState({});
  const [dbTestimonials, setDbTestimonials] = useState([]);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    location: '',
    houseType: '',
    rating: 5,
    comment: ''
  });

  const { language, t } = useLanguage();

  const fetchPublicTestimonials = () => {
    axios.get('/api/testimonials').then(res => {
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setDbTestimonials(res.data);
      }
    }).catch(err => console.error(err));
  };

  useEffect(() => {
    axios.get('/api/settings').then(res => {
      if (res.data) setSettings(res.data);
    }).catch(err => console.error(err));

    fetchPublicTestimonials();
  }, []);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.comment) {
      alert(language === 'am' ? 'እባክዎን ስምዎን እና አስተያየትዎን ያስገቡ' : 'Please provide your name and review comment');
      return;
    }
    if (!avatarFile) {
      alert(language === 'am' ? 'እባክዎን የፕሮፋይል ፎቶዎን ያስገቡ (ግዴታ ነው)' : 'Please upload your profile photo (Required)');
      return;
    }
    setSubmitting(true);
    try {
      // 1. Upload profile image
      const uploadForm = new FormData();
      uploadForm.append('image', avatarFile);

      const uploadRes = await axios.post('/api/testimonials/upload', uploadForm, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const uploadedAvatarUrl = uploadRes.data.image_url;

      // 2. Submit review with the uploaded avatar URL
      await axios.post('/api/testimonials/submit', {
        name: formData.name,
        role_en: formData.role || 'Tenant / Customer',
        role_am: formData.role || 'ተገልጋይ / ተከራይ',
        location_en: formData.location || 'Injibara City',
        location_am: formData.location || 'እንጅባራ ከተማ',
        house_type_en: formData.houseType || 'Rented Property',
        house_type_am: formData.houseType || 'የተከራዩት ቤት',
        avatar: uploadedAvatarUrl,
        rating: formData.rating,
        comment_en: formData.comment,
        comment_am: formData.comment,
        badge_en: 'Customer Review',
        badge_am: 'የተጠቃሚ አስተያየት'
      });
      setSubmitting(false);
      setSubmitSuccess(true);
      setFormData({ name: '', role: '', location: '', houseType: '', rating: 5, comment: '' });
      setAvatarFile(null);
      setAvatarPreview('');
    } catch (err) {
      setSubmitting(false);
      alert(language === 'am' ? 'አስተያየት ማስገባት አልተሳካም። እባክዎ ደግመው ይሞክሩ።' : 'Failed to submit review. Please try again.');
    }
  };

  const baseTestimonials = (Array.isArray(dbTestimonials) && dbTestimonials.length > 0) 
    ? dbTestimonials 
    : defaultTestimonialsData.map(item => ({ ...item }));
  
  // Apply setting overrides if still using defaults
  if (!dbTestimonials || dbTestimonials.length === 0) {
    if (baseTestimonials[0]) {
      baseTestimonials[0].comment = language === 'am' ? (settings.testimonial_1_text_am || settings.testimonial_1_text || baseTestimonials[0].comment) : (settings.testimonial_1_text || baseTestimonials[0].comment);
      baseTestimonials[0].name = language === 'am' ? (settings.testimonial_1_author_am || settings.testimonial_1_author || baseTestimonials[0].name) : (settings.testimonial_1_author || baseTestimonials[0].name);
    }
    if (baseTestimonials[1]) {
      baseTestimonials[1].comment = language === 'am' ? (settings.testimonial_2_text_am || settings.testimonial_2_text || baseTestimonials[1].comment) : (settings.testimonial_2_text || baseTestimonials[1].comment);
      baseTestimonials[1].name = language === 'am' ? (settings.testimonial_2_author_am || settings.testimonial_2_author || baseTestimonials[1].name) : (settings.testimonial_2_author || baseTestimonials[1].name);
    }
  }

  useEffect(() => {
    if (baseTestimonials.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % baseTestimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [baseTestimonials.length]);

  const nextSlide = () => {
    if (baseTestimonials.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % baseTestimonials.length);
  };

  const prevSlide = () => {
    if (baseTestimonials.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + baseTestimonials.length) % baseTestimonials.length);
  };

  const current = baseTestimonials[currentIndex] || null;

  if (!current) return null;

  return (
    <section className="bg-slate-950 text-white py-20 relative overflow-hidden border-t border-amber-500/20">
      {/* Background Lighting Accents */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-yellow-600/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
      >
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-extrabold text-xs px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
            <Heart size={14} className="fill-amber-400" />
            <span>{t('customerExperience')}</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            {t('testimonialTitle')}
          </h2>
          <p className="text-sm md:text-base text-slate-400 font-light">
            {t('testimonialSubtitle')}
          </p>
          <div>
            <button
              onClick={() => { setIsSubmitOpen(true); setSubmitSuccess(false); }}
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 py-3 rounded-2xl shadow-lg transition transform hover:-translate-y-0.5"
            >
              <Heart size={18} className="fill-slate-950" />
              <span>{language === 'am' ? '✍️ አስተያየትዎን ያጋሩ (Share Your Review)' : '✍️ Share Your Experience'}</span>
            </button>
          </div>
        </div>

        {/* Testimonials Carousel Card */}
        <div className="max-w-4xl mx-auto bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-amber-500/30 p-8 md:p-12 shadow-2xl relative">
          
          <AnimatePresence mode="wait">
            <motion.div 
              key={current.id}
              initial={{ opacity: 0, scale: 0.95, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: -20 }}
              transition={{ duration: 0.5 }}
              className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8"
            >
            
            {/* Avatar & Badge */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="relative">
                <OptimizedImage
                  src={current.avatar}
                  alt={current.name}
                  className="w-24 h-24 md:w-28 md:h-28 rounded-2xl border-2 border-gold shadow-xl"
                />
                <div className="absolute -bottom-2 -right-2 bg-slate-950 p-1.5 rounded-xl border border-amber-500/40 text-gold shadow-md">
                  <ShieldCheck size={18} />
                </div>
              </div>

              <span className="mt-3 inline-block text-[11px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
                {language === 'am' 
                  ? (current.badge_am || current.badgeAm || current.badge) 
                  : (current.badge_en || current.badgeEn || current.badge)}
              </span>
            </div>

            {/* Testimonial Content */}
            <div className="flex-1 text-center md:text-left space-y-4">
              
              {/* Star Rating */}
              <div className="flex items-center justify-center md:justify-start gap-1">
                {[...Array(current.rating)].map((_, i) => (
                  <Star key={i} size={18} className="text-gold fill-gold" />
                ))}
              </div>

              {/* Comment Text */}
              <p className="text-slate-200 text-base md:text-lg font-light leading-relaxed italic">
                "{language === 'am' 
                  ? (current.comment_am || current.commentAm || current.comment) 
                  : (current.comment_en || current.commentEn || current.comment)}"
              </p>

              {/* Author Info */}
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-lg font-black text-white">{current.name}</h4>
                  <p className="text-xs text-amber-400 font-semibold">
                    {language === 'am' 
                      ? (current.role_am || current.roleAm || current.role) 
                      : (current.role_en || current.roleEn || current.role)} • {language === 'am' 
                      ? (current.location_am || current.locationAm || current.location) 
                      : (current.location_en || current.locationEn || current.location)}
                  </p>
                </div>

                <div className="inline-flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
                  <Building2 size={14} className="text-amber-400" />
                  <span>
                    {language === 'am' 
                      ? (current.house_type_am || current.houseTypeAm || current.houseType) 
                      : (current.house_type_en || current.houseTypeEn || current.houseType)}
                  </span>
                </div>
              </div>

            </div>

          </motion.div>
          </AnimatePresence>

          {/* Carousel Controls */}
          <div className="mt-10 pt-6 border-t border-slate-800/80 flex items-center justify-between">
            
            {/* Dots */}
            <div className="flex items-center gap-2">
              {baseTestimonials.map((t, idx) => (
                <button
                  key={t.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2.5 rounded-full transition-all cursor-pointer ${
                    idx === currentIndex
                      ? 'w-8 bg-gold'
                      : 'w-2.5 bg-slate-700 hover:bg-slate-500'
                  }`}
                  aria-label={`Go to testimonial ${idx + 1}`}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={prevSlide}
                className="w-10 h-10 rounded-xl bg-slate-950 hover:bg-gold hover:text-slate-950 text-white border border-slate-800 flex items-center justify-center transition cursor-pointer"
                aria-label="Previous Testimonial"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={nextSlide}
                className="w-10 h-10 rounded-xl bg-slate-950 hover:bg-gold hover:text-slate-950 text-white border border-slate-800 flex items-center justify-center transition cursor-pointer"
                aria-label="Next Testimonial"
              >
                <ChevronRight size={20} />
              </button>
            </div>

          </div>

        </div>

      </motion.div>

      {/* CUSTOMER TESTIMONIAL SUBMISSION MODAL */}
      {isSubmitOpen && (
        <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-md flex items-start justify-center p-4 pt-20 sm:pt-28 pb-12 overflow-y-auto">
          <div className="bg-slate-900 border border-amber-500/30 p-6 md:p-8 rounded-3xl w-full max-w-xl shadow-2xl space-y-6 relative text-white my-4">
            <button
              onClick={() => setIsSubmitOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/60 transition"
            >
              <X size={20} />
            </button>

            {submitSuccess ? (
              <div className="text-center py-8 space-y-4 animate-fadeIn">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="text-2xl font-black text-amber-400">
                  {language === 'am' ? 'አስተያየትዎ ስኬታማ በሆነ መንገድ ተልኳል!' : 'Testimonial Submitted Successfully!'}
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed max-w-md mx-auto">
                  {language === 'am' 
                    ? 'እናመሰግናለን! አስተያየትዎ በአስተዳዳሪው ከተገመገመና ከጸደቀ በኋላ በዋናው ገጽ ላይ ይወጣል!' 
                    : 'Thank you for sharing your experience! Your testimonial has been submitted and will appear on the homepage once approved by admin.'}
                </p>
                <button
                  onClick={() => setIsSubmitOpen(false)}
                  className="px-6 py-3 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400 transition"
                >
                  {language === 'am' ? 'ዝጋ (Close)' : 'Close Window'}
                </button>
              </div>
            ) : (
              <div>
                <div className="mb-6 space-y-1">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
                    {language === 'am' ? 'የተገልጋይ አስተያየት' : 'Customer Review'}
                  </span>
                  <h3 className="text-2xl font-black text-white pt-2">
                    {language === 'am' ? 'አስተያየትዎን እና ተሞክሮዎን ያጋሩ' : 'Share Your Experience'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {language === 'am' 
                      ? 'ስለ አገልግሎታችን ወይም ስለተከራዩት ቤት ያለዎትን አስተያየት ለሌሎች ያጋሩ።' 
                      : 'Tell others about your renting or house broker experience in Injibara.'}
                  </p>
                </div>

                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        {language === 'am' ? 'ሙሉ ስም *' : 'Full Name *'}
                      </label>
                      <input
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder={language === 'am' ? 'ምሳሌ፡ ዮሐንስ ተስፋዬ' : 'e.g. Yohannes Tesfaye'}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:border-amber-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        {language === 'am' ? 'ስራ / የጥያቄ ዓይነት' : 'Role / Title'}
                      </label>
                      <input
                        value={formData.role}
                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                        placeholder={language === 'am' ? 'ምሳሌ፡ ተከራይ / የህክምና ባለሙያ' : 'e.g. Tenant / Lecturer'}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:border-amber-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        {language === 'am' ? 'አካባቢ / ከተማ' : 'Location / Area'}
                      </label>
                      <input
                        value={formData.location}
                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                        placeholder={language === 'am' ? 'ምሳሌ፡ እንጅባራ ቀበሌ 01' : 'e.g. Injibara Kebele 01'}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:border-amber-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        {language === 'am' ? 'የተከራዩት ቤት ዓይነት' : 'Rented Property Type'}
                      </label>
                      <input
                        value={formData.houseType}
                        onChange={e => setFormData({ ...formData, houseType: e.target.value })}
                        placeholder={language === 'am' ? 'ምሳሌ፡ ባለ 2 መኝታ አፓርታማ' : 'e.g. 2-Bedroom Apartment'}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                      <span>{language === 'am' ? 'የፕሮፋይል ፎቶ * (ግዴታ)' : 'Profile Photo * (Required)'}</span>
                    </label>
                    <div className="flex items-center gap-4 bg-slate-950 border border-slate-700 p-4 rounded-xl">
                      <div className="relative w-14 h-14 rounded-full border-2 border-slate-700 bg-slate-900 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {avatarPreview ? (
                          <OptimizedImage src={avatarPreview} alt="Preview" className="w-full h-full object-cover" width={56} height={56} />
                        ) : (
                          <UserCheck className="w-6 h-6 text-slate-500" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <input
                          type="file"
                          accept="image/*"
                          required
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setAvatarFile(file);
                              setAvatarPreview(URL.createObjectURL(file));
                            }
                          }}
                          className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-white hover:file:bg-slate-700 cursor-pointer"
                        />
                        <p className="text-[10px] text-slate-400">
                          {language === 'am' ? 'ምስል ፋይል ብቻ (ከ 5MB በታች)' : 'Image files only (under 5MB)'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      {language === 'am' ? 'ደረጃ (Rating)' : 'Rating (1 - 5 Stars)'}
                    </label>
                    <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 p-3 rounded-xl">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFormData({ ...formData, rating: star })}
                          className="p-1 hover:scale-125 transition"
                        >
                          <Star
                            size={24}
                            className={star <= formData.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-amber-400 ml-2">{formData.rating} / 5 Stars</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      {language === 'am' ? 'ያለዎት አስተያየት / ተሞክሮ *' : 'Your Review & Feedback *'}
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.comment}
                      onChange={e => setFormData({ ...formData, comment: e.target.value })}
                      placeholder={language === 'am' ? 'ስለ አገልግሎቱ ያለዎትን ልምድ ወይም አስተያየት እዚህ ይጻፉ...' : 'Write your review here...'}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="pt-2 flex gap-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-3.5 bg-amber-500 text-slate-950 font-extrabold rounded-xl hover:bg-amber-400 transition disabled:opacity-50"
                    >
                      {submitting 
                        ? (language === 'am' ? 'እየተላከ ነው...' : 'Submitting...') 
                        : (language === 'am' ? 'አስተያየት ላክ (Submit)' : 'Submit Review')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsSubmitOpen(false)}
                      className="px-6 py-3.5 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700 transition"
                    >
                      {language === 'am' ? 'ተመለስ' : 'Cancel'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

    </section>
  );
}
