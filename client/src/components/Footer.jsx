import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  ChevronDown,
} from "lucide-react";
import { EthDateTime } from "ethiopian-calendar-date-converter";
import Logo from "./Logo";
import CITY_CONFIG from "../config/cityConfig";
import { useLanguage } from "../context/LanguageContext";

const Footer = () => {
  const [settings, setSettings] = useState({});
  const { language, t } = useLanguage();
  const ethYear = EthDateTime.fromEuropeanDate(new Date()).year;

  // Accordion state for mobile screens
  const [openSections, setOpenSections] = useState({
    quick: false,
    kebeles: false,
    contact: false,
  });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  useEffect(() => {
    axios
      .get("/api/settings")
      .then((res) => setSettings(res.data || {}))
      .catch(console.error);
  }, []);

  const brandName =
    language === "am"
      ? settings.brand_name_am || settings.brand_name || CITY_CONFIG.brandNameAm
      : settings.brand_name_en ||
        settings.brand_name ||
        CITY_CONFIG.brandNameEn;

  const footerDescription =
    language === "am"
      ? settings.footer_desc_am ||
        settings.footer_desc ||
        settings.about_text_am ||
        settings.about_text ||
        `${CITY_CONFIG.brandNameAm} - ${CITY_CONFIG.brandSubAm}። በእንጅባራ ከተማ የሚከራዩ ቤቶችን፣ አፓርታማዎችንና የንግድ ቦታዎችን በቀላሉ ያግኙ።`
      : settings.footer_desc_en ||
        settings.footer_desc ||
        settings.about_text ||
        `${CITY_CONFIG.brandNameEn} - ${CITY_CONFIG.brandSubEn}. Find verified residential houses and commercial spaces in Injibara City.`;

  const socialLinks = {
    facebook: settings.social_facebook_url || settings.facebook_url || "#",
    twitter: settings.social_twitter_url || settings.twitter_url || "#",
    instagram: settings.social_instagram_url || settings.instagram_url || "#",
    linkedin: settings.social_linkedin_url || settings.linkedin_url || "#",
  };

  return (
    <footer className="bg-[#1A1A1A] text-white pt-12 md:pt-16 pb-8 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-12 mb-12 text-left">
          {/* Brand Info */}
          <div className="col-span-1 border-b border-gray-800 md:border-b-0 pb-6 md:pb-0">
            <Link to="/" className="inline-flex items-center mb-4">
              <Logo size="md" />
            </Link>
            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed mb-4">
              {footerDescription}
            </p>
            <div className="flex space-x-3 mb-2">
              {socialLinks.facebook && socialLinks.facebook !== "#" && (
                <a
                  href={socialLinks.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="text-gray-400 hover:text-amber-500 transition"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {socialLinks.twitter && socialLinks.twitter !== "#" && (
                <a
                  href={socialLinks.twitter}
                  target="_blank"
                  rel="noreferrer"
                  className="text-gray-400 hover:text-amber-500 transition"
                >
                  <Twitter className="h-5 w-5" />
                </a>
              )}
              {socialLinks.instagram && socialLinks.instagram !== "#" && (
                <a
                  href={socialLinks.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="text-gray-400 hover:text-amber-500 transition"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {socialLinks.linkedin && socialLinks.linkedin !== "#" && (
                <a
                  href={socialLinks.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="text-gray-400 hover:text-amber-500 transition"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links Dropdown */}
          <div className="border-b border-gray-800 md:border-b-0 pb-4 md:pb-0">
            <button
              type="button"
              onClick={() => toggleSection("quick")}
              className="w-full flex items-center justify-between py-1 md:py-0 text-left cursor-pointer md:cursor-default group"
              aria-expanded={openSections.quick}
            >
              <h3 className="text-sm font-black text-white uppercase tracking-wider group-hover:text-amber-400 transition-colors md:mb-6">
                {language === "am" ? "ፈጣን ሊንኮች" : "Quick Links"}
              </h3>
              <ChevronDown
                className={`w-5 h-5 text-amber-500 transition-transform duration-300 md:hidden ${
                  openSections.quick ? "rotate-180" : ""
                }`}
              />
            </button>
            <ul
              className={`space-y-3 pt-3 md:pt-0 ${openSections.quick ? "block" : "hidden md:block"}`}
            >
              <li>
                <Link
                  to="/"
                  className="text-gray-400 hover:text-amber-400 transition text-sm"
                >
                  {t("home")}
                </Link>
              </li>
              <li>
                <Link
                  to="/houses"
                  className="text-gray-400 hover:text-amber-400 transition text-sm"
                >
                  {t("houses")}
                </Link>
              </li>
              <li>
                <Link
                  to="/categories"
                  className="text-gray-400 hover:text-amber-400 transition text-sm"
                >
                  {t("categories")}
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-gray-400 hover:text-amber-400 transition text-sm"
                >
                  {t("about")}
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-gray-400 hover:text-amber-400 transition text-sm"
                >
                  {t("contact")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Kebeles Dropdown */}
          <div className="border-b border-gray-800 md:border-b-0 pb-4 md:pb-0">
            <button
              type="button"
              onClick={() => toggleSection("kebeles")}
              className="w-full flex items-center justify-between py-1 md:py-0 text-left cursor-pointer md:cursor-default group"
              aria-expanded={openSections.kebeles}
            >
              <h3 className="text-sm font-black text-white uppercase tracking-wider group-hover:text-amber-400 transition-colors md:mb-6">
                {language === "am" ? "የእንጅባራ ቀበሌዎች" : "Injibara Kebeles"}
              </h3>
              <ChevronDown
                className={`w-5 h-5 text-amber-500 transition-transform duration-300 md:hidden ${
                  openSections.kebeles ? "rotate-180" : ""
                }`}
              />
            </button>
            <ul
              className={`space-y-3 pt-3 md:pt-0 ${openSections.kebeles ? "block" : "hidden md:block"}`}
            >
              <li>
                <Link
                  to="/houses"
                  className="text-gray-400 hover:text-amber-400 transition text-sm"
                >
                  {language === "am"
                    ? "ቀበሌ 01 (መሃል ከተማ)"
                    : "Kebele 01 (City Center)"}
                </Link>
              </li>
              <li>
                <Link
                  to="/houses"
                  className="text-gray-400 hover:text-amber-400 transition text-sm"
                >
                  {language === "am" ? "ቀበሌ 02" : "Kebele 02"}
                </Link>
              </li>
              <li>
                <Link
                  to="/houses"
                  className="text-gray-400 hover:text-amber-400 transition text-sm"
                >
                  {language === "am"
                    ? "እንጅባራ ዩኒቨርሲቲ አካባቢ"
                    : "Injibara University Area"}
                </Link>
              </li>
              <li>
                <Link
                  to="/houses"
                  className="text-gray-400 hover:text-amber-400 transition text-sm"
                >
                  {language === "am" ? "አውቶቡስ ተራ አካባቢ" : "Bus Station Area"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Us Dropdown */}
          <div className="pb-2 md:pb-0">
            <button
              type="button"
              onClick={() => toggleSection("contact")}
              className="w-full flex items-center justify-between py-1 md:py-0 text-left cursor-pointer md:cursor-default group"
              aria-expanded={openSections.contact}
            >
              <h3 className="text-sm font-black text-white uppercase tracking-wider group-hover:text-amber-400 transition-colors md:mb-6">
                {language === "am" ? "እኛን ለማግኘት" : "Contact Us"}
              </h3>
              <ChevronDown
                className={`w-5 h-5 text-amber-500 transition-transform duration-300 md:hidden ${
                  openSections.contact ? "rotate-180" : ""
                }`}
              />
            </button>
            <ul
              className={`space-y-3 pt-3 md:pt-0 ${openSections.contact ? "block" : "hidden md:block"}`}
            >
              <li className="text-gray-400 text-sm">
                <strong className="block text-gray-200 mb-1">
                  {language === "am" ? "ኢሜይል፡" : "Email:"}
                </strong>
                {settings.contact_email ||
                  (language === "am" ? "ኢሜይል አልተገኘም" : "Email not set")}
              </li>
              <li className="text-gray-400 text-sm">
                <strong className="block text-gray-200 mb-1">
                  {language === "am" ? "ስልክ፡" : "Phone:"}
                </strong>
                {settings.contact_phone ||
                  (language === "am" ? "ስልክ አልተገኘም" : "Phone not set")}
              </li>
              <li className="text-gray-400 text-sm">
                <strong className="block text-gray-200 mb-1">
                  {language === "am" ? "አድራሻ፡" : "Address:"}
                </strong>
                {language === "am"
                  ? "ቀበሌ 01፣ እንጅባራ፣ አዊ ዞን፣ ኢትዮጵያ"
                  : "Kebele 01, Injibara, Awi Zone, Ethiopia"}
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800 text-center">
          <p className="text-gray-500 text-sm">
            &copy; {ethYear} {brandName}.{" "}
            {language === "am" ? "መብቱ በህግ የተጠበቀ ነው።" : "All rights reserved."}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
