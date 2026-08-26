import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Search,
  MapPin,
  DollarSign,
  Home as HomeIcon,
  Star,
  ChevronLeft,
  ChevronRight,
  Video,
  Play,
  Sparkles,
  Edit,
  Trash2,
  Plus,
  X,
  Upload,
  Save,
} from "lucide-react";
import { ethiopianLocations, regions } from "../utils/locations";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import HouseGrid from "../components/HouseGrid";
import Testimonials from "../components/Testimonials";
import TenantSeekingAds from "../components/TenantSeekingAds";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import CITY_CONFIG from "../config/cityConfig";
import appConfig from "../config/appConfig";
import Logo from "../components/Logo";
import NoticeBoard from "../components/NoticeBoard";
import PropertyDetailModal from "../components/PropertyDetailModal";
import ButtonSpinner from "../components/ButtonSpinner";

export default function Home() {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({});
  const [categories, setCategories] = useState([]);
  const [selectedDetailHouse, setSelectedDetailHouse] = useState(null);
  const [heroSlides, setHeroSlides] = useState([]);
  const [tickerItems, setTickerItems] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [pageReady, setPageReady] = useState(false);

  const [isSectionSettingsModalOpen, setIsSectionSettingsModalOpen] =
    useState(false);
  const [sectionSettingsForm, setSectionSettingsForm] = useState({
    home_categories_title: "",
    home_categories_title_am: "",
    home_categories_subtitle: "",
    home_categories_subtitle_am: "",
  });
  const [isSavingSectionSettings, setIsSavingSectionSettings] = useState(false);
  const [seekingModalTrigger, setSeekingModalTrigger] = useState(0);
  const [isHeroSlideModalOpen, setIsHeroSlideModalOpen] = useState(false);
  const [editingHeroSlide, setEditingHeroSlide] = useState(null);
  const [heroSlideForm, setHeroSlideForm] = useState({
    title_en: "",
    title_am: "",
    subtitle_en: "",
    subtitle_am: "",
    image_url: "",
    is_active: true,
  });
  const [isSavingHeroSlide, setIsSavingHeroSlide] = useState(false);
  const [isTickerModalOpen, setIsTickerModalOpen] = useState(false);
  const [editingTickerItem, setEditingTickerItem] = useState(null);
  const [tickerForm, setTickerForm] = useState({
    text_en: "",
    text_am: "",
    is_active: true,
  });
  const [isSavingTicker, setIsSavingTicker] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    name_am: "",
    description: "",
    description_am: "",
    font_size: "text-2xl md:text-4xl",
  });
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  const handleAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: "",
      name_am: "",
      description: "",
      description_am: "",
      font_size: "text-2xl md:text-4xl",
    });
    setIsCategoryModalOpen(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name || "",
      name_am: category.name_am || "",
      description: category.description || "",
      description_am: category.description_am || "",
      font_size: category.font_size || "text-2xl md:text-4xl",
    });
    setIsCategoryModalOpen(true);
  };

  const handlePostSeekingRequestClick = () => {
    const element = document.getElementById("tenant-seeking-ads-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setSeekingModalTrigger((prev) => prev + 1);
  };
  const handleEditTickerItem = (item) => {
    setEditingTickerItem(item);
    setTickerForm({
      text_en: item.text_en || "",
      text_am: item.text_am || "",
      is_active: item.is_active === 1,
    });
    setIsTickerModalOpen(true);
  };

  const handleAddTickerItem = () => {
    setEditingTickerItem(null);
    setTickerForm({ text_en: "", text_am: "", is_active: true });
    setIsTickerModalOpen(true);
  };

  const saveTickerItem = async (e) => {
    e.preventDefault();
    setIsSavingTicker(true);
    try {
      if (editingTickerItem) {
        await axios.put(`/api/ticker/${editingTickerItem.id}`, tickerForm, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
      } else {
        await axios.post("/api/ticker", tickerForm, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
      }
      setIsTickerModalOpen(false);
      fetchTickerItems();
    } catch (err) {
      console.error("Failed to save ticker item", err);
      alert("Failed to save ticker item. Please try again.");
    } finally {
      setIsSavingTicker(false);
    }
  };

  const deleteTickerItem = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await axios.delete(`/api/ticker/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      fetchTickerItems();
    } catch (err) {
      console.error("Failed to delete ticker item", err);
    }
  };

  const [subCity, setSubCity] = useState("");
  const [houseType, setHouseType] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [currentSlide, setCurrentSlide] = useState(0);
  const [prevSlide, setPrevSlide] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const loadPage = async () => {
      try {
        await Promise.all([
          fetchHouses(),
          fetchSettings(),
          fetchHeroSlides(),
          fetchTickerItems(),
          fetchAnnouncements(),
        ]);
        if (isMounted) {
          setPageReady(true);
        }
      } catch (err) {
        console.error("Failed to load home page data", err);
        if (isMounted) {
          setPageReady(true);
        }
      }
    };
    loadPage();
    return () => {
      isMounted = false;
    };
  }, []);

  const fetchHeroSlides = async () => {
    try {
      const res = await axios.get("/api/hero-slides");
      setHeroSlides(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch hero slides", err);
    }
    return Promise.resolve();
  };

  const fetchTickerItems = async () => {
    try {
      const res = await axios.get("/api/ticker");
      setTickerItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch ticker items", err);
    }
    return Promise.resolve();
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await axios.get("/api/announcements?type=promotional_notice");
      setAnnouncements(
        Array.isArray(res.data) ? res.data.filter((a) => a.is_active) : [],
      );
    } catch (err) {
      console.error("Failed to fetch announcements", err);
    }
    return Promise.resolve();
  };

  const fetchHouses = async (searchParams = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams(searchParams).toString();
      const res = await axios.get(`/api/houses?${params}`);
      const payload = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : [];
      setHouses(payload);
    } catch (err) {
      console.error("Failed to fetch houses", err);
      setHouses([]);
    } finally {
      setLoading(false);
    }
    return Promise.resolve();
  };

  const fetchSettings = async () => {
    try {
      const res = await axios.get("/api/settings");
      const safeSettings =
        res.data && typeof res.data === "object" ? res.data : {};
      setSettings(safeSettings);

      const catRes = await axios.get("/api/settings/categories");
      const categoryData = Array.isArray(catRes.data)
        ? catRes.data
        : Array.isArray(catRes.data?.data)
          ? catRes.data.data
          : [];
      setCategories(categoryData);
    } catch (err) {
      console.error("Failed to fetch settings", err);
      setSettings({});
      setCategories([]);
    }
    return Promise.resolve();
  };

  const handleEditSectionSettings = () => {
    setSectionSettingsForm({
      home_categories_title:
        settings.home_categories_title || "Browse Categories",
      home_categories_title_am:
        settings.home_categories_title_am || "ምድቦችን ያስሱ",
      home_categories_subtitle:
        settings.home_categories_subtitle ||
        "Explore available properties in Injibara",
      home_categories_subtitle_am:
        settings.home_categories_subtitle_am || "በእንጅባራ ከተማ የሚከራዩ ቤቶች ዝርዝር",
    });
    setIsSectionSettingsModalOpen(true);
  };

  const saveSectionSettings = async (e) => {
    e.preventDefault();
    setIsSavingSectionSettings(true);
    try {
      await axios.put("/api/admin/settings", sectionSettingsForm, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setIsSectionSettingsModalOpen(false);
      fetchSettings();
    } catch (err) {
      console.error("Failed to save section settings", err);
      alert("Failed to save settings");
    } finally {
      setIsSavingSectionSettings(false);
    }
  };

  const handleEditHeroSlide = (slide) => {
    setEditingHeroSlide(slide);
    setHeroSlideForm({
      title_en: slide.title_en || "",
      title_am: slide.title_am || "",
      subtitle_en: slide.subtitle_en || "",
      subtitle_am: slide.subtitle_am || "",
      image_url: slide.image_url || "",
      is_active: slide.is_active === 1,
    });
    setIsHeroSlideModalOpen(true);
  };

  const handleAddHeroSlide = () => {
    setEditingHeroSlide(null);
    setHeroSlideForm({
      title_en: "",
      title_am: "",
      subtitle_en: "",
      subtitle_am: "",
      image_url: "",
      is_active: true,
    });
    setIsHeroSlideModalOpen(true);
  };

  const saveHeroSlide = async (e) => {
    e.preventDefault();
    setIsSavingHeroSlide(true);
    try {
      if (editingHeroSlide) {
        await axios.put(
          `/api/hero-slides/${editingHeroSlide.id}`,
          heroSlideForm,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
      }
      setIsHeroSlideModalOpen(false);
      fetchHeroSlides();
    } catch (err) {
      console.error("Failed to save hero slide", err);
      alert("Failed to save hero slide. Please try again.");
    } finally {
      setIsSavingHeroSlide(false);
    }
  };

  const saveCategory = async (e) => {
    e.preventDefault();
    setIsSavingCategory(true);
    try {
      if (editingCategory) {
        await axios.put(
          `/api/admin/categories/${editingCategory.id || editingCategory.category_id}`,
          categoryForm,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
      } else {
        await axios.post("/api/admin/categories", categoryForm, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
      }
      setIsCategoryModalOpen(false);
      fetchSettings();
    } catch (err) {
      console.error("Failed to save category", err);
      alert("Failed to save category. Please try again.");
    } finally {
      setIsSavingCategory(false);
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?"))
      return;
    try {
      await axios.delete(`/api/admin/categories/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      fetchSettings();
    } catch (err) {
      console.error("Failed to delete category", err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchHouses({ sub_city: subCity, type: houseType, maxPrice });
  };

  const defaultSlides = [
    {
      image_url:
        settings.hero_image ||
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80",
      title_en: settings.hero_title || "",
      title_am: settings.hero_title_am || "",
      subtitle_en: settings.hero_subtitle || "",
      subtitle_am: settings.hero_subtitle_am || "",
    },
    {
      image_url:
        settings.hero_slide_2 ||
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80",
      title_en: "",
      title_am: "",
      subtitle_en: "",
      subtitle_am: "",
    },
    {
      image_url:
        settings.hero_slide_3 ||
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80",
      title_en: "",
      title_am: "",
      subtitle_en: "",
      subtitle_am: "",
    },
  ];

  const activeHeroSlides = Array.isArray(heroSlides)
    ? heroSlides
        .filter((s) => s.is_active)
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
    : [];

  const parseJsonArray = (value, fallback = []) => {
    if (Array.isArray(value)) return value;
    if (typeof value !== "string" || !value.trim()) return fallback;
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch (error) {
      return fallback;
    }
  };

  const services = parseJsonArray(settings.services_list, []).filter(Boolean);
  const faqs = parseJsonArray(settings.faq_list, []).filter(Boolean);
  const marketingBlocks = parseJsonArray(settings.marketing_blocks, []).filter(
    Boolean,
  );

  const slides = activeHeroSlides.length > 0 ? activeHeroSlides : defaultSlides;

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const activeSlide = slides[currentSlide] || slides[0];
  const activeAnnouncements = announcements.filter((a) => a.is_active);

  const normalizeTypeText = (value) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u1200-\u137f]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const typeMatchesCategory = (houseType, categoryName) => {
    const houseValue = normalizeTypeText(houseType);
    const categoryValue = normalizeTypeText(categoryName);

    if (!houseValue || !categoryValue) return false;
    if (houseValue === categoryValue) return true;

    const aliases = {
      "የመኖሪያ ቤት": ["residential house", "የመኖሪያ ቤት", "residential", "house"],
      ቪላ: ["villa", "ቪላ"],
      አፓርታማ: ["apartment", "አፓርታማ", "flat"],
      "የንግድ ሱቅ": [
        "shop",
        "commercial shop",
        "የንግድ ሱቅ",
        "commercial",
        "business space",
      ],
      "ለሆቴል እና ለምግብ (ሽሮ) ቤት": [
        "hotel and restaurant",
        "restaurant",
        "hotel",
        "ለሆቴል እና ለምግብ (ሽሮ) ቤት",
      ],
      ኮንዶሚኒየም: ["condominium", "condo", "ኮንዶሚኒየም"],
      ስቱዲዮ: ["studio", "ስቱዲዮ"],
      ግርጌ: ["office", "ቢሮ", "office space", "ግርጌ", "workspace"],
      "የመሬት ቦታ": ["land", "plot", "የመሬት ቦታ"],
      "ለኤሌክትሮኒክስ እና ፎቶ ቤት": [
        "electronics store",
        "photo studio",
        "electronics and photo",
        "ኤሌክትሮኒክስ",
        "ፎቶ",
      ],
      "ለፋርማሲ እና ክሊኒክ": [
        "pharmacy",
        "clinic",
        "medical",
        "pharmacy and clinic",
        "ለፋርማሲ",
        "ክሊኒክ",
      ],
      "ሌሎች የንግድና የአገልግሎት ቦታዎች": [
        "service space",
        "commercial space",
        "office building",
        "ንግድ",
        "አገልግሎት",
      ],
    };

    const normalizedAliases = Object.entries(aliases).flatMap(
      ([key, values]) => {
        const normalizedKey = normalizeTypeText(key);
        return [
          normalizedKey,
          ...values.map((value) => normalizeTypeText(value)),
        ];
      },
    );

    const aliasSet = new Set(normalizedAliases);

    if (aliasSet.has(houseValue) && aliasSet.has(categoryValue)) return true;

    const broaderMatches = [
      houseValue.includes(categoryValue),
      categoryValue.includes(houseValue),
      houseValue
        .split(" ")
        .some((word) => word && categoryValue.includes(word)),
      categoryValue
        .split(" ")
        .some((word) => word && houseValue.includes(word)),
    ];

    return broaderMatches.some(Boolean);
  };

  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <div className="relative min-h-[85vh] pt-24 sm:pt-28 pb-12 sm:pb-16 flex items-center justify-center bg-black overflow-hidden">
        {slides.map((slide, idx) => {
          const isCurrent = idx === currentSlide;
          const isPrev = idx === prevSlide;
          return (
            <div
              key={idx}
              className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out transform ${
                isCurrent
                  ? "opacity-100 scale-100 z-10"
                  : isPrev
                    ? "opacity-100 scale-105 z-0"
                    : "opacity-0 scale-105 z-0 pointer-events-none"
              }`}
              style={{ backgroundImage: `url('${slide.image_url}')` }}
            ></div>
          );
        })}

        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/85"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center w-full">
          <motion.h1
            initial={{ opacity: 0, y: -30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 sm:mb-6 uppercase tracking-wide drop-shadow-[0_4px_14px_rgba(0,0,0,0.95)] leading-tight"
          >
            {language === "am"
              ? activeSlide.title_am ||
                settings.hero_title_am ||
                t("welcomeTitle")
              : activeSlide.title_en ||
                settings.hero_title ||
                t("welcomeTitle")}
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-6 sm:mb-10"
          >
            <p className="text-base sm:text-2xl md:text-3xl font-extrabold text-amber-300 drop-shadow-[0_4px_16px_rgba(0,0,0,1)] max-w-4xl mx-auto leading-snug bg-black/50 backdrop-blur-md px-4 sm:px-6 py-2 sm:py-3 rounded-2xl border border-yellow-500/30 inline-block">
              {language === "am"
                ? activeSlide.subtitle_am ||
                  settings.hero_subtitle_am ||
                  t("brandSub")
                : activeSlide.subtitle_en ||
                  settings.hero_subtitle ||
                  t("brandSub")}
            </p>
          </motion.div>

          {/* Search Box */}
          <motion.form
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: 1,
              delay: 0.6,
              type: "spring",
              stiffness: 50,
            }}
            onSubmit={handleSearch}
            className="max-w-4xl mx-auto bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 shadow-2xl flex flex-col md:flex-row gap-4 items-center"
          >
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="flex-1 w-full bg-white rounded-lg flex items-center px-4 py-3 relative"
            >
              <div className="mr-3 flex-shrink-0">
                <Logo size="sm" showText={false} />
              </div>
              <input
                type="text"
                list="location-options"
                value={subCity}
                onChange={(e) => setSubCity(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full bg-transparent border-none focus:outline-none text-black font-bold text-sm placeholder-gray-500"
              />
              <datalist id="location-options">
                <option value="Kebele 01">
                  ቀበሌ 01 (Kebele 01 City Center)
                </option>
                <option value="Kebele 02">ቀበሌ 02 (Kebele 02)</option>
                <option value="Kebele 03">ቀበሌ 03 (Kebele 03)</option>
                <option value="Injibara University">
                  እንጅባራ ዩኒቨርሲቲ (Injibara University)
                </option>
                <option value="Bus Station">አውቶቡስ ተራ (Bus Station)</option>
                <option value="Hospital Area">አግኒ ሆስፒታል (Hospital Area)</option>
                <option value="College Area">ኮሌጅ አካባቢ (College Area)</option>
                <option value="Dangila Road">ዳንግላ መንገድ</option>
                <option value="Bole Area">ቦሌ ሰፈር</option>
              </datalist>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="flex-1 w-full bg-white rounded-lg flex items-center px-4 py-3"
            >
              <HomeIcon className="text-yellow-600 w-5 h-5 flex-shrink-0" />
              <select
                value={houseType}
                onChange={(e) => setHouseType(e.target.value)}
                className="w-full ml-3 bg-transparent border-none focus:outline-none text-gray-800 font-semibold"
              >
                <option value="" className="text-slate-900 bg-white">
                  {t("allCategories")}
                </option>
                <option value="የመኖሪያ ቤት" className="text-slate-900 bg-white">
                  {t("residential")}
                </option>
                <option value="ቪላ" className="text-slate-900 bg-white">
                  {t("villa")}
                </option>
                <option value="አፓርታማ" className="text-slate-900 bg-white">
                  {t("apartment")}
                </option>
                <option value="ለንግድ ቤት" className="text-slate-900 bg-white">
                  {t("commercial")}
                </option>
                <option value="ኮንዶሚኒየም" className="text-slate-900 bg-white">
                  {t("condo")}
                </option>
                <option value="ስቱዲዮ" className="text-slate-900 bg-white">
                  {t("studio")}
                </option>
              </select>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.9 }}
              className="flex-1 w-full bg-white rounded-lg flex items-center px-4 py-3"
            >
              <DollarSign className="text-yellow-600 w-5 h-5 flex-shrink-0" />
              <input
                type="number"
                placeholder={`${t("maxPrice")} (ETB)`}
                className="w-full ml-3 bg-transparent border-none focus:outline-none text-gray-800"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </motion.div>

            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 1.0 }}
              type="submit"
              className="w-full md:w-auto bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-4 rounded-lg font-bold flex items-center justify-center transition uppercase tracking-wide cursor-pointer"
            >
              <Search className="w-5 h-5 mr-2" />
              {t("searchBtn")}
            </motion.button>
          </motion.form>
        </div>
      </div>

      {/* Ticker Section */}
      <section className="bg-slate-900 text-amber-500 py-3 overflow-hidden border-b border-amber-500/20">
        <div className="flex items-center animate-ticker hover:animation-play-state-paused">
          {tickerItems.map((item) => (
            <span
              key={item.id}
              className="mx-8 font-black text-lg whitespace-nowrap flex items-center gap-4"
            >
              {language === "am" ? item.text_am : item.text_en}
              {user?.role === "Admin" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditTickerItem(item)}
                    className="text-white hover:text-amber-300"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => deleteTickerItem(item.id)}
                    className="text-white hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </span>
          ))}
          {user?.role === "Admin" && (
            <button
              onClick={handleAddTickerItem}
              className="mx-8 text-white hover:text-amber-300"
            >
              <Plus size={20} />
            </button>
          )}
        </div>
      </section>

      {/* Continuous Sliding Text Ticker */}
      <div className="bg-amber-500 text-slate-950 font-black py-3 overflow-hidden relative border-y border-amber-600 shadow-md">
        <div className="flex w-max">
          <div className="animate-ticker flex items-center gap-12 text-xs sm:text-sm tracking-wide uppercase">
            {activeAnnouncements.length > 0 ? (
              <>
                {[...activeAnnouncements, ...activeAnnouncements].map(
                  (a, i) => (
                    <span key={i} className="flex items-center gap-2">
                      <span className="bg-slate-950 text-amber-400 text-[10px] px-2 py-0.5 rounded font-black">
                        {a.badge || "NEWS"}
                      </span>
                      <span>{language === "am" ? a.title_am : a.title_en}</span>
                      <span className="ml-8">•</span>
                    </span>
                  ),
                )}
              </>
            ) : (
              <>
                {/* Fallback Static Set 1 */}
                <span className="flex items-center gap-2">
                  <span className="bg-slate-950 text-amber-400 text-[10px] px-2 py-0.5 rounded font-black">
                    NEWS
                  </span>
                  <span>
                    {language === "am"
                      ? "🔥 አዲስ ማሻሻያ፡ ለአከራዮች እና ለተከራዮች ፈጣን የኤስኤምኤስ (SMS) ማሳወቂያዎች በስራ ላይ ውለዋል!"
                      : "🔥 NEW UPDATE: Instant SMS notifications are now active for both landlords and tenants!"}
                  </span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-2">
                  <span className="bg-slate-950 text-amber-400 text-[10px] px-2 py-0.5 rounded font-black">
                    OFFER
                  </span>
                  <span>
                    {language === "am"
                      ? "⭐ ልዩ ማስታወቂያ፡ ማስታወቂያዎን በመጀመሪያ ገጽ ላይ በማውጣት 5 እጥፍ ፈጣን ተከራይ ያግኙ!"
                      : "⭐ SPECIAL OFFER: Boost your listing or seeking request on top of the main page to rent 5x faster!"}
                  </span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-2">
                  <span className="bg-slate-950 text-amber-400 text-[10px] px-2 py-0.5 rounded font-black">
                    SUPPORT
                  </span>
                <span>
                  {language === "am"
                    ? `📞 ለፈጣን እገዛ እና የቤት ማሳያ ቀጠሮዎች በ ${appConfig.supportPhone} ይደውሉልን!`
                    : `📞 CALL US: Reach our support office at ${appConfig.supportPhone} for instant brokerage and physical property tours!`}
                </span>
              </span>
                <span>•</span>
                {/* Fallback Static Set 2 (Duplicated for seamless infinite loop) */}
                <span className="flex items-center gap-2">
                  <span className="bg-slate-950 text-amber-400 text-[10px] px-2 py-0.5 rounded font-black">
                    NEWS
                  </span>
                  <span>
                    {language === "am"
                      ? "🔥 አዲስ ማሻሻያ፡ ለአከራዮች እና ለተከራዮች ፈጣን የኤስኤምኤስ (SMS) ማሳወቂያዎች በስራ ላይ ውለዋል!"
                      : "🔥 NEW UPDATE: Instant SMS notifications are now active for both landlords and tenants!"}
                  </span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-2">
                  <span className="bg-slate-950 text-amber-400 text-[10px] px-2 py-0.5 rounded font-black">
                    OFFER
                  </span>
                  <span>
                    {language === "am"
                      ? "⭐ ልዩ ማስታወቂያ፡ ማስታወቂያዎን በመጀመሪያ ገጽ ላይ በማውጣት 5 እጥፍ ፈጣን ተከራይ ያግኙ!"
                      : "⭐ SPECIAL OFFER: Boost your listing or seeking request on top of the main page to rent 5x faster!"}
                  </span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-2">
                  <span className="bg-slate-950 text-amber-400 text-[10px] px-2 py-0.5 rounded font-black">
                    SUPPORT
                  </span>
                  <span>
                    {language === "am"
                      ? `📞 ለፈጣን እገዛ እና የቤት ማሳያ ቀጠሮዎች በ ${appConfig.supportPhone} ይደውሉልን!`
                      : `📞 CALL US: Reach our support office at ${appConfig.supportPhone} for instant brokerage and physical property tours!`}
                  </span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Notice & Announcement Board (የማስታወቂያ ሰሌዳ) */}
      <NoticeBoard onPostSeekingRequestClick={handlePostSeekingRequestClick} />

      {services.length > 0 && (
        <section className="bg-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-600 mb-4">
                {language === "am" ? "አገልግሎቶች" : "Services"}
              </p>
              <h2 className="text-3xl md:text-5xl font-black text-slate-900">
                {language === "am"
                  ? settings.services_title_am || "የእኛ አገልግሎቶች"
                  : settings.services_title_en || "Our Services"}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {services.map((service, index) => (
                <div
                  key={`${service.title_en || service.title || index}`}
                  className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-lg transition"
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-black mb-5">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-3">
                    {language === "am"
                      ? service.title_am || service.title_en || service.title
                      : service.title_en || service.title_am || service.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {language === "am"
                      ? service.description_am ||
                        service.description_en ||
                        service.description
                      : service.description_en ||
                        service.description_am ||
                        service.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {marketingBlocks.length > 0 && (
        <section className="bg-slate-900 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {marketingBlocks.map((block, index) => (
                <div
                  key={`${block.title_en || block.title || index}`}
                  className="rounded-3xl border border-slate-700 bg-slate-800 p-6 text-white shadow-xl"
                >
                  <div className="text-amber-400 text-xs font-black uppercase tracking-[0.25em] mb-4">
                    {index + 1}
                  </div>
                  <h3 className="text-2xl font-black mb-3">
                    {language === "am"
                      ? block.title_am || block.title_en || block.title
                      : block.title_en || block.title_am || block.title}
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {language === "am"
                      ? block.description_am ||
                        block.description_en ||
                        block.description
                      : block.description_en ||
                        block.description_am ||
                        block.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {faqs.length > 0 && (
        <section className="bg-slate-100 py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-700 mb-4">
                FAQ
              </p>
              <h2 className="text-3xl md:text-5xl font-black text-slate-900">
                {language === "am"
                  ? settings.faq_title_am || "ተደጋግሞ የሚጠየቁ"
                  : settings.faq_title_en || "Frequently Asked Questions"}
              </h2>
            </div>
            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <details
                  key={`${faq.question_en || faq.question || idx}`}
                  open={idx === 0}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <summary className="cursor-pointer list-none font-black text-slate-900 flex items-center justify-between gap-3">
                    <span>
                      {language === "am"
                        ? faq.question_am || faq.question_en || faq.question
                        : faq.question_en || faq.question_am || faq.question}
                    </span>
                    <span className="text-amber-600 text-xl">+</span>
                  </summary>
                  <p className="mt-4 text-slate-600 text-sm leading-relaxed">
                    {language === "am"
                      ? faq.answer_am || faq.answer_en || faq.answer
                      : faq.answer_en || faq.answer_am || faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Properties by Category */}
      <section
        className={`py-24 ${settings.home_categories_bg_color || "bg-white"} transition-colors duration-500`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Container - Dim Green with Border */}
          <div className="max-w-5xl mx-auto mb-20">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="bg-emerald-100/30 backdrop-blur-md border-2 border-emerald-200/40 rounded-[2.5rem] p-10 md:p-16 text-center shadow-2xl shadow-emerald-900/10 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent"></div>

              <h2 className="text-5xl md:text-7xl font-black text-gray-900 mb-6 tracking-tighter uppercase drop-shadow-sm">
                {language === "am"
                  ? settings.home_categories_title_am || "ምድቦችን ያስሱ"
                  : settings.home_categories_title || t("browseCategories")}
              </h2>

              <div className="h-2.5 w-32 bg-amber-500 mx-auto rounded-full mb-10 shadow-lg shadow-amber-500/20"></div>

              {/* Auto-Sliding Text Container */}
              <div className="relative h-16 md:h-20 flex items-center overflow-hidden border-y border-emerald-200/20">
                <motion.div
                  animate={{ x: ["0%", "-50%"] }}
                  transition={{
                    duration: 30,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="flex whitespace-nowrap gap-12"
                >
                  <div className="flex items-center gap-12">
                    <p className="text-2xl md:text-4xl font-extrabold text-emerald-800/80 italic flex items-center gap-4">
                      <span>
                        {language === "am"
                          ? settings.home_categories_subtitle_am ||
                            "በእንጅባራ ከተማ የሚከራዩ ቤቶች ዝርዝር"
                          : settings.home_categories_subtitle ||
                            "Explore available properties in Injibara"}
                      </span>
                      <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
                      <span>
                        {language === "am"
                          ? "ምርጥ ቤቶችን እዚህ ያገኛሉ"
                          : "Premium Housing Solutions"}
                      </span>
                      <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
                    </p>
                    <p className="text-2xl md:text-4xl font-extrabold text-emerald-800/80 italic flex items-center gap-4">
                      <span>
                        {language === "am"
                          ? settings.home_categories_subtitle_am ||
                            "በእንጅባራ ከተማ የሚከራዩ ቤቶች ዝርዝር"
                          : settings.home_categories_subtitle ||
                            "Explore available properties in Injibara"}
                      </span>
                      <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
                      <span>
                        {language === "am"
                          ? "ምርጥ ቤቶችን እዚህ ያገኛሉ"
                          : "Premium Housing Solutions"}
                      </span>
                      <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
                    </p>
                  </div>
                  {/* Duplicate set for seamless loop */}
                  <div className="flex items-center gap-12">
                    <p className="text-2xl md:text-4xl font-extrabold text-emerald-800/80 italic flex items-center gap-4">
                      <span>
                        {language === "am"
                          ? settings.home_categories_subtitle_am ||
                            "በእንጅባራ ከተማ የሚከራዩ ቤቶች ዝርዝር"
                          : settings.home_categories_subtitle ||
                            "Explore available properties in Injibara"}
                      </span>
                      <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
                      <span>
                        {language === "am"
                          ? "ምርጥ ቤቶችን እዚህ ያገኛሉ"
                          : "Premium Housing Solutions"}
                      </span>
                      <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
                    </p>
                    <p className="text-2xl md:text-4xl font-extrabold text-emerald-800/80 italic flex items-center gap-4">
                      <span>
                        {language === "am"
                          ? settings.home_categories_subtitle_am ||
                            "በእንጅባራ ከተማ የሚከራዩ ቤቶች ዝርዝር"
                          : settings.home_categories_subtitle ||
                            "Explore available properties in Injibara"}
                      </span>
                      <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
                      <span>
                        {language === "am"
                          ? "ምርጥ ቤቶችን እዚህ ያገኛሉ"
                          : "Premium Housing Solutions"}
                      </span>
                      <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
                    </p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {!pageReady ? (
            <div className="mb-12">
              <div className="flex justify-between items-end mb-8 border-b border-gray-200 pb-4">
                <div>
                  <div className="h-8 bg-gray-100 rounded-lg w-64 animate-shimmer mb-2" />
                  <div className="h-4 bg-gray-100 rounded-md w-48 animate-shimmer" />
                </div>
              </div>
              <HouseGrid loading={true} columns={3} />
            </div>
          ) : (
            (Array.isArray(categories) ? categories : []).map((cat, i) => {
              if (!cat || typeof cat !== "object") return null;

              const categoryNames = [cat.name, cat.name_am]
                .filter((value) => typeof value === "string" && value.trim())
                .map((value) => value.trim());

              const catHouses = (Array.isArray(houses) ? houses : []).filter(
                (h) =>
                  h &&
                  typeof h === "object" &&
                  categoryNames.some(
                    (categoryName) =>
                      typeMatchesCategory(h.type, categoryName) ||
                      typeMatchesCategory(h.title, categoryName),
                  ),
              );

              if (catHouses.length === 0) return null;

              const displayName =
                language === "am" ? cat.name_am || cat.name : cat.name;
              const displayDesc =
                language === "am"
                  ? cat.description_am ||
                    `${t("exploreAvailable")} ${displayName} ${t("propertiesInInjibara")}`
                  : cat.description ||
                    `${t("exploreAvailable")} ${displayName} ${t("propertiesInInjibara")}`;

              return (
                <div key={i} className="mb-20 last:mb-0">
                  <div className="text-center mb-10 relative group">
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                      <h3 className="text-5xl md:text-7xl font-black text-gray-900 mb-6 tracking-tight drop-shadow-sm">
                        {displayName}
                      </h3>
                      <div className="h-2 w-32 bg-amber-500 mx-auto rounded-full mb-8"></div>

                      {/* Animated Sliding Description Ticker */}
                      <div className="relative h-12 md:h-16 flex items-center overflow-hidden border-y border-gray-100/50 mb-8">
                        <motion.div
                          animate={{ x: ["0%", "-50%"] }}
                          transition={{
                            duration: 20,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="flex whitespace-nowrap gap-12"
                        >
                          <div className="flex items-center gap-12">
                            <p
                              className={`${cat.font_size || "text-2xl md:text-4xl"} font-extrabold text-gray-700 italic flex items-center gap-4`}
                            >
                              <span>{displayDesc}</span>
                              <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                              <span>
                                {language === "am"
                                  ? "ምርጥ ምርጫዎች"
                                  : "Premium Selection"}
                              </span>
                              <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                            </p>
                          </div>
                          <div className="flex items-center gap-12">
                            <p
                              className={`${cat.font_size || "text-2xl md:text-4xl"} font-extrabold text-gray-700 italic flex items-center gap-4`}
                            >
                              <span>{displayDesc}</span>
                              <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                              <span>
                                {language === "am"
                                  ? "ምርጥ ምርጫዎች"
                                  : "Premium Selection"}
                              </span>
                              <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                            </p>
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="mt-8 flex justify-center"
                    >
                      <button
                        onClick={() =>
                          navigate(
                            `/houses?type=${encodeURIComponent(cat.name)}`,
                          )
                        }
                        className="bg-slate-900 hover:bg-slate-800 text-white font-black px-8 py-3 rounded-2xl shadow-xl hover:shadow-amber-500/20 transition-all active:scale-95 flex items-center gap-2 group/btn"
                      >
                        <span className="uppercase tracking-widest text-sm">
                          {t("viewAll")} {displayName} ({catHouses.length})
                        </span>
                        <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </motion.div>
                  </div>

                  <HouseGrid
                    houses={catHouses.slice(0, 6)}
                    loading={false}
                    columns={3}
                  />
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Video Tours Showcase Section */}
      {houses.some((h) => h.video_url) && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16"
        >
          <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-amber-500/20 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-b border-slate-800 pb-6">
              <div>
                <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 font-black text-[11px] px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 mb-2">
                  <Video className="w-3.5 h-3.5" />
                  <span>{t("watchVideo")}</span>
                </span>
                <h2 className="text-2xl md:text-3xl font-black text-white">
                  {t("featuredHouses")}
                </h2>
                <p className="text-slate-400 text-xs mt-1">{t("browseDesc")}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {houses
                .filter((h) => h.video_url)
                .slice(0, 3)
                .map((house) => (
                  <div
                    key={house.house_id || house.id}
                    className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden group hover:border-amber-500/50 transition"
                  >
                    <div className="relative h-48 bg-black">
                      {house.video_url.includes("youtube.com") ||
                      house.video_url.includes("youtu.be") ? (
                        <iframe
                          src={house.video_url
                            .replace("watch?v=", "embed/")
                            .replace("youtu.be/", "youtube.com/embed/")}
                          title={house.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video
                          src={house.video_url}
                          controls
                          className="w-full h-full object-cover bg-black"
                          poster={house.image_url}
                        />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-white text-sm truncate mb-1">
                        {house.title}
                      </h3>
                      <p className="text-slate-400 text-xs flex items-center gap-1 mb-3">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        <span>
                          {[house.sub_city, house.city]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </p>
                      <div className="flex justify-between items-center pt-3 border-t border-slate-900">
                        <span className="text-amber-400 font-black text-sm">
                          {Number(house.price).toLocaleString()} ETB/mo
                        </span>
                        <button
                          onClick={() => setSelectedDetailHouse(house)}
                          className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>{t("preview")}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Tenant Seeking Ads Section */}
      <TenantSeekingAds openModalTrigger={seekingModalTrigger} />

      {/* Testimonials Carousel Section */}
      <Testimonials />

      {/* Section Settings Modal */}
      {isSectionSettingsModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setIsSectionSettingsModalOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100"
          >
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-black flex items-center gap-2">
                <Edit size={20} className="text-amber-500" />
                Edit Section Header
              </h3>
              <button
                onClick={() => setIsSectionSettingsModalOpen(false)}
                className="hover:bg-white/10 p-2 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveSectionSettings} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider">
                  Main Title (English)
                </label>
                <input
                  type="text"
                  required
                  value={sectionSettingsForm.home_categories_title}
                  onChange={(e) =>
                    setSectionSettingsForm({
                      ...sectionSettingsForm,
                      home_categories_title: e.target.value,
                    })
                  }
                  className="w-full bg-gray-50 border border-gray-200 text-black rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500 outline-none font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider">
                  Main Title (Amharic)
                </label>
                <input
                  type="text"
                  required
                  value={sectionSettingsForm.home_categories_title_am}
                  onChange={(e) =>
                    setSectionSettingsForm({
                      ...sectionSettingsForm,
                      home_categories_title_am: e.target.value,
                    })
                  }
                  className="w-full bg-gray-50 border border-gray-200 text-black rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500 outline-none font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider">
                  Sliding Subtitle (English)
                </label>
                <textarea
                  required
                  rows={2}
                  value={sectionSettingsForm.home_categories_subtitle}
                  onChange={(e) =>
                    setSectionSettingsForm({
                      ...sectionSettingsForm,
                      home_categories_subtitle: e.target.value,
                    })
                  }
                  className="w-full bg-gray-50 border border-gray-200 text-black rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500 outline-none font-bold resize-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider">
                  Sliding Subtitle (Amharic)
                </label>
                <textarea
                  required
                  rows={2}
                  value={sectionSettingsForm.home_categories_subtitle_am}
                  onChange={(e) =>
                    setSectionSettingsForm({
                      ...sectionSettingsForm,
                      home_categories_subtitle_am: e.target.value,
                    })
                  }
                  className="w-full bg-gray-50 border border-gray-200 text-black rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500 outline-none font-bold resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingSectionSettings}
                className="w-full bg-slate-900 hover:bg-black disabled:bg-slate-500 text-amber-500 font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition active:scale-95 shadow-xl"
              >
                {isSavingSectionSettings ? (
                  <ButtonSpinner size={20} />
                ) : (
                  <>
                    <Save size={20} /> Save Changes
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Category Edit/Add Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setIsCategoryModalOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100"
          >
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-black flex items-center gap-2">
                {editingCategory ? (
                  <Edit size={20} className="text-amber-500" />
                ) : (
                  <Plus size={20} className="text-amber-500" />
                )}
                {editingCategory ? "Edit Category" : "Add New Category"}
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="hover:bg-white/10 p-2 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveCategory} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider">
                    Name (English)
                  </label>
                  <input
                    type="text"
                    required
                    value={categoryForm.name}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, name: e.target.value })
                    }
                    className="w-full bg-white border border-gray-300 text-slate-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500 outline-none font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-600 uppercase tracking-wider">
                    Name (Amharic)
                  </label>
                  <input
                    type="text"
                    required
                    value={categoryForm.name_am}
                    onChange={(e) =>
                      setCategoryForm({
                        ...categoryForm,
                        name_am: e.target.value,
                      })
                    }
                    className="w-full bg-white border border-gray-300 text-slate-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500 outline-none font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider">
                  Description (English)
                </label>
                <textarea
                  required
                  rows={2}
                  value={categoryForm.description}
                  onChange={(e) =>
                    setCategoryForm({
                      ...categoryForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full bg-white border border-gray-300 text-slate-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500 outline-none font-semibold resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider">
                  Description (Amharic)
                </label>
                <textarea
                  required
                  rows={2}
                  value={categoryForm.description_am}
                  onChange={(e) =>
                    setCategoryForm({
                      ...categoryForm,
                      description_am: e.target.value,
                    })
                  }
                  className="w-full bg-white border border-gray-300 text-slate-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500 outline-none font-semibold resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider">
                  Font Size Class
                </label>
                <select
                  value={categoryForm.font_size}
                  onChange={(e) =>
                    setCategoryForm({
                      ...categoryForm,
                      font_size: e.target.value,
                    })
                  }
                  className="w-full bg-white border border-gray-300 text-slate-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500 outline-none font-semibold"
                >
                  <option value="text-xl md:text-2xl">Small</option>
                  <option value="text-2xl md:text-3xl">Medium</option>
                  <option value="text-2xl md:text-4xl">Large (Default)</option>
                  <option value="text-3xl md:text-5xl">Extra Large</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSavingCategory}
                className="w-full bg-slate-900 hover:bg-black disabled:bg-slate-500 text-amber-500 font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition active:scale-95 shadow-xl"
              >
                {isSavingCategory ? (
                  <ButtonSpinner size={20} />
                ) : (
                  <>
                    <Save size={20} />{" "}
                    {editingCategory ? "Update Category" : "Create Category"}
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Hero Slide Edit Modal */}
      {isHeroSlideModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setIsHeroSlideModalOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100"
          >
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-black flex items-center gap-2">
                <Edit size={20} className="text-amber-500" />
                Edit Slide
              </h3>
              <button
                onClick={() => setIsHeroSlideModalOpen(false)}
                className="hover:bg-white/10 p-2 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveHeroSlide} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider">
                  Preset Category
                </label>
                <select
                  onChange={(e) => {
                    const val = e.target.value.split("|");
                    setHeroSlideForm({
                      ...heroSlideForm,
                      title_en: val[0],
                      title_am: val[1],
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-950 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500 outline-none font-semibold"
                >
                  <option value="|">Select Preset...</option>
                  <option value="Residential|የመኖሪያ ቤት">
                    Residential (የመኖሪያ ቤት)
                  </option>
                  <option value="Commercial|የንግድ ሱቅ">
                    Commercial (የንግድ ሱቅ)
                  </option>
                  <option value="Hotel & Food|ለሆቴል እና ለምግብ (ሽሮ) ቤት">
                    Hotel & Food (ለሆቴል እና ለምግብ (ሽሮ) ቤት)
                  </option>
                  <option value="Electronics & Photo|ለኤሌክትሮኒክስ እና ፎቶ ቤት">
                    Electronics & Photo (ለኤሌክትሮኒክስ እና ፎቶ ቤት)
                  </option>
                  <option value="Pharmacy & Clinic|ለፋርማሲ እና ክሊኒክ">
                    Pharmacy & Clinic (ለፋርማሲ እና ክሊኒክ)
                  </option>
                  <option value="Others|ሌሎች የንግድና የአገልግሎት ቦታዎች">
                    Others (ሌሎች የንግድና የአገልግሎት ቦታዎች)
                  </option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-600 uppercase tracking-wider">
                    Title (English)
                  </label>
                  <input
                    type="text"
                    required
                    value={heroSlideForm.title_en}
                    onChange={(e) =>
                      setHeroSlideForm({
                        ...heroSlideForm,
                        title_en: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 text-black rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500 outline-none font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-600 uppercase tracking-wider">
                    Title (Amharic)
                  </label>
                  <input
                    type="text"
                    required
                    value={heroSlideForm.title_am}
                    onChange={(e) =>
                      setHeroSlideForm({
                        ...heroSlideForm,
                        title_am: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 text-black rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500 outline-none font-semibold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-600 uppercase tracking-wider">
                    Subtitle (English)
                  </label>
                  <input
                    type="text"
                    required
                    value={heroSlideForm.subtitle_en}
                    onChange={(e) =>
                      setHeroSlideForm({
                        ...heroSlideForm,
                        subtitle_en: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 text-black rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500 outline-none font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-600 uppercase tracking-wider">
                    Subtitle (Amharic)
                  </label>
                  <input
                    type="text"
                    required
                    value={heroSlideForm.subtitle_am}
                    onChange={(e) =>
                      setHeroSlideForm({
                        ...heroSlideForm,
                        subtitle_am: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 text-black rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500 outline-none font-semibold"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider">
                  Image URL
                </label>
                <input
                  type="url"
                  required
                  value={heroSlideForm.image_url}
                  onChange={(e) =>
                    setHeroSlideForm({
                      ...heroSlideForm,
                      image_url: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 text-black rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500 outline-none font-semibold"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingHeroSlide}
                className="w-full bg-slate-900 hover:bg-black disabled:bg-slate-500 text-amber-500 font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition active:scale-95 shadow-xl"
              >
                {isSavingHeroSlide ? (
                  <ButtonSpinner size={20} />
                ) : (
                  <>
                    <Save size={20} /> Save Changes
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Ticker Edit Modal */}
      {isTickerModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setIsTickerModalOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100"
          >
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-black flex items-center gap-2">
                <Edit size={20} className="text-amber-500" />
                {editingTickerItem ? "Edit Ticker Item" : "Add Ticker Item"}
              </h3>
              <button
                onClick={() => setIsTickerModalOpen(false)}
                className="hover:bg-white/10 p-2 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveTickerItem} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider">
                  Text (English)
                </label>
                <input
                  type="text"
                  required
                  value={tickerForm.text_en}
                  onChange={(e) =>
                    setTickerForm({ ...tickerForm, text_en: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 text-black rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500 outline-none font-semibold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider">
                  Text (Amharic)
                </label>
                <input
                  type="text"
                  required
                  value={tickerForm.text_am}
                  onChange={(e) =>
                    setTickerForm({ ...tickerForm, text_am: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 text-black rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500 outline-none font-semibold"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={tickerForm.is_active}
                  onChange={(e) =>
                    setTickerForm({
                      ...tickerForm,
                      is_active: e.target.checked,
                    })
                  }
                />
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider">
                  Active
                </label>
              </div>

              <button
                type="submit"
                disabled={isSavingTicker}
                className="w-full bg-slate-900 hover:bg-black disabled:bg-slate-500 text-amber-500 font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition active:scale-95 shadow-xl"
              >
                {isSavingTicker ? (
                  <ButtonSpinner size={20} />
                ) : (
                  <>
                    <Save size={20} /> Save Changes
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
