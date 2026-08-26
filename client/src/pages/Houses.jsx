import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Search,
  MapPin,
  Home as HomeIcon,
  Filter,
  Map,
  RefreshCw,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import HouseGrid from "../components/HouseGrid";
import CITY_CONFIG from "../config/cityConfig";
import { useLanguage } from "../context/LanguageContext";

export default function Houses() {
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { language, t } = useLanguage();

  const location = useLocation();

  const [subCity, setSubCity] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Initialize type from URL if present
  const queryParams = new URLSearchParams(location.search);
  const initialType = queryParams.get("type") || "";
  const [type, setType] = useState(initialType);

  const [rooms, setRooms] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetchHouses();
  }, []);

  const fetchHouses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (subCity) params.append("sub_city", subCity);
      if (maxPrice) params.append("maxPrice", maxPrice);
      if (type) params.append("type", type);
      if (rooms) params.append("rooms", rooms);

      const res = await axios.get(`/api/houses?${params.toString()}`);
      const payload = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : [];
      setHouses(payload);
    } catch (err) {
      console.error("Failed to fetch houses", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (e) => {
    e.preventDefault();
    fetchHouses();
  };

  const clearFilters = () => {
    setSubCity("");
    setMaxPrice("");
    setType("");
    setRooms("");
    setTimeout(() => {
      fetchHouses();
    }, 100);
  };

  return (
    <div className="bg-slate-950 text-white min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mb-1">
              {t("findPropertyTitle")}
            </h1>
            <p className="text-sm text-slate-300">{t("findPropertyDesc")}</p>
          </div>
          <button
            onClick={() => navigate("/map")}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-5 py-3 rounded-2xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 uppercase tracking-wide text-xs cursor-pointer shrink-0"
          >
            <Map className="w-4 h-4" />
            {t("mapView")}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="w-full lg:w-1/4">
            <div className="bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-800 sticky top-24">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Filter className="w-5 h-5 text-amber-400" /> {t("filters")}
                </h2>
                <button
                  onClick={clearFilters}
                  className="text-xs text-amber-400 hover:text-amber-300 font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> {t("clear")}
                </button>
              </div>

              <form onSubmit={handleFilter} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    {t("areaKebele")}
                  </label>
                  <select
                    value={subCity}
                    onChange={(e) => setSubCity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:border-amber-500 focus:outline-none"
                  >
                    <option value="">{t("allAreas")}</option>
                    <option value="Kebele 01">
                      Kebele 01 ({language === "am" ? "መሃል ከተማ" : "City Center"}
                      )
                    </option>
                    <option value="Kebele 02">Kebele 02</option>
                    <option value="Kebele 03">Kebele 03</option>
                    <option value="Injibara University">
                      {language === "am"
                        ? "የእንጅባራ ዩኒቨርሲቲ አካባቢ"
                        : "Injibara University Area"}
                    </option>
                    <option value="Bus Station">
                      {language === "am"
                        ? "መናኸሪያ (አውቶብስ ተራ)"
                        : "Bus Station Area (Autobus Tera)"}
                    </option>
                    <option value="Hospital Area">
                      {language === "am"
                        ? "ሆስፒታል አካባቢ"
                        : "Hospital Area (Agni Hospital)"}
                    </option>
                    <option value="College Area">
                      {language === "am" ? "ኮሌጅ አካባቢ" : "College Area"}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    {t("propertyType")}
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:border-amber-500 focus:outline-none"
                  >
                    <option value="">{t("allTypes")}</option>
                    <option value="የመኖሪያ ቤት">{t("residentialHouse")}</option>
                    <option value="የንግድ ሱቅ">{t("commercialShop")}</option>
                    <option value="ለሆቴል እና ለምግብ (ሽሮ) ቤት">
                      {t("hotelShiro")}
                    </option>
                    <option value="ለኤሌክትሮኒክስ እና ፎቶ ቤት">
                      {t("electronicsPhoto")}
                    </option>
                    <option value="ለፋርማሲ እና ክሊኒክ">{t("pharmacyClinic")}</option>
                    <option value="ሌሎች የንግድና የአገልግሎት ቦታዎች">
                      {t("otherCommercial")}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    {t("priceRange")}
                  </label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    {t("roomsLabel")}
                  </label>
                  <input
                    type="number"
                    value={rooms}
                    onChange={(e) => setRooms(e.target.value)}
                    placeholder="e.g. 2"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-amber-500 text-slate-950 py-3.5 rounded-xl font-black hover:bg-amber-400 transition uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  <Search className="w-4 h-4" /> {t("applyFilters")}
                </button>
              </form>
            </div>
          </div>

          {/* Results Area */}
          <div className="w-full lg:w-3/4">
            <HouseGrid
              houses={houses}
              loading={loading}
              columns={2}
              showControls={true}
              onClearFilters={clearFilters}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
