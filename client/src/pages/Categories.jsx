import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import OptimizedImage from "../components/OptimizedImage";
import { useLanguage } from "../context/LanguageContext";
import CITY_CONFIG from "../config/cityConfig";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const catRes = await axios.get("/api/settings/categories");
      setCategories(Array.isArray(catRes.data) ? catRes.data : []);
    } catch (err) {
      console.error("Failed to fetch categories", err);
      setCategories([]);
    }
  };

  const getCategoryName = (category) => {
    const name =
      typeof category === "string"
        ? category
        : category?.name || category?.name_am || "";
    if (language === "am")
      return name || category?.name_am || category?.name || "";

    switch (name) {
      case "የመኖሪያ ቤት":
        return "Residential House";
      case "የንግድ ሱቅ":
        return "Commercial Shop";
      case "ለሆቴል እና ለምግብ (ሽሮ) ቤት":
        return "Hotel & Restaurant";
      case "ለኤሌክትሮኒክስ እና ፎቶ ቤት":
        return "Electronics & Photo Studio";
      case "ለፋርማሲ እና ክሊኒክ":
        return "Pharmacy & Clinic";
      case "ሌሎች የንግድና የአገልግሎት ቦታዎች":
        return "Other Commercial Spaces";
      default:
        return name || "Category";
    }
  };

  return (
    <div className="bg-slate-950 text-white min-h-screen py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-amber-400 text-xs font-bold uppercase tracking-widest bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full inline-block mb-3">
            {t("propertyCategories")}
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
            {t("categoriesInInjibara")}
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
            {t("categoriesDesc")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {(Array.isArray(categories) ? categories : []).map((cat, i) => (
            <div
              key={i}
              onClick={() =>
                navigate(`/houses?type=${encodeURIComponent(cat.name)}`)
              }
              className="relative h-80 rounded-3xl overflow-hidden group cursor-pointer shadow-2xl border border-slate-800 hover:border-amber-500/50 transition-all duration-300"
            >
              <OptimizedImage
                src={cat.image_url}
                alt={cat.name}
                className="w-full h-full"
                imgClassName="group-hover:scale-110 transition duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6 text-center">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">
                  {getCategoryName(cat)}
                </h3>
                <span className="inline-flex items-center gap-1.5 text-amber-400 font-bold text-xs uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full group-hover:bg-amber-500 group-hover:text-slate-950 transition-all">
                  {language === "am" ? "ቤቶችን ይመልከቱ" : "View Properties"} &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
