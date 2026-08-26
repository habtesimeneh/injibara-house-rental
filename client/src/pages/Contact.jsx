import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Facebook,
  Send as Telegram,
  Youtube,
  Video,
  Building,
  Clock,
  ChevronRight,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import ListSkeleton from "../components/ListSkeleton";

export default function Contact() {
  const [contactData, setContactData] = useState({
    title_en: "",
    title_am: "",
    subtitle_en: "",
    subtitle_am: "",
    address_en: "",
    address_am: "",
    phone_1: "",
    phone_2: "",
    phone_3: "",
    email: "",
    working_hours_en: "",
    working_hours_am: "",
    facebook_url: "",
    telegram_url: "",
    tiktok_url: "",
    youtube_url: "",
    banner_image_url: "",
    offices: [],
    phones: [],
  });
  const [loading, setLoading] = useState(true);
  const { language, t } = useLanguage();

  useEffect(() => {
    fetchContactData();
  }, []);

  const fetchContactData = async () => {
    try {
      const res = await axios.get("/api/contact");
      if (res.data) setContactData(res.data);
    } catch (err) {
      console.error("Failed to fetch contact info:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ListSkeleton rows={4} />;
  }

  const title = language === "am" ? contactData.title_am : contactData.title_en;
  const subtitle =
    language === "am" ? contactData.subtitle_am : contactData.subtitle_en;
  const address =
    language === "am" ? contactData.address_am : contactData.address_en;
  const workingHours =
    language === "am"
      ? contactData.working_hours_am
      : contactData.working_hours_en;
  const mapEmbed =
    contactData.map_embed ||
    contactData.map_url ||
    contactData.location_map_url ||
    "";

  return (
    <div className="bg-slate-950 text-white min-h-screen">
      {/* Hero / Banner */}
      <div
        className="relative h-[40vh] flex items-center justify-center bg-cover bg-center"
        style={{
          backgroundImage: `url('${contactData.banner_image_url || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1200"}')`,
        }}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
        <div className="relative z-10 text-center px-4">
          <span className="text-amber-400 text-xs font-bold uppercase tracking-[0.2em] bg-amber-500/10 border border-amber-500/30 px-4 py-1.5 rounded-full inline-block mb-4">
            {t("contactUs")}
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white mb-4 drop-shadow-lg">
            {title || t("getInTouch")}
          </h1>
          <p className="text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {subtitle || t("contactDesc")}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 -mt-16 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Contact Info Card */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>

              <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
                <div className="w-1.5 h-8 bg-amber-500 rounded-full"></div>
                {t("contactDetails")}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-8">
                {/* Phone */}
                <div className="flex gap-5">
                  <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                    <Phone className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">
                      {t("phone")}
                    </p>
                    <p className="text-lg font-bold text-white leading-tight">
                      {contactData.phone_1}
                    </p>
                    {contactData.phone_2 && (
                      <p className="text-lg font-bold text-white mt-1 leading-tight">
                        {contactData.phone_2}
                      </p>
                    )}
                    {contactData.phone_3 && (
                      <p className="text-lg font-bold text-white mt-1 leading-tight">
                        {contactData.phone_3}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="flex gap-5">
                  <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                    <Mail className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">
                      {t("email")}
                    </p>
                    <p className="text-lg font-bold text-white break-all leading-tight">
                      {contactData.email}
                    </p>
                  </div>
                </div>

                {/* Address */}
                <div className="flex gap-5">
                  <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                    <MapPin className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">
                      {t("officeLocation")}
                    </p>
                    <p className="text-base font-bold text-white leading-snug">
                      {address}
                    </p>
                  </div>
                </div>

                {/* Working Hours */}
                <div className="flex gap-5">
                  <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                    <Clock className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">
                      {t("workingHours") || "Working Hours"}
                    </p>
                    <p className="text-base font-bold text-white leading-snug">
                      {workingHours}
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="mt-12 pt-8 border-t border-slate-800 flex flex-wrap gap-4">
                {contactData.facebook_url && (
                  <a
                    href={contactData.facebook_url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:border-amber-500/50 hover:bg-amber-500/5 transition group"
                  >
                    <Facebook className="w-5 h-5 group-hover:scale-110 transition" />
                  </a>
                )}
                {contactData.telegram_url && (
                  <a
                    href={contactData.telegram_url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:border-amber-500/50 hover:bg-amber-500/5 transition group"
                  >
                    <Telegram className="w-5 h-5 -rotate-45 group-hover:scale-110 transition" />
                  </a>
                )}
                {contactData.youtube_url && (
                  <a
                    href={contactData.youtube_url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:border-amber-500/50 hover:bg-amber-500/5 transition group"
                  >
                    <Youtube className="w-5 h-5 group-hover:scale-110 transition" />
                  </a>
                )}
                {contactData.tiktok_url && (
                  <a
                    href={contactData.tiktok_url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:border-amber-500/50 hover:bg-amber-500/5 transition group"
                  >
                    <Video className="w-5 h-5 group-hover:scale-110 transition" />
                  </a>
                )}
              </div>
            </div>

            {mapEmbed && (
              <div className="space-y-4">
                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                  <MapPin className="text-amber-400" />
                  {language === "am" ? "አካባቢ ካርታ" : "Location Map"}
                </h2>
                <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-xl">
                  <iframe
                    title="Location map"
                    src={mapEmbed}
                    className="w-full h-[280px] border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            )}

            {/* Office Branches */}
            {contactData.offices && contactData.offices.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                  <Building className="text-amber-400" />
                  {language === "am"
                    ? "የቅርንጫፍ ጽሕፈት ቤቶቻችን"
                    : "Our Office Branches"}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {contactData.offices
                    .filter((o) => o.is_active)
                    .map((office) => (
                      <div
                        key={office.id}
                        className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 hover:border-amber-500/30 transition group shadow-xl"
                      >
                        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-amber-400 transition">
                          {language === "am" ? office.name_am : office.name_en}
                        </h3>
                        <div className="space-y-3 mt-4">
                          <div className="flex items-start gap-3">
                            <MapPin className="w-4 h-4 text-amber-500 mt-1 shrink-0" />
                            <p className="text-sm text-slate-300 leading-relaxed">
                              {language === "am"
                                ? office.address_am
                                : office.address_en}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                            <p className="text-sm font-bold text-white">
                              {office.phone}
                            </p>
                          </div>
                          {office.agent_name && (
                            <div className="flex items-center gap-3">
                              <div className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                              </div>
                              <p className="text-xs text-slate-400 font-bold">
                                {office.agent_name}
                              </p>
                            </div>
                          )}
                          {office.working_hours && (
                            <div className="flex items-center gap-3">
                              <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                              <p className="text-xs text-slate-400 italic">
                                {office.working_hours}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: Hotlines & Contact Form */}
          <div className="space-y-8">
            {/* Phone Hotlines */}
            {contactData.phones && contactData.phones.length > 0 && (
              <div className="bg-amber-500 border border-amber-600 rounded-3xl p-8 text-slate-950 shadow-2xl">
                <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                  <Phone size={24} />{" "}
                  {language === "am" ? "ፈጣን ስልክ መስመሮች" : "Quick Hotlines"}
                </h3>
                <div className="space-y-5">
                  {contactData.phones
                    .filter((p) => p.is_active)
                    .map((phone) => (
                      <div
                        key={phone.id}
                        className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/20"
                      >
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">
                          {language === "am"
                            ? phone.department_am
                            : phone.department_en}
                        </p>
                        <a
                          href={`tel:${phone.phone_number}`}
                          className="text-xl font-black hover:underline block"
                        >
                          {phone.phone_number}
                        </a>
                        {phone.telegram_username && (
                          <a
                            href={`https://t.me/${phone.telegram_username.replace("@", "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold hover:bg-slate-950 hover:text-white bg-slate-950/10 px-2 py-1 rounded-lg transition"
                          >
                            <Telegram size={12} className="-rotate-45" />{" "}
                            Telegram: {phone.telegram_username}
                          </a>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Simple Contact Form */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-6">
                {t("sendMessage")}
              </h3>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  alert(t("messageSentSuccess"));
                }}
              >
                <div>
                  <input
                    type="text"
                    required
                    placeholder={t("yourName")}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 text-sm transition"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    required
                    placeholder={t("yourEmail")}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 text-sm transition"
                  />
                </div>
                <div>
                  <textarea
                    required
                    rows={4}
                    placeholder={t("message")}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 text-sm transition"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 py-4 px-4 rounded-xl font-black transition flex items-center justify-center gap-2 uppercase tracking-wide shadow-lg active:scale-95"
                >
                  <Send className="w-4 h-4" /> {t("sendMessage")}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
