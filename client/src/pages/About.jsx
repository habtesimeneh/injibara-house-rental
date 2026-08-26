import React, { useEffect, useState } from 'react';
import axios from 'axios';
import CITY_CONFIG from '../config/cityConfig';
import { useLanguage } from '../context/LanguageContext';
import { 
  Home, 
  Users, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  Building2, 
  MapPin, 
  Search, 
  Send, 
  KeyRound, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  PhoneCall, 
  Mail,
  Award,
  Clock,
  Target,
  Eye,
  HeartHandshake,
  TrendingUp,
  Compass,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function About() {
  const [settings, setSettings] = useState({});
  const [aboutData, setAboutData] = useState(null);
  const [dynamicFaqs, setDynamicFaqs] = useState([]);
  const [openFaq, setOpenFaq] = useState(null);
  const [activeRoleTab, setActiveRoleTab] = useState('tenants'); // 'tenants' or 'landlords'
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  useEffect(() => {
    axios.get('/api/settings')
      .then(res => setSettings(res.data))
      .catch(console.error);

    axios.get('/api/about')
      .then(res => {
        if (res.data) setAboutData(res.data);
      })
      .catch(console.error);

    axios.get('/api/about/faqs')
      .then(res => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setDynamicFaqs(res.data);
        }
      })
      .catch(console.error);
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const defaultFaqs = [
    {
      q: language === 'am' ? "በእንጅባራ ሆምስ ቤት ለመከራየት ምን ማድረግ አለብኝ?" : "How do I request to rent a property on EthioHomes?",
      a: language === 'am' ? "ቤቶችን መመልከት ሙሉ በሙሉ ነፃ ነው! የሚወዱትን ቤት ካገኙ በኋላ እንደ ተከራይ ይመዝገቡ፣ ከዚያም 'የኪራይ ጥያቄ' የሚለውን ይጫኑ። ጥያቄዎ በቀጥታ ለቤት ባለቤቱ ይደርሳል፡" : "Browsing properties is completely free! Once you find a house you love, log in or register as a Tenant, click 'Request Rent' or 'View Details', and your application will be sent directly to the landlord for instant review."
    },
    {
      q: language === 'am' ? "አከራዮች ቤታቸውን እንዴት መመዝገብ ይችላሉ?" : "How do landlords list their houses for rent?",
      a: language === 'am' ? "የቤት ባለቤቶች እንደ አከራይ በመመዝገብ በዳሽቦርዳቸው ላይ 'አዲስ ቤት መዝግብ' የሚለውን በመጫን የቤቱን ፎቶ፣ አድራሻ፣ ዋጋ እና ዝርዝር መረጃ በማስገባት መመዝገብ ይችላሉ።" : "Landlords can register for a Landlord account on EthioHomes, navigate to their Dashboard, and easily add property listings with photos, location (Region, City, Sub-city), pricing in ETB, and specific house details."
    },
    {
      q: language === 'am' ? "የትኞቹን የእንጅባራ ከተማ አካባቢዎች ያካትታሉ?" : "Which areas in Injibara City do you cover?",
      a: language === 'am' ? "ሁሉንም የእንጅባራ ከተማ ቀበሌዎችን እና ዋና ዋና ቦታዎችን እናካትታለን። ለምሳሌ ቀበሌ 01 (መሀል ከተማ)፣ ቀበሌ 02፣ ቀበሌ 03፣ ዩኒቨርሲቲ አካባቢ፣ አውቶቡስ ተራ እና ሆስፒታል አካባቢ።" : "We cover all Kebeles and key zones across Injibara City, including Kebele 01 (City Center), Kebele 02, Kebele 03, Injibara University Area, Bus Station Area, and Agni Hospital Area."
    },
    {
      q: language === 'am' ? "የቤት ኪራይ ዋጋዎች በኢትዮጵያ ብር (ETB) ናቸው?" : "Are rental prices listed in Ethiopian Birr (ETB)?",
      a: language === 'am' ? "አዎ፣ ሁሉም የአፓርታማ፣ ቪላ፣ ስቱዲዮ እና የንግድ ቦታዎች ኪራይ ዋጋዎች በግልጽ በኢትዮጵያ ብር (ETB) በወር ተቀምጠዋል።" : "Yes, all rental prices listed across apartments, villas, studios, and commercial spaces are clearly displayed in Ethiopian Birr (ETB) per month."
    },
    {
      q: language === 'am' ? "የኪራይ ጥያቄዬን ሁኔታ እንዴት መከታተል እችላለሁ?" : "How can I track the status of my rental requests?",
      a: language === 'am' ? "ተከራዮች የኪራይ ጥያቄ ካስገቡ በኋላ በዳሽቦርዳቸው ላይ ጥያቄያቸው 'በመጠባበቅ ላይ'፣ 'የተፈቀደ' ወይም 'ውድቅ የተደረገ' መሆኑን በቅጽበት ማየት ይችላሉ።" : "After submitting a rental request, tenants can check their Dashboard anytime to view real-time updates—whether your request is Pending, Approved, or Rejected by the property owner."
    }
  ];

  const faqs = dynamicFaqs.length > 0 
    ? dynamicFaqs.map(f => ({
        q: language === 'am' ? (f.question_am || f.question_en) : (f.question_en || f.question_am),
        a: language === 'am' ? (f.answer_am || f.answer_en) : (f.answer_en || f.answer_am)
      }))
    : defaultFaqs;

  const featuredRegions = [
    { name: language === 'am' ? "ቀበሌ 01" : "Kebele 01", sub: language === 'am' ? "መሀል ከተማ፣ ገበያ አካባቢ፣ ባንኮች" : "City Center, Commercial Market, Bank Area", count: language === 'am' ? "45+ ቤቶች" : "45+ listings" },
    { name: language === 'am' ? "ቀበሌ 02" : "Kebele 02", sub: language === 'am' ? "የመኖሪያ ቪላዎች፣ ሰላማዊ ሰፈር" : "Residential Villas, Peaceful Neighborhoods", count: language === 'am' ? "38+ ቤቶች" : "38+ listings" },
    { name: language === 'am' ? "ዩኒቨርሲቲ አካባቢ" : "University Area", sub: language === 'am' ? "የእንጅባራ ዩኒቨርሲቲ ግቢ፣ የተማሪዎች እና ሰራተኞች አፓርታማ" : "Injibara University Campus, Student/Staff Apartments", count: language === 'am' ? "60+ ቤቶች" : "60+ listings" },
    { name: language === 'am' ? "አውቶቡስ ተራ" : "Bus Station Area", sub: language === 'am' ? "የትራንስፖርት መነሻ፣ ሱቆች" : "Transport Hub, Shops & Retail Spaces", count: language === 'am' ? "25+ ቤቶች" : "25+ listings" },
    { name: language === 'am' ? "ሆስፒታል አካባቢ" : "Hospital Area", sub: language === 'am' ? "አግኒ ሆስፒታል አካባቢ" : "Agni Hospital & Health Center Area", count: language === 'am' ? "20+ ቤቶች" : "20+ listings" },
  ];

  const bgImage = (aboutData && (aboutData.banner_image_url || aboutData.image_url)) || settings.hero_image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80';
  const heroTag = (aboutData && (language === 'am' ? aboutData.banner_subtitle_am : aboutData.banner_subtitle_en)) || t('aboutHeroTag');
  const heroTitle = (aboutData && (language === 'am' ? aboutData.title_am : aboutData.title_en)) || t('aboutHeroTitle');
  const heroSubtitle = (aboutData && (language === 'am' ? aboutData.subtitle_am : aboutData.subtitle_en)) || (language === 'am' ? (settings.about_text_am || settings.about_text || t('aboutHeroSubtitle')) : (settings.about_text || t('aboutHeroSubtitle')));

  const missionText = (aboutData && (language === 'am' ? aboutData.mission_am : aboutData.mission_en)) || (language === 'am' ? (settings.about_mission_am || t('missionText')) : (settings.about_mission_en || t('missionText')));
  const visionText = (aboutData && (language === 'am' ? aboutData.vision_am : aboutData.vision_en)) || (language === 'am' ? (settings.about_vision_am || t('visionText')) : (settings.about_vision_en || t('visionText')));
  const valuesText = (aboutData && (language === 'am' ? aboutData.values_am : aboutData.values_en)) || (language === 'am' ? (settings.about_vision_am || t('valuesText')) : (settings.about_vision_en || t('valuesText')));

  return (
    <div id="about-page-container" className="bg-gray-50 min-h-screen pb-20">
      
      {/* High-Impact Hero Banner with Beautiful Background Image */}
      <div 
        className="relative bg-cover bg-center min-h-[520px] md:min-h-[600px] flex items-center justify-center text-white"
        style={{ 
          backgroundImage: `url('${bgImage}')` 
        }}
      >
        {/* Dark Dual Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/75 to-black/85"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-extrabold uppercase tracking-widest mb-6 border border-yellow-500/40 backdrop-blur-md shadow-lg">
            <Sparkles className="w-4 h-4 text-yellow-400 animate-spin-slow" />
            {heroTag}
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white mb-6 uppercase tracking-wider max-w-4xl mx-auto leading-tight">
            {heroTitle}
          </h1>

          <p className="text-base sm:text-xl md:text-2xl text-gray-200 mb-10 max-w-3xl mx-auto font-light leading-relaxed">
            {heroSubtitle}
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <button 
              onClick={() => navigate('/houses')}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-8 py-4 rounded-xl font-bold transition duration-300 flex items-center gap-2 uppercase tracking-wider text-sm shadow-xl shadow-amber-500/25 transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              {t('exploreHouses')}
            </button>
            <button 
              onClick={() => navigate('/categories')}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-md px-8 py-4 rounded-xl font-bold transition duration-300 flex items-center gap-2 uppercase tracking-wider text-sm cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-amber-400" />
              {t('browseCategories')}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        
        {/* Core Pillars: Mission, Vision, Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          
          {/* Mission */}
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 flex flex-col justify-between hover:-translate-y-1.5 transition-all duration-300 group">
            <div>
              <div className="w-14 h-14 bg-yellow-50 text-yellow-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-yellow-500 group-hover:text-black transition-colors duration-300 shadow-sm">
                <Target className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-3">{t('ourMission')}</h2>
              <p className="text-gray-600 leading-relaxed text-sm">
                {missionText}
              </p>
            </div>
            <div className="mt-8 pt-6 border-t border-gray-100 flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{t('verifiedListings')}</span>
            </div>
          </div>

          {/* Vision */}
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 flex flex-col justify-between hover:-translate-y-1.5 transition-all duration-300 group">
            <div>
              <div className="w-14 h-14 bg-yellow-50 text-yellow-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-yellow-500 group-hover:text-black transition-colors duration-300 shadow-sm">
                <Eye className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-3">{t('ourVision')}</h2>
              <p className="text-gray-600 leading-relaxed text-sm">
                {visionText}
              </p>
            </div>
            <div className="mt-8 pt-6 border-t border-gray-100 flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{t('nationwideCoverage')}</span>
            </div>
          </div>

          {/* Core Values */}
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 flex flex-col justify-between hover:-translate-y-1.5 transition-all duration-300 group">
            <div>
              <div className="w-14 h-14 bg-yellow-50 text-yellow-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-yellow-500 group-hover:text-black transition-colors duration-300 shadow-sm">
                <HeartHandshake className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-3">{t('coreValues')}</h2>
              <p className="text-gray-600 leading-relaxed text-sm">
                {valuesText}
              </p>
            </div>
            <div className="mt-8 pt-6 border-t border-gray-100 flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{t('zeroFees')}</span>
            </div>
          </div>

        </div>

        {/* Platform Experience for Tenants vs Landlords */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 mb-20">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-bold uppercase tracking-wider mb-3">
              <Compass className="w-3.5 h-3.5" />
              {t('tailoredExp')}
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">{t('builtForBoth')}</h2>
            <p className="text-gray-600 text-sm md:text-base">
              {t('streamlineDesc')}
            </p>

            {/* Role Switcher Tabs */}
            <div className="inline-flex p-1.5 bg-gray-100 rounded-xl mt-6 border border-gray-200">
              <button 
                onClick={() => setActiveRoleTab('tenants')}
                className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
                  activeRoleTab === 'tenants' 
                    ? 'bg-[#1A1A1A] text-yellow-400 shadow-md' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t('forTenants')}
              </button>
              <button 
                onClick={() => setActiveRoleTab('landlords')}
                className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
                  activeRoleTab === 'landlords' 
                    ? 'bg-[#1A1A1A] text-yellow-400 shadow-md' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t('forLandlords')}
              </button>
            </div>
          </div>

          {/* Role Content: Tenants */}
          {activeRoleTab === 'tenants' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-10 h-10 bg-yellow-500 text-black rounded-xl font-bold flex items-center justify-center mb-4">1</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{t('kebeleFiltering')}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {t('kebeleFilteringDesc')}
                </p>
              </div>

              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-10 h-10 bg-yellow-500 text-black rounded-xl font-bold flex items-center justify-center mb-4">2</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{t('oneClickRequest')}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {t('oneClickRequestDesc')}
                </p>
              </div>

              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-10 h-10 bg-yellow-500 text-black rounded-xl font-bold flex items-center justify-center mb-4">3</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{t('liveUpdates')}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {t('liveUpdatesDesc')}
                </p>
              </div>
            </div>
          )}

          {/* Role Content: Landlords */}
          {activeRoleTab === 'landlords' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-10 h-10 bg-[#1A1A1A] text-yellow-400 rounded-xl font-bold flex items-center justify-center mb-4">1</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{t('freeListings')}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {t('freeListingsDesc')}
                </p>
              </div>

              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-10 h-10 bg-[#1A1A1A] text-yellow-400 rounded-xl font-bold flex items-center justify-center mb-4">2</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{t('reviewApplicants')}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {t('reviewApplicantsDesc')}
                </p>
              </div>

              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-10 h-10 bg-[#1A1A1A] text-yellow-400 rounded-xl font-bold flex items-center justify-center mb-4">3</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{t('dashboardMgmt')}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {t('dashboardMgmtDesc')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Regional Footprint Section */}
        <div className="mb-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">{t('ourFootprint')}</h2>
            <p className="text-gray-600 text-sm">{t('footprintDesc')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {featuredRegions.map((item, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
                <div className="flex items-center gap-2 text-yellow-600 font-bold mb-1 text-sm">
                  <MapPin className="w-4 h-4" />
                  {item.name}
                </div>
                <p className="text-xs text-gray-500 mb-3 line-clamp-1">{item.sub}</p>
                <span className="inline-block bg-yellow-50 text-yellow-800 text-[11px] font-bold px-2.5 py-1 rounded-full">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Impact Statistics Counter Bar */}
        <div className="bg-[#1A1A1A] text-white rounded-3xl p-8 md:p-12 mb-20 shadow-xl relative overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center relative z-10">
            <div>
              <p className="text-4xl md:text-5xl font-black text-yellow-400 mb-2">500+</p>
              <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold">{t('propertiesListed')}</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-black text-white mb-2">10+</p>
              <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold">{t('majorCities')}</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-black text-yellow-400 mb-2">1,200+</p>
              <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold">{t('verifiedUsers')}</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-black text-white mb-2">99%</p>
              <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold">{t('tenantSatisfaction')}</p>
            </div>
          </div>
        </div>

        {/* Frequently Asked Questions */}
        <div className="max-w-4xl mx-auto mb-20">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-bold uppercase tracking-wider mb-3">
              <HelpCircle className="w-3.5 h-3.5" />
              {t('faqTitle')}
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">{t('gotQuestions')}</h2>
            <p className="text-gray-600 text-sm">{t('navigatingDesc')}</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div 
                  key={index} 
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm transition-all duration-200"
                >
                  <button 
                    onClick={() => toggleFaq(index)}
                    className="w-full text-left p-6 font-bold text-gray-900 flex justify-between items-center gap-4 hover:bg-gray-50 transition"
                  >
                    <span className="text-base md:text-lg">{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 text-gray-600 text-sm border-t border-gray-100 pt-4 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA Banner */}
        <div className="bg-gradient-to-r from-yellow-500 via-yellow-400 to-amber-500 rounded-3xl p-8 md:p-12 text-black flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl">
          <div className="max-w-xl">
            <h3 className="text-2xl md:text-3xl font-black mb-2 uppercase tracking-wide">{t('readyToFind')}</h3>
            <p className="text-gray-900 font-medium text-sm md:text-base">
              {t('browseDesc')}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 flex-shrink-0">
            <button 
              onClick={() => navigate('/houses')}
              className="bg-black text-yellow-400 hover:bg-gray-900 px-8 py-4 rounded-xl font-bold text-sm transition uppercase tracking-wider flex items-center gap-2 shadow-md"
            >
              {t('browseNow')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

