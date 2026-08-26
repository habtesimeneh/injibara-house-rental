import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Home,
  Store,
  Coffee,
  Camera,
  Activity,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import OptimizedImage from "./OptimizedImage";
import CITY_CONFIG from "../config/cityConfig";
import { useLanguage } from "../context/LanguageContext";
import Logo from "./Logo";

export const defaultHouseCategories = [
  {
    id: "residential",
    titleEn: "Residential Homes",
    titleAm: "ለግል መኖሪያ የሚሆኑ ቤቶች",
    descEn:
      "Find comfortable villas, apartments, and condos for you and your family in Injibara.",
    descAm: "በእንጅባራ ለግል እና ለቤተሰብ መኖሪያ የሚሆኑ ምቹ ቪላዎች፣ አፓርትመንቶች እና ኮንዶሚኒየሞች።",
    icon: Home,
    badge: "1. Residential",
    imageKey: "login_slide_1",
    defaultImage:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80",
    accentColor: "from-amber-500 to-yellow-600",
  },
  {
    id: "boutique",
    titleEn: "Boutique & Clothing",
    titleAm: "ለቡቲክ፣ ጫማ እና አልባሳት",
    descEn:
      "Prime retail spaces perfect for boutiques, shoe stores, and clothing shops.",
    descAm: "ለቡቲክ፣ ለጫማ እና ለተለያዩ አልባሳት መሸጫ የሚሆኑ ምርጥ የንግድ ሱቆች።",
    icon: Store,
    badge: "2. Boutique & Clothing",
    imageKey: "login_slide_2",
    defaultImage:
      "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80",
    accentColor: "from-emerald-500 to-teal-600",
  },
  {
    id: "hospitality",
    titleEn: "Hotel, Restaurant & Cafe",
    titleAm: "ለሆቴል፣ ሬስቶራንት እና ካፌ",
    descEn:
      "Commercial spaces ideal for restaurants, cafes, and hospitality businesses.",
    descAm: "ለሆቴል፣ ሬስቶራንት እና ካፌ አገልግሎት የሚውሉ ምቹ እና ሰፊ ቦታዎች።",
    icon: Coffee,
    badge: "3. Hospitality",
    imageKey: "login_slide_3",
    defaultImage:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80",
    accentColor: "from-blue-500 to-indigo-600",
  },
  {
    id: "electronics",
    titleEn: "Electronics & Photo Studio",
    titleAm: "ለኤሌክትሮኒክስ እና ፎቶ ቤት",
    descEn:
      "Secure and well-located spaces for electronics shops and photo studios.",
    descAm: "ለኤሌክትሮኒክስ እቃዎች እና ለፎቶ ስቱዲዮ የሚሆኑ ደህንነታቸው የተጠበቀ ሱቆች።",
    icon: Camera,
    badge: "4. Electronics & Photo",
    imageKey: "login_slide_4",
    defaultImage:
      "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=80",
    accentColor: "from-purple-500 to-indigo-600",
  },
  {
    id: "health",
    titleEn: "Pharmacy & Clinic",
    titleAm: "ለፋርማሲ እና ክሊኒክ",
    descEn:
      "Clean and accessible spaces suitable for pharmacies, clinics, and medical labs.",
    descAm: "ለፋርማሲ፣ ክሊኒክ እና ላቦራቶሪ አገልግሎት የሚውሉ ንጹህ እና ተደራሽ ቦታዎች።",
    icon: Activity,
    badge: "5. Health & Medical",
    imageKey: "login_slide_5",
    defaultImage:
      "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&q=80",
    accentColor: "from-red-500 to-rose-600",
  },
  {
    id: "others",
    titleEn: "Other Commercial Spaces",
    titleAm: "ሌሎች የንግድና የአገልግሎት ቦታዎች",
    descEn:
      "Versatile spaces for offices, warehouses, gyms, and other service businesses.",
    descAm: "ለቢሮ፣ መጋዘን፣ ጂም እና ለተለያዩ አገልግሎቶች የሚውሉ ሰፊ ቦታዎች።",
    icon: Briefcase,
    badge: "6. Other Commercial",
    imageKey: "login_slide_6",
    defaultImage:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80",
    accentColor: "from-gray-500 to-slate-600",
  },
];

export default function AuthCategorySlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slides, setSlides] = useState([]);
  const [settings, setSettings] = useState({});
  const { language, t } = useLanguage();

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const [slidesRes, settingsRes] = await Promise.all([
          axios.get("/api/auth-page/slides"),
          axios.get("/api/settings"),
        ]);
        const slideData = Array.isArray(slidesRes.data) ? slidesRes.data : [];
        setSlides(slideData);

        const settingsData =
          settingsRes.data && typeof settingsRes.data === "object"
            ? settingsRes.data
            : {};
        setSettings(settingsData);
      } catch (err) {
        console.error("Failed to fetch auth content:", err);
        setSlides([]);
        setSettings({});
      }
    };
    fetchContent();
  }, []);

  const houseCategories =
    Array.isArray(slides) && slides.length > 0
      ? slides.map((s) => ({
          id: s.id,
          titleEn: s.title_en,
          titleAm: s.title_am,
          descEn: s.desc_en,
          descAm: s.desc_am,
          badge: language === "am" ? s.badge_am || s.badge_en : s.badge_en,
          image: s.image_url,
          icon: Home,
        }))
      : defaultHouseCategories.map((cat) => ({
          ...cat,
          image: settings[cat.imageKey] || cat.defaultImage,
        }));

  const safeCurrentIndex =
    houseCategories.length > 0 ? currentIndex % houseCategories.length : 0;
  const current =
    houseCategories[safeCurrentIndex] || defaultHouseCategories[0];

  useEffect(() => {
    if (houseCategories.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % houseCategories.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [houseCategories.length]);

  const nextSlide = () => {
    if (!houseCategories.length) return;
    setCurrentIndex((prev) => (prev + 1) % houseCategories.length);
  };
  const prevSlide = () => {
    if (!houseCategories.length) return;
    setCurrentIndex(
      (prev) => (prev - 1 + houseCategories.length) % houseCategories.length,
    );
  };

  const IconComponent = current.icon || Home;

  return (
    <div className="relative w-full h-full min-h-[420px] lg:min-h-[640px] rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between p-8 text-white group">
      {/* Background Image Carousel with Transition */}
      {houseCategories.map((cat, idx) => (
        <div
          key={cat.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === currentIndex ? "opacity-100 z-0" : "opacity-0 -z-10"
          }`}
        >
          <OptimizedImage
            src={cat.image}
            alt={cat.titleEn}
            className="w-full h-full"
            imgClassName="transform scale-105 transition-transform duration-10000 ease-out group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-900/30" />
        </div>
      ))}

      {/* Top Brand Header */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="bg-slate-950/70 backdrop-blur-md pr-3 pl-1 py-1 rounded-2xl border border-amber-500/30">
          <Logo size="sm" />
        </div>

        <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold text-amber-300 border border-amber-500/20">
          <ShieldCheck size={14} />
          <span>{t("verifiedPlatform")}</span>
        </div>
      </div>

      {/* Center Category Content Card */}
      <div className="relative z-10 my-auto space-y-4 max-w-md">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20">
          <IconComponent size={16} />
          <span>{current.badge}</span>
        </div>

        <div className="space-y-1">
          <h3 className="text-2xl lg:text-3xl font-black tracking-tight text-white leading-tight">
            {language === "am" ? current.titleAm : current.titleEn}
          </h3>
        </div>

        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-light bg-slate-950/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-inner">
          {language === "am" ? current.descAm : current.descEn}
        </p>

        {/* Category Features */}
        <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-slate-300 pt-1">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-amber-400" />
            <span>{t("verifiedProperty")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-amber-400" />
            <span>{t("directLandlordContact")}</span>
          </div>
        </div>
      </div>

      {/* Bottom Slider Controls & Indicators */}
      <div className="relative z-10 flex items-center justify-between pt-4 border-t border-white/15">
        {/* Slide Indicators */}
        <div className="flex items-center gap-2">
          {houseCategories.map((cat, idx) => (
            <button
              key={cat.id}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                idx === currentIndex
                  ? "w-8 bg-gold"
                  : "w-2 bg-white/40 hover:bg-white/70"
              }`}
              title={cat.titleEn}
            />
          ))}
        </div>

        {/* Navigation Arrows */}
        <div className="flex items-center gap-2">
          <button
            onClick={prevSlide}
            className="w-9 h-9 rounded-xl bg-slate-950/60 hover:bg-gold hover:text-slate-950 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition cursor-pointer"
            title="Previous Category"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={nextSlide}
            className="w-9 h-9 rounded-xl bg-slate-950/60 hover:bg-gold hover:text-slate-950 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition cursor-pointer"
            title="Next Category"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
