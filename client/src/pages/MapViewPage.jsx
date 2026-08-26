import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  MapPin,
  Search,
  Filter,
  Home,
  MessageSquare,
  DollarSign,
  List,
  Map,
} from "lucide-react";
import InteractiveMap from "../components/InteractiveMap";
import CITY_CONFIG from "../config/cityConfig";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

export default function MapViewPage() {
  const { language, t } = useLanguage();
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  // Filters
  const [selectedType, setSelectedType] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const navigate = useNavigate();

  const fetchHouses = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedType) params.type = selectedType;
      if (selectedCity) params.city = selectedCity;
      if (maxPrice) params.maxPrice = maxPrice;

      const res = await axios.get("/api/houses", { params });
      const payload = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : [];
      setHouses(payload);
    } catch (err) {
      console.error("Failed to fetch houses for map", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHouses();
    axios
      .get("/api/settings/categories")
      .then((res) => setCategories(Array.isArray(res.data) ? res.data : []))
      .catch((err) => {
        console.error(err);
        setCategories([]);
      });
  }, [selectedType, selectedCity, maxPrice]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-gray-900 via-black to-yellow-900 text-white rounded-3xl p-6 md:p-8 mb-8 shadow-xl border border-yellow-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-yellow-400 font-bold uppercase tracking-wider text-xs mb-2">
              <MapPin className="w-4 h-4" />
              {language === "am"
                ? `${CITY_CONFIG.cityNameAm} ዘመናዊ የቤቶች ካርታ`
                : `${CITY_CONFIG.cityNameEn} Smart Property Map`}
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              {language === "am"
                ? CITY_CONFIG.cityNameAm
                : CITY_CONFIG.cityNameEn}{" "}
              {t("interactiveMap")}
            </h1>
            <p className="text-gray-300 text-sm mt-1">{t("mapDesc")}</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => navigate("/houses")}
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2 text-sm"
            >
              <List className="w-4 h-4" />
              Grid View
            </button>
            <button
              onClick={() => {
                if (localStorage.getItem("token")) {
                  navigate("/messages");
                  return;
                }
                navigate("/login", { state: { from: "/messages" } });
              }}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-2.5 rounded-xl shadow-lg transition flex items-center gap-2 text-sm uppercase"
            >
              <MessageSquare className="w-4 h-4" />
              Chat Landlords
            </button>
          </div>
        </div>
      </div>

      {/* Map Filter Controls Bar */}
      <div className="bg-white rounded-2xl shadow-lg p-5 mb-8 border border-gray-200">
        <div className="mb-4">
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1 flex items-center gap-2">
            <Search className="w-4 h-4 text-amber-500" />
            AI Smart Search
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. 'I want a 2-bedroom house in Injibara Kebele 01 under 8000'"
              className="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-yellow-500 text-gray-800"
              onKeyDown={async (e) => {
                if (e.key === "Enter" && e.target.value.trim() !== "") {
                  const query = e.target.value;
                  try {
                    const res = await axios.post("/api/ai/detect-place", {
                      query,
                    });
                    if (res.data.city) setSelectedCity(res.data.city);
                    if (res.data.type) setSelectedType(res.data.type);
                    if (res.data.maxPrice) setMaxPrice(res.data.maxPrice);
                  } catch (err) {
                    console.error("AI search failed", err);
                  }
                }
              }}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            Press Enter to auto-fill filters using AI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center border-t border-gray-100 pt-4">
          {/* Category Filter */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              {t("propertyType")}
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-500 text-gray-800"
            >
              <option value="">{t("allCategories")}</option>
              {(Array.isArray(categories) ? categories : []).map((c) => (
                <option key={c.id || c.name} value={c.name}>
                  {language === "am"
                    ? c.name
                    : c.name === "የመኖሪያ ቤት"
                      ? "Residential House"
                      : c.name === "የንግድ ሱቅ"
                        ? "Commercial Shop"
                        : c.name === "ለሆቴል እና ለምግብ (ሽሮ) ቤት"
                          ? "Hotel & Restaurant"
                          : c.name === "ለኤሌክትሮኒክስ እና ፎቶ ቤት"
                            ? "Electronics & Photo Studio"
                            : c.name === "ለፋርማሲ እና ክሊኒክ"
                              ? "Pharmacy & Clinic"
                              : c.name === "ሌሎች የንግድና የአገልግሎት ቦታዎች"
                                ? "Other Commercial Spaces"
                                : c.name}
                </option>
              ))}
            </select>
          </div>

          {/* City / Location Filter */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              {t("areaKebele")}
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-500 text-gray-800"
            >
              <option value="">{t("allAreas")}</option>
              <option value="Injibara">
                {language === "am" ? "እንጅባራ (መሃል)" : "Injibara (Center)"}
              </option>
              <option value="Kebele 01">
                {language === "am"
                  ? "ቀበሌ 01 (መሃል ከተማ)"
                  : "Kebele 01 (Mahal Ketema)"}
              </option>
              <option value="Kebele 02">Kebele 02</option>
              <option value="Kebele 03">Kebele 03</option>
              <option value="Injibara University">
                {language === "am"
                  ? "የእንጅባራ ዩኒቨርሲቲ አካባቢ"
                  : "Injibara University Area"}
              </option>
              <option value="Bus Station">
                {language === "am" ? "መናኸሪያ" : "Bus Station Area"}
              </option>
              <option value="Hospital Area">
                {language === "am" ? "ሆስፒታል አካባቢ" : "Agni Hospital Area"}
              </option>
            </select>
          </div>

          {/* Max Price Filter */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              {t("priceRange")}
            </label>
            <input
              type="number"
              placeholder="e.g. 100000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-500 text-gray-800"
            />
          </div>

          {/* Reset button */}
          <div className="flex items-end h-full">
            <button
              onClick={() => {
                setSelectedType("");
                setSelectedCity("");
                setMaxPrice("");
              }}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-xl text-sm transition"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Map Display */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-[500px] bg-white rounded-2xl shadow gap-4">
          <div className="w-full h-full animate-shimmer rounded-2xl" />
        </div>
      ) : (
        <div>
          <InteractiveMap houses={houses} height="650px" />
        </div>
      )}
    </div>
  );
}
