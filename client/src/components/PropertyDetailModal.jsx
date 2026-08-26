import React, { useState, useEffect } from "react";
import {
  X,
  MapPin,
  Home,
  Bed,
  Bath,
  Maximize,
  Calendar,
  Phone,
  MessageSquare,
  Send,
  MessageCircle,
  Heart,
  Share2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Star,
  FileText,
  Video,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Zap,
  Car,
  Shield,
  Clock,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatEthiopianDate } from "../utils/date";
import { useLanguage } from "../context/LanguageContext";
import OptimizedImage from "./OptimizedImage";
import CITY_CONFIG from "../config/cityConfig";
import appConfig from "../config/appConfig";

export default function PropertyDetailModal({
  isOpen,
  onClose,
  house,
  onRequestRental,
  onContactBroker,
  onToggleFavorite,
  isFavorite = false,
}) {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  // Keyboard escape listener to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !house) return null;

  // Prepare images list (fallback to placeholder array if single image)
  const images =
    house.images && house.images.length > 0
      ? house.images
      : [
          house.image_url ||
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80",
        ];

  const formattedPrice = house.price
    ? Number(house.price).toLocaleString()
    : "0";
  const phone = house.owner_phone || appConfig.supportPhone;
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const locationString = [house.sub_city, house.city, house.region]
    .filter(Boolean)
    .join(", ");

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCall = () => {
    window.open(`tel:${phone}`, "_self");
  };

  const defaultMsg =
    language === "am"
      ? `ሰላም፣ በእንጅባራ ቤት ደላላ የተለጠፈውን "${house.title}" (ዋጋ፡ ${formattedPrice} ብር/በወር) ማየት እፈልጋለሁ። ይገኛል?`
      : `Hello, I am interested in property "${house.title}" listed for ${formattedPrice} ETB/month in Injibara. Is it available?`;

  const handleWhatsApp = () => {
    const text = encodeURIComponent(defaultMsg);
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, "_blank");
  };

  const handleTelegram = () => {
    const text = encodeURIComponent(defaultMsg);
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${text}`,
      "_blank",
    );
  };

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-5 pt-20 sm:pt-28 pb-12 overflow-y-auto animate-fadeIn">
      <div
        className="bg-slate-900 border border-slate-800 text-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden my-4 relative flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Modal Top Bar */}
        <div className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden pr-2">
            <span className="bg-amber-500/15 border border-amber-500/30 text-amber-400 font-extrabold text-[11px] px-3 py-1 rounded-full uppercase tracking-wider shrink-0">
              {house.type || (language === "am" ? "የመኖሪያ ቤት" : "Residential")}
            </span>
            <h2 className="text-base sm:text-lg font-bold text-white truncate">
              {language === "am" ? house.title_am || house.title : house.title}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onToggleFavorite && (
              <button
                onClick={(e) => onToggleFavorite(e, house.house_id)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                title={isFavorite ? t("saved") : t("saveProperty")}
              >
                <Heart
                  className={`w-5 h-5 ${isFavorite ? "text-red-500 fill-red-500" : "text-slate-300"}`}
                />
              </button>
            )}

            <button
              onClick={handleShare}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer relative"
              title={language === "am" ? "ሊንኩን አጋራ" : "Share property"}
            >
              <Share2 className="w-5 h-5" />
              {copied && (
                <span className="absolute -bottom-8 right-0 bg-amber-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded shadow">
                  {language === "am" ? "ተገልብጧል!" : "Copied!"}
                </span>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto p-5 sm:p-7 space-y-6">
          {/* Main Image Gallery Carousel */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 group h-64 sm:h-96">
            <OptimizedImage
              src={images[activeImageIndex]}
              alt={`${house.title} - view ${activeImageIndex + 1}`}
              className="w-full h-full object-cover"
              imgClassName="transition duration-500"
            />

            {/* Price Tag Overlay */}
            <div className="absolute top-4 left-4 bg-slate-950/90 backdrop-blur border border-amber-500/40 text-amber-400 px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2">
              <div>
                <span className="text-xl sm:text-2xl font-black">
                  {formattedPrice} ETB
                </span>
                <span className="text-xs text-slate-300 font-bold block">
                  {t("perMonth")}
                </span>
              </div>
            </div>

            {/* Availability Badge Overlay */}
            <div className="absolute top-4 right-4">
              {house.status === "Rented" ? (
                <span className="inline-flex items-center gap-1.5 bg-red-950/90 border border-red-500/50 text-red-400 text-xs font-black px-3 py-1.5 rounded-xl backdrop-blur shadow-md">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  {t("rented")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 bg-emerald-950/90 border border-emerald-500/50 text-emerald-400 text-xs font-black px-3 py-1.5 rounded-xl backdrop-blur shadow-md">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  {t("available")}
                </span>
              )}
            </div>

            {/* Gallery Nav Buttons */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-slate-950/70 hover:bg-slate-950 text-white p-2 rounded-full border border-slate-700 transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-950/70 hover:bg-slate-950 text-white p-2 rounded-full border border-slate-700 transition"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Image Indicator Bar */}
            {images.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-950/80 backdrop-blur px-3 py-1 rounded-full border border-slate-800 flex items-center gap-1.5">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`h-2 rounded-full transition-all ${
                      activeImageIndex === idx
                        ? "w-5 bg-amber-400"
                        : "w-2 bg-slate-600"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Virtual Video Tour Section if present */}
          {house.video_url && (
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 border border-amber-500/30 p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-amber-400">
                      {t("virtualTour")}
                    </h4>
                    <p className="text-xs text-slate-300">
                      {t("virtualTourSubtitle")}
                    </p>
                  </div>
                </div>

                <a
                  href={house.video_url}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs px-3 py-1.5 rounded-lg border border-amber-500/30 transition shrink-0 flex items-center gap-1"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>{t("openLink")}</span>
                </a>
              </div>

              {/* Embedded Video Player */}
              <div className="rounded-xl overflow-hidden bg-black border border-amber-500/20 shadow-2xl">
                {house.video_url.includes("youtube.com") ||
                house.video_url.includes("youtu.be") ? (
                  <iframe
                    src={house.video_url
                      .replace("watch?v=", "embed/")
                      .replace("youtu.be/", "youtube.com/embed/")}
                    title={house.title}
                    className="w-full h-64 sm:h-80 rounded-xl border-none"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={house.video_url}
                    controls
                    className="w-full max-h-96 rounded-xl object-contain bg-black"
                    poster={house.image_url}
                  >
                    {t("videoPlaybackError")}
                  </video>
                )}
              </div>
            </div>
          )}

          {/* Location & Title Header */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                {language === "am"
                  ? house.title_am || house.title
                  : house.title}
              </h1>
            </div>

            <p className="flex items-center text-slate-300 text-sm font-semibold">
              <MapPin className="w-4 h-4 mr-1.5 text-amber-400 shrink-0" />
              <span>
                {locationString ||
                  (language === "am"
                    ? `${CITY_CONFIG.cityNameAm}፣ ኢትዮጵያ`
                    : `${CITY_CONFIG.cityNameEn}, Ethiopia`)}
              </span>
              {house.address && (
                <span className="text-slate-400 font-normal ml-2">
                  ({house.address})
                </span>
              )}
            </p>
          </div>

          {/* Key Features & Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-3 p-2.5 bg-slate-900 rounded-xl border border-slate-800/80">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                <Bed className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-bold block">
                  {t("roomsLabel")}
                </span>
                <span className="text-sm font-black text-white">
                  {house.rooms || 1} {t("rooms")}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 bg-slate-900 rounded-xl border border-slate-800/80">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                <Bath className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-bold block">
                  {t("bathsLabel")}
                </span>
                <span className="text-sm font-black text-white">
                  {house.bathrooms || 1} {t("baths")}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 bg-slate-900 rounded-xl border border-slate-800/80">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                <Maximize className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-bold block">
                  {t("sqm")}
                </span>
                <span className="text-sm font-black text-white">
                  {house.square_meter || "N/A"} m²
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 bg-slate-900 rounded-xl border border-slate-800/80">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-bold block">
                  {t("dateListed")}
                </span>
                <span className="text-xs font-bold text-white">
                  {house.created_at
                    ? formatEthiopianDate(house.created_at)
                    : t("cityCenter")}
                </span>
              </div>
            </div>
          </div>

          {/* Property Amenities List */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              {t("propertyAmenities")}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs text-slate-300 font-medium">
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                <Droplets className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{t("waterReservoir")}</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{t("electricMeter")}</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                <Car className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{t("parkingSpace")}</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{t("secureCompound")}</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                <Home className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{t("nearMainRoad")}</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{t("readyMoveIn")}</span>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t("propertyDescription")}
            </h3>
            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
              {language === "am"
                ? house.description_am ||
                  house.description ||
                  t("defaultDescription")
                : house.description || t("defaultDescription")}
            </p>
          </div>

          {/* Verified Broker & Contact Info Section */}
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/30 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-sm">
                  {house.owner_name
                    ? house.owner_name.charAt(0).toUpperCase()
                    : "I"}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {house.owner_name ||
                      (language === "am"
                        ? "እንጅባራ ቤት ደላላ / Landlord"
                        : "Injibara House Broker")}
                  </h4>
                  <span className="text-[11px] text-amber-400 flex items-center gap-1 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {t("verifiedBroker")}
                  </span>
                </div>
              </div>
            </div>

            {/* Direct Contact Buttons */}
            <div>
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                {t("instantContact")}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  onClick={handleCall}
                  className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 px-3 rounded-xl transition text-xs shadow-md cursor-pointer"
                >
                  <Phone className="w-4 h-4 shrink-0" />
                  <span>{t("callPhone")}</span>
                </button>

                <button
                  onClick={handleWhatsApp}
                  className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-black py-3 px-3 rounded-xl transition text-xs shadow-md cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" />
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={handleTelegram}
                  className="flex items-center justify-center gap-2 bg-[#0088cc] hover:bg-[#0077b5] text-white font-black py-3 px-3 rounded-xl transition text-xs shadow-md cursor-pointer"
                >
                  <Send className="w-4 h-4 shrink-0" />
                  <span>Telegram</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    if (!house?.owner_id) {
                      navigate("/login", { state: { from: "/messages" } });
                      return;
                    }
                    navigate(
                      `/messages?user=${house.owner_id}&house=${house.house_id}`,
                    );
                  }}
                  className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 px-3 rounded-xl transition text-xs shadow-md cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span>{t("chatLandlord")}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Sticky Footer CTA */}
        <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-md p-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 z-20">
          <div>
            <span className="text-xs text-slate-400 font-bold block">
              {t("monthlyRent")}
            </span>
            <div className="text-xl font-black text-amber-400">
              {formattedPrice} ETB / {t("perMonth")}
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => {
                onClose();
                if (onContactBroker) {
                  onContactBroker(house);
                }
              }}
              className="flex-1 sm:flex-none px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs uppercase tracking-wider transition cursor-pointer border border-slate-700"
            >
              {t("contactBroker")}
            </button>

            <button
              disabled={house.status === "Rented"}
              onClick={() => {
                onClose();
                if (onRequestRental) {
                  onRequestRental(house);
                }
              }}
              className={`flex-1 sm:flex-none px-6 py-3 font-black rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-xl ${
                house.status === "Rented"
                  ? "bg-red-950 text-red-400 border border-red-800 cursor-not-allowed"
                  : "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20"
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>
                {house.status === "Rented" ? t("rented") : t("requestBtn")}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
