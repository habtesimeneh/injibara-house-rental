import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "motion/react";
import OptimizedImage from "./OptimizedImage";
import PropertyCardSkeleton from "./PropertyCardSkeleton";
import {
  MapPin,
  Home as HomeIcon,
  Bed,
  Bath,
  Maximize,
  Star,
  Heart,
  ArrowRight,
  Grid,
  List,
  Calendar,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Phone,
  FileText,
  DollarSign,
  Video,
} from "lucide-react";
import { formatEthiopianDate } from "../utils/date";
import RentalRequestModal from "./RentalRequestModal";
import ContactBrokerModal from "./ContactBrokerModal";
import VideoModal from "./VideoModal";
const PropertyDetailModal = React.lazy(() => import("./PropertyDetailModal"));
import { useLoading } from "../context/LoadingContext";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import CITY_CONFIG from "../config/cityConfig";

export default function HouseGrid({
  houses = [],
  loading = false,
  columns = 3,
  onHouseClick,
  emptyTitle,
  emptyMessage,
  onClearFilters,
  showControls = false,
  onFavoriteToggle, // Optional callback when favorite is toggled
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isLoading: globalLoading } = useLoading();
  const { language, t } = useLanguage();

  const normalizedHouses = Array.isArray(houses)
    ? houses
    : Array.isArray(houses?.data)
      ? houses.data
      : [];

  const displayEmptyTitle = emptyTitle || t("noPropertiesFound");
  const displayEmptyMessage = emptyMessage || t("noPropertiesMsg");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'

  const isGridLoading =
    loading || (globalLoading && normalizedHouses.length === 0);
  const loadingStartTime = React.useRef(Date.now());
  const [displayLoading, setDisplayLoading] = React.useState(isGridLoading);

  React.useEffect(() => {
    if (isGridLoading) {
      loadingStartTime.current = Date.now();
      setDisplayLoading(true);
    } else {
      const elapsed = Date.now() - loadingStartTime.current;
      const remaining = Math.max(0, 2000 - elapsed);
      const timer = setTimeout(() => {
        setDisplayLoading(false);
      }, remaining);
      return () => clearTimeout(timer);
    }
  }, [isGridLoading]);

  const translateHouseType = (type, currentLang) => {
    if (!type) return currentLang === "am" ? "ቤት" : "House";

    // Map of common Amharic DB values to translation keys
    const amToKey = {
      "የመኖሪያ ቤት": "residential",
      ቪላ: "villa",
      አፓርታማ: "apartment",
      "ንግድ ቤት": "commercial",
      "ለንግድ ቤት": "commercial",
      ኮንዶሚኒየም: "condo",
      ስቱዲዮ: "studio",
      ቢሮ: "office",
      መጋዘን: "warehouse",
      መሬት: "land",
      ቦታ: "land",
    };

    // Map of common English DB values to translation keys
    const enToKey = {
      "Residential House": "residential",
      Villa: "villa",
      Apartment: "apartment",
      Commercial: "commercial",
      Shop: "commercial",
      Condominium: "condo",
      Studio: "studio",
      Office: "office",
      Warehouse: "warehouse",
      Land: "land",
      Plot: "land",
    };

    const key =
      amToKey[type] ||
      enToKey[type] ||
      enToKey[type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()] ||
      null;
    if (key) return t(key);

    return type; // Fallback to raw value if no mapping found
  };

  const [sortBy, setSortBy] = useState("featured"); // 'featured', 'price-asc', 'price-desc', 'newest'
  const [favorites, setFavorites] = useState({});
  const [selectedRequestHouse, setSelectedRequestHouse] = useState(null);
  const [selectedBrokerHouse, setSelectedBrokerHouse] = useState(null);
  const [selectedDetailHouse, setSelectedDetailHouse] = useState(null);
  const [selectedVideoHouse, setSelectedVideoHouse] = useState(null);

  useEffect(() => {
    // Load local storage saved wishlist items
    let localSaved = [];
    try {
      localSaved = JSON.parse(localStorage.getItem("wishlist_houses") || "[]");
    } catch (e) {
      localSaved = [];
    }

    const localFavMap = {};
    if (Array.isArray(localSaved)) {
      localSaved.forEach((id) => {
        localFavMap[id] = true;
      });
    }
    setFavorites(localFavMap);

    if (user && localStorage.getItem("token")) {
      fetchWishlist(localFavMap);
    }
  }, [user]);

  const fetchWishlist = async (initialLocalMap = {}) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await axios.get("/api/wishlist", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const favMap = { ...initialLocalMap };
      const data = Array.isArray(res.data) ? res.data : [];
      data.forEach((w) => {
        favMap[w.house_id] = true;
      });
      setFavorites(favMap);
      localStorage.setItem(
        "wishlist_houses",
        JSON.stringify(Object.keys(favMap).filter((k) => favMap[k])),
      );
    } catch (error) {
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        console.error("Failed to fetch wishlist", error);
      }
    }
  };

  const handleOpenChat = (house) => {
    if (!user) {
      navigate("/login", {
        state: {
          from: `/messages?user=${house.owner_id}&house=${house.house_id}`,
        },
      });
      return;
    }

    navigate(`/messages?user=${house.owner_id}&house=${house.house_id}`);
  };

  const toggleFavorite = async (e, houseId) => {
    e.stopPropagation();

    const isFav = !!favorites[houseId];
    const updatedFavs = { ...favorites, [houseId]: !isFav };

    // Save to local storage immediately
    setFavorites(updatedFavs);
    const savedIds = Object.keys(updatedFavs).filter((k) => updatedFavs[k]);
    localStorage.setItem("wishlist_houses", JSON.stringify(savedIds));

    // Also sync with backend if user logged in
    if (user) {
      try {
        if (isFav) {
          await axios.delete(`/api/wishlist/${houseId}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
        } else {
          await axios.post(
            `/api/wishlist/${houseId}`,
            {},
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            },
          );
        }
      } catch (error) {
        console.error("Failed to sync wishlist with server", error);
      }
    }

    if (onFavoriteToggle) {
      onFavoriteToggle();
    }
  };

  const handleCardClick = (house) => {
    if (onHouseClick) {
      onHouseClick(house);
    } else {
      setSelectedDetailHouse(house);
    }
  };

  // Sort houses based on state
  const sortedHouses = [...normalizedHouses].sort((a, b) => {
    if (sortBy === "price-asc") return Number(a.price) - Number(b.price);
    if (sortBy === "price-desc") return Number(b.price) - Number(a.price);
    if (sortBy === "newest")
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    return 0; // default featured order
  });

  // Calculate dynamic grid column classes based on columns prop
  const getGridColsClass = () => {
    if (columns === 1) return "grid-cols-1";
    if (columns === 2) return "grid-cols-1 md:grid-cols-2";
    if (columns === 4)
      return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
    return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"; // default 3
  };

  // Render Structured Shimmer Loading State
  if (displayLoading) {
    return <PropertyCardSkeleton columns={columns} />;
  }

  // Render Empty State
  if (!normalizedHouses || normalizedHouses.length === 0) {
    return (
      <div
        id="house-grid-empty"
        className="bg-white p-12 rounded-2xl shadow-sm border border-gray-200 text-center max-w-2xl mx-auto my-6"
      >
        <div className="w-16 h-16 bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <HomeIcon className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {displayEmptyTitle}
        </h3>
        <p className="text-gray-500 mb-6">{displayEmptyMessage}</p>
        {onClearFilters && (
          <button
            id="clear-filters-btn"
            onClick={onClearFilters}
            className="inline-flex items-center gap-2 bg-[#1A1A1A] text-yellow-500 px-6 py-3 rounded-lg font-bold hover:bg-black transition uppercase tracking-wide text-sm"
          >
            {t("clearFilters")}
          </button>
        )}
      </div>
    );
  }

  return (
    <div id="house-grid-container" className="space-y-6">
      {/* Optional Top Controls Bar for Sorting and Layout Toggle */}
      {showControls && (
        <div
          id="house-grid-controls"
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100"
        >
          <p className="text-sm font-bold text-gray-700">
            {t("showingProperties")}:{" "}
            <span className="font-extrabold text-amber-600">
              {sortedHouses.length}
            </span>
          </p>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2">
              <label
                htmlFor="sort-select"
                className="text-xs font-bold text-gray-600 uppercase"
              >
                {t("sortBy")}:
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm rounded-lg border-gray-300 border bg-gray-50 px-3 py-1.5 focus:border-yellow-500 focus:ring-yellow-500 text-gray-800 font-semibold"
              >
                <option value="featured">{t("featuredFirst")}</option>
                <option value="newest">{t("newestFirst")}</option>
                <option value="price-asc">{t("priceLowHigh")}</option>
                <option value="price-desc">{t("priceHighLow")}</option>
              </select>
            </div>

            <div className="flex items-center border border-gray-200 rounded-lg p-1 bg-gray-50">
              <button
                id="view-mode-grid"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded flex items-center gap-1 text-xs font-bold ${viewMode === "grid" ? "bg-white shadow text-yellow-600" : "text-gray-400 hover:text-gray-600"}`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                id="view-mode-list"
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded flex items-center gap-1 text-xs font-bold ${viewMode === "list" ? "bg-white shadow text-yellow-600" : "text-gray-400 hover:text-gray-600"}`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid or List Layout */}
      <motion.div
        layout
        id="house-grid-listings"
        className={
          viewMode === "list"
            ? "flex flex-col gap-6"
            : `grid ${getGridColsClass()} gap-6`
        }
      >
        <AnimatePresence mode="popLayout">
          {sortedHouses.map((house, index) => {
            const isFav = favorites[house.house_id];
            const formattedPrice = house.price
              ? Number(house.price).toLocaleString()
              : "N/A";
            const locationString = [house.sub_city, house.city, house.region]
              .filter(Boolean)
              .join(", ");

            if (viewMode === "list") {
              return (
                <motion.div
                  key={`house-list-${house.house_id || index}`}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  id={`house-card-${house.house_id}`}
                  onClick={() => handleCardClick(house)}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group border border-gray-100 flex flex-col sm:flex-row cursor-pointer"
                >
                  {/* List Image */}
                  <div className="relative sm:w-72 h-56 sm:h-auto overflow-hidden flex-shrink-0">
                    <OptimizedImage
                      src={
                        house.image_url ||
                        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80"
                      }
                      alt={house.title}
                      imgClassName="group-hover:scale-105"
                      className="w-full h-full"
                    />
                    <button
                      id={`fav-btn-list-${house.house_id}`}
                      onClick={(e) => toggleFavorite(e, house.house_id)}
                      className="absolute top-3 left-3 px-2.5 py-1.5 rounded-full bg-white/90 backdrop-blur hover:bg-white text-gray-800 hover:text-red-500 transition shadow-md flex items-center gap-1 text-xs font-bold"
                      title={isFav ? t("saved") : t("saveProperty")}
                    >
                      <Heart
                        className={`w-4 h-4 ${isFav ? "text-red-500 fill-red-500" : "text-gray-700"}`}
                      />
                      <span>{isFav ? t("saved") : t("saveProperty")}</span>
                    </button>
                    <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur text-gray-900 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                      <HomeIcon className="w-3.5 h-3.5 text-amber-600" />
                      <span>
                        {t("typeLabel")}:{" "}
                        {translateHouseType(house.type, language)}
                      </span>
                    </div>
                  </div>

                  {/* List Details */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
                          {language === "am"
                            ? house.title_am || house.title
                            : house.title}
                        </h3>
                        <div className="text-right flex-shrink-0 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                          <span className="text-2xl font-black text-slate-900">
                            {formattedPrice}
                          </span>
                          <span className="text-xs font-bold text-amber-700 block">
                            {t("perMonth")}
                          </span>
                        </div>
                      </div>

                      <p className="flex items-center text-gray-600 text-sm mb-4">
                        <MapPin className="w-4 h-4 mr-1 text-amber-600 flex-shrink-0" />
                        <span className="font-semibold">
                          {t("location")}:{" "}
                          {locationString ||
                            (language === "am"
                              ? CITY_CONFIG.cityNameAm
                              : CITY_CONFIG.cityNameEn)}
                        </span>
                      </p>

                      {house.description && (
                        <p className="text-gray-600 text-sm line-clamp-2 mb-4 font-normal">
                          {house.description}
                        </p>
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-6 text-xs font-semibold text-gray-700 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-md">
                          <Bed className="w-4 h-4 text-gray-500" />
                          <span>
                            <b className="text-gray-900">{house.rooms || 1}</b>{" "}
                            {t("roomsLabel")}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-md">
                          <Bath className="w-4 h-4 text-gray-500" />
                          <span>
                            <b className="text-gray-900">
                              {house.bathrooms || 1}
                            </b>{" "}
                            {t("bathsLabel")}
                          </span>
                        </div>
                        {Number(house.square_meter) > 0 && (
                          <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-md">
                            <Maximize className="w-4 h-4 text-gray-500" />
                            <span>
                              <b className="text-gray-900">
                                {house.square_meter}
                              </b>{" "}
                              {t("sqm")}
                            </span>
                          </div>
                        )}
                        {house.created_at && (
                          <div className="flex items-center gap-1.5 ml-auto text-xs text-gray-500">
                            <Calendar className="w-3.5 h-3.5 text-amber-600" />
                            <span>{formatEthiopianDate(house.created_at)}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-2">
                        {house.status === "Rented" ? (
                          <span className="inline-flex items-center text-xs font-black text-red-700 bg-red-100 border border-red-300 px-3 py-1 rounded-full">
                            <AlertCircle className="w-3.5 h-3.5 mr-1 text-red-600" />
                            {t("rented")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                            {t("available")}
                          </span>
                        )}

                        <div className="flex flex-wrap justify-end items-center gap-2">
                          <button
                            id={`video-btn-list-${house.house_id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedVideoHouse(house);
                            }}
                            className="bg-purple-900/90 hover:bg-purple-800 text-purple-100 px-3.5 py-2 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 border border-purple-500/40 shadow-sm cursor-pointer"
                            title={t("watchVideo")}
                          >
                            <Video className="w-3.5 h-3.5 text-purple-300" />
                            <span>{t("watchVideo")}</span>
                          </button>
                          <button
                            id={`chat-btn-list-${house.house_id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenChat(house);
                            }}
                            className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-2 rounded-lg text-xs font-black transition flex items-center gap-1.5 shadow-xs"
                            title={t("chatLandlord")}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>{t("chatLandlord")}</span>
                          </button>

                          <button
                            id={`broker-btn-list-${house.house_id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBrokerHouse(house);
                            }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-900 px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-slate-300"
                            title={t("contactBroker")}
                          >
                            <Phone className="w-3.5 h-3.5 text-slate-700" />
                            <span>{t("contactBroker")}</span>
                          </button>

                          <button
                            id={`request-btn-list-${house.house_id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCardClick(house);
                            }}
                            className={`px-4 py-2 rounded-lg text-xs font-black transition flex items-center gap-1.5 ${
                              house.status === "Rented"
                                ? "bg-red-100 text-red-700 border border-red-300 hover:bg-red-200"
                                : "bg-slate-950 hover:bg-black text-amber-400 shadow-md"
                            }`}
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>
                              {house.status === "Rented"
                                ? t("rented")
                                : t("requestBtn")}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            }

            // Default Grid Card View
            return (
              <motion.div
                key={`house-grid-${house.house_id || index}`}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: (index % 3) * 0.1 }}
                id={`house-card-${house.house_id}`}
                onClick={() => handleCardClick(house)}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group border border-gray-200 flex flex-col cursor-pointer relative"
              >
                {/* Image Section */}
                <div className="relative h-60 overflow-hidden">
                  <OptimizedImage
                    src={
                      house.image_url ||
                      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80"
                    }
                    alt={house.title}
                    imgClassName="group-hover:scale-105"
                    className="w-full h-full"
                  />

                  {/* Price Tag Overlay with Dollar Icon */}
                  <div className="absolute top-3 right-3 bg-slate-950/90 backdrop-blur text-amber-400 px-3 py-1.5 rounded-lg text-xs font-black tracking-wide shadow-md flex items-center gap-1 border border-amber-500/30">
                    <DollarSign className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{formattedPrice}</span>
                    <span className="text-[10px] text-amber-200 font-semibold">
                      {t("perMonth")}
                    </span>
                  </div>

                  {/* Favorite Button with clear text label */}
                  <button
                    id={`fav-btn-grid-${house.house_id}`}
                    onClick={(e) => toggleFavorite(e, house.house_id)}
                    className="absolute top-3 left-3 px-2.5 py-1.5 rounded-full bg-white/90 backdrop-blur hover:bg-white text-gray-800 transition shadow-md flex items-center gap-1 text-[11px] font-extrabold"
                    title={isFav ? t("saved") : t("saveProperty")}
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${isFav ? "text-red-500 fill-red-500" : "text-gray-700"}`}
                    />
                    <span>{isFav ? t("saved") : t("saveProperty")}</span>
                  </button>

                  {/* Property Type & VIP Badges with text */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <div className="bg-white/95 backdrop-blur text-slate-950 px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                      <HomeIcon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>
                        {t("typeLabel")}:{" "}
                        {translateHouseType(house.type, language)}
                      </span>
                    </div>
                    {house.is_featured === 1 && (
                      <div className="bg-amber-500 text-slate-950 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md border border-amber-400">
                        <Star className="w-3 h-3 fill-slate-950 shrink-0" />
                        <span>{t("vipFeatured")}</span>
                      </div>
                    )}
                  </div>

                  {/* Watch Video Overlay Button */}
                  <button
                    id={`video-btn-grid-${house.house_id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedVideoHouse(house);
                    }}
                    className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-slate-950/90 hover:bg-purple-900 text-amber-300 border border-amber-500/30 backdrop-blur transition shadow-md flex items-center gap-1.5 text-xs font-black z-10 cursor-pointer"
                    title={t("watchVideo")}
                  >
                    <Video className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{t("watchVideo")}</span>
                  </button>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-lg font-extrabold text-gray-900 mb-1.5 group-hover:text-amber-600 transition-colors line-clamp-1">
                    {language === "am"
                      ? house.title_am || house.title
                      : house.title}
                  </h3>

                  <p className="flex items-center text-gray-600 text-xs font-semibold mb-4">
                    <MapPin className="w-4 h-4 mr-1 text-amber-600 shrink-0" />
                    <span className="line-clamp-1">
                      {t("location")}:{" "}
                      {locationString ||
                        (language === "am"
                          ? CITY_CONFIG.cityNameAm
                          : CITY_CONFIG.cityNameEn)}
                    </span>
                  </p>

                  {/* Specs Bar with explicit labels */}
                  <div className="flex items-center justify-between gap-2 text-xs font-bold text-gray-700 py-2.5 px-3 bg-gray-50 rounded-lg border border-gray-100 mb-4">
                    <div className="flex items-center gap-1">
                      <Bed className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>
                        <b className="text-slate-950">{house.rooms || 1}</b>{" "}
                        {t("roomsLabel")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Bath className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>
                        <b className="text-slate-950">{house.bathrooms || 1}</b>{" "}
                        {t("bathsLabel")}
                      </span>
                    </div>
                    {Number(house.square_meter) > 0 && (
                      <div className="flex items-center gap-1">
                        <Maximize className="w-4 h-4 text-slate-500 shrink-0" />
                        <span>
                          <b className="text-slate-950">{house.square_meter}</b>{" "}
                          {t("sqm")}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Footer Action */}
                  <div className="mt-auto pt-3 border-t border-gray-100 flex flex-col gap-2">
                    <div className="flex items-center justify-between mb-1">
                      {house.status === "Rented" ? (
                        <span className="text-xs font-black text-red-700 bg-red-100 border border-red-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                          {t("rented")}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          {t("available")}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        id={`chat-btn-grid-${house.house_id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenChat(house);
                        }}
                        className="text-[11px] bg-amber-500 hover:bg-amber-400 text-slate-950 py-2 rounded-lg font-black transition flex items-center justify-center gap-1 shadow-xs"
                        title={t("chatLandlord")}
                      >
                        <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{t("chatLandlord")}</span>
                      </button>

                      <button
                        id={`broker-btn-grid-${house.house_id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBrokerHouse(house);
                        }}
                        className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-900 py-2 rounded-lg font-bold transition flex items-center justify-center gap-1 border border-slate-300"
                        title={t("contactBroker")}
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                        <span className="truncate">{t("contactBroker")}</span>
                      </button>

                      <button
                        id={`request-btn-grid-${house.house_id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCardClick(house);
                        }}
                        className={`text-[11px] py-2 rounded-lg font-black transition flex items-center justify-center gap-1 ${
                          house.status === "Rented"
                            ? "bg-red-100 text-red-700 border border-red-300 hover:bg-red-200"
                            : "bg-slate-950 hover:bg-black text-amber-400"
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">
                          {house.status === "Rented"
                            ? t("rented")
                            : t("requestBtn")}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Property Detail Modal */}
      <React.Suspense fallback={null}>
        <PropertyDetailModal
          house={selectedDetailHouse}
          isOpen={Boolean(selectedDetailHouse)}
          onClose={() => setSelectedDetailHouse(null)}
          onRequestRental={(house) => {
            setSelectedDetailHouse(null);
            setSelectedRequestHouse(house);
          }}
          onContactBroker={(house) => {
            setSelectedDetailHouse(null);
            setSelectedBrokerHouse(house);
          }}
          onToggleFavorite={(e, houseId) => toggleFavorite(e, houseId)}
          isFavorite={
            selectedDetailHouse
              ? Boolean(favorites[selectedDetailHouse.house_id])
              : false
          }
        />
      </React.Suspense>

      {/* Rental Request Modal with Ethiopian DatePicker */}
      <RentalRequestModal
        house={selectedRequestHouse}
        isOpen={Boolean(selectedRequestHouse)}
        onClose={() => setSelectedRequestHouse(null)}
        onSuccess={() => {
          setSelectedRequestHouse(null);
          navigate("/dashboard");
        }}
      />

      {/* Contact Broker Modal */}
      <ContactBrokerModal
        house={selectedBrokerHouse}
        isOpen={Boolean(selectedBrokerHouse)}
        onClose={() => setSelectedBrokerHouse(null)}
      />

      {/* Video Walkthrough Modal */}
      <VideoModal
        house={selectedVideoHouse}
        isOpen={Boolean(selectedVideoHouse)}
        onClose={() => setSelectedVideoHouse(null)}
        onChat={(house) =>
          navigate(`/messages?user=${house.owner_id}&house=${house.house_id}`)
        }
        onRequestRental={(house) => setSelectedRequestHouse(house)}
      />
    </div>
  );
}
