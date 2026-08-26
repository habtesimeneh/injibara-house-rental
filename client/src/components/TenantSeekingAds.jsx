import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  MapPin,
  DollarSign,
  Clock,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Plus,
  Phone,
  Home as HomeIcon,
  X,
  Send,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useNavigate } from "react-router-dom";
import { formatEthiopianDate } from "../utils/date";
import { ethiopianLocations, regions } from "../utils/locations";
import { motion, AnimatePresence } from "motion/react";
import OptimizedImage from "./OptimizedImage";

export default function TenantSeekingAds({ openModalTrigger = 0 }) {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [ads, setAds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (openModalTrigger > 0) {
      if (!user) {
        navigate("/login");
      } else {
        setIsModalOpen(true);
      }
    }
  }, [openModalTrigger, user, navigate]);

  // New Request Form State
  const { updateUserContext } = useAuth();
  const [newAd, setNewAd] = useState({
    title: "",
    house_type: "Apartment",
    preferred_location: "",
    budget_max: "",
    min_bedrooms: "1",
    description: "",
    contact_phone: "",
  });
  const [isCustomType, setIsCustomType] = useState(false);
  const [customHouseType, setCustomHouseType] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdAdDetails, setCreatedAdDetails] = useState(null);

  // Profile Fields States
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState("");

  useEffect(() => {
    if (user) {
      setFullName(user.name || "");
      setPhoneNumber(user.phone || "");
      setProfilePhotoPreview(user.avatar || "");
    }
  }, [user]);

  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Tenant seeking ad payment states
  const [selectedPaymentKey, setSelectedPaymentKey] = useState(null);
  const [tenantTransactionRef, setTenantTransactionRef] = useState("");
  const [tenantReceiptFile, setTenantReceiptFile] = useState(null);
  const [config, setConfig] = useState({ fees: {}, payments: {} });
  const [configLoading, setConfigLoading] = useState(false);
  const [configError, setConfigError] = useState("");
  const [copiedField, setCopiedField] = useState(null);

  const PAYMENT_LABELS = {
    telebirr: "Telebirr",
    cbe: "CBE Bank",
    abyssinia: "Abyssinia Bank",
    mpesa: "M-Pesa",
    amhara: "Amhara Bank",
  };

  const PAYMENT_ICONS = {
    telebirr: "📱",
    cbe: "🏦",
    abyssinia: "🏦",
    mpesa: "💸",
    amhara: "🏦",
  };

  const paymentMethods = Object.keys(config.payments || {});
  const selectedPayment = selectedPaymentKey
    ? config.payments[selectedPaymentKey]
    : null;
  const paymentMethod =
    selectedPaymentKey && PAYMENT_LABELS[selectedPaymentKey]
      ? PAYMENT_LABELS[selectedPaymentKey]
      : paymentMethods.length > 0
        ? PAYMENT_LABELS[paymentMethods[0]] || paymentMethods[0]
        : "";

  useEffect(() => {
    fetchAds();
    fetchConfig();
  }, []);

  const normalizeConfig = (raw) => {
    const data = raw?.data || raw || {};
    return {
      fees: data.fees || {},
      payments: data.payments || {},
    };
  };

  const fetchConfig = async () => {
    setConfigLoading(true);
    setConfigError("");
    try {
      const res = await axios.get("/api/payments/config");
      const normalized = normalizeConfig(res.data);
      setConfig(normalized);
      const methods = Object.keys(normalized.payments || {});
      if (methods.length > 0 && !selectedPaymentKey) {
        setSelectedPaymentKey(methods[0]);
      }
    } catch (e) {
      console.error(e);
      setConfigError(
        language === "am"
          ? "የክፍያ መረጃ ማግኘት አልተቻለም። እባክዎን እንደገና ይሞክሩ።"
          : "Payment information is temporarily unavailable. Please try again."
      );
    } finally {
      setConfigLoading(false);
    }
  };

  const fetchAds = async (selectNewest = false) => {
    try {
      const res = await axios.get("/api/seeking-ads");
      const data = Array.isArray(res.data) ? res.data : [];
      setAds(data);
      if (selectNewest) {
        setCurrentIndex(0);
      }
    } catch (err) {
      console.error("Error fetching ads", err);
    }
  };

  const nextSlide = () => {
    if (ads.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % ads.length);
  };

  const prevSlide = () => {
    if (ads.length === 0) return;
    setCurrentIndex((prev) => (prev === 0 ? ads.length - 1 : prev - 1));
  };

  // Touch handlers for mobile swipe
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsPaused(true);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    setIsPaused(false);
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  useEffect(() => {
    if (ads.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 6000);
    return () => clearInterval(timer);
  }, [ads.length, isPaused]);

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("እባክዎን የቤት ፍላጎት ለማስመዝገብ መጀመሪያ ይግቡ (Please sign in to post)");
      navigate("/login");
      return;
    }

    if (!fullName.trim() || !phoneNumber.trim()) {
      alert(
        language === "am"
          ? "እባክዎን ሙሉ ስምዎን እና ስልክ ቁጥርዎን ያስገቡ"
          : "Please enter your Full Name and Phone Number.",
      );
      return;
    }

    if (!profilePhotoFile && !profilePhotoPreview) {
      alert(
        language === "am"
          ? "እባክዎን የፕሮፋይል ፎቶዎን ያስገቡ (ግዴታ)"
          : "Please upload your Profile Photo (Required).",
      );
      return;
    }

    if (!tenantTransactionRef.trim()) {
      alert(
        language === "am"
          ? "እባክዎን የትራንዛክሽን ቁጥር (Transaction Ref Number) ያስገቡ"
          : "Please enter your Transaction Reference Number.",
      );
      return;
    }

    setPosting(true);
    try {
      const token = localStorage.getItem("token");

      if (!selectedPaymentKey || !paymentMethods.includes(selectedPaymentKey)) {
        alert(
          language === "am"
            ? "እባክዎን የትክክለኛ የክፍያ ዘዴ ይምረጡ"
            : "Please select a valid payment method.",
        );
        setPosting(false);
        return;
      }

      // 1. Upload profile photo if a new one is selected
      let finalAvatarUrl = profilePhotoPreview;
      if (profilePhotoFile) {
        const uploadForm = new FormData();
        uploadForm.append("image", profilePhotoFile);
        const uploadRes = await axios.post(
          "/api/testimonials/upload",
          uploadForm,
          {
            headers: { "Content-Type": "multipart/form-data" },
          },
        );
        finalAvatarUrl = uploadRes.data.image_url;
      }

      // 2. Update user profile details in backend
      await axios.put("/api/auth/profile", {
        name: fullName.trim(),
        phone: phoneNumber.trim(),
        avatar: finalAvatarUrl,
      });

      // 3. Update React User context
      if (updateUserContext) {
        updateUserContext({
          name: fullName.trim(),
          phone: phoneNumber.trim(),
          avatar: finalAvatarUrl,
        });
      }

      const finalHouseType =
        isCustomType || newAd.house_type === "Custom"
          ? customHouseType.trim() || "ሌላ የቤት ዓይነት"
          : newAd.house_type;

      // 4. Create seeking ad
      const formPayload = new FormData();
      formPayload.append(
        "title",
        newAd.title || `${finalHouseType} ፈላጊ በ ${newAd.preferred_location}`,
      );
      formPayload.append(
        "description",
        `${newAd.description} | የክፍል ብዛት: ${newAd.min_bedrooms} | ስልክ: ${phoneNumber.trim()}`,
      );
      formPayload.append("preferred_location", newAd.preferred_location);
      formPayload.append("budget_max", newAd.budget_max);
      formPayload.append("house_type", finalHouseType);
      formPayload.append("payment_method", selectedPaymentKey);
      formPayload.append("transaction_ref", tenantTransactionRef.trim());
      if (tenantReceiptFile) {
        formPayload.append("receipt", tenantReceiptFile);
      }

      const res = await axios.post("/api/seeking-ads", formPayload, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      const newlyAddedAd = {
        id: res.data?.id || Date.now(),
        user_id: user.user_id || user.id,
        user_name: fullName.trim(),
        user_avatar: finalAvatarUrl,
        user_phone: phoneNumber.trim(),
        title:
          newAd.title || `${finalHouseType} ፈላጊ በ ${newAd.preferred_location}`,
        description: `${newAd.description || ""} | የክፍል ብዛት: ${newAd.min_bedrooms} | ስልክ: ${phoneNumber.trim()}`,
        preferred_location: newAd.preferred_location,
        budget_max: newAd.budget_max,
        house_type: finalHouseType,
        created_at: new Date().toISOString(),
      };

      // Immediately prepend to homepage slider and jump to index 0
      setAds((prev) => [
        newlyAddedAd,
        ...prev.filter((a) => a.id !== newlyAddedAd.id),
      ]);
      setCurrentIndex(0);

      setCreatedAdDetails(newlyAddedAd);
      setIsModalOpen(false);
      setShowSuccessModal(true);

      setNewAd({
        title: "",
        house_type: "Apartment",
        preferred_location: "",
        budget_max: "",
        min_bedrooms: "1",
        description: "",
        contact_phone: "",
      });
      setIsCustomType(false);
      setCustomHouseType("");
      setTenantTransactionRef("");
      setTenantReceiptFile(null);
      fetchAds(true); // Sync with backend
    } catch (err) {
      alert(err.response?.data?.error || "ለማስመዝገብ አልተቻለም");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div
      id="tenant-seeking-ads-section"
      className="bg-slate-900 text-white py-20 border-t border-slate-800 relative overflow-hidden"
    >
      {/* Background Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
      >
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-400 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-amber-500/20 mb-3">
              <Sparkles size={14} /> {t("liveTenantRequests")}
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              {t("tenantSeekingTitle")}
            </h2>
            <p className="text-slate-400 mt-2 text-sm md:text-base max-w-2xl">
              {t("tenantSeekingSubtitle")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (!user) {
                  navigate("/login");
                } else {
                  setIsModalOpen(true);
                }
              }}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-5 py-3 rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              <Plus size={18} /> {t("postSeekingRequest")}
            </button>

            {ads.length > 1 && (
              <div className="flex gap-2">
                <button
                  onClick={prevSlide}
                  className="w-11 h-11 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:bg-amber-500 hover:text-slate-950 transition shadow-md"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={nextSlide}
                  className="w-11 h-11 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:bg-amber-500 hover:text-slate-950 transition shadow-md"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Carousel Container */}
        {ads.length === 0 ? (
          <div className="bg-slate-800/60 rounded-3xl p-12 text-center border border-slate-700/60 max-w-2xl mx-auto">
            <HomeIcon
              size={48}
              className="mx-auto text-amber-500 mb-4 opacity-80"
            />
            <h3 className="text-xl font-bold text-white mb-2">
              {t("noSeekingRequests")}
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              {t("noSeekingRequestsDesc")}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider inline-flex items-center gap-2"
            >
              <Plus size={16} /> {t("postFirstRequest")}
            </button>
          </div>
        ) : (
          <div
            className="relative min-h-[420px] sm:min-h-[380px] flex items-center justify-center touch-pan-y"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Side Navigation Buttons overlay for quick touch/click */}
            {ads.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-0 sm:left-2 top-1/2 -translate-y-1/2 z-30 p-3 bg-slate-950/80 border border-slate-700/80 text-amber-400 rounded-full hover:bg-amber-500 hover:text-slate-950 transition shadow-2xl backdrop-blur-md cursor-pointer"
                  title="Previous Request"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-0 sm:right-2 top-1/2 -translate-y-1/2 z-30 p-3 bg-slate-950/80 border border-slate-700/80 text-amber-400 rounded-full hover:bg-amber-500 hover:text-slate-950 transition shadow-2xl backdrop-blur-md cursor-pointer"
                  title="Next Request"
                >
                  <ChevronRight size={22} />
                </button>
              </>
            )}

            <AnimatePresence mode="wait">
              {ads.map((ad, idx) => {
                if (idx !== currentIndex) return null;

                return (
                  <motion.div
                    key={ad.id}
                    initial={{ opacity: 0, x: 50, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -50, scale: 0.95 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="absolute inset-0 w-full md:w-3/4 lg:w-2/3 mx-auto"
                  >
                    <div className="bg-slate-950/95 rounded-3xl p-6 sm:p-8 md:p-10 border border-slate-800 shadow-2xl backdrop-blur-xl h-full flex flex-col justify-between relative group">
                      {/* Top Row: User Avatar, Name & Date */}
                      <div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                          <div className="flex items-center gap-4">
                            {ad.user_avatar ? (
                              <OptimizedImage
                                src={ad.user_avatar}
                                alt="Avatar"
                                className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-500/50 shadow-lg shrink-0"
                                width={56}
                                height={56}
                              />
                            ) : (
                              <div className="w-14 h-14 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner shrink-0">
                                {ad.user_name?.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <h4 className="font-black text-white text-base sm:text-lg md:text-xl flex flex-wrap items-center gap-2">
                                <span>{ad.user_name}</span>
                                <span className="text-[10px] bg-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                                  {t("seeker")}
                                </span>
                              </h4>
                              <div className="flex items-center text-xs text-slate-400 gap-1 mt-1 font-medium">
                                <Clock size={13} className="text-amber-500" />
                                {t("postedOn")}:{" "}
                                {formatEthiopianDate(ad.created_at)}
                              </div>
                            </div>
                          </div>

                          {/* Direct Contact Buttons */}
                          <div className="flex items-center gap-2 self-start sm:self-auto">
                            {ad.user_phone && (
                              <a
                                href={`tel:${ad.user_phone}`}
                                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-md"
                                title="በስልክ ደውል"
                              >
                                <Phone size={15} /> ደውል ({ad.user_phone})
                              </a>
                            )}
                            <button
                              onClick={() => navigate("/messages")}
                              className="bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 p-2.5 rounded-xl border border-slate-700 transition cursor-pointer"
                              title="መልዕክት ላክ"
                            >
                              <MessageSquare size={18} />
                            </button>
                          </div>
                        </div>

                        {/* Criteria Badges Bar */}
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          <span className="bg-slate-900 border border-slate-800 text-amber-400 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                            <HomeIcon size={14} /> {t("houseType")}:{" "}
                            <strong className="text-white">
                              {ad.house_type || t("notSpecified")}
                            </strong>
                          </span>
                          <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5">
                            <DollarSign size={14} /> {t("budget")}:{" "}
                            <strong className="text-amber-400 text-sm">
                              {Number(ad.budget_max).toLocaleString()} ETB/mo
                            </strong>
                          </span>
                          <span className="bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                            <MapPin size={14} className="text-amber-500" />{" "}
                            {t("location")}:{" "}
                            <strong className="text-white">
                              {ad.preferred_location}
                            </strong>
                          </span>
                        </div>

                        {/* Request Title & Description */}
                        <h3 className="text-lg sm:text-xl md:text-2xl font-black text-white mb-2 leading-snug">
                          "{ad.title}"
                        </h3>
                        <p className="text-slate-300 text-xs sm:text-sm md:text-base leading-relaxed line-clamp-3 bg-slate-900/60 p-3.5 sm:p-4 rounded-2xl border border-slate-800/80">
                          {ad.description}
                        </p>
                      </div>

                      {/* Bottom Status Row */}
                      <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800/80">
                        <span className="text-xs text-slate-400 font-medium truncate max-w-[60%]">
                          {t("location")}:{" "}
                          <strong className="text-amber-400 font-bold">
                            {ad.preferred_location}
                          </strong>
                        </span>
                        <span
                          className="text-xs font-bold text-amber-500 hover:underline cursor-pointer"
                          onClick={() => navigate("/messages")}
                        >
                          {t("contactLandlordSystem")} →
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Slide Pagination Indicators */}
        {ads.length > 1 && (
          <div className="flex flex-col items-center gap-3 mt-8">
            <div className="flex justify-center items-center gap-2">
              {ads.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                    i === currentIndex
                      ? "w-8 bg-amber-500 shadow-md shadow-amber-500/30"
                      : "w-2.5 bg-slate-700 hover:bg-slate-500"
                  }`}
                  title={`Slide ${i + 1}`}
                />
              ))}
            </div>
            <span className="text-[11px] font-extrabold text-amber-400 bg-slate-950/80 px-3 py-0.5 rounded-full border border-amber-500/20">
              ጥያቄ {currentIndex + 1} ከ {ads.length}
            </span>
          </div>
        )}
      </motion.div>

      {/* Post Seeking Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-start justify-center p-4 pt-20 sm:pt-28 pb-12 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="bg-slate-900 rounded-3xl p-6 md:p-8 max-w-lg w-full border border-slate-800 shadow-2xl relative text-white my-4">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1"
            >
              <X size={20} />
            </button>

            <h3 className="text-2xl font-black text-white mb-1 flex items-center gap-2">
              <Sparkles className="text-amber-500" size={24} />
              {t("postSeekingRequest")}
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              {t("postSeekingRequestDesc")}
            </p>

            <form onSubmit={handlePostSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-300">
                    የቤት ዓይነት (House Type)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomType(!isCustomType);
                      if (!isCustomType)
                        setNewAd({ ...newAd, house_type: "Custom" });
                      else setNewAd({ ...newAd, house_type: "Apartment" });
                    }}
                    className="text-[11px] font-extrabold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {isCustomType
                      ? "📋 ከዝርዝር ይምረጡ (Select Dropdown)"
                      : "✍️ በጽሁፍ ይፃፉ (Type Custom)"}
                  </button>
                </div>

                {!isCustomType && newAd.house_type !== "Custom" ? (
                  <select
                    value={newAd.house_type}
                    onChange={(e) => {
                      if (e.target.value === "Custom") {
                        setIsCustomType(true);
                      } else {
                        setNewAd({ ...newAd, house_type: e.target.value });
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-amber-500 outline-none font-medium cursor-pointer"
                  >
                    <option value="Apartment">Apartment (አፓርታማ)</option>
                    <option value="Villa">Villa (ቪላ)</option>
                    <option value="Condominium">Condominium (ኮንዶሚኒየም)</option>
                    <option value="Service Quarter">
                      Service Quarter (ሰርቪስ)
                    </option>
                    <option value="Studio">Studio (ስቱዲዮ)</option>
                    <option value="Commercial">Commercial (ንግድ ቤት / ሱቅ)</option>
                    <option value="Custom">
                      ✍️ ሌላ - በጽሁፍ ለመጻፍ (Type Custom...)
                    </option>
                  </select>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={customHouseType}
                      onChange={(e) => setCustomHouseType(e.target.value)}
                      placeholder={t("customHouseTypePlaceholder")}
                      className="w-full bg-slate-950 border border-amber-500/80 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-amber-500 outline-none pr-10 font-bold placeholder-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomType(false);
                        setNewAd({ ...newAd, house_type: "Apartment" });
                      }}
                      className="absolute right-3 top-3 text-slate-400 hover:text-white"
                      title="ወደ ዝርዝር ተመለስ"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {t("maxBudget")} (ETB)
                  </label>
                  <input
                    type="number"
                    required
                    value={newAd.budget_max}
                    onChange={(e) =>
                      setNewAd({ ...newAd, budget_max: e.target.value })
                    }
                    placeholder={t("budgetPlaceholder")}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {t("location")} (Location)
                  </label>
                  <input
                    type="text"
                    required
                    value={newAd.preferred_location}
                    onChange={(e) =>
                      setNewAd({ ...newAd, preferred_location: e.target.value })
                    }
                    placeholder={t("locationPlaceholderSeeking")}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {t("bedrooms")}
                  </label>
                  <select
                    value={newAd.min_bedrooms}
                    onChange={(e) =>
                      setNewAd({ ...newAd, min_bedrooms: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="1">1 {t("room")}</option>
                    <option value="2">2 {t("room")}</option>
                    <option value="3">3 {t("room")}</option>
                    <option value="4+">4+ {t("room")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {language === "am" ? "ሙሉ ስም (Full Name) *" : "Full Name *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={
                      language === "am" ? "ምሳሌ፡ ካሳሁን አበበ" : "e.g. Kasahun Abebe"
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-amber-500 outline-none font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {language === "am"
                      ? "ስልክ ቁጥር (Phone Number) *"
                      : "Phone Number *"}
                  </label>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="09..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-amber-500 outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {language === "am" ? "የፕሮፋይል ፎቶ *" : "Profile Photo *"}
                  </label>
                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 p-2.5 rounded-xl">
                    <div className="relative w-8 h-8 rounded-full border border-slate-700 bg-slate-900 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {profilePhotoPreview ? (
                        <OptimizedImage
                          src={profilePhotoPreview}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                          width={32}
                          height={32}
                        />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-slate-800" />
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      required={!profilePhotoPreview}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setProfilePhotoFile(file);
                          setProfilePhotoPreview(URL.createObjectURL(file));
                        }
                      }}
                      className="w-full text-[10px] text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-slate-800 file:text-white hover:file:bg-slate-700 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {t("additionalDetails")}
                </label>
                <textarea
                  rows="3"
                  value={newAd.description}
                  onChange={(e) =>
                    setNewAd({ ...newAd, description: e.target.value })
                  }
                  placeholder={t("seekingDescriptionPlaceholder")}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

               {/* Payment Section */}
               <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
                 <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                   <span className="text-amber-400 font-bold text-xs bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                     {language === "am" ? "ደረጃ 2" : "Step 2"}
                   </span>
                   <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">
                     {language === "am"
                       ? "የአገልግሎት ክፍያ (Service Fee Payment)"
                       : "Service Fee Payment"}
                   </h4>
                 </div>

                 {configLoading ? (
                   <div className="text-xs text-amber-400 font-bold animate-pulse">
                     {language === "am" ? "በመጫን ላይ..." : "Loading payment information..."}
                   </div>
                 ) : configError ? (
                   <div className="text-xs text-red-400 font-bold">
                     {configError}
                     <button
                       type="button"
                       onClick={fetchConfig}
                       className="block mt-1 underline"
                     >
                       {language === "am" ? "እንደገና ሞክር" : "Retry"}
                     </button>
                   </div>
                 ) : (
                   <>
                     <div className="text-xs text-slate-300 leading-relaxed">
                       {language === "am" ? (
                         <p>
                           ይህንን ማስታወቂያ ለመለጠፍ እባክዎ አስቀድመው{" "}
                           <span className="text-amber-400 font-black">
                             {config.fees?.tenant_seeking || "200"} ብር
                           </span>{" "}
                           በቴሌብር ወይም በባንክ በኩል ይክፈሉ፡
                         </p>
                       ) : (
                         <p>
                           To post this house seeking ad, please pay{" "}
                           <span className="text-amber-400 font-bold">
                             {config.fees?.tenant_seeking || "200"} ETB
                           </span>{" "}
                           service fee via Telebirr or Bank transfer:
                         </p>
                       )}
                     </div>

                     {paymentMethods.length === 0 ? (
                       <div className="text-xs text-slate-500 text-center py-2">
                         {language === "am"
                           ? "በአሁኑ ሰዓት የክፍያ መረጃ የለም።"
                           : "No payment methods configured."}
                       </div>
                     ) : (
                       <div className="grid grid-cols-2 gap-2">
                         {paymentMethods.map((key) => {
                           const label = PAYMENT_LABELS[key] || key;
                           const isSelected = selectedPaymentKey === key;
                           return (
                             <button
                               key={key}
                               type="button"
                               onClick={() => setSelectedPaymentKey(key)}
                               className={`py-2 px-1 text-center rounded-xl text-[10px] font-black transition active:scale-95 cursor-pointer ${
                                 isSelected
                                   ? "bg-amber-500 text-slate-950 shadow-md"
                                   : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                               }`}
                             >
                               {PAYMENT_ICONS[key] || "💳"} {label}
                             </button>
                           );
                         })}
                       </div>
                     )}

                     {/* Selected Method Details */}
                     <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
                       {selectedPayment ? (
                         (() => {
                           const label =
                             selectedPaymentKey && PAYMENT_LABELS[selectedPaymentKey]
                               ? PAYMENT_LABELS[selectedPaymentKey]
                               : selectedPaymentKey || "Payment";
                           const accountValue =
                             selectedPayment.account || selectedPayment.phone || "";
                           const accountName = selectedPayment.name || "";
                           const valueLabel =
                             selectedPaymentKey === "telebirr"
                               ? language === "am"
                                 ? "የስልክ ቁጥር"
                                 : "Phone Number"
                               : language === "am"
                                 ? "የሂሳብ ቁጥር"
                                 : "Account Number";

                           return (
                             <>
                               <div className="flex items-center justify-between py-1.5 border-b border-slate-700">
                                 <span className="text-slate-400">
                                   {language === "am" ? "ስም (Name)" : "Account Name"}
                                 </span>
                                 <span className="font-bold text-slate-950 text-right">
                                   {accountName || "-"}
                                 </span>
                               </div>
                               <div className="flex items-center justify-between py-1.5">
                                 <span className="text-slate-400">
                                   {valueLabel}
                                 </span>
                                 <div className="flex items-center gap-1.5">
                                   <span className="font-mono font-bold text-slate-900">
                                     {accountValue}
                                   </span>
                                   <button
                                     type="button"
                                     onClick={() =>
                                       handleCopy(accountValue, selectedPaymentKey)
                                     }
                                     className="p-1 hover:bg-slate-700 rounded text-slate-500"
                                   >
                                     {copiedField === selectedPaymentKey ? (
                                       <Check size={14} className="text-green-600" />
                                     ) : (
                                       <Copy size={14} />
                                     )}
                                   </button>
                                 </div>
                               </div>
                             </>
                           );
                         })()
                       ) : (
                         <div className="text-xs text-slate-400 text-center py-2">
                           {language === "am"
                             ? "እባክዎን የክፍያ ዘዴ ይምረጡ"
                             : "Please select a payment method above"}
                         </div>
                       )}
                     </div>

                     {/* Transaction Ref input */}
                     <div>
                       <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                         <span>
                           {language === "am"
                             ? "የትራንዛክሽን ቁጥር"
                             : "Transaction Ref Number"}
                         </span>
                         <span className="text-rose-500">*</span>
                       </label>
                       <input
                         type="text"
                         required
                         value={tenantTransactionRef}
                         onChange={(e) => setTenantTransactionRef(e.target.value)}
                         placeholder={
                           language === "am" ? "ምሳሌ፡ TXN1234567" : "e.g., TXN1234567"
                         }
                         className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white font-bold placeholder-slate-600 focus:ring-2 focus:ring-amber-500 outline-none"
                       />
                     </div>

                     {/* File Uploader */}
                     <div>
                       <label className="block text-xs font-bold text-slate-300 mb-1">
                         {language === "am"
                           ? "የክፍያ ደረሰኝ ፎቶ (አማራጭ)"
                           : "Receipt File / Image (Optional)"}
                       </label>
                       <input
                         type="file"
                         accept="image/*,application/pdf"
                         onChange={(e) =>
                           setTenantReceiptFile(
                             e.target.files ? e.target.files[0] : null,
                           )
                         }
                         className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-white hover:file:bg-slate-700 cursor-pointer"
                       />
                     </div>
                   </>
                 )}
               </div>

          <button
                type="submit"
                disabled={posting}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-sm transition shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                {posting ? t("registering") : t("submitSeekingRequest")}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Registration Success Confirmation Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-center">
            <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/40 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/10">
              <Sparkles size={32} />
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white mb-2">
              🎉 {t("registeredSuccessfully")}
            </h3>

            <p className="text-xs sm:text-sm text-amber-300 font-bold mb-4 bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl leading-relaxed">
              {t("seekingRequestSuccessMsg")}
            </p>

            {createdAdDetails && (
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl text-left mb-6 space-y-2 text-xs">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-slate-400 font-semibold">
                    {t("houseType")}:
                  </span>
                  <span className="font-bold text-amber-400">
                    {createdAdDetails.house_type}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-slate-400 font-semibold">
                    {t("location")}:
                  </span>
                  <span className="font-bold text-white">
                    {createdAdDetails.preferred_location}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-semibold">
                    {t("budget")}:
                  </span>
                  <span className="font-black text-amber-400">
                    {Number(createdAdDetails.budget_max).toLocaleString()}{" "}
                    ETB/mo
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setShowSuccessModal(false);
                setCurrentIndex(0);
              }}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-sm transition shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              {t("viewSlider")} →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
