import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Home,
  Grid,
  Settings,
  Plus,
  Trash2,
  Save,
  Layout,
  Check,
  X,
  Eye,
  Shield,
  Menu,
  Users,
  Phone,
  Edit3,
  Lock,
  Mail,
  Globe,
  Building,
  MapPin,
  QrCode,
  BarChart3,
  MessageSquare,
  Bot,
  CreditCard,
  Bell,
  Megaphone,
  Star,
  MessageSquareText,
  Folder,
  Printer,
  Download,
  Copy,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  DollarSign,
  FileCheck,
  ExternalLink,
  FileText,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Receipt,
  ShieldAlert,
  CheckCheck,
  AlertTriangle,
  Image,
  Play,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import ButtonSpinner from "../components/ButtonSpinner";
import adminApi from "../services/adminApi";
import OptimizedImage from "../components/OptimizedImage";
import SettingsLayout from "../components/admin/settings/SettingsLayout";
import GeneralSettings from "../components/admin/settings/GeneralSettings";
import PaymentSettings from "../components/admin/settings/PaymentSettings";
import ContactSettings from "../components/admin/settings/ContactSettings";
import SEOSettings from "../components/admin/settings/SEOSettings";
import MediaSettings from "../components/admin/settings/MediaSettings";
import ContentSettings from "../components/admin/settings/ContentSettings";
import CategorySettings from "../components/admin/settings/CategorySettings";
import LocationSettings from "../components/admin/settings/LocationSettings";
import FeeSettings from "../components/admin/settings/FeeSettings";

function ImageSettingInput({ label, value, onChange, onUpload }) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-300 mb-2">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files[0];
            if (file) {
              const url = await onUpload(file);
              if (url) onChange(url);
            }
          }}
          className="w-full bg-slate-950 border border-slate-700 text-slate-300 rounded-xl shadow-sm py-2 px-3 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-amber-500/10 file:text-amber-400 hover:file:bg-amber-500/20 cursor-pointer"
        />
        <input
          type="url"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Or paste URL..."
          className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-amber-500"
        />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, updateUserContext } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [dataFetchErrors, setDataFetchErrors] = useState({});

  const handleActiveTabChange = (tabId) => {
    setActiveTab(tabId);
    setEditingAnnouncement(null);
  };

  // States
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalHouses: 0,
    activeRentals: 0,
  });
  const [analytics, setAnalytics] = useState(null);

  // Hero Slides
  const [heroSlides, setHeroSlides] = useState([]);
  const [newHeroSlide, setNewHeroSlide] = useState({
    title_en: "",
    title_am: "",
    subtitle_en: "",
    subtitle_am: "",
    description_en: "",
    description_am: "",
    button_text_en: "Explore Properties",
    button_text_am: "ቤቶችን ይጎብኙ",
    button_url: "/houses",
    image_url: "",
    is_active: true,
    display_order: 0,
  });
  const [editingHeroSlide, setEditingHeroSlide] = useState(null);

  // Settings
  const [settingsSubTab, setSettingsSubTab] = useState('general');

  // About Page
  const [aboutPage, setAboutPage] = useState({
    title_en: "",
    title_am: "",
    subtitle_en: "",
    subtitle_am: "",
    content_en: "",
    content_am: "",
    mission_en: "",
    mission_am: "",
    vision_en: "",
    vision_am: "",
    values_en: "",
    values_am: "",
    banner_image_url: "",
    image_url: "",
  });

  // Contact Page
  const [contactPage, setContactPage] = useState({
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
  });
  const [contactOffices, setContactOffices] = useState([]);
  const [newOffice, setNewOffice] = useState({
    name_en: "",
    name_am: "",
    address_en: "",
    address_am: "",
    phone: "",
    agent_name: "",
    working_hours: "",
    is_active: true,
    display_order: 0,
  });
  const [editingOffice, setEditingOffice] = useState(null);
  const [isAddingOffice, setIsAddingOffice] = useState(false);

  const [contactPhones, setContactPhones] = useState([]);
  const [newPhone, setNewPhone] = useState({
    department_en: "",
    department_am: "",
    phone_number: "",
    telegram_username: "",
    contact_person: "",
    is_whatsapp: true,
    is_active: true,
    display_order: 0,
  });
  const [editingPhone, setEditingPhone] = useState(null);
  const [isAddingPhone, setIsAddingPhone] = useState(false);

  // Auth Page Settings & Slides
  const [authSettings, setAuthSettings] = useState({
    login_title_en: "",
    login_title_am: "",
    login_subtitle_en: "",
    login_subtitle_am: "",
    register_title_en: "",
    register_title_am: "",
    register_subtitle_en: "",
    register_subtitle_am: "",
  });
  const [authSlides, setAuthSlides] = useState([]);
  const [newAuthSlide, setNewAuthSlide] = useState({
    title_en: "",
    title_am: "",
    desc_en: "",
    desc_am: "",
    badge_en: "",
    badge_am: "",
    image_url: "",
    display_order: 0,
    is_active: true,
  });
  const [editingAuthSlide, setEditingAuthSlide] = useState(null);
  const [isAddingAuthSlide, setIsAddingAuthSlide] = useState(false);

  // Houses & Categories
  const [houses, setHouses] = useState([]);
  const [isAddingHouse, setIsAddingHouse] = useState(false);
  const [editingHouse, setEditingHouse] = useState(null);
  const [newHouse, setNewHouse] = useState({
    title: "",
    type: "Apartment",
    price: "",
    region: "Amhara",
    city: "Injibara",
    sub_city: "",
    address: "",
    rooms: 1,
    bathrooms: 1,
    square_meter: 0,
    description: "",
    image_url: "",
    video_url: "",
    status: "Available",
  });

  const [categories, setCategories] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({
    name: "",
    name_am: "",
    description: "",
    description_am: "",
    font_size: "text-2xl md:text-4xl",
    image_url: "",
  });

  // Users Management
  const [usersList, setUsersList] = useState([]);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("ALL");
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    role: "Tenant",
    password: "",
    city: "Injibara",
    region: "Amhara",
  });

  // Chats & AI Logs
  const [adminConversations, setAdminConversations] = useState([]);
  const [selectedAdminPair, setSelectedAdminPair] = useState(null);
  const [adminThreadMessages, setAdminThreadMessages] = useState([]);
  const [loadingAdminChat, setLoadingAdminChat] = useState(false);
  const [aiLogs, setAiLogs] = useState([]);
  const [aiLogSearch, setAiLogSearch] = useState("");
  const [aiLogFilter, setAiLogFilter] = useState("all"); // 'all', 'unread', 'security', 'read'

  // Website Settings
  const [websiteSettings, setWebsiteSettings] = useState({
    home_categories_title: "",
    home_categories_title_am: "",
    home_categories_subtitle: "",
    home_categories_subtitle_am: "",
    home_categories_bg_color: "bg-white",
    brand_name_en: "",
    brand_name_am: "",
    brand_tagline_en: "",
    brand_tagline_am: "",
    primary_color: "#fbbf24",
    secondary_color: "#f59e0b",
    accent_color: "#1d4ed8",
    footer_desc_en: "",
    footer_desc_am: "",
    services_title_en: "",
    services_title_am: "",
    services_list: "[]",
    faq_title_en: "",
    faq_title_am: "",
    faq_list: "[]",
    marketing_blocks: "[]",
    contact_map_url: "",
    social_facebook_url: "",
    social_twitter_url: "",
    social_instagram_url: "",
    social_linkedin_url: "",
  });

  // Security risk keyword checker
  const checkSecurityRisk = (text = "") => {
    if (!text) return false;
    const keywords = [
      "password",
      "pass",
      "pin",
      "secret",
      "otp",
      "credential",
      "bank",
      "cbe",
      "telebirr",
      "account number",
      "card number",
      "cvv",
      "login",
      "token",
      "admin access",
      "hack",
      "ፓስወርድ",
      "የባንክ",
      "አካውንት",
      "ቁጥር",
      "ሚስጥር",
      "ፒን",
      "ቃልኪዳን",
    ];
    const lower = text.toLowerCase();
    return keywords.some((kw) => lower.includes(kw));
  };

  // Payments & Announcements & Testimonials
  const [payments, setPayments] = useState([]);
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all"); // 'all', 'Pending', 'Approved', 'Rejected'
  const [inspectingPayment, setInspectingPayment] = useState(null); // Receipt Security Inspector modal
  const [verifyNotesInput, setVerifyNotesInput] = useState("");
  const [verifyRefInput, setVerifyRefInput] = useState("");
  const [verifyBankInput, setVerifyBankInput] = useState("");
  const [printingReceipt, setPrintingReceipt] = useState(null); // Official Printable Receipt modal
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [manualReceiptFile, setManualReceiptFile] = useState(null);
  const [newPayment, setNewPayment] = useState({
    user_id: "",
    user_role: "Landlord",
    ad_type: "Featured House Listing",
    house_id: "",
    seeking_ad_id: "",
    amount: "500",
    payment_method: "CBE Bank",
    transaction_ref: "",
    status: "Approved",
    admin_notes: "Verified and approved by Management",
  });
  const [statusModalPayment, setStatusModalPayment] = useState(null);
  const [statusModalNote, setStatusModalNote] = useState("");

  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title_en: "",
    title_am: "",
    content_en: "",
    content_am: "",
    badge: "NEWS",
    is_active: true,
  });

  // Admin Profile State
  const [profileAvatarFile, setProfileAvatarFile] = useState(null);
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    region: user?.region || "",
    city: user?.city || "",
    sub_city: user?.sub_city || "",
    address: user?.address || "",
    avatar: user?.avatar || "",
  });
  const [profileMessage, setProfileMessage] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        phone: user.phone || "",
        region: user.region || "",
        city: user.city || "",
        sub_city: user.sub_city || "",
        address: user.address || "",
        avatar: user.avatar || "",
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const formData = new FormData();
      Object.keys(profileData).forEach((key) =>
        formData.append(key, profileData[key] || ""),
      );
      if (profileAvatarFile) {
        formData.append("avatar_file", profileAvatarFile);
      }
      const res = await adminApi.updateProfile(formData);
      setProfileMessage(
        language === "am"
          ? "ፕሮፋይልዎ በተሳካ ሁኔታ ተዘምኗል!"
          : "Profile updated successfully!",
      );
      setTimeout(() => setProfileMessage(""), 3000);
      if (res.user) {
        updateUserContext(res.user);
        setProfileAvatarFile(null);
      }
    } catch (err) {
      setProfileMessage(
        language === "am" ? "ፕሮፋይል ማዘመን አልተቻለም።" : "Failed to update profile.",
      );
    } finally {
      setIsUpdatingProfile(false);
    }
  };
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [previewingAnnouncement, setPreviewingAnnouncement] = useState(null);
  const [testimonials, setTestimonials] = useState([]);
  const [newTestimonial, setNewTestimonial] = useState({
    name: "",
    role: "",
    location: "",
    avatar: "",
    rating: 5,
    comment: "",
    badge: "",
  });

  // Media Management State
  const [mediaHouseId, setMediaHouseId] = useState("");
  const [mediaHouseSearch, setMediaHouseSearch] = useState("");
  const [mediaHouseImages, setMediaHouseImages] = useState([]);
  const [mediaHouseVideos, setMediaHouseVideos] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaMessage, setMediaMessage] = useState("");

  useEffect(() => {
    if (!user || user.role !== "Admin") {
      navigate("/");
      return;
    }
    fetchAllData();
  }, [user]);

  const fetchAllData = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setLoadingMessage(
      language === "am" ? "ዳታ በመጫን ላይ..." : "Loading dashboard data...",
    );
    setDataFetchErrors({});

    const fetchWithTimeout = (promise, timeout = 8000, label) => {
      return Promise.race([
        promise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`${label} timed out`)), timeout),
        ),
      ]);
    };

    try {
      const criticalFetches = [
        { fn: fetchStats, label: "Statistics" },
        { fn: fetchAnalytics, label: "Analytics" },
        { fn: fetchHouses, label: "Properties" },
        { fn: fetchUsersList, label: "Users" },
      ];

      const nonCriticalFetches = [
        { fn: fetchHeroSlides, label: "Hero Slides" },
        { fn: fetchAboutPage, label: "About Page" },
        { fn: fetchContactPage, label: "Contact Info" },
        { fn: fetchAuthData, label: "Auth Settings" },
        { fn: fetchCategories, label: "Categories" },
        { fn: fetchAdminConversations, label: "Messages" },
        { fn: fetchAiLogs, label: "AI Logs" },
        { fn: fetchAdminPayments, label: "Payments" },
        { fn: fetchAnnouncements, label: "Announcements" },
        { fn: fetchTestimonials, label: "Testimonials" },
        { fn: fetchWebsiteSettings, label: "Website Settings" },
      ];

      const results = await Promise.allSettled(
        criticalFetches.map(({ fn, label }) =>
          fetchWithTimeout(fn(), 10000, label),
        ),
      );

      results.forEach((result, index) => {
        if (result.status === "rejected") {
          setDataFetchErrors((prev) => ({
            ...prev,
            [criticalFetches[index].label]: result.reason.message,
          }));
        }
      });

      if (results.some((r) => r.status === "fulfilled")) {
        setTimeout(async () => {
          await Promise.allSettled(
            nonCriticalFetches.map(({ fn, label }) =>
              fetchWithTimeout(fn(), 8000, label).catch((err) => {
                setDataFetchErrors((prev) => ({
                  ...prev,
                  [label]: err.message,
                }));
              }),
            ),
          );
          setIsLoading(false);
          setLoadingMessage("");
        }, 100);
      } else {
        setIsLoading(false);
        setLoadingMessage("");
      }
    } catch (err) {
      console.error("Dashboard initialization error:", err);
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const fetchWebsiteSettings = async () => {
    try {
      const data = await adminApi.getSettings();
      setWebsiteSettings({
        home_categories_title:
          data.home_categories_title || "Explore Categories",
        home_categories_title_am: data.home_categories_title_am || "ምድቦችን ያስሱ",
        home_categories_subtitle:
          data.home_categories_subtitle ||
          "Discover premium properties tailored to your needs in Injibara.",
        home_categories_subtitle_am:
          data.home_categories_subtitle_am || "በእንጅባራ ከተማ የሚከራዩ ቤቶች ዝርዝር",
        home_categories_bg_color: data.home_categories_bg_color || "bg-white",
        brand_name_en: data.brand_name_en || "Injibara House Rentals",
        brand_name_am: data.brand_name_am || "እንጅባራ የቤት ኪራይ",
        brand_tagline_en:
          data.brand_tagline_en ||
          "Trusted homes and business spaces in Injibara.",
        brand_tagline_am: data.brand_tagline_am || "ታማኝ ቤቶች እና ንግድ ቦታዎች በእንጅባራ",
        primary_color: data.primary_color || "#fbbf24",
        secondary_color: data.secondary_color || "#f59e0b",
        accent_color: data.accent_color || "#1d4ed8",
        footer_desc_en: data.footer_desc_en || "",
        footer_desc_am: data.footer_desc_am || "",
        services_title_en: data.services_title_en || "Our Services",
        services_title_am: data.services_title_am || "አገልግሎቶች",
        services_list:
          typeof data.services_list === "string"
            ? data.services_list
            : JSON.stringify(
                data.services_list || [
                  {
                    title_en: "Property Sales",
                    title_am: "የቤት ሽያጭ",
                    description_en:
                      "Premium listings and trusted landlord outreach.",
                    description_am: "የላቀ ሽያጭ እና የታመነ አከራይ አገልግሎት.",
                  },
                  {
                    title_en: "Rental Support",
                    title_am: "የኪራይ እርዳታ",
                    description_en:
                      "Fast matching between tenants and verified homes.",
                    description_am: "ተከራዮችን ከተረጋገጡ ቤቶች ጋር በፍጥነት በማገናኘት እንረዳለን.",
                  },
                  {
                    title_en: "Brokerage & Guidance",
                    title_am: "የዋስትና እና የመርዳት አገልግሎት",
                    description_en:
                      "Professional guidance through renting, buying, and management.",
                    description_am:
                      "በኪራይ፣ በግዢ እና በአስተዳደር የሚያስፈልጉ ምክር እና አገልግሎት.",
                  },
                ],
                null,
                2,
              ),
        faq_title_en: data.faq_title_en || "Frequently Asked Questions",
        faq_title_am: data.faq_title_am || "ተደጋግሞ የሚጠየቁ",
        faq_list:
          typeof data.faq_list === "string"
            ? data.faq_list
            : JSON.stringify(
                data.faq_list || [
                  {
                    question_en: "How do I find a house?",
                    question_am: "ቤት እንዴት እንደሚገኝ?",
                    answer_en:
                      "Use the search and filter tools on the housing page.",
                    answer_am: "በቤት ገጽ ላይ የፍለጋ እና የማጣሪያ መሳሪያዎችን ይጠቀሙ።",
                  },
                  {
                    question_en: "Do you support both renters and owners?",
                    question_am: "ለተከራዮችና ለአከራዮች ድጋፍ አለ?",
                    answer_en:
                      "Yes, both renters and landlords are supported through the platform.",
                    answer_am: "አዎ፣ ሁለቱም ተከራዮች እና አከራዮች በመድረክ ላይ ይደገፋሉ።",
                  },
                ],
                null,
                2,
              ),
        marketing_blocks:
          typeof data.marketing_blocks === "string"
            ? data.marketing_blocks
            : JSON.stringify(
                data.marketing_blocks || [
                  {
                    title_en: "Fast House Search",
                    title_am: "ፈጣን የቤት ፍለጋ",
                    description_en:
                      "Find homes in your preferred area quickly.",
                    description_am: "በእርስዎ ከሚመርጡት አካባቢ ቤቶችን በፍጥነት ያግኙ።",
                  },
                  {
                    title_en: "Verified Listings",
                    title_am: "የተረጋገጡ ዝርዝር",
                    description_en:
                      "Every property is checked for trust and value.",
                    description_am: "እያንዳንዱ ቤት እሴት እና እምነት ለማረጋገጥ ተፈትሿል።",
                  },
                ],
                null,
                2,
              ),
        contact_map_url: data.contact_map_url || "",
        social_facebook_url: data.social_facebook_url || "",
        social_twitter_url: data.social_twitter_url || "",
        social_instagram_url: data.social_instagram_url || "",
        social_linkedin_url: data.social_linkedin_url || "",
      });
    } catch (err) {
      console.error("Failed to fetch website settings:", err);
    }
  };

  const handleSaveWebsiteSettings = async (e) => {
    e.preventDefault();
    try {
      await adminApi.updateSettings(websiteSettings);
      alert("Homepage settings updated successfully!");
      fetchWebsiteSettings();
    } catch (err) {
      alert(err.message || "Failed to save website settings");
    }
  };

  const fetchStats = async () => {
    try {
      const data = await adminApi.getStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const data = await adminApi.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    }
  };

  const fetchHeroSlides = async () => {
    try {
      const data = await adminApi.getHeroSlides();
      setHeroSlides(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch hero slides:", err);
    }
  };

  const fetchAboutPage = async () => {
    try {
      const data = await adminApi.getAbout();
      if (data) setAboutPage(data);
    } catch (err) {
      console.error("Failed to fetch about page:", err);
    }
  };

  const fetchContactPage = async () => {
    try {
      const data = await adminApi.getContact();
      if (data) {
        setContactPage(data);
      }
      // Also fetch full list for admin
      fetchOffices();
      fetchPhones();
    } catch (err) {
      console.error("Failed to fetch contact page:", err);
    }
  };

  const fetchOffices = async () => {
    try {
      const data = await adminApi.getOffices();
      setContactOffices(data);
    } catch (err) {
      console.error("Failed to fetch offices:", err);
    }
  };

  const fetchPhones = async () => {
    try {
      const data = await adminApi.getPhones();
      setContactPhones(data);
    } catch (err) {
      console.error("Failed to fetch phones:", err);
    }
  };

  const fetchAuthData = async () => {
    try {
      const settingsData = await adminApi.getAuthSettings();
      if (settingsData) {
        setAuthSettings({
          login_title_en:
            settingsData.login_title_en || "Welcome Back to Injibara Rentals",
          login_title_am:
            settingsData.login_title_am || "እንኳን ደህና መጡ ወደ እንጅባራ ቤት ኪራይ",
          login_subtitle_en:
            settingsData.login_subtitle_en ||
            "Sign in to access your rental dashboard, view inquiries, and manage your properties.",
          login_subtitle_am:
            settingsData.login_subtitle_am ||
            "ወደ አካውንትዎ በመግባት የኪራይ አገልግሎቶችን፣ ማመልከቻዎችን እና ቤቶችን ያስተዳድሩ።",
          register_title_en:
            settingsData.register_title_en || "Create an Account",
          register_title_am: settingsData.register_title_am || "አዲስ አካውንት ይፍጠሩ",
          register_subtitle_en:
            settingsData.register_subtitle_en ||
            "Join Injibara House Rentals to easily rent or list properties in Injibara town.",
          register_subtitle_am:
            settingsData.register_subtitle_am ||
            "በእንጅባራ ከተማ ቤቶችን በቀላሉ ለመከራየት ወይም ለማከራየት ዛሬውኑ ይቀላቀሉን።",
        });
      }
      const slidesData = await adminApi.getAuthSlides();
      if (slidesData) setAuthSlides(slidesData);
    } catch (err) {
      console.error("Failed to fetch auth data:", err);
    }
  };

  const fetchHouses = async () => {
    try {
      const data = await adminApi.getHouses();
      setHouses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch houses:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await adminApi.getCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const fetchUsersList = async () => {
    try {
      const data = await adminApi.getUsers();
      setUsersList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  const fetchAdminConversations = async () => {
    try {
      const data = await adminApi.getConversations();
      setAdminConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    }
  };

  const fetchAdminThread = async (pair) => {
    setSelectedAdminPair(pair);
    setLoadingAdminChat(true);
    try {
      const data = await adminApi.getThread(
        pair.user1.user_id,
        pair.user2.user_id,
      );
      setAdminThreadMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch thread:", err);
    } finally {
      setLoadingAdminChat(false);
    }
  };

  const fetchAiLogs = async () => {
    try {
      const data = await adminApi.getAiLogs();
      setAiLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch AI logs:", err);
    }
  };

  const handleMarkAiLogRead = async (id) => {
    try {
      await adminApi.markAiLogRead(id);
      setAiLogs((prev) =>
        prev.map((l) => (l.id === id ? { ...l, is_read: true } : l)),
      );
    } catch (err) {
      console.error("Failed to mark log read:", err);
      alert(err.message || "Failed to mark log as read");
    }
  };

  const handleMarkAllAiLogsRead = async () => {
    try {
      await adminApi.markAllAiLogsRead();
      setAiLogs((prev) => prev.map((l) => ({ ...l, is_read: true })));
      alert("All AI chat logs marked as read!");
    } catch (err) {
      alert(err.message || "Failed to mark logs as read");
    }
  };

  const handleDeleteAiLog = async (id) => {
    if (!window.confirm("Are you sure you want to delete this AI chat log?"))
      return;
    try {
      await adminApi.deleteAiLog(id);
      setAiLogs((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      alert(err.message || "Failed to delete chat log");
    }
  };

  const fetchAdminPayments = async () => {
    try {
      const data = await adminApi.getPayments();
      setPayments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch payments:", err);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const data = await adminApi.getAnnouncements();
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch announcements:", err);
    }
  };

  const fetchTestimonials = async () => {
    try {
      const data = await adminApi.getTestimonials();
      setTestimonials(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch testimonials:", err);
    }
  };

  const handleApproveTestimonial = async (id, currentApprovedStatus) => {
    try {
      const newStatus =
        currentApprovedStatus === 1 || currentApprovedStatus === true ? 0 : 1;
      await adminApi.approveTestimonial(id, newStatus === 1);
      fetchTestimonials();
      alert(
        newStatus === 1
          ? "Testimonial approved & published on homepage!"
          : "Testimonial hidden from homepage.",
      );
    } catch (err) {
      alert(err.message || "Failed to update testimonial status");
    }
  };

  const handleDeleteTestimonial = async (id) => {
    if (!window.confirm("Delete this testimonial?")) return;
    try {
      await adminApi.deleteTestimonial(id);
      fetchTestimonials();
      alert("Testimonial deleted successfully");
    } catch (err) {
      alert(err.message || "Failed to delete testimonial");
    }
  };

  const uploadImage = async (file) => {
    if (!file) return null;
    try {
      return await adminApi.uploadImage(file);
    } catch (error) {
      alert(error.message || "Failed to upload image.");
      return null;
    }
  };

  // Handlers for Hero Slides
  const handleAddHeroSlide = async () => {
    if (!newHeroSlide.title_en || !newHeroSlide.image_url) {
      alert("Please fill Title (EN) and Image URL");
      return;
    }
    try {
      await adminApi.createHeroSlide(newHeroSlide);
      fetchHeroSlides();
      setNewHeroSlide({
        title_en: "",
        title_am: "",
        subtitle_en: "",
        subtitle_am: "",
        description_en: "",
        description_am: "",
        button_text_en: "Explore Properties",
        button_text_am: "ቤቶችን ይጎብኙ",
        button_url: "/houses",
        image_url: "",
        is_active: true,
        display_order: 0,
      });
      alert("Hero slide added successfully!");
    } catch (err) {
      alert("Failed to add hero slide");
    }
  };

  const handleEditHeroSlide = (slide) => {
    setEditingHeroSlide(slide);
    const formElement = document.getElementById("hero-form");
    if (formElement)
      formElement.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleUpdateHeroSlide = async (e) => {
    e.preventDefault();
    if (!editingHeroSlide) return;
    try {
      await adminApi.updateHeroSlide(editingHeroSlide.id, editingHeroSlide);
      fetchHeroSlides();
      setEditingHeroSlide(null);
      alert("Hero slide updated successfully!");
    } catch (err) {
      alert(err.message || "Failed to update hero slide");
    }
  };

  const handleDeleteHeroSlide = async (id) => {
    if (!window.confirm("Delete this slide?")) return;
    try {
      await adminApi.deleteHeroSlide(id);
      fetchHeroSlides();
    } catch (err) {
      alert(err.message || "Failed to delete slide");
    }
  };

  // Handlers for About & Contact & Auth
  const handleSaveAbout = async (e) => {
    e.preventDefault();
    try {
      await adminApi.saveAbout(aboutPage);
      alert("About page updated successfully!");
      fetchAboutPage();
    } catch (err) {
      alert(err.message || "Failed to update about page");
    }
  };

  const handleSaveContact = async (e) => {
    e.preventDefault();
    try {
      await adminApi.saveContact(contactPage);
      alert("Contact page updated successfully!");
      fetchContactPage();
    } catch (err) {
      alert(err.message || "Failed to update contact page");
    }
  };

  const handleAddOffice = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createOffice(newOffice);
      setIsAddingOffice(false);
      setNewOffice({
        name_en: "",
        name_am: "",
        address_en: "",
        address_am: "",
        phone: "",
        agent_name: "",
        working_hours: "",
        is_active: true,
        display_order: 0,
      });
      fetchContactPage();
      alert("Office branch added successfully!");
    } catch (err) {
      alert(err.message || "Failed to add office branch");
    }
  };

  const handleUpdateOffice = async (e) => {
    e.preventDefault();
    if (!editingOffice) return;
    try {
      await adminApi.updateOffice(editingOffice.id, editingOffice);
      setEditingOffice(null);
      fetchContactPage();
      alert("Office branch updated successfully!");
    } catch (err) {
      alert(err.message || "Failed to update office branch");
    }
  };

  const handleDeleteOffice = async (id) => {
    if (!window.confirm("Delete this office branch?")) return;
    try {
      await adminApi.deleteOffice(id);
      fetchContactPage();
      alert("Office branch deleted");
    } catch (err) {
      alert(err.message || "Failed to delete office branch");
    }
  };

  const handleAddPhone = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createPhone(newPhone);
      setIsAddingPhone(false);
      setNewPhone({
        department_en: "",
        department_am: "",
        phone_number: "",
        telegram_username: "",
        contact_person: "",
        is_whatsapp: true,
        is_active: true,
        display_order: 0,
      });
      fetchContactPage();
      alert("Phone hotline added successfully!");
    } catch (err) {
      alert(err.message || "Failed to add phone hotline");
    }
  };

  const handleUpdatePhone = async (e) => {
    e.preventDefault();
    if (!editingPhone) return;
    try {
      await adminApi.updatePhone(editingPhone.id, editingPhone);
      setEditingPhone(null);
      fetchContactPage();
      alert("Phone hotline updated successfully!");
    } catch (err) {
      alert(err.message || "Failed to update phone hotline");
    }
  };

  const handleDeletePhone = async (id) => {
    if (!window.confirm("Delete this phone hotline?")) return;
    try {
      await adminApi.deletePhone(id);
      fetchContactPage();
      alert("Phone hotline deleted");
    } catch (err) {
      alert(err.message || "Failed to delete phone hotline");
    }
  };

  const handleSaveAuthSettings = async (e) => {
    e.preventDefault();
    try {
      await adminApi.saveAuthSettings(authSettings);
      alert("Login & Register headings updated successfully!");
      fetchAuthData();
    } catch (err) {
      alert(err.message || "Failed to update auth settings");
    }
  };

  const handleAddAuthSlide = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createAuthSlide(newAuthSlide);
      setIsAddingAuthSlide(false);
      setNewAuthSlide({
        title_en: "",
        title_am: "",
        desc_en: "",
        desc_am: "",
        badge_en: "",
        badge_am: "",
        image_url: "",
        display_order: 0,
        is_active: true,
      });
      fetchAuthData();
      alert("New carousel slide added successfully!");
    } catch (err) {
      alert(err.message || "Failed to add carousel slide");
    }
  };

  const handleUpdateAuthSlide = async (e) => {
    e.preventDefault();
    if (!editingAuthSlide) return;
    try {
      await adminApi.updateAuthSlide(editingAuthSlide.id, editingAuthSlide);
      setEditingAuthSlide(null);
      fetchAuthData();
      alert("Carousel slide updated successfully!");
    } catch (err) {
      alert(err.message || "Failed to update carousel slide");
    }
  };

  const handleDeleteAuthSlide = async (id) => {
    if (!window.confirm("Are you sure you want to delete this carousel slide?"))
      return;
    try {
      await adminApi.deleteAuthSlide(id);
      fetchAuthData();
      alert("Carousel slide deleted");
    } catch (err) {
      alert(err.message || "Failed to delete carousel slide");
    }
  };

  const handleToggleAuthSlideStatus = async (slide) => {
    try {
      await adminApi.updateAuthSlide(slide.id, {
        ...slide,
        is_active: slide.is_active ? 0 : 1,
      });
      fetchAuthData();
    } catch (err) {
      alert(err.message || "Failed to update slide status");
    }
  };

  // Houses Handlers
  const handleAddHouse = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createHouse(newHouse);
      setIsAddingHouse(false);
      setNewHouse({
        title: "",
        type: "Apartment",
        price: "",
        region: "Amhara",
        city: "Injibara",
        sub_city: "",
        address: "",
        rooms: 1,
        bathrooms: 1,
        square_meter: 0,
        description: "",
        image_url: "",
        video_url: "",
        status: "Available",
      });
      fetchHouses();
      alert("Property added successfully");
    } catch (err) {
      alert(
        err.message || err.response?.data?.error || "Failed to add property",
      );
    }
  };

  const handleUpdateHouse = async (e) => {
    e.preventDefault();
    if (!editingHouse) return;
    const houseId = editingHouse.house_id || editingHouse.id;
    try {
      await adminApi.updateHouse(houseId, editingHouse);
      setEditingHouse(null);
      fetchHouses();
      alert("Property updated successfully");
    } catch (err) {
      alert(
        err.message || err.response?.data?.error || "Failed to update property",
      );
    }
  };

  const handleDeleteHouse = async (id) => {
    if (!window.confirm("Delete this property?")) return;
    try {
      await adminApi.deleteHouse(id);
      fetchHouses();
    } catch (err) {
      alert(err.message || "Failed to delete property");
    }
  };

  // Categories Handlers
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.name) return;
    try {
      await adminApi.createCategory(newCategory);
      setNewCategory({
        name: "",
        name_am: "",
        description: "",
        description_am: "",
        font_size: "text-2xl md:text-4xl",
        image_url: "",
      });
      fetchCategories();
      alert("Category added successfully");
    } catch (err) {
      alert(err.message || "Failed to add category");
    }
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editingCategory) return;
    try {
      await adminApi.updateCategory(editingCategory.id, editingCategory);
      setEditingCategory(null);
      fetchCategories();
      alert("Category updated successfully");
    } catch (err) {
      alert(err.message || "Failed to update category");
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Delete category?")) return;
    try {
      await adminApi.deleteCategory(id);
      fetchCategories();
    } catch (err) {
      alert(err.message || "Failed to delete category");
    }
  };

  // Users Handlers
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createUser(newUser);
      setIsAddingUser(false);
      setNewUser({
        name: "",
        email: "",
        phone: "",
        role: "Tenant",
        password: "",
        city: "Injibara",
        region: "Amhara",
      });
      fetchUsersList();
      alert("User created successfully");
    } catch (err) {
      alert(
        err.message || err.response?.data?.error || "Failed to create user",
      );
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    const userId = editingUser.user_id || editingUser.id;
    try {
      await adminApi.updateUser(userId, editingUser);
      setEditingUser(null);
      fetchUsersList();
      alert("User account updated successfully");
    } catch (err) {
      alert(
        err.message ||
          err.response?.data?.error ||
          "Failed to update user account",
      );
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Delete user account?")) return;
    try {
      await adminApi.deleteUser(id);
      fetchUsersList();
      alert("User account deleted");
    } catch (err) {
      alert(err.message || "Failed to delete user");
    }
  };

  const handleUpdateUserRole = async (id, role) => {
    try {
      await adminApi.updateUserRole(id, role);
      fetchUsersList();
    } catch (err) {
      alert(err.message || "Failed to update role");
    }
  };

  // Payments Handlers
  const handleUpdatePayment = async (
    paymentId,
    status,
    customNote = "",
    transactionRef = "",
    paymentMethod = "",
  ) => {
    try {
      const note =
        customNote ||
        (status === "Approved"
          ? "Verified & approved by Admin"
          : "Rejected by Admin");
      await adminApi.updatePaymentStatus(paymentId, status, note);
      fetchAdminPayments();
      if (inspectingPayment && inspectingPayment.id === paymentId) {
        setInspectingPayment((prev) =>
          prev
            ? {
                ...prev,
                status,
                admin_notes: note,
                transaction_ref:
                  transactionRef ||
                  prev.transaction_ref ||
                  prev.transaction_reference,
                payment_method: paymentMethod || prev.payment_method,
              }
            : null,
        );
      }
      setStatusModalPayment(null);
      alert(`Payment status updated to ${status}`);
    } catch (err) {
      alert(err.message || "Failed to update payment status");
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm("Are you sure you want to delete this payment record?"))
      return;
    try {
      await adminApi.deletePayment(paymentId);
      fetchAdminPayments();
      if (inspectingPayment && inspectingPayment.id === paymentId) {
        setInspectingPayment(null);
      }
      alert("Payment record deleted successfully");
    } catch (err) {
      alert(err.message || "Failed to delete payment record");
    }
  };

  const handleAddManualPaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("user_id", newPayment.user_id);
      formData.append("user_role", newPayment.user_role);
      formData.append("ad_type", newPayment.ad_type);
      if (newPayment.house_id) formData.append("house_id", newPayment.house_id);
      if (newPayment.seeking_ad_id)
        formData.append("seeking_ad_id", newPayment.seeking_ad_id);
      formData.append("amount", newPayment.amount);
      formData.append("payment_method", newPayment.payment_method);
      formData.append("transaction_ref", newPayment.transaction_ref);
      formData.append("status", newPayment.status);
      formData.append("admin_notes", newPayment.admin_notes);
      if (manualReceiptFile) formData.append("receipt", manualReceiptFile);

      await adminApi.addManualPayment(formData);

      setIsAddingPayment(false);
      setManualReceiptFile(null);
      setNewPayment({
        user_id: "",
        user_role: "Landlord",
        ad_type: "Featured House Listing",
        house_id: "",
        seeking_ad_id: "",
        amount: "500",
        payment_method: "CBE Bank",
        transaction_ref: "",
        status: "Approved",
        admin_notes: "Verified and approved by Management",
      });
      fetchAdminPayments();
      alert("New payment record added successfully!");
    } catch (err) {
      alert(
        err.response?.data?.error ||
          err.message ||
          "Failed to add manual payment",
      );
    }
  };

  // Announcements Handlers
  const handleAddAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const type =
        activeTab === "homepage_notices"
          ? "homepage_notice"
          : "promotional_notice";
      await adminApi.createAnnouncement({ ...newAnnouncement, type });
      setNewAnnouncement({
        title_en: "",
        title_am: "",
        content_en: "",
        content_am: "",
        badge: "NEWS",
        is_active: true,
      });
      fetchAnnouncements();
      alert("Announcement published successfully");
    } catch (err) {
      alert(err.message || "Failed to publish announcement");
    }
  };

  const handleEditAnnouncement = (ann) => {
    setEditingAnnouncement(ann);
    window.scrollTo({ top: 0, behavior: "smooth" });
    const formElement = document.getElementById("announcement-form");
    if (formElement)
      formElement.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleUpdateAnnouncement = async (e) => {
    e.preventDefault();
    if (!editingAnnouncement) return;
    try {
      await adminApi.updateAnnouncement(
        editingAnnouncement.id,
        editingAnnouncement,
      );
      setEditingAnnouncement(null);
      fetchAnnouncements();
      alert("Ticker text / Announcement updated successfully");
    } catch (err) {
      alert(err.message || "Failed to update announcement");
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm("Delete announcement?")) return;
    try {
      await adminApi.deleteAnnouncement(id);
      fetchAnnouncements();
    } catch (err) {
      alert(err.message || "Failed to delete announcement");
    }
  };

  const handleLoadMediaForHouse = async () => {
    const houseId = Number(mediaHouseId);
    if (!Number.isInteger(houseId) || houseId <= 0) {
      setMediaMessage("Please enter a valid house ID");
      return;
    }
    setMediaLoading(true);
    setMediaMessage("");
    try {
      const [imagesRes, videosRes] = await Promise.all([
        adminApi.getHouseImages(houseId),
        adminApi.getHouseVideos(houseId),
      ]);
      setMediaHouseImages(Array.isArray(imagesRes.data) ? imagesRes.data : []);
      setMediaHouseVideos(Array.isArray(videosRes.data) ? videosRes.data : []);
      setMediaMessage(`Loaded media for house #${houseId}`);
    } catch (err) {
      setMediaMessage(err.message || "Failed to load media");
    } finally {
      setMediaLoading(false);
    }
  };

  const handleAddMediaImages = async (files) => {
    if (!mediaHouseId) {
      alert("Please enter a house ID first");
      return;
    }
    try {
      await adminApi.addHouseImages(Number(mediaHouseId), Array.from(files));
      handleLoadMediaForHouse();
      alert("Images uploaded successfully");
    } catch (err) {
      alert(err.message || "Failed to upload images");
    }
  };

  const handleDeleteMediaImage = async (imageId) => {
    if (!window.confirm("Delete this image?")) return;
    try {
      await adminApi.deleteHouseImage(Number(mediaHouseId), imageId);
      handleLoadMediaForHouse();
    } catch (err) {
      alert(err.message || "Failed to delete image");
    }
  };

  const handleSetPrimaryImage = async (imageId) => {
    try {
      await adminApi.updateHouseImage(Number(mediaHouseId), imageId, { is_primary: true });
      handleLoadMediaForHouse();
    } catch (err) {
      alert(err.message || "Failed to set primary image");
    }
  };

  const handleAddMediaVideo = async (file) => {
    if (!mediaHouseId) {
      alert("Please enter a house ID first");
      return;
    }
    try {
      await adminApi.addHouseVideo(Number(mediaHouseId), file);
      handleLoadMediaForHouse();
      alert("Video uploaded successfully");
    } catch (err) {
      alert(err.message || "Failed to upload video");
    }
  };

  const handleDeleteMediaVideo = async (videoId) => {
    if (!window.confirm("Delete this video?")) return;
    try {
      await adminApi.deleteHouseVideo(Number(mediaHouseId), videoId);
      handleLoadMediaForHouse();
    } catch (err) {
      alert(err.message || "Failed to delete video");
    }
  };

  const unreadAiCount = useMemo(
    () => aiLogs.filter((l) => !l.is_read).length,
    [aiLogs],
  );

  const navItems = useMemo(
    () => [
      {
        id: "overview",
        label: "Overview & Analytics",
        icon: <LayoutDashboard size={20} />,
      },
      {
        id: "homepage_config",
        label: "Homepage Setup",
        icon: <Layout size={20} />,
      },
      {
        id: "profile",
        label: "My Admin Profile (የእኔ ፕሮፋይል)",
        icon: <Users size={20} />,
      },
      {
        id: "users",
        label: "Account Management (የአካውንት አስተዳደር)",
        icon: <Users size={20} />,
        badge: usersList.length,
      },
      {
        id: "houses",
        label: "Properties",
        icon: <Home size={20} />,
        badge: houses.length,
      },
      {
        id: "media",
        label: "Media Library",
        icon: <Image size={20} />,
      },
      {
        id: "hero",
        label: "Hero Slides",
        icon: <Grid size={20} />,
        badge: heroSlides.length,
      },
      {
        id: "categories",
        label: "Categories",
        icon: <Grid size={20} />,
        badge: categories.length,
      },
      { id: "about", label: "About Page", icon: <Settings size={20} /> },
      { id: "contact", label: "Contact Page", icon: <Phone size={20} /> },
      {
        id: "auth",
        label: "Login & Register",
        icon: <Lock size={20} />,
        badge: authSlides.length,
      },
      {
        id: "chats",
        label: "Tenant & Broker Chats",
        icon: <MessageSquare size={20} />,
        badge: adminConversations.length,
      },
      {
        id: "ai_logs",
        label: "AI Chat Logs",
        icon: <Bot size={20} />,
        badge: unreadAiCount > 0 ? `${unreadAiCount} New` : undefined,
      },
      {
        id: "payments",
        label: "Ad Payments",
        icon: <CreditCard size={20} />,
        badge: payments.length,
      },
      {
        id: "homepage_notices",
        label: "HomepageNotice (ይፋዊ መግለጫዎች)",
        icon: <Bell size={20} />,
        badge: announcements.filter((a) => a.type === "homepage_notice").length,
      },
      {
        id: "promotional_notices",
        label: "promotional_Notice (የፕሮሞሽን ማስታወቂያዎች)",
        icon: <Megaphone size={20} />,
        badge: announcements.filter((a) => a.type !== "homepage_notice").length,
      },
      {
        id: "testimonials",
        label: "Testimonials",
        icon: <Star size={20} />,
        badge: testimonials.length,
      },
      {
        id: "settings",
        label: "Settings",
        icon: <Settings size={20} />,
      },
    ],
    [
      usersList.length,
      houses.length,
      heroSlides.length,
      categories.length,
      authSlides.length,
      adminConversations.length,
      unreadAiCount,
      payments.length,
      announcements,
      testimonials,
    ],
  );

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 flex flex-col md:flex-row relative">
      {/* Global Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-[300] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-4 max-w-sm mx-4">
            <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-300 font-bold text-sm">{loadingMessage}</p>
            <p className="text-slate-500 text-xs">
              {language === "am"
                ? "እባክዎ ይጠብቁ..."
                : "Please wait while we load your dashboard..."}
            </p>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {Object.keys(dataFetchErrors).length > 0 && (
        <div className="fixed top-4 right-4 z-[300] max-w-md">
          {Object.entries(dataFetchErrors).map(([key, error]) => (
            <div
              key={key}
              className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-2 flex items-center gap-2 shadow-lg"
            >
              <AlertCircle size={16} />
              <div>
                <p className="font-bold text-xs">{key}</p>
                <p className="text-xs opacity-80">{error}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mobile Top Bar */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <Shield className="text-amber-400" size={22} />
          <span className="font-black text-amber-400">Admin Portal</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 bg-slate-800 text-white rounded-xl border border-slate-700"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-slate-950/95 z-40 p-6 flex flex-col pt-20 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-amber-400 font-bold uppercase text-xs tracking-wider">
              Navigation
            </h3>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-400"
            >
              <X size={24} />
            </button>
          </div>
          <div className="space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  handleActiveTabChange(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between p-4 rounded-xl font-bold text-sm ${
                  activeTab === item.id
                    ? "bg-amber-500 text-slate-950"
                    : "bg-slate-900 text-slate-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-slate-800 text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="w-72 bg-slate-900 border-r border-slate-800 hidden md:block shrink-0 p-6 space-y-6 overflow-y-auto max-h-screen sticky top-0">
        <div className="flex items-center gap-3 pb-6 border-b border-slate-800">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
            <Shield size={24} />
          </div>
          <div>
            <h2 className="text-base font-black text-white tracking-wider">
              Admin Portal
            </h2>
            <p className="text-xs text-slate-400">Injibara Real Estate</p>
          </div>
        </div>

        <nav className="space-y-1.5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleActiveTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-bold text-xs md:text-sm transition shadow-sm ${
                activeTab === item.id
                  ? "bg-amber-500 text-slate-950 shadow-amber-500/20"
                  : "bg-slate-950/40 text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                    activeTab === item.id
                      ? "bg-slate-950 text-amber-400"
                      : "bg-slate-800 text-amber-400"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* OVERVIEW & ANALYTICS TAB */}
        {activeTab === "overview" && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h1 className="text-3xl font-black text-white">
                Dashboard Overview & Analytics
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Real-time platform metrics, user activity, and property listings
                overview.
              </p>
            </div>

            {/* Top Bar Profile Preview */}
            <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-lg mb-4">
              <div className="flex items-center gap-4">
                <OptimizedImage
                  src={
                    user?.avatar ||
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80"
                  }
                  alt="Avatar"
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-500/20"
                  width={48}
                  height={48}
                />
                <div>
                  <h4 className="text-white font-bold">{user?.name}</h4>
                  <p className="text-xs text-slate-400 font-medium">
                    Administrator • {user?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab("profile")}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-2"
              >
                <Edit3 size={14} /> Edit Profile
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Total Users
                  </p>
                  <h3 className="text-4xl font-black text-white mt-2">
                    {stats.totalUsers || usersList.length}
                  </h3>
                </div>
                <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
                  <Users size={28} />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Properties
                  </p>
                  <h3 className="text-4xl font-black text-white mt-2">
                    {houses.length}
                  </h3>
                </div>
                <div className="p-4 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20">
                  <Home size={28} />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Active Rentals
                  </p>
                  <h3 className="text-4xl font-black text-white mt-2">
                    {stats.activeRentals || 0}
                  </h3>
                </div>
                <div className="p-4 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
                  <BarChart3 size={28} />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Payments
                  </p>
                  <h3 className="text-4xl font-black text-white mt-2">
                    {payments.length}
                  </h3>
                </div>
                <div className="p-4 bg-purple-500/10 text-purple-400 rounded-2xl border border-purple-500/20">
                  <CreditCard size={28} />
                </div>
              </div>
            </div>

            {/* Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                <h3 className="text-lg font-bold text-white">
                  Properties by Type
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        {
                          name: "Apartment",
                          count: houses.filter((h) => h.type === "Apartment")
                            .length,
                        },
                        {
                          name: "Villa",
                          count: houses.filter((h) => h.type === "Villa")
                            .length,
                        },
                        {
                          name: "Condominium",
                          count: houses.filter((h) => h.type === "Condominium")
                            .length,
                        },
                        {
                          name: "Commercial",
                          count: houses.filter((h) => h.type === "Commercial")
                            .length,
                        },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#334155",
                          borderRadius: "12px",
                        }}
                      />
                      <Bar
                        dataKey="count"
                        fill="#f59e0b"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                <h3 className="text-lg font-bold text-white">
                  User Role Breakdown
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        {
                          name: "Admin",
                          count: usersList.filter((u) => u.role === "Admin")
                            .length,
                        },
                        {
                          name: "Landlord",
                          count: usersList.filter((u) => u.role === "Landlord")
                            .length,
                        },
                        {
                          name: "Tenant",
                          count: usersList.filter((u) => u.role === "Tenant")
                            .length,
                        },
                        {
                          name: "Broker",
                          count: usersList.filter((u) => u.role === "Broker")
                            .length,
                        },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#334155",
                          borderRadius: "12px",
                        }}
                      />
                      <Bar
                        dataKey="count"
                        fill="#3b82f6"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HOMEPAGE CONFIGURATION TAB */}
        {activeTab === "homepage_config" && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h1 className="text-3xl font-black text-white">
                Homepage Configuration
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Manage global sections, headings, and visual styling for the
                landing page.
              </p>
            </div>

            <div className="max-w-4xl">
              <form
                onSubmit={handleSaveWebsiteSettings}
                className="bg-slate-900 border border-slate-800 p-6 md:p-10 rounded-3xl space-y-8 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-3xl rounded-full -mr-32 -mt-32"></div>

                <div className="relative z-10 space-y-10">
                  {/* Category Section Setup */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                      <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 shadow-lg">
                        <Layout size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          Browse Categories Section
                        </h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                          Header & Background Styling
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
                          Section Title (EN)
                        </label>
                        <input
                          type="text"
                          value={websiteSettings.home_categories_title}
                          onChange={(e) =>
                            setWebsiteSettings({
                              ...websiteSettings,
                              home_categories_title: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none transition-all shadow-inner font-bold"
                          placeholder="e.g. Browse Categories"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
                          Section Title (AM)
                        </label>
                        <input
                          type="text"
                          value={websiteSettings.home_categories_title_am}
                          onChange={(e) =>
                            setWebsiteSettings({
                              ...websiteSettings,
                              home_categories_title_am: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none transition-all shadow-inner font-bold font-amharic"
                          placeholder="ምድቦችን ያስሱ"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
                          Section Subtitle (EN)
                        </label>
                        <textarea
                          rows={2}
                          value={websiteSettings.home_categories_subtitle}
                          onChange={(e) =>
                            setWebsiteSettings({
                              ...websiteSettings,
                              home_categories_subtitle: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none transition-all shadow-inner font-bold"
                          placeholder="Short English description..."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
                          Section Subtitle (AM)
                        </label>
                        <textarea
                          rows={2}
                          value={websiteSettings.home_categories_subtitle_am}
                          onChange={(e) =>
                            setWebsiteSettings({
                              ...websiteSettings,
                              home_categories_subtitle_am: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none transition-all shadow-inner font-bold font-amharic"
                          placeholder="በእንጅባራ ከተማ የሚከራዩ ቤቶች ዝርዝር"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
                          Background Styling (Tailwind Classes)
                        </label>
                        <div className="flex gap-4 items-center">
                          <input
                            type="text"
                            value={websiteSettings.home_categories_bg_color}
                            onChange={(e) =>
                              setWebsiteSettings({
                                ...websiteSettings,
                                home_categories_bg_color: e.target.value,
                              })
                            }
                            className="flex-1 bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none transition-all shadow-inner font-bold"
                            placeholder="e.g. bg-white, bg-slate-50, bg-amber-50/30"
                          />
                          <div
                            className={`w-14 h-14 rounded-2xl border border-slate-800 shadow-lg ${websiteSettings.home_categories_bg_color || "bg-white"}`}
                          ></div>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium ml-1 italic">
                          Use Tailwind background classes like bg-slate-50,
                          bg-amber-50, etc.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 pt-8 border-t border-slate-800">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                      <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 shadow-lg">
                        <Globe size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          Branding, Theme & Footer
                        </h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                          Global identity and visual branding
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
                          Brand Name (EN)
                        </label>
                        <input
                          value={websiteSettings.brand_name_en}
                          onChange={(e) =>
                            setWebsiteSettings({
                              ...websiteSettings,
                              brand_name_en: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none"
                          placeholder="Injibara House Rentals"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
                          Brand Name (AM)
                        </label>
                        <input
                          value={websiteSettings.brand_name_am}
                          onChange={(e) =>
                            setWebsiteSettings({
                              ...websiteSettings,
                              brand_name_am: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none font-amharic"
                          placeholder="እንጅባራ የቤት ኪራይ"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
                          Tagline (EN)
                        </label>
                        <input
                          value={websiteSettings.brand_tagline_en}
                          onChange={(e) =>
                            setWebsiteSettings({
                              ...websiteSettings,
                              brand_tagline_en: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none"
                          placeholder="Trusted homes and business spaces"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
                          Tagline (AM)
                        </label>
                        <input
                          value={websiteSettings.brand_tagline_am}
                          onChange={(e) =>
                            setWebsiteSettings({
                              ...websiteSettings,
                              brand_tagline_am: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none font-amharic"
                          placeholder="ታማኝ ቤቶች እና ንግድ ቦታዎች"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
                          Primary Color
                        </label>
                        <input
                          type="color"
                          value={websiteSettings.primary_color}
                          onChange={(e) =>
                            setWebsiteSettings({
                              ...websiteSettings,
                              primary_color: e.target.value,
                            })
                          }
                          className="w-full h-14 bg-slate-950 border border-slate-800 rounded-2xl p-2 focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
                          Secondary Color
                        </label>
                        <input
                          type="color"
                          value={websiteSettings.secondary_color}
                          onChange={(e) =>
                            setWebsiteSettings({
                              ...websiteSettings,
                              secondary_color: e.target.value,
                            })
                          }
                          className="w-full h-14 bg-slate-950 border border-slate-800 rounded-2xl p-2 focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
                          Accent Color
                        </label>
                        <input
                          type="color"
                          value={websiteSettings.accent_color}
                          onChange={(e) =>
                            setWebsiteSettings({
                              ...websiteSettings,
                              accent_color: e.target.value,
                            })
                          }
                          className="w-full h-14 bg-slate-950 border border-slate-800 rounded-2xl p-2 focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
                          Footer Description (EN)
                        </label>
                        <textarea
                          rows={2}
                          value={websiteSettings.footer_desc_en}
                          onChange={(e) =>
                            setWebsiteSettings({
                              ...websiteSettings,
                              footer_desc_en: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none"
                          placeholder="Brand copy shown in the footer"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
                          Footer Description (AM)
                        </label>
                        <textarea
                          rows={2}
                          value={websiteSettings.footer_desc_am}
                          onChange={(e) =>
                            setWebsiteSettings({
                              ...websiteSettings,
                              footer_desc_am: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none font-amharic"
                          placeholder="የፊት ገጹ ቅርጫት መግለጫ"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
                          Facebook URL
                        </label>
                        <input
                          value={websiteSettings.social_facebook_url}
                          onChange={(e) =>
                            setWebsiteSettings({
                              ...websiteSettings,
                              social_facebook_url: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none"
                          placeholder="https://facebook.com/yourpage"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
                          Twitter/X URL
                        </label>
                        <input
                          value={websiteSettings.social_twitter_url}
                          onChange={(e) =>
                            setWebsiteSettings({
                              ...websiteSettings,
                              social_twitter_url: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none"
                          placeholder="https://x.com/yourpage"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
                          Instagram URL
                        </label>
                        <input
                          value={websiteSettings.social_instagram_url}
                          onChange={(e) =>
                            setWebsiteSettings({
                              ...websiteSettings,
                              social_instagram_url: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none"
                          placeholder="https://instagram.com/yourpage"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
                          LinkedIn URL
                        </label>
                        <input
                          value={websiteSettings.social_linkedin_url}
                          onChange={(e) =>
                            setWebsiteSettings({
                              ...websiteSettings,
                              social_linkedin_url: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none"
                          placeholder="https://linkedin.com/company/yourpage"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
                          Google Map Embed URL
                        </label>
                        <input
                          value={websiteSettings.contact_map_url}
                          onChange={(e) =>
                            setWebsiteSettings({
                              ...websiteSettings,
                              contact_map_url: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none"
                          placeholder="https://www.google.com/maps?q=...&output=embed"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 pt-8 border-t border-slate-800">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                      <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 shadow-lg">
                        <FileText size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          Services, FAQ & Marketing Blocks
                        </h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                          JSON arrays for site modules
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
                          Services Title (EN)
                        </label>
                        <input
                          value={websiteSettings.services_title_en}
                          onChange={(e) =>
                            setWebsiteSettings({
                              ...websiteSettings,
                              services_title_en: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none"
                          placeholder="Our Services"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
                          Services Title (AM)
                        </label>
                        <input
                          value={websiteSettings.services_title_am}
                          onChange={(e) =>
                            setWebsiteSettings({
                              ...websiteSettings,
                              services_title_am: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none font-amharic"
                          placeholder="አገልግሎቶች"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
                          Services JSON
                        </label>
                        <textarea
                          rows={8}
                          value={websiteSettings.services_list}
                          onChange={(e) =>
                            setWebsiteSettings({
                              ...websiteSettings,
                              services_list: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none font-mono text-xs"
                          placeholder='[{"title_en":"Property Sales","title_am":"የቤት ሽያጭ","description_en":"...","description_am":"..."}]'
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
                          FAQ Title (EN)
                        </label>
                        <input
                          value={websiteSettings.faq_title_en}
                          onChange={(e) =>
                            setWebsiteSettings({
                              ...websiteSettings,
                              faq_title_en: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none"
                          placeholder="Frequently Asked Questions"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
                          FAQ Title (AM)
                        </label>
                        <input
                          value={websiteSettings.faq_title_am}
                          onChange={(e) =>
                            setWebsiteSettings({
                              ...websiteSettings,
                              faq_title_am: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none font-amharic"
                          placeholder="ተደጋግሞ የሚጠየቁ"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
                          FAQ JSON
                        </label>
                        <textarea
                          rows={8}
                          value={websiteSettings.faq_list}
                          onChange={(e) =>
                            setWebsiteSettings({
                              ...websiteSettings,
                              faq_list: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none font-mono text-xs"
                          placeholder='[{"question_en":"How do I find a house?","question_am":"ቤት እንዴት እንደሚገኝ?","answer_en":"...","answer_am":"..."}]'
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
                          Marketing Blocks JSON
                        </label>
                        <textarea
                          rows={8}
                          value={websiteSettings.marketing_blocks}
                          onChange={(e) =>
                            setWebsiteSettings({
                              ...websiteSettings,
                              marketing_blocks: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none font-mono text-xs"
                          placeholder='[{"title_en":"Fast Search","title_am":"ፈጣን ፍለጋ","description_en":"...","description_am":"..."}]'
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row gap-4">
                    <button
                      type="submit"
                      className="flex-1 py-4 bg-amber-500 text-slate-950 font-black rounded-2xl hover:bg-amber-400 transition shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2"
                    >
                      <Save size={20} /> Update Homepage Settings
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("overview")}
                      className="px-8 py-4 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-700 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ADMIN PROFILE TAB */}
        {activeTab === "profile" && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h1 className="text-3xl font-black text-white">
                My Administrator Profile
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Manage your personal administrative account details and security
                settings.
              </p>
            </div>

            <div className="max-w-4xl">
              <form
                onSubmit={handleProfileSubmit}
                className="bg-slate-900 border border-slate-800 p-6 md:p-10 rounded-3xl space-y-8 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-3xl rounded-full -mr-32 -mt-32"></div>

                <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                  {/* Avatar Upload Section */}
                  <div className="flex flex-col items-center gap-4 shrink-0">
                    <div className="relative group">
                      <OptimizedImage
                        src={
                          profileData.avatar ||
                          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80"
                        }
                        alt="Profile Preview"
                        className="w-40 h-40 rounded-3xl object-cover border-4 border-slate-800 shadow-2xl group-hover:border-amber-500/50 transition-all duration-300"
                        width={160}
                        height={160}
                      />
                      <label className="absolute inset-0 bg-black/60 rounded-3xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity duration-300 backdrop-blur-sm">
                        <Plus className="text-white w-10 h-10 mb-1" />
                        <span className="text-white text-[10px] font-black uppercase tracking-widest">
                          Change Photo
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              setProfileAvatarFile(file);
                              setProfileData({
                                ...profileData,
                                avatar: URL.createObjectURL(file),
                              });
                            }
                          }}
                        />
                      </label>
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center">
                      Admin Profile Photo
                    </p>
                  </div>

                  {/* Form Fields */}
                  <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            name: e.target.value,
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none transition-all shadow-inner font-bold"
                        placeholder="Your full name..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        value={profileData.phone}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            phone: e.target.value,
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none transition-all shadow-inner font-bold"
                        placeholder="0911..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
                        Email Address (Read Only)
                      </label>
                      <input
                        type="email"
                        value={user?.email || ""}
                        disabled
                        className="w-full bg-slate-800/50 border border-slate-800 text-slate-500 rounded-2xl p-4 cursor-not-allowed font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
                        Region (ክልል)
                      </label>
                      <select
                        value={profileData.region}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            region: e.target.value,
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none transition-all shadow-inner font-bold"
                      >
                        <option value="Injibara">
                          እንጅባራ እና አካባቢው (Injibara & Area)
                        </option>
                        <option value="Bahir Dar">sil</option>
                        <option value="Gondar">ጎንደር (Gondar)</option>
                        <option value="Dessie">ደሴ (Dessie)</option>
                        <option value="Awi Zone">አዊ ዞን (Awi Zone)</option>
                        <option value="Addis Ababa">
                          አዲስ አበባ (Addis Ababa)
                        </option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
                        City (ከተማ)
                      </label>
                      <input
                        type="text"
                        value={profileData.city}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            city: e.target.value,
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none transition-all shadow-inner font-bold"
                        placeholder="Injibara..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
                        Sub-City / Kebele (ክፍለ ከተማ / ቀበሌ)
                      </label>
                      <input
                        type="text"
                        value={profileData.sub_city}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            sub_city: e.target.value,
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none transition-all shadow-inner font-bold"
                        placeholder="Woreda 01 / Kebele 02..."
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
                        Work Address / Bio
                      </label>
                      <textarea
                        rows={3}
                        value={profileData.address}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            address: e.target.value,
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none transition-all shadow-inner font-bold resize-none"
                        placeholder="Tell us about yourself or specify your admin location..."
                      />
                    </div>
                  </div>
                </div>

                {profileMessage && (
                  <div
                    className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-3 animate-slideIn ${profileMessage.includes("Failed") || profileMessage.includes("አልተቻለም") ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}`}
                  >
                    {profileMessage.includes("Failed") ? (
                      <ShieldAlert size={18} />
                    ) : (
                      <CheckCircle size={18} />
                    )}
                    {profileMessage}
                  </div>
                )}

                <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row gap-4">
                  <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="flex-1 py-4 bg-amber-500 text-slate-950 font-black rounded-2xl hover:bg-amber-400 transition shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait"
                  >
                    {isUpdatingProfile ? (
                      <>
                        <ButtonSpinner size={20} />
                        Saving Profile...
                      </>
                    ) : (
                      <>
                        <Save size={20} />
                        Update Profile Settings
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("overview")}
                    className="px-8 py-4 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-700 transition"
                  >
                    Discard Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* HERO SLIDES TAB */}
        {activeTab === "hero" && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black text-white">
                  Hero Slides Management
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  Configure homepage banner carousel slides with bilingual
                  support (Add, Edit, Update, Delete).
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-3 py-1.5 rounded-xl font-bold">
                  {heroSlides.filter((s) => s.is_active).length} Active
                </span>
                <span className="bg-slate-800 border border-slate-700 text-slate-400 text-xs px-3 py-1.5 rounded-xl font-bold">
                  {heroSlides.length} Total
                </span>
              </div>
            </div>

            <div
              id="hero-form"
              className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden"
            >
              {editingHeroSlide && (
                <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
              )}
              <h3 className="text-xl font-bold text-amber-400 flex items-center gap-2">
                <Plus size={20} />{" "}
                {editingHeroSlide ? "Edit Hero Slide" : "Add New Hero Slide"}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Title (English)
                  </label>
                  <input
                    value={
                      editingHeroSlide
                        ? editingHeroSlide.title_en || ""
                        : newHeroSlide.title_en
                    }
                    onChange={(e) =>
                      editingHeroSlide
                        ? setEditingHeroSlide({
                            ...editingHeroSlide,
                            title_en: e.target.value,
                          })
                        : setNewHeroSlide({
                            ...newHeroSlide,
                            title_en: e.target.value,
                          })
                    }
                    placeholder="e.g. Modern Living in Injibara"
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm focus:border-amber-500/50 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Title (Amharic)
                  </label>
                  <input
                    value={
                      editingHeroSlide
                        ? editingHeroSlide.title_am || ""
                        : newHeroSlide.title_am
                    }
                    onChange={(e) =>
                      editingHeroSlide
                        ? setEditingHeroSlide({
                            ...editingHeroSlide,
                            title_am: e.target.value,
                          })
                        : setNewHeroSlide({
                            ...newHeroSlide,
                            title_am: e.target.value,
                          })
                    }
                    placeholder="ለምሳሌ: በእንጅባራ የቅንጦት መኖሪያ"
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm focus:border-amber-500/50 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Subtitle (English)
                  </label>
                  <input
                    value={
                      editingHeroSlide
                        ? editingHeroSlide.subtitle_en || ""
                        : newHeroSlide.subtitle_en
                    }
                    onChange={(e) =>
                      editingHeroSlide
                        ? setEditingHeroSlide({
                            ...editingHeroSlide,
                            subtitle_en: e.target.value,
                          })
                        : setNewHeroSlide({
                            ...newHeroSlide,
                            subtitle_en: e.target.value,
                          })
                    }
                    placeholder="Verified homes"
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm focus:border-amber-500/50 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Subtitle (Amharic)
                  </label>
                  <input
                    value={
                      editingHeroSlide
                        ? editingHeroSlide.subtitle_am || ""
                        : newHeroSlide.subtitle_am
                    }
                    onChange={(e) =>
                      editingHeroSlide
                        ? setEditingHeroSlide({
                            ...editingHeroSlide,
                            subtitle_am: e.target.value,
                          })
                        : setNewHeroSlide({
                            ...newHeroSlide,
                            subtitle_am: e.target.value,
                          })
                    }
                    placeholder="የተረጋገጡ ቤቶች"
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm focus:border-amber-500/50 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Description (English)
                  </label>
                  <textarea
                    value={
                      editingHeroSlide
                        ? editingHeroSlide.description_en || ""
                        : newHeroSlide.description_en
                    }
                    onChange={(e) =>
                      editingHeroSlide
                        ? setEditingHeroSlide({
                            ...editingHeroSlide,
                            description_en: e.target.value,
                          })
                        : setNewHeroSlide({
                            ...newHeroSlide,
                            description_en: e.target.value,
                          })
                    }
                    placeholder="Short description..."
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm focus:border-amber-500/50 outline-none transition"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Description (Amharic)
                  </label>
                  <textarea
                    value={
                      editingHeroSlide
                        ? editingHeroSlide.description_am || ""
                        : newHeroSlide.description_am
                    }
                    onChange={(e) =>
                      editingHeroSlide
                        ? setEditingHeroSlide({
                            ...editingHeroSlide,
                            description_am: e.target.value,
                          })
                        : setNewHeroSlide({
                            ...newHeroSlide,
                            description_am: e.target.value,
                          })
                    }
                    placeholder="አጭር መግለጫ..."
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm focus:border-amber-500/50 outline-none transition"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Button Text (English)
                  </label>
                  <input
                    value={
                      editingHeroSlide
                        ? editingHeroSlide.button_text_en || ""
                        : newHeroSlide.button_text_en
                    }
                    onChange={(e) =>
                      editingHeroSlide
                        ? setEditingHeroSlide({
                            ...editingHeroSlide,
                            button_text_en: e.target.value,
                          })
                        : setNewHeroSlide({
                            ...newHeroSlide,
                            button_text_en: e.target.value,
                          })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm focus:border-amber-500/50 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Button Text (Amharic)
                  </label>
                  <input
                    value={
                      editingHeroSlide
                        ? editingHeroSlide.button_text_am || ""
                        : newHeroSlide.button_text_am
                    }
                    onChange={(e) =>
                      editingHeroSlide
                        ? setEditingHeroSlide({
                            ...editingHeroSlide,
                            button_text_am: e.target.value,
                          })
                        : setNewHeroSlide({
                            ...newHeroSlide,
                            button_text_am: e.target.value,
                          })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm focus:border-amber-500/50 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Button URL
                  </label>
                  <input
                    value={
                      editingHeroSlide
                        ? editingHeroSlide.button_url || ""
                        : newHeroSlide.button_url
                    }
                    onChange={(e) =>
                      editingHeroSlide
                        ? setEditingHeroSlide({
                            ...editingHeroSlide,
                            button_url: e.target.value,
                          })
                        : setNewHeroSlide({
                            ...newHeroSlide,
                            button_url: e.target.value,
                          })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm focus:border-amber-500/50 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Display Order (Lower comes first)
                  </label>
                  <input
                    type="number"
                    value={
                      editingHeroSlide
                        ? editingHeroSlide.display_order || 0
                        : newHeroSlide.display_order
                    }
                    onChange={(e) =>
                      editingHeroSlide
                        ? setEditingHeroSlide({
                            ...editingHeroSlide,
                            display_order: Number(e.target.value),
                          })
                        : setNewHeroSlide({
                            ...newHeroSlide,
                            display_order: Number(e.target.value),
                          })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm focus:border-amber-500/50 outline-none transition"
                  />
                </div>

                <div className="col-span-2">
                  <ImageSettingInput
                    label="Background Image"
                    value={
                      editingHeroSlide
                        ? editingHeroSlide.image_url || ""
                        : newHeroSlide.image_url
                    }
                    onChange={(val) =>
                      editingHeroSlide
                        ? setEditingHeroSlide({
                            ...editingHeroSlide,
                            image_url: val,
                          })
                        : setNewHeroSlide({ ...newHeroSlide, image_url: val })
                    }
                    onUpload={uploadImage}
                  />
                </div>

                <div className="col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="hero-active"
                    checked={
                      editingHeroSlide
                        ? (editingHeroSlide.is_active ?? true)
                        : (newHeroSlide.is_active ?? true)
                    }
                    onChange={(e) =>
                      editingHeroSlide
                        ? setEditingHeroSlide({
                            ...editingHeroSlide,
                            is_active: e.target.checked,
                          })
                        : setNewHeroSlide({
                            ...newHeroSlide,
                            is_active: e.target.checked,
                          })
                    }
                    className="w-5 h-5 accent-amber-500"
                  />
                  <label
                    htmlFor="hero-active"
                    className="text-sm font-bold text-white"
                  >
                    Active (Visible on homepage)
                  </label>
                </div>
              </div>

              <div className="flex gap-4">
                {editingHeroSlide ? (
                  <>
                    <button
                      onClick={handleUpdateHeroSlide}
                      className="flex-1 py-4 bg-amber-500 text-slate-950 font-black rounded-2xl hover:bg-amber-400 transition shadow-lg flex items-center justify-center gap-2"
                    >
                      <Save size={20} /> Update Hero Slide
                    </button>
                    <button
                      onClick={() => setEditingHeroSlide(null)}
                      className="px-6 py-4 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-700 transition"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleAddHeroSlide}
                    className="w-full py-4 bg-amber-500 text-slate-950 font-black rounded-2xl hover:bg-amber-400 transition shadow-lg flex items-center justify-center gap-2"
                  >
                    <Plus size={24} /> Create Hero Slide
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">
                  Existing Hero Slides ({heroSlides.length})
                </h3>
                <div className="text-xs text-slate-500">
                  Sorted by Display Order
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...heroSlides]
                  .sort(
                    (a, b) => (a.display_order || 0) - (b.display_order || 0),
                  )
                  .map((slide, index) => (
                    <div
                      key={slide.id || index}
                      className={`bg-slate-900 border ${slide.is_active ? "border-slate-800 shadow-xl" : "border-slate-800/50 grayscale opacity-60"} p-6 rounded-3xl flex flex-col justify-between gap-6 transition-all duration-300 hover:scale-[1.02]`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="relative flex-shrink-0">
                          <OptimizedImage
                            src={slide.image_url}
                            alt=""
                            className="w-28 h-28 rounded-2xl object-cover border border-slate-700 shadow-md"
                            width={112}
                            height={112}
                          />
                          <div className="absolute -top-2 -left-2 w-8 h-8 bg-slate-950 border border-slate-700 rounded-full flex items-center justify-center text-xs font-black text-amber-400 shadow-lg">
                            {slide.display_order || 0}
                          </div>
                          {!slide.is_active && (
                            <div className="absolute inset-0 bg-slate-950/40 rounded-2xl flex items-center justify-center">
                              <span className="bg-red-500 text-[10px] text-white px-2 py-0.5 rounded font-black uppercase">
                                Inactive
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-1 min-w-0 flex-1">
                          <h4 className="text-white font-bold text-lg truncate">
                            {slide.title_en}
                          </h4>
                          <p className="text-slate-400 text-xs truncate">
                            {slide.subtitle_en}
                          </p>
                          <div className="pt-2 border-t border-slate-800 mt-2">
                            <p className="text-amber-400/90 text-xs font-amharic font-semibold truncate">
                              {slide.title_am}
                            </p>
                            <p className="text-slate-400/80 text-xs font-amharic truncate">
                              {slide.subtitle_am}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                        <div className="flex items-center gap-2">
                          {slide.is_active ? (
                            <span className="flex items-center gap-1 text-[10px] font-black text-emerald-400 uppercase tracking-wider">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>{" "}
                              Active
                            </span>
                          ) : (
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                              Hidden
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditHeroSlide(slide)}
                            className="px-5 py-2.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold hover:bg-amber-500/20 transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteHeroSlide(slide.id)}
                            className="p-2.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/20 transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
              {heroSlides.length === 0 && (
                <div className="bg-slate-900/50 border border-dashed border-slate-800 p-12 rounded-3xl text-center">
                  <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                    <Grid size={32} />
                  </div>
                  <h4 className="text-white font-bold">No Hero Slides Yet</h4>
                  <p className="text-slate-500 text-sm mt-1">
                    Create your first homepage banner slide using the form
                    above.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ABOUT PAGE TAB */}
        {activeTab === "about" && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h1 className="text-3xl font-black text-white">
                About Page Management
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Customize company history, mission, vision, values, and
                photography.
              </p>
            </div>

            <form
              onSubmit={handleSaveAbout}
              className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl space-y-6 shadow-xl"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Title (EN)
                  </label>
                  <input
                    value={aboutPage.title_en || ""}
                    onChange={(e) =>
                      setAboutPage({ ...aboutPage, title_en: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Title (AM)
                  </label>
                  <input
                    value={aboutPage.title_am || ""}
                    onChange={(e) =>
                      setAboutPage({ ...aboutPage, title_am: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Subtitle (EN)
                  </label>
                  <input
                    value={aboutPage.subtitle_en || ""}
                    onChange={(e) =>
                      setAboutPage({
                        ...aboutPage,
                        subtitle_en: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Subtitle (AM)
                  </label>
                  <input
                    value={aboutPage.subtitle_am || ""}
                    onChange={(e) =>
                      setAboutPage({
                        ...aboutPage,
                        subtitle_am: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Content (EN)
                  </label>
                  <textarea
                    rows={3}
                    value={aboutPage.content_en || ""}
                    onChange={(e) =>
                      setAboutPage({ ...aboutPage, content_en: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Content (AM)
                  </label>
                  <textarea
                    rows={3}
                    value={aboutPage.content_am || ""}
                    onChange={(e) =>
                      setAboutPage({ ...aboutPage, content_am: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Mission (EN)
                  </label>
                  <textarea
                    rows={2}
                    value={aboutPage.mission_en || ""}
                    onChange={(e) =>
                      setAboutPage({ ...aboutPage, mission_en: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Mission (AM)
                  </label>
                  <textarea
                    rows={2}
                    value={aboutPage.mission_am || ""}
                    onChange={(e) =>
                      setAboutPage({ ...aboutPage, mission_am: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Vision (EN)
                  </label>
                  <textarea
                    rows={2}
                    value={aboutPage.vision_en || ""}
                    onChange={(e) =>
                      setAboutPage({ ...aboutPage, vision_en: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Vision (AM)
                  </label>
                  <textarea
                    rows={2}
                    value={aboutPage.vision_am || ""}
                    onChange={(e) =>
                      setAboutPage({ ...aboutPage, vision_am: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Values (EN)
                  </label>
                  <textarea
                    rows={2}
                    value={aboutPage.values_en || ""}
                    onChange={(e) =>
                      setAboutPage({ ...aboutPage, values_en: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Values (AM)
                  </label>
                  <textarea
                    rows={2}
                    value={aboutPage.values_am || ""}
                    onChange={(e) =>
                      setAboutPage({ ...aboutPage, values_am: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <ImageSettingInput
                    label="Banner / Hero Background Image"
                    value={aboutPage.banner_image_url || ""}
                    onChange={(val) =>
                      setAboutPage({ ...aboutPage, banner_image_url: val })
                    }
                    onUpload={uploadImage}
                  />
                </div>
                <div className="col-span-2">
                  <ImageSettingInput
                    label="About Section Image"
                    value={aboutPage.image_url || ""}
                    onChange={(val) =>
                      setAboutPage({ ...aboutPage, image_url: val })
                    }
                    onUpload={uploadImage}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-amber-500 text-slate-950 font-black rounded-2xl hover:bg-amber-400 transition shadow-lg"
              >
                Save About Page
              </button>
            </form>
          </div>
        )}

        {/* CONTACT PAGE TAB */}
        {activeTab === "contact" && (
          <div className="space-y-10 animate-fadeIn">
            <div>
              <h1 className="text-3xl font-black text-white flex items-center gap-3">
                <Phone className="text-amber-400" /> Contact Us Page Management
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Configure global contact headings, address info, phone numbers,
                email, social links, office branches, and hotlines.
              </p>
            </div>

            {/* SECTION 1: GLOBAL CONTACT INFO FORM */}
            <form
              onSubmit={handleSaveContact}
              className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl space-y-6 shadow-xl"
            >
              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-xl font-bold text-amber-400 flex items-center gap-2">
                  <Edit3 size={20} /> Contact Page Global Content
                </h3>
                <p className="text-slate-400 text-xs mt-1">
                  Update titles, subtitles, official physical addresses,
                  primary/secondary/tertiary phones, email, working hours, and
                  social media links.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Page Title (EN)
                  </label>
                  <input
                    value={contactPage.title_en || ""}
                    onChange={(e) =>
                      setContactPage({
                        ...contactPage,
                        title_en: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Page Title (AM)
                  </label>
                  <input
                    value={contactPage.title_am || ""}
                    onChange={(e) =>
                      setContactPage({
                        ...contactPage,
                        title_am: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Subtitle (EN)
                  </label>
                  <textarea
                    rows={2}
                    value={contactPage.subtitle_en || ""}
                    onChange={(e) =>
                      setContactPage({
                        ...contactPage,
                        subtitle_en: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Subtitle (AM)
                  </label>
                  <textarea
                    rows={2}
                    value={contactPage.subtitle_am || ""}
                    onChange={(e) =>
                      setContactPage({
                        ...contactPage,
                        subtitle_am: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Physical Address (EN)
                  </label>
                  <input
                    value={contactPage.address_en || ""}
                    onChange={(e) =>
                      setContactPage({
                        ...contactPage,
                        address_en: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Physical Address (AM)
                  </label>
                  <input
                    value={contactPage.address_am || ""}
                    onChange={(e) =>
                      setContactPage({
                        ...contactPage,
                        address_am: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Primary Phone 1
                  </label>
                  <input
                    value={contactPage.phone_1 || ""}
                    onChange={(e) =>
                      setContactPage({
                        ...contactPage,
                        phone_1: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Secondary Phone 2
                  </label>
                  <input
                    value={contactPage.phone_2 || ""}
                    onChange={(e) =>
                      setContactPage({
                        ...contactPage,
                        phone_2: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Tertiary Phone 3
                  </label>
                  <input
                    value={contactPage.phone_3 || ""}
                    onChange={(e) =>
                      setContactPage({
                        ...contactPage,
                        phone_3: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Official Email
                  </label>
                  <input
                    value={contactPage.email || ""}
                    onChange={(e) =>
                      setContactPage({ ...contactPage, email: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Working Hours (EN)
                  </label>
                  <input
                    value={contactPage.working_hours_en || ""}
                    onChange={(e) =>
                      setContactPage({
                        ...contactPage,
                        working_hours_en: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Working Hours (AM)
                  </label>
                  <input
                    value={contactPage.working_hours_am || ""}
                    onChange={(e) =>
                      setContactPage({
                        ...contactPage,
                        working_hours_am: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Facebook URL
                  </label>
                  <input
                    value={contactPage.facebook_url || ""}
                    onChange={(e) =>
                      setContactPage({
                        ...contactPage,
                        facebook_url: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Telegram URL
                  </label>
                  <input
                    value={contactPage.telegram_url || ""}
                    onChange={(e) =>
                      setContactPage({
                        ...contactPage,
                        telegram_url: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    TikTok URL
                  </label>
                  <input
                    value={contactPage.tiktok_url || ""}
                    onChange={(e) =>
                      setContactPage({
                        ...contactPage,
                        tiktok_url: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    YouTube URL
                  </label>
                  <input
                    value={contactPage.youtube_url || ""}
                    onChange={(e) =>
                      setContactPage({
                        ...contactPage,
                        youtube_url: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <ImageSettingInput
                    label="Banner / Header Background Image"
                    value={contactPage.banner_image_url || ""}
                    onChange={(val) =>
                      setContactPage({ ...contactPage, banner_image_url: val })
                    }
                    onUpload={uploadImage}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-amber-500 text-slate-950 font-black rounded-2xl hover:bg-amber-400 transition shadow-lg"
              >
                Save Contact Page Global Settings
              </button>
            </form>

            {/* SECTION 2: OFFICE BRANCHES MANAGEMENT */}
            <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Building size={20} className="text-amber-400" /> Office
                    Branches (ቅርንጫፍ ጽሕፈት ቤቶች)
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">
                    Manage physical branch locations displayed on the contact
                    page.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddingOffice(!isAddingOffice)}
                  className="px-5 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-sm hover:bg-amber-400 transition"
                >
                  {isAddingOffice ? "Cancel" : "+ Add Office Branch"}
                </button>
              </div>

              {/* Add Office Form */}
              {isAddingOffice && (
                <form
                  onSubmit={handleAddOffice}
                  className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 animate-fadeIn"
                >
                  <h4 className="text-sm font-black text-amber-400">
                    Add New Office Branch
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">
                        Branch Name (EN)
                      </label>
                      <input
                        value={newOffice.name_en}
                        onChange={(e) =>
                          setNewOffice({
                            ...newOffice,
                            name_en: e.target.value,
                          })
                        }
                        placeholder="e.g. Kebele 01 Main Branch"
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">
                        Branch Name (AM)
                      </label>
                      <input
                        value={newOffice.name_am}
                        onChange={(e) =>
                          setNewOffice({
                            ...newOffice,
                            name_am: e.target.value,
                          })
                        }
                        placeholder="ምሳሌ፡ ቀበሌ 01 ዋና ጽሕፈት ቤት"
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">
                        Address (EN)
                      </label>
                      <input
                        value={newOffice.address_en}
                        onChange={(e) =>
                          setNewOffice({
                            ...newOffice,
                            address_en: e.target.value,
                          })
                        }
                        placeholder="Main Road, Injibara"
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">
                        Address (AM)
                      </label>
                      <input
                        value={newOffice.address_am}
                        onChange={(e) =>
                          setNewOffice({
                            ...newOffice,
                            address_am: e.target.value,
                          })
                        }
                        placeholder="ዋና መንገድ፣ እንጅባራ"
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">
                        Branch Phone
                      </label>
                      <input
                        value={newOffice.phone}
                        onChange={(e) =>
                          setNewOffice({ ...newOffice, phone: e.target.value })
                        }
                        placeholder="+251 ..."
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">
                        Agent / Manager Name
                      </label>
                      <input
                        value={newOffice.agent_name}
                        onChange={(e) =>
                          setNewOffice({
                            ...newOffice,
                            agent_name: e.target.value,
                          })
                        }
                        placeholder="Habtamu Simeneh"
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">
                        Working Hours
                      </label>
                      <input
                        value={newOffice.working_hours}
                        onChange={(e) =>
                          setNewOffice({
                            ...newOffice,
                            working_hours: e.target.value,
                          })
                        }
                        placeholder="Mon-Sat: 8:00 AM - 6:00 PM"
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">
                        Display Order
                      </label>
                      <input
                        type="number"
                        value={newOffice.display_order}
                        onChange={(e) =>
                          setNewOffice({
                            ...newOffice,
                            display_order: Number(e.target.value),
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 text-sm"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400 transition"
                  >
                    Save Office Branch
                  </button>
                </form>
              )}

              {/* Edit Office Modal / Form */}
              {editingOffice && (
                <form
                  onSubmit={handleUpdateOffice}
                  className="bg-slate-950 p-5 rounded-2xl border border-amber-500/50 space-y-4 animate-fadeIn"
                >
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-black text-amber-400">
                      Edit Office Branch: {editingOffice.name_en}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setEditingOffice(null)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">
                        Branch Name (EN)
                      </label>
                      <input
                        value={editingOffice.name_en || ""}
                        onChange={(e) =>
                          setEditingOffice({
                            ...editingOffice,
                            name_en: e.target.value,
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">
                        Branch Name (AM)
                      </label>
                      <input
                        value={editingOffice.name_am || ""}
                        onChange={(e) =>
                          setEditingOffice({
                            ...editingOffice,
                            name_am: e.target.value,
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">
                        Address (EN)
                      </label>
                      <input
                        value={editingOffice.address_en || ""}
                        onChange={(e) =>
                          setEditingOffice({
                            ...editingOffice,
                            address_en: e.target.value,
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">
                        Address (AM)
                      </label>
                      <input
                        value={editingOffice.address_am || ""}
                        onChange={(e) =>
                          setEditingOffice({
                            ...editingOffice,
                            address_am: e.target.value,
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">
                        Branch Phone
                      </label>
                      <input
                        value={editingOffice.phone || ""}
                        onChange={(e) =>
                          setEditingOffice({
                            ...editingOffice,
                            phone: e.target.value,
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">
                        Agent / Manager Name
                      </label>
                      <input
                        value={editingOffice.agent_name || ""}
                        onChange={(e) =>
                          setEditingOffice({
                            ...editingOffice,
                            agent_name: e.target.value,
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">
                        Working Hours
                      </label>
                      <input
                        value={editingOffice.working_hours || ""}
                        onChange={(e) =>
                          setEditingOffice({
                            ...editingOffice,
                            working_hours: e.target.value,
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">
                        Display Order
                      </label>
                      <input
                        type="number"
                        value={editingOffice.display_order || 0}
                        onChange={(e) =>
                          setEditingOffice({
                            ...editingOffice,
                            display_order: Number(e.target.value),
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 text-sm"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400 transition"
                  >
                    Update Office Branch
                  </button>
                </form>
              )}

              {/* Offices List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contactOffices.map((office) => (
                  <div
                    key={office.id}
                    className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-white text-base">
                          {office.name_en}
                        </h4>
                        <span className="text-xs bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full font-semibold">
                          Order: {office.display_order}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {office.name_am}
                      </p>
                      <p className="text-xs text-slate-300 mt-3 flex items-center gap-1.5">
                        <MapPin size={14} className="text-amber-400" />{" "}
                        {office.address_en}
                      </p>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                        <Phone size={14} className="text-emerald-400" />{" "}
                        {office.phone} ({office.agent_name})
                      </p>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() => setEditingOffice(office)}
                        className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteOffice(office.id)}
                        className="py-2 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-semibold transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {contactOffices.length === 0 && (
                  <p className="text-slate-500 text-sm italic col-span-2 text-center py-6">
                    No office branches configured yet.
                  </p>
                )}
              </div>
            </div>

            {/* SECTION 3: PHONE HOTLINES MANAGEMENT */}
            <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Phone size={20} className="text-amber-400" /> Phone &
                    Telegram Hotlines (የስልክ እና የቴሌግራም መስመሮች)
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">
                    Manage departmental telephone and Telegram contact lines.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddingPhone(!isAddingPhone)}
                  className="px-5 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-sm hover:bg-amber-400 transition"
                >
                  {isAddingPhone ? "Cancel" : "+ Add Hotline"}
                </button>
              </div>

              {/* Add Phone Form */}
              {isAddingPhone && (
                <form
                  onSubmit={handleAddPhone}
                  className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 animate-fadeIn"
                >
                  <h4 className="text-sm font-black text-amber-400">
                    Add New Hotline
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">
                        Department (EN)
                      </label>
                      <input
                        value={newPhone.department_en}
                        onChange={(e) =>
                          setNewPhone({
                            ...newPhone,
                            department_en: e.target.value,
                          })
                        }
                        placeholder="e.g. Main Rental Support"
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">
                        Department (AM)
                      </label>
                      <input
                        value={newPhone.department_am}
                        onChange={(e) =>
                          setNewPhone({
                            ...newPhone,
                            department_am: e.target.value,
                          })
                        }
                        placeholder="ምሳሌ፡ ዋና የቤት ኪራይ እርዳታ"
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">
                        Phone Number
                      </label>
                      <input
                        value={newPhone.phone_number}
                        onChange={(e) =>
                          setNewPhone({
                            ...newPhone,
                            phone_number: e.target.value,
                          })
                        }
                        placeholder="+251 ..."
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">
                        Telegram Username
                      </label>
                      <input
                        value={newPhone.telegram_username}
                        onChange={(e) =>
                          setNewPhone({
                            ...newPhone,
                            telegram_username: e.target.value,
                          })
                        }
                        placeholder="@Habte88"
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">
                        Contact Person Name
                      </label>
                      <input
                        value={newPhone.contact_person}
                        onChange={(e) =>
                          setNewPhone({
                            ...newPhone,
                            contact_person: e.target.value,
                          })
                        }
                        placeholder="Habtamu Simeneh"
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">
                        Display Order
                      </label>
                      <input
                        type="number"
                        value={newPhone.display_order}
                        onChange={(e) =>
                          setNewPhone({
                            ...newPhone,
                            display_order: Number(e.target.value),
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 text-sm"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400 transition"
                  >
                    Save Hotline
                  </button>
                </form>
              )}

              {/* Edit Phone Modal / Form */}
              {editingPhone && (
                <form
                  onSubmit={handleUpdatePhone}
                  className="bg-slate-950 p-5 rounded-2xl border border-amber-500/50 space-y-4 animate-fadeIn"
                >
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-black text-amber-400">
                      Edit Hotline: {editingPhone.department_en}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setEditingPhone(null)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">
                        Department (EN)
                      </label>
                      <input
                        value={editingPhone.department_en || ""}
                        onChange={(e) =>
                          setEditingPhone({
                            ...editingPhone,
                            department_en: e.target.value,
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">
                        Department (AM)
                      </label>
                      <input
                        value={editingPhone.department_am || ""}
                        onChange={(e) =>
                          setEditingPhone({
                            ...editingPhone,
                            department_am: e.target.value,
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">
                        Phone Number
                      </label>
                      <input
                        value={editingPhone.phone_number || ""}
                        onChange={(e) =>
                          setEditingPhone({
                            ...editingPhone,
                            phone_number: e.target.value,
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">
                        Telegram Username
                      </label>
                      <input
                        value={editingPhone.telegram_username || ""}
                        onChange={(e) =>
                          setEditingPhone({
                            ...editingPhone,
                            telegram_username: e.target.value,
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">
                        Contact Person Name
                      </label>
                      <input
                        value={editingPhone.contact_person || ""}
                        onChange={(e) =>
                          setEditingPhone({
                            ...editingPhone,
                            contact_person: e.target.value,
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">
                        Display Order
                      </label>
                      <input
                        type="number"
                        value={editingPhone.display_order || 0}
                        onChange={(e) =>
                          setEditingPhone({
                            ...editingPhone,
                            display_order: Number(e.target.value),
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 text-sm"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400 transition"
                  >
                    Update Hotline
                  </button>
                </form>
              )}

              {/* Phones List */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {contactPhones.map((phone) => (
                  <div
                    key={phone.id}
                    className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-white text-sm">
                          {phone.department_en}
                        </h4>
                        <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-semibold">
                          #{phone.display_order}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {phone.department_am}
                      </p>
                      <p className="text-xs text-emerald-400 font-mono font-bold mt-3 flex items-center gap-1.5">
                        <Phone size={14} /> {phone.phone_number}
                      </p>
                      <p className="text-xs text-slate-300 mt-1">
                        Telegram: {phone.telegram_username || "N/A"}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Contact: {phone.contact_person}
                      </p>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() => setEditingPhone(phone)}
                        className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeletePhone(phone.id)}
                        className="py-2 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-semibold transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {contactPhones.length === 0 && (
                  <p className="text-slate-500 text-sm italic col-span-3 text-center py-6">
                    No phone hotlines configured yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* AUTH PAGES TAB */}
        {activeTab === "auth" && (
          <div className="space-y-10 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black text-white flex items-center gap-3">
                  <Lock className="text-amber-400" /> Login & Register Page
                  Management
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  Configure authentication headings, subtitles, and interactive
                  carousel category slides.
                </p>
              </div>
            </div>

            {/* SECTION 1: HEADINGS & SUBTITLES FORM */}
            <form
              onSubmit={handleSaveAuthSettings}
              className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl space-y-6 shadow-xl"
            >
              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-xl font-bold text-amber-400 flex items-center gap-2">
                  <Edit3 size={20} /> Authentication Headings & Subtitles
                </h3>
                <p className="text-slate-400 text-xs mt-1">
                  Customize the titles and subheadings displayed on the Login
                  and Register forms (English & Amharic).
                </p>
              </div>

              {/* Login Page Headings */}
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 space-y-4">
                <h4 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>{" "}
                  Login Page Headings
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      Login Title (English)
                    </label>
                    <input
                      value={authSettings.login_title_en || ""}
                      onChange={(e) =>
                        setAuthSettings({
                          ...authSettings,
                          login_title_en: e.target.value,
                        })
                      }
                      placeholder="e.g. Welcome Back to Injibara Rentals"
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      Login Title (አማርኛ)
                    </label>
                    <input
                      value={authSettings.login_title_am || ""}
                      onChange={(e) =>
                        setAuthSettings({
                          ...authSettings,
                          login_title_am: e.target.value,
                        })
                      }
                      placeholder="ምሳሌ፡ እንኳን ደህና መጡ ወደ እንጅባራ ቤት ኪራይ"
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      Login Subtitle (English)
                    </label>
                    <textarea
                      rows={2}
                      value={authSettings.login_subtitle_en || ""}
                      onChange={(e) =>
                        setAuthSettings({
                          ...authSettings,
                          login_subtitle_en: e.target.value,
                        })
                      }
                      placeholder="e.g. Sign in to access your rental dashboard..."
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      Login Subtitle (አማርኛ)
                    </label>
                    <textarea
                      rows={2}
                      value={authSettings.login_subtitle_am || ""}
                      onChange={(e) =>
                        setAuthSettings({
                          ...authSettings,
                          login_subtitle_am: e.target.value,
                        })
                      }
                      placeholder="ምሳሌ፡ ወደ አካውንትዎ በመግባት የኪራይ አገልግሎቶችን ያስተዳድሩ..."
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Register Page Headings */}
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 space-y-4">
                <h4 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>{" "}
                  Register Page Headings
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      Register Title (English)
                    </label>
                    <input
                      value={authSettings.register_title_en || ""}
                      onChange={(e) =>
                        setAuthSettings({
                          ...authSettings,
                          register_title_en: e.target.value,
                        })
                      }
                      placeholder="e.g. Create an Account"
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      Register Title (አማርኛ)
                    </label>
                    <input
                      value={authSettings.register_title_am || ""}
                      onChange={(e) =>
                        setAuthSettings({
                          ...authSettings,
                          register_title_am: e.target.value,
                        })
                      }
                      placeholder="ምሳሌ፡ አዲስ አካውንት ይፍጠሩ"
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      Register Subtitle (English)
                    </label>
                    <textarea
                      rows={2}
                      value={authSettings.register_subtitle_en || ""}
                      onChange={(e) =>
                        setAuthSettings({
                          ...authSettings,
                          register_subtitle_en: e.target.value,
                        })
                      }
                      placeholder="e.g. Join Injibara House Rentals today..."
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      Register Subtitle (አማርኛ)
                    </label>
                    <textarea
                      rows={2}
                      value={authSettings.register_subtitle_am || ""}
                      onChange={(e) =>
                        setAuthSettings({
                          ...authSettings,
                          register_subtitle_am: e.target.value,
                        })
                      }
                      placeholder="ምሳሌ፡ በእንጅባራ ከተማ ቤቶችን በቀላሉ ለመከራየት..."
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3.5 bg-amber-500 text-slate-950 font-black rounded-2xl hover:bg-amber-400 transition shadow-lg flex items-center justify-center gap-2"
              >
                <Check size={18} /> Save Headings & Subtitles
              </button>
            </form>

            {/* SECTION 2: CAROUSEL SLIDES MANAGEMENT (FULL CRUD) */}
            <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl space-y-6 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <h3 className="text-xl font-bold text-amber-400 flex items-center gap-2">
                    <Grid size={20} /> Auth Carousel Slides ({authSlides.length}
                    )
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">
                    Manage promotional category slides displayed on the Login &
                    Register hero slider panel.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddingAuthSlide(true)}
                  className="px-5 py-3 bg-amber-500 text-slate-950 font-black rounded-2xl hover:bg-amber-400 transition flex items-center gap-2 shadow-lg self-start md:self-auto"
                >
                  <Plus size={18} /> Add New Auth Slide
                </button>
              </div>

              {/* SLIDES GRID */}
              {authSlides.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/50 rounded-2xl border border-dashed border-slate-800 text-slate-400">
                  <p>
                    No carousel slides found. Click "Add New Auth Slide" to
                    create your first slide.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {authSlides.map((slide) => (
                    <div
                      key={slide.id}
                      className={`bg-slate-950 border rounded-2xl overflow-hidden flex flex-col justify-between transition shadow-md ${slide.is_active ? "border-slate-800" : "border-red-900/40 opacity-60"}`}
                    >
                      <div>
                        {/* Slide Image Preview */}
                        <div className="relative h-44 w-full bg-slate-900 overflow-hidden group">
                          <OptimizedImage
                            src={
                              slide.image_url ||
                              "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80"
                            }
                            alt={slide.title_en}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                            width={400}
                            height={176}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                          <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-amber-400 border border-amber-500/30">
                            {slide.badge_en || "Category"}
                          </div>
                          <div className="absolute top-3 right-3 flex items-center gap-1.5">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${slide.is_active ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/20 text-rose-400 border border-rose-500/30"}`}
                            >
                              {slide.is_active ? "Active" : "Hidden"}
                            </span>
                          </div>
                          <div className="absolute bottom-3 left-3 right-3 text-xs text-slate-300 font-medium truncate">
                            Order:{" "}
                            <span className="text-white font-bold">
                              {slide.display_order ?? 0}
                            </span>
                          </div>
                        </div>

                        {/* Slide Content */}
                        <div className="p-4 space-y-2">
                          <div>
                            <h4 className="text-base font-bold text-white leading-tight">
                              {slide.title_en}
                            </h4>
                            <p className="text-xs font-medium text-amber-400 mt-0.5">
                              {slide.title_am}
                            </p>
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-2">
                            {slide.desc_en}
                          </p>
                          <p className="text-xs text-slate-500 line-clamp-2">
                            {slide.desc_am}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="p-4 pt-0 border-t border-slate-900/80 mt-3 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleToggleAuthSlideStatus(slide)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${slide.is_active ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30"}`}
                        >
                          <Eye size={14} /> {slide.is_active ? "Hide" : "Show"}
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingAuthSlide(slide)}
                            className="p-2 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded-xl transition border border-amber-500/20"
                            title="Edit Slide"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteAuthSlide(slide.id)}
                            className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-xl transition border border-rose-500/20"
                            title="Delete Slide"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ADD AUTH SLIDE MODAL */}
            {isAddingAuthSlide && (
              <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-md flex items-start justify-center p-4 pt-20 sm:pt-28 pb-12 overflow-y-auto">
                <div className="bg-slate-900 border border-slate-700 p-6 md:p-8 rounded-3xl w-full max-w-2xl shadow-2xl space-y-6 my-4 animate-fadeIn">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                    <h3 className="text-2xl font-black text-amber-500 flex items-center gap-2">
                      <Plus size={24} /> Add New Carousel Slide
                    </h3>
                    <button
                      onClick={() => setIsAddingAuthSlide(false)}
                      className="text-slate-400 hover:text-white p-1 rounded-lg"
                    >
                      <X size={22} />
                    </button>
                  </div>
                  <form onSubmit={handleAddAuthSlide} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Title (English) *
                        </label>
                        <input
                          required
                          value={newAuthSlide.title_en}
                          onChange={(e) =>
                            setNewAuthSlide({
                              ...newAuthSlide,
                              title_en: e.target.value,
                            })
                          }
                          placeholder="e.g. Residential Homes"
                          className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm focus:border-amber-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Title (አማርኛ) *
                        </label>
                        <input
                          required
                          value={newAuthSlide.title_am}
                          onChange={(e) =>
                            setNewAuthSlide({
                              ...newAuthSlide,
                              title_am: e.target.value,
                            })
                          }
                          placeholder="ምሳሌ፡ ለግል መኖሪያ የሚሆኑ ቤቶች"
                          className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm focus:border-amber-400 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Badge Tag (English)
                        </label>
                        <input
                          value={newAuthSlide.badge_en}
                          onChange={(e) =>
                            setNewAuthSlide({
                              ...newAuthSlide,
                              badge_en: e.target.value,
                            })
                          }
                          placeholder="e.g. 1. Residential"
                          className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm focus:border-amber-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Badge Tag (አማርኛ)
                        </label>
                        <input
                          value={newAuthSlide.badge_am}
                          onChange={(e) =>
                            setNewAuthSlide({
                              ...newAuthSlide,
                              badge_am: e.target.value,
                            })
                          }
                          placeholder="ምሳሌ፡ 1. የመኖሪያ ቤቶች"
                          className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm focus:border-amber-400 focus:outline-none"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Description (English) *
                        </label>
                        <textarea
                          required
                          rows={2}
                          value={newAuthSlide.desc_en}
                          onChange={(e) =>
                            setNewAuthSlide({
                              ...newAuthSlide,
                              desc_en: e.target.value,
                            })
                          }
                          placeholder="Detailed slide description in English..."
                          className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm focus:border-amber-400 focus:outline-none"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Description (አማርኛ) *
                        </label>
                        <textarea
                          required
                          rows={2}
                          value={newAuthSlide.desc_am}
                          onChange={(e) =>
                            setNewAuthSlide({
                              ...newAuthSlide,
                              desc_am: e.target.value,
                            })
                          }
                          placeholder="ዝርዝር መግለጫ በአማርኛ..."
                          className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm focus:border-amber-400 focus:outline-none"
                        />
                      </div>

                      <div className="col-span-2">
                        <ImageSettingInput
                          label="Slide Cover Image URL *"
                          value={newAuthSlide.image_url}
                          onChange={(val) =>
                            setNewAuthSlide({ ...newAuthSlide, image_url: val })
                          }
                          onUpload={uploadImage}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Display Order
                        </label>
                        <input
                          type="number"
                          value={newAuthSlide.display_order}
                          onChange={(e) =>
                            setNewAuthSlide({
                              ...newAuthSlide,
                              display_order: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm focus:border-amber-400 focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-3 pt-6">
                        <input
                          type="checkbox"
                          id="add_active"
                          checked={newAuthSlide.is_active}
                          onChange={(e) =>
                            setNewAuthSlide({
                              ...newAuthSlide,
                              is_active: e.target.checked,
                            })
                          }
                          className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                        />
                        <label
                          htmlFor="add_active"
                          className="text-sm font-bold text-white cursor-pointer"
                        >
                          Set Slide Active
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-slate-800">
                      <button
                        type="submit"
                        className="flex-1 py-3.5 bg-amber-500 text-slate-950 font-black rounded-xl hover:bg-amber-400 transition shadow-lg"
                      >
                        Save & Add Slide
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingAuthSlide(false)}
                        className="px-6 py-3.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* EDIT AUTH SLIDE MODAL */}
            {editingAuthSlide && (
              <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-md flex items-start justify-center p-4 pt-20 sm:pt-28 pb-12 overflow-y-auto">
                <div className="bg-slate-900 border border-slate-700 p-6 md:p-8 rounded-3xl w-full max-w-2xl shadow-2xl space-y-6 my-4 animate-fadeIn">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                    <h3 className="text-2xl font-black text-amber-500 flex items-center gap-2">
                      <Edit3 size={24} /> Edit Carousel Slide
                    </h3>
                    <button
                      onClick={() => setEditingAuthSlide(null)}
                      className="text-slate-400 hover:text-white p-1 rounded-lg"
                    >
                      <X size={22} />
                    </button>
                  </div>
                  <form onSubmit={handleUpdateAuthSlide} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Title (English) *
                        </label>
                        <input
                          required
                          value={editingAuthSlide.title_en || ""}
                          onChange={(e) =>
                            setEditingAuthSlide({
                              ...editingAuthSlide,
                              title_en: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm focus:border-amber-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Title (አማርኛ) *
                        </label>
                        <input
                          required
                          value={editingAuthSlide.title_am || ""}
                          onChange={(e) =>
                            setEditingAuthSlide({
                              ...editingAuthSlide,
                              title_am: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm focus:border-amber-400 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Badge Tag (English)
                        </label>
                        <input
                          value={editingAuthSlide.badge_en || ""}
                          onChange={(e) =>
                            setEditingAuthSlide({
                              ...editingAuthSlide,
                              badge_en: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm focus:border-amber-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Badge Tag (አማርኛ)
                        </label>
                        <input
                          value={editingAuthSlide.badge_am || ""}
                          onChange={(e) =>
                            setEditingAuthSlide({
                              ...editingAuthSlide,
                              badge_am: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm focus:border-amber-400 focus:outline-none"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Description (English) *
                        </label>
                        <textarea
                          required
                          rows={2}
                          value={editingAuthSlide.desc_en || ""}
                          onChange={(e) =>
                            setEditingAuthSlide({
                              ...editingAuthSlide,
                              desc_en: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm focus:border-amber-400 focus:outline-none"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Description (አማርኛ) *
                        </label>
                        <textarea
                          required
                          rows={2}
                          value={editingAuthSlide.desc_am || ""}
                          onChange={(e) =>
                            setEditingAuthSlide({
                              ...editingAuthSlide,
                              desc_am: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm focus:border-amber-400 focus:outline-none"
                        />
                      </div>

                      <div className="col-span-2">
                        <ImageSettingInput
                          label="Slide Cover Image URL *"
                          value={editingAuthSlide.image_url || ""}
                          onChange={(val) =>
                            setEditingAuthSlide({
                              ...editingAuthSlide,
                              image_url: val,
                            })
                          }
                          onUpload={uploadImage}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Display Order
                        </label>
                        <input
                          type="number"
                          value={editingAuthSlide.display_order ?? 0}
                          onChange={(e) =>
                            setEditingAuthSlide({
                              ...editingAuthSlide,
                              display_order: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm focus:border-amber-400 focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-3 pt-6">
                        <input
                          type="checkbox"
                          id="edit_active"
                          checked={Boolean(editingAuthSlide.is_active)}
                          onChange={(e) =>
                            setEditingAuthSlide({
                              ...editingAuthSlide,
                              is_active: e.target.checked ? 1 : 0,
                            })
                          }
                          className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                        />
                        <label
                          htmlFor="edit_active"
                          className="text-sm font-bold text-white cursor-pointer"
                        >
                          Set Slide Active
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-slate-800">
                      <button
                        type="submit"
                        className="flex-1 py-3.5 bg-amber-500 text-slate-950 font-black rounded-xl hover:bg-amber-400 transition shadow-lg"
                      >
                        Update Carousel Slide
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingAuthSlide(null)}
                        className="px-6 py-3.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PROPERTIES / HOUSES TAB */}
        {activeTab === "houses" && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-black text-white">
                  Properties Management
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  Add, review, edit, and delete verified house & property
                  listings.
                </p>
              </div>
              <button
                onClick={() => setIsAddingHouse(true)}
                className="px-5 py-3 bg-amber-500 text-slate-950 font-black rounded-2xl hover:bg-amber-400 transition flex items-center gap-2 shadow-lg"
              >
                <Plus size={18} /> Add Property
              </button>
            </div>

            {/* ADD HOUSE MODAL */}
            {isAddingHouse && (
              <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-md flex items-start justify-center p-4 pt-20 sm:pt-28 pb-12 overflow-y-auto">
                <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl w-full max-w-2xl shadow-2xl space-y-6 my-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black text-amber-500">
                      Add New Property
                    </h3>
                    <button
                      onClick={() => setIsAddingHouse(false)}
                      className="text-slate-400"
                    >
                      <X size={22} />
                    </button>
                  </div>
                  <form onSubmit={handleAddHouse} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-400 mb-1">
                          Property Title
                        </label>
                        <input
                          required
                          value={newHouse.title}
                          onChange={(e) =>
                            setNewHouse({ ...newHouse, title: e.target.value })
                          }
                          placeholder="e.g. Modern Villa in Injibara"
                          className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">
                          Property Type
                        </label>
                        <select
                          value={newHouse.type}
                          onChange={(e) =>
                            setNewHouse({ ...newHouse, type: e.target.value })
                          }
                          className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                        >
                          <option value="Apartment">Apartment</option>
                          <option value="Villa">Villa</option>
                          <option value="Condominium">Condominium</option>
                          <option value="Commercial">Commercial</option>
                          <option value="Studio">Studio</option>
                          <option value="House">House</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">
                          Price per Month (ETB)
                        </label>
                        <input
                          type="number"
                          required
                          value={newHouse.price}
                          onChange={(e) =>
                            setNewHouse({ ...newHouse, price: e.target.value })
                          }
                          placeholder="15000"
                          className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">
                          City / Town
                        </label>
                        <input
                          required
                          value={newHouse.city}
                          onChange={(e) =>
                            setNewHouse({ ...newHouse, city: e.target.value })
                          }
                          placeholder="Injibara"
                          className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">
                          Specific Address / Kebele
                        </label>
                        <input
                          required
                          value={newHouse.address}
                          onChange={(e) =>
                            setNewHouse({
                              ...newHouse,
                              address: e.target.value,
                            })
                          }
                          placeholder="Kebele 01, Near Commercial Bank"
                          className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">
                          Bedrooms / Rooms
                        </label>
                        <input
                          type="number"
                          value={newHouse.rooms}
                          onChange={(e) =>
                            setNewHouse({ ...newHouse, rooms: e.target.value })
                          }
                          className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">
                          Bathrooms
                        </label>
                        <input
                          type="number"
                          value={newHouse.bathrooms}
                          onChange={(e) =>
                            setNewHouse({
                              ...newHouse,
                              bathrooms: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">
                          Listing Status
                        </label>
                        <select
                          value={newHouse.status}
                          onChange={(e) =>
                            setNewHouse({ ...newHouse, status: e.target.value })
                          }
                          className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                        >
                          <option value="Available">Available</option>
                          <option value="Rented">Rented</option>
                          <option value="Pending Approval">
                            Pending Approval
                          </option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">
                          Video URL (Optional)
                        </label>
                        <input
                          value={newHouse.video_url}
                          onChange={(e) =>
                            setNewHouse({
                              ...newHouse,
                              video_url: e.target.value,
                            })
                          }
                          placeholder="https://..."
                          className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <ImageSettingInput
                          label="Property Image"
                          value={newHouse.image_url}
                          onChange={(val) =>
                            setNewHouse({ ...newHouse, image_url: val })
                          }
                          onUpload={uploadImage}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-400 mb-1">
                          Description
                        </label>
                        <textarea
                          rows={3}
                          value={newHouse.description}
                          onChange={(e) =>
                            setNewHouse({
                              ...newHouse,
                              description: e.target.value,
                            })
                          }
                          placeholder="Detailed property description..."
                          className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button
                        type="submit"
                        className="flex-1 py-3.5 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400 transition"
                      >
                        Publish Property
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingHouse(false)}
                        className="px-6 py-3.5 bg-slate-800 text-white font-bold rounded-xl"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* EDIT HOUSE MODAL */}
            {editingHouse && (
              <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-md flex items-start justify-center p-4 pt-20 sm:pt-28 pb-12 overflow-y-auto">
                <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl w-full max-w-2xl shadow-2xl space-y-6 my-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black text-amber-500">
                      Edit Property Details
                    </h3>
                    <button
                      onClick={() => setEditingHouse(null)}
                      className="text-slate-400"
                    >
                      <X size={22} />
                    </button>
                  </div>
                  <form onSubmit={handleUpdateHouse} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-400 mb-1">
                          Property Title
                        </label>
                        <input
                          required
                          value={editingHouse.title || ""}
                          onChange={(e) =>
                            setEditingHouse({
                              ...editingHouse,
                              title: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">
                          Property Type
                        </label>
                        <select
                          value={editingHouse.type || "Apartment"}
                          onChange={(e) =>
                            setEditingHouse({
                              ...editingHouse,
                              type: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                        >
                          <option value="Apartment">Apartment</option>
                          <option value="Villa">Villa</option>
                          <option value="Condominium">Condominium</option>
                          <option value="Commercial">Commercial</option>
                          <option value="Studio">Studio</option>
                          <option value="House">House</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">
                          Price per Month (ETB)
                        </label>
                        <input
                          type="number"
                          required
                          value={editingHouse.price || ""}
                          onChange={(e) =>
                            setEditingHouse({
                              ...editingHouse,
                              price: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">
                          City / Town
                        </label>
                        <input
                          required
                          value={editingHouse.city || ""}
                          onChange={(e) =>
                            setEditingHouse({
                              ...editingHouse,
                              city: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">
                          Specific Address / Kebele
                        </label>
                        <input
                          required
                          value={editingHouse.address || ""}
                          onChange={(e) =>
                            setEditingHouse({
                              ...editingHouse,
                              address: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">
                          Bedrooms / Rooms
                        </label>
                        <input
                          type="number"
                          value={editingHouse.rooms || 1}
                          onChange={(e) =>
                            setEditingHouse({
                              ...editingHouse,
                              rooms: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">
                          Bathrooms
                        </label>
                        <input
                          type="number"
                          value={editingHouse.bathrooms || 1}
                          onChange={(e) =>
                            setEditingHouse({
                              ...editingHouse,
                              bathrooms: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">
                          Listing Status
                        </label>
                        <select
                          value={editingHouse.status || "Available"}
                          onChange={(e) =>
                            setEditingHouse({
                              ...editingHouse,
                              status: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                        >
                          <option value="Available">Available</option>
                          <option value="Rented">Rented</option>
                          <option value="Pending Approval">
                            Pending Approval
                          </option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">
                          Video URL
                        </label>
                        <input
                          value={editingHouse.video_url || ""}
                          onChange={(e) =>
                            setEditingHouse({
                              ...editingHouse,
                              video_url: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <ImageSettingInput
                          label="Property Image"
                          value={editingHouse.image_url || ""}
                          onChange={(val) =>
                            setEditingHouse({ ...editingHouse, image_url: val })
                          }
                          onUpload={uploadImage}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-400 mb-1">
                          Description
                        </label>
                        <textarea
                          rows={3}
                          value={editingHouse.description || ""}
                          onChange={(e) =>
                            setEditingHouse({
                              ...editingHouse,
                              description: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button
                        type="submit"
                        className="flex-1 py-3.5 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400 transition"
                      >
                        Update Property
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingHouse(null)}
                        className="px-6 py-3.5 bg-slate-800 text-white font-bold rounded-xl"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* HOUSES LIST GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {houses.map((house, index) => {
                const houseId = house.house_id || house.id;
                return (
                  <div
                    key={houseId || index}
                    className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative">
                        <OptimizedImage
                          src={
                            house.image_url ||
                            "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00"
                          }
                          alt={house.title}
                          className="w-full h-48 object-cover"
                          width={400}
                          height={192}
                        />
                        <span
                          className={`absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full ${
                            house.status === "Available"
                              ? "bg-emerald-500/90 text-white"
                              : house.status === "Rented"
                                ? "bg-red-500/90 text-white"
                                : "bg-amber-500/90 text-slate-950"
                          }`}
                        >
                          {house.status || "Available"}
                        </span>
                      </div>
                      <div className="p-5 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-bold">
                            {house.type}
                          </span>
                          <span className="text-emerald-400 font-black">
                            {house.price?.toLocaleString()} ETB
                          </span>
                        </div>
                        <h4 className="text-white font-bold text-base">
                          {house.title}
                        </h4>
                        <p className="text-slate-400 text-xs">
                          {house.address || `${house.city || "Injibara"}`}
                        </p>
                      </div>
                    </div>
                    <div className="p-5 pt-0 flex justify-end gap-2 border-t border-slate-800/60 mt-4">
                      <button
                        onClick={() => setEditingHouse(house)}
                        className="px-3.5 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold hover:bg-amber-500/20 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteHouse(houseId)}
                        className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold hover:bg-red-500/20 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MEDIA LIBRARY TAB */}
        {activeTab === "media" && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h1 className="text-3xl font-black text-white">
                Media Library
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Manage images and videos for any property by entering its House ID.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl space-y-6 shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    House ID
                  </label>
                  <input
                    type="number"
                    value={mediaHouseId}
                    onChange={(e) => setMediaHouseId(e.target.value)}
                    placeholder="Enter house ID (e.g. 12)"
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <button
                    onClick={handleLoadMediaForHouse}
                    disabled={mediaLoading}
                    className="w-full py-3 bg-amber-500 text-slate-950 font-black rounded-xl hover:bg-amber-400 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {mediaLoading ? "Loading..." : "Load Media"}
                  </button>
                </div>
              </div>

              {mediaMessage && (
                <div className={`p-3 rounded-xl text-xs font-bold ${mediaMessage.includes("Failed") || mediaMessage.includes("Please") ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}`}>
                  {mediaMessage}
                </div>
              )}

              {mediaHouseId && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Images Section */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">
                        Images ({mediaHouseImages.length})
                      </h3>
                      <label className="cursor-pointer bg-amber-500 text-slate-950 text-xs font-black px-3 py-1.5 rounded-lg hover:bg-amber-400 transition">
                        + Add Images
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files.length > 0) {
                              handleAddMediaImages(Array.from(e.target.files));
                              e.target.value = "";
                            }
                          }}
                        />
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {mediaHouseImages.map((img) => (
                        <div key={img.image_id} className="relative group bg-slate-900 border border-slate-800 rounded-xl overflow-hidden aspect-square">
                          <img
                            src={img.image_url.startsWith("http") ? img.image_url : `http://localhost:5000${img.image_url}`}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSetPrimaryImage(img.image_id)}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black transition ${img.is_primary ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-white hover:bg-slate-700"}`}
                              >
                                {img.is_primary ? "Primary" : "Set Primary"}
                              </button>
                              <button
                                onClick={() => handleDeleteMediaImage(img.image_id)}
                                className="px-2.5 py-1.5 bg-red-500 text-white rounded-lg text-[10px] font-black hover:bg-red-400 transition"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          {img.is_primary && (
                            <div className="absolute top-2 left-2 px-2 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-black rounded-lg uppercase tracking-wider">
                              Primary
                            </div>
                          )}
                        </div>
                      ))}
                      {mediaHouseImages.length === 0 && (
                        <div className="col-span-full text-center text-slate-500 text-xs py-8">
                          No images yet. Upload images using the button above.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Videos Section */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">
                        Videos ({mediaHouseVideos.length})
                      </h3>
                      <label className="cursor-pointer bg-amber-500 text-slate-950 text-xs font-black px-3 py-1.5 rounded-lg hover:bg-amber-400 transition">
                        + Add Video
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files[0]) {
                              handleAddMediaVideo(e.target.files[0]);
                              e.target.value = "";
                            }
                          }}
                        />
                      </label>
                    </div>
                    <div className="space-y-3">
                      {mediaHouseVideos.map((vid) => (
                        <div key={vid.video_id} className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
                          <div className="w-16 h-16 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 border border-amber-500/30 shrink-0">
                            <Play className="w-6 h-6 fill-amber-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">
                              {vid.video_type === "upload" ? "Uploaded Video" : vid.video_type}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {vid.video_url}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteMediaVideo(vid.video_id)}
                            className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition shrink-0"
                            title="Delete video"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      {mediaHouseVideos.length === 0 && (
                        <div className="text-center text-slate-500 text-xs py-8">
                          No videos yet. Upload a video using the button above.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CATEGORIES TAB */}
        {activeTab === "categories" && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h1 className="text-3xl font-black text-white">
                Property Categories Management
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Create, view, update, and delete property classification
                categories.
              </p>
            </div>

            <form
              onSubmit={
                editingCategory ? handleUpdateCategory : handleAddCategory
              }
              className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl"
            >
              <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                <Folder size={20} />{" "}
                {editingCategory ? "Edit Category" : "Add New Category"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Category Name (English)
                  </label>
                  <input
                    required
                    value={
                      editingCategory ? editingCategory.name : newCategory.name
                    }
                    onChange={(e) =>
                      editingCategory
                        ? setEditingCategory({
                            ...editingCategory,
                            name: e.target.value,
                          })
                        : setNewCategory({
                            ...newCategory,
                            name: e.target.value,
                          })
                    }
                    placeholder="e.g. Commercial Space"
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Category Name (Amharic)
                  </label>
                  <input
                    value={
                      editingCategory
                        ? editingCategory.name_am || ""
                        : newCategory.name_am
                    }
                    onChange={(e) =>
                      editingCategory
                        ? setEditingCategory({
                            ...editingCategory,
                            name_am: e.target.value,
                          })
                        : setNewCategory({
                            ...newCategory,
                            name_am: e.target.value,
                          })
                    }
                    placeholder="e.g. የንግድ ቦታዎች"
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                  />
                </div>
                <div>
                  <ImageSettingInput
                    label="Category Image"
                    value={
                      editingCategory
                        ? editingCategory.image_url
                        : newCategory.image_url
                    }
                    onChange={(val) =>
                      editingCategory
                        ? setEditingCategory({
                            ...editingCategory,
                            image_url: val,
                          })
                        : setNewCategory({ ...newCategory, image_url: val })
                    }
                    onUpload={uploadImage}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Description (English)
                  </label>
                  <textarea
                    value={
                      editingCategory
                        ? editingCategory.description || ""
                        : newCategory.description
                    }
                    onChange={(e) =>
                      editingCategory
                        ? setEditingCategory({
                            ...editingCategory,
                            description: e.target.value,
                          })
                        : setNewCategory({
                            ...newCategory,
                            description: e.target.value,
                          })
                    }
                    placeholder="Brief description for homepage..."
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Description (Amharic)
                  </label>
                  <textarea
                    value={
                      editingCategory
                        ? editingCategory.description_am || ""
                        : newCategory.description_am
                    }
                    onChange={(e) =>
                      editingCategory
                        ? setEditingCategory({
                            ...editingCategory,
                            description_am: e.target.value,
                          })
                        : setNewCategory({
                            ...newCategory,
                            description_am: e.target.value,
                          })
                    }
                    placeholder="መግለጫ በአማርኛ..."
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm font-amharic"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Sub-title Size (Tailwind Class)
                  </label>
                  <input
                    type="text"
                    value={
                      editingCategory
                        ? editingCategory.font_size || ""
                        : newCategory.font_size
                    }
                    onChange={(e) =>
                      editingCategory
                        ? setEditingCategory({
                            ...editingCategory,
                            font_size: e.target.value,
                          })
                        : setNewCategory({
                            ...newCategory,
                            font_size: e.target.value,
                          })
                    }
                    placeholder="e.text-4xl md:text-6xl"
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Example: text-3xl md:text-5xl font-black
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                {editingCategory ? (
                  <>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400 transition"
                    >
                      Update Category
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCategory(null)}
                      className="px-6 py-3 bg-slate-800 text-white font-bold rounded-xl"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="submit"
                    className="w-full py-3 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400 transition"
                  >
                    + Add Category
                  </button>
                )}
              </div>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {categories.map((cat, index) => (
                <div
                  key={cat.id || index}
                  className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-md"
                >
                  <div className="flex items-center gap-3">
                    {cat.image_url ? (
                      <OptimizedImage
                        src={cat.image_url}
                        alt=""
                        className="w-12 h-12 rounded-xl object-cover"
                        width={48}
                        height={48}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400 font-bold">
                        {cat.name?.[0]}
                      </div>
                    )}
                    <div>
                      <span className="font-bold text-white block">
                        {cat.name}
                      </span>
                      {cat.name_am && (
                        <span className="text-xs text-amber-400/80 font-amharic">
                          {cat.name_am}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingCategory(cat)}
                      className="px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold hover:bg-amber-500/20 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* USER MANAGEMENT TAB */}
        {activeTab === "users" &&
          (() => {
            const filteredUsers = usersList.filter((u) => {
              const query = userSearchQuery.toLowerCase();
              const matchesSearch =
                !query ||
                (u.name && u.name.toLowerCase().includes(query)) ||
                (u.email && u.email.toLowerCase().includes(query)) ||
                (u.phone && u.phone.toLowerCase().includes(query)) ||
                (u.city && u.city.toLowerCase().includes(query));
              const matchesRole =
                userRoleFilter === "ALL" || u.role === userRoleFilter;
              return matchesSearch && matchesRole;
            });

            return (
              <div className="space-y-8 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-black text-white">
                      User Accounts & Admin Management
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                      Manage, edit, create, and assign roles for all registered
                      accounts.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAddingUser(true)}
                    className="px-5 py-3 bg-amber-500 text-slate-950 font-black rounded-2xl hover:bg-amber-400 transition flex items-center gap-2 shadow-lg"
                  >
                    <Plus size={18} /> Add New User
                  </button>
                </div>

                {/* SEARCH & FILTER BAR */}
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-md">
                  <div className="w-full md:w-1/2">
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      placeholder="Search accounts by name, email, phone, or city..."
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
                    <span className="text-xs font-bold text-slate-400 uppercase">
                      Role:
                    </span>
                    {["ALL", "Admin", "Landlord", "Tenant", "Broker"].map(
                      (role) => (
                        <button
                          key={role}
                          onClick={() => setUserRoleFilter(role)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${
                            userRoleFilter === role
                              ? "bg-amber-500 text-slate-950 shadow-md"
                              : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                          }`}
                        >
                          {role}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                {/* ADD USER MODAL */}
                {isAddingUser && (
                  <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-md flex items-start justify-center p-4 pt-20 sm:pt-28 pb-12 overflow-y-auto">
                    <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl w-full max-w-xl shadow-2xl space-y-6 my-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-black text-amber-500">
                          Create New User Account
                        </h3>
                        <button
                          onClick={() => setIsAddingUser(false)}
                          className="text-slate-400"
                        >
                          <X size={22} />
                        </button>
                      </div>
                      <form onSubmit={handleAddUser} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-400 mb-1">
                            Full Name
                          </label>
                          <input
                            required
                            value={newUser.name}
                            onChange={(e) =>
                              setNewUser({ ...newUser, name: e.target.value })
                            }
                            placeholder="Full Name"
                            className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1">
                              Email Address
                            </label>
                            <input
                              type="email"
                              required
                              value={newUser.email}
                              onChange={(e) =>
                                setNewUser({
                                  ...newUser,
                                  email: e.target.value,
                                })
                              }
                              placeholder="Email Address"
                              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1">
                              Phone Number
                            </label>
                            <input
                              required
                              value={newUser.phone}
                              onChange={(e) =>
                                setNewUser({
                                  ...newUser,
                                  phone: e.target.value,
                                })
                              }
                              placeholder="+251..."
                              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1">
                              Password
                            </label>
                            <input
                              type="password"
                              required
                              value={newUser.password}
                              onChange={(e) =>
                                setNewUser({
                                  ...newUser,
                                  password: e.target.value,
                                })
                              }
                              placeholder="Password"
                              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1">
                              Account Role
                            </label>
                            <select
                              value={newUser.role}
                              onChange={(e) =>
                                setNewUser({ ...newUser, role: e.target.value })
                              }
                              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                            >
                              <option value="Tenant">Tenant</option>
                              <option value="Landlord">Landlord</option>
                              <option value="Broker">Broker</option>
                              <option value="Admin">Admin</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1">
                              City
                            </label>
                            <input
                              value={newUser.city}
                              onChange={(e) =>
                                setNewUser({ ...newUser, city: e.target.value })
                              }
                              placeholder="Injibara"
                              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1">
                              Region
                            </label>
                            <input
                              value={newUser.region}
                              onChange={(e) =>
                                setNewUser({
                                  ...newUser,
                                  region: e.target.value,
                                })
                              }
                              placeholder="Amhara"
                              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                            />
                          </div>
                        </div>
                        <div className="flex gap-4 pt-4">
                          <button
                            type="submit"
                            className="flex-1 py-3.5 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400 transition"
                          >
                            Create User Account
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsAddingUser(false)}
                            className="px-6 py-3.5 bg-slate-800 text-white font-bold rounded-xl"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* EDIT USER MODAL (PRE-FILLED WITH CURRENT DATA) */}
                {editingUser && (
                  <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-md flex items-start justify-center p-4 pt-20 sm:pt-28 pb-12 overflow-y-auto">
                    <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl w-full max-w-xl shadow-2xl space-y-6 my-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-black text-amber-500">
                          Edit User Account
                        </h3>
                        <button
                          onClick={() => setEditingUser(null)}
                          className="text-slate-400"
                        >
                          <X size={22} />
                        </button>
                      </div>
                      <form onSubmit={handleUpdateUser} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-400 mb-1">
                            Full Name
                          </label>
                          <input
                            required
                            value={editingUser.name || ""}
                            onChange={(e) =>
                              setEditingUser({
                                ...editingUser,
                                name: e.target.value,
                              })
                            }
                            className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1">
                              Email Address
                            </label>
                            <input
                              type="email"
                              required
                              value={editingUser.email || ""}
                              onChange={(e) =>
                                setEditingUser({
                                  ...editingUser,
                                  email: e.target.value,
                                })
                              }
                              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1">
                              Phone Number
                            </label>
                            <input
                              required
                              value={editingUser.phone || ""}
                              onChange={(e) =>
                                setEditingUser({
                                  ...editingUser,
                                  phone: e.target.value,
                                })
                              }
                              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1">
                              Account Role
                            </label>
                            <select
                              value={editingUser.role || "Tenant"}
                              onChange={(e) =>
                                setEditingUser({
                                  ...editingUser,
                                  role: e.target.value,
                                })
                              }
                              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                            >
                              <option value="Tenant">Tenant</option>
                              <option value="Landlord">Landlord</option>
                              <option value="Broker">Broker</option>
                              <option value="Admin">Admin</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1">
                              New Password (Optional)
                            </label>
                            <input
                              type="password"
                              value={editingUser.password || ""}
                              onChange={(e) =>
                                setEditingUser({
                                  ...editingUser,
                                  password: e.target.value,
                                })
                              }
                              placeholder="Leave blank to keep same"
                              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1">
                              City
                            </label>
                            <input
                              value={editingUser.city || "Injibara"}
                              onChange={(e) =>
                                setEditingUser({
                                  ...editingUser,
                                  city: e.target.value,
                                })
                              }
                              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1">
                              Region
                            </label>
                            <input
                              value={editingUser.region || "Amhara"}
                              onChange={(e) =>
                                setEditingUser({
                                  ...editingUser,
                                  region: e.target.value,
                                })
                              }
                              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                            />
                          </div>
                        </div>
                        <div className="flex gap-4 pt-4">
                          <button
                            type="submit"
                            className="flex-1 py-3.5 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400 transition"
                          >
                            Update User Account
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingUser(null)}
                            className="px-6 py-3.5 bg-slate-800 text-white font-bold rounded-xl"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* USERS TABLE */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                  <div className="p-4 border-b border-slate-800 flex justify-between items-center text-xs text-slate-400 font-bold">
                    <span>
                      Showing {filteredUsers.length} of {usersList.length} users
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-xs uppercase">
                          <th className="p-4">User</th>
                          <th className="p-4">Contact</th>
                          <th className="p-4">Location</th>
                          <th className="p-4">Role</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-sm">
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="p-8 text-center text-slate-500"
                            >
                              No user accounts matched your search criteria.
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((u, index) => {
                            const userId = u.user_id || u.id;
                            return (
                              <tr
                                key={userId || index}
                                className="hover:bg-slate-800/50 transition"
                              >
                                <td className="p-4">
                                  <div className="font-bold text-white text-base">
                                    {u.name}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    ID: #{userId}
                                  </div>
                                </td>
                                <td className="p-4 space-y-0.5">
                                  <div className="text-slate-300 font-medium text-xs">
                                    {u.email}
                                  </div>
                                  <div className="text-amber-400 font-mono text-xs">
                                    {u.phone}
                                  </div>
                                </td>
                                <td className="p-4 text-slate-300 text-xs">
                                  {u.city || "Injibara"}
                                  {u.region ? `, ${u.region}` : ""}
                                </td>
                                <td className="p-4">
                                  <select
                                    value={u.role}
                                    onChange={(e) =>
                                      handleUpdateUserRole(
                                        userId,
                                        e.target.value,
                                      )
                                    }
                                    className={`font-bold rounded-xl py-1.5 px-3 text-xs border ${
                                      u.role === "Admin"
                                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                        : u.role === "Landlord"
                                          ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                                          : u.role === "Broker"
                                            ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                                            : "bg-slate-950 text-slate-300 border-slate-700"
                                    }`}
                                  >
                                    <option
                                      value="Tenant"
                                      className="bg-slate-900 text-white"
                                    >
                                      Tenant
                                    </option>
                                    <option
                                      value="Landlord"
                                      className="bg-slate-900 text-white"
                                    >
                                      Landlord
                                    </option>
                                    <option
                                      value="Broker"
                                      className="bg-slate-900 text-white"
                                    >
                                      Broker
                                    </option>
                                    <option
                                      value="Admin"
                                      className="bg-slate-900 text-white"
                                    >
                                      Admin
                                    </option>
                                  </select>
                                </td>
                                <td className="p-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => setEditingUser(u)}
                                      className="px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold hover:bg-amber-500/20 transition flex items-center gap-1"
                                    >
                                      <Edit3 size={14} /> Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteUser(userId)}
                                      className="p-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/20 transition"
                                      title="Delete User"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

        {/* TENANT & BROKER CHATS TAB */}
        {activeTab === "chats" && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h1 className="text-3xl font-black text-white">
                Tenant, Landlord & Broker Chats
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Monitor and inspect communication threads across the platform.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3 max-h-[600px] overflow-y-auto">
                <h3 className="font-bold text-white px-2">
                  Conversations ({adminConversations.length})
                </h3>
                {adminConversations.map((pair, index) => (
                  <button
                    key={index}
                    onClick={() => fetchAdminThread(pair)}
                    className={`w-full text-left p-3 rounded-2xl transition border ${
                      selectedAdminPair === pair
                        ? "bg-amber-500/10 border-amber-500/40"
                        : "bg-slate-950 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="font-bold text-white text-sm">
                      {pair.user1.name} & {pair.user2.name}
                    </div>
                    <div className="text-xs text-slate-400 mt-1 truncate">
                      {pair.last_message || "No messages"}
                    </div>
                  </button>
                ))}
              </div>

              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col h-[600px]">
                {selectedAdminPair ? (
                  <>
                    <div className="pb-4 border-b border-slate-800 mb-4">
                      <h3 className="font-bold text-white text-lg">
                        {selectedAdminPair.user1.name} &{" "}
                        {selectedAdminPair.user2.name}
                      </h3>
                      <p className="text-xs text-slate-400">
                        Inspection Thread
                      </p>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                      {adminThreadMessages.map((msg, index) => (
                        <div
                          key={index}
                          className="bg-slate-950 border border-slate-800 p-4 rounded-2xl"
                        >
                          <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                            <span className="font-bold text-amber-400">
                              {msg.sender_name}
                            </span>
                            <span>
                              {new Date(msg.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-white text-sm">{msg.message}</p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                    Select a conversation thread to inspect messages.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* AI CHAT LOGS TAB */}
        {activeTab === "ai_logs" &&
          (() => {
            const unreadCount = aiLogs.filter((l) => !l.is_read).length;
            const securityAlertsCount = aiLogs.filter((l) =>
              checkSecurityRisk(l.prompt || l.user_message),
            ).length;

            // Filtering
            const filteredLogs = aiLogs.filter((log) => {
              const promptText = log.prompt || log.user_message || "";
              const isSecurity = checkSecurityRisk(promptText);

              // Filter status
              let matchesFilter = true;
              if (aiLogFilter === "unread") matchesFilter = !log.is_read;
              else if (aiLogFilter === "read") matchesFilter = log.is_read;
              else if (aiLogFilter === "security") matchesFilter = isSecurity;

              // Search query
              const q = aiLogSearch.toLowerCase();
              const matchesQuery =
                !q ||
                (log.user_name && log.user_name.toLowerCase().includes(q)) ||
                (log.user_email && log.user_email.toLowerCase().includes(q)) ||
                promptText.toLowerCase().includes(q) ||
                (log.response && log.response.toLowerCase().includes(q));

              return matchesFilter && matchesQuery;
            });

            return (
              <div className="space-y-8 animate-fadeIn">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3">
                      <Bot className="text-amber-400" /> AI Assistant Chat Logs
                      & Inquiries
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                      Review inquiries handled by the Injibara AI Assistant,
                      monitor security-sensitive questions, and clear unread
                      logs.
                    </p>
                  </div>

                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAiLogsRead}
                      className="px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold rounded-2xl transition flex items-center gap-2 self-start sm:self-auto text-xs"
                    >
                      <CheckCheck size={16} /> Mark All as Read ({unreadCount})
                    </button>
                  )}
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">
                        Total AI Interactions
                      </p>
                      <p className="text-2xl font-black text-white mt-1">
                        {aiLogs.length}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
                      <Bot size={24} />
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">
                        Unread Logs
                      </p>
                      <p
                        className={`text-2xl font-black mt-1 ${unreadCount > 0 ? "text-amber-400" : "text-emerald-400"}`}
                      >
                        {unreadCount} {unreadCount === 0 ? "✓" : ""}
                      </p>
                    </div>
                    <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
                      <MessageSquare size={24} />
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">
                        Security Flagged Questions
                      </p>
                      <p
                        className={`text-2xl font-black mt-1 ${securityAlertsCount > 0 ? "text-rose-400" : "text-slate-400"}`}
                      >
                        {securityAlertsCount}
                      </p>
                    </div>
                    <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
                      <ShieldAlert size={24} />
                    </div>
                  </div>
                </div>

                {/* Controls: Search & Filters */}
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="relative w-full md:w-96">
                    <Search
                      size={18}
                      className="absolute left-3.5 top-3.5 text-slate-500"
                    />
                    <input
                      type="text"
                      value={aiLogSearch}
                      onChange={(e) => setAiLogSearch(e.target.value)}
                      placeholder="Search logs by question, user name or keyword..."
                      className="w-full bg-slate-950 border border-slate-800 text-white text-sm rounded-xl pl-10 pr-4 py-2.5 focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                    <span className="text-xs text-slate-400 font-bold flex items-center gap-1 shrink-0">
                      <Filter size={14} /> View:
                    </span>
                    {[
                      { id: "all", label: `All (${aiLogs.length})` },
                      { id: "unread", label: `Unread (${unreadCount})` },
                      {
                        id: "security",
                        label: `Security Risks (${securityAlertsCount})`,
                      },
                      { id: "read", label: "Read" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setAiLogFilter(tab.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                          aiLogFilter === tab.id
                            ? "bg-amber-500 text-slate-950 shadow-md"
                            : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chat Log Items */}
                {filteredLogs.length === 0 ? (
                  <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl text-slate-400">
                    <Bot size={40} className="mx-auto text-slate-600 mb-3" />
                    <p className="text-base font-bold text-slate-300">
                      No AI chat logs found.
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Try changing your search keywords or filter tab.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredLogs.map((log, index) => {
                      const promptText = log.prompt || log.user_message || "";
                      const isSecurityRisk = checkSecurityRisk(promptText);

                      return (
                        <div
                          key={log.id || index}
                          className={`bg-slate-900 border p-5 rounded-2xl space-y-3 shadow-md transition ${
                            isSecurityRisk
                              ? "border-rose-500/50 bg-slate-900/90"
                              : !log.is_read
                                ? "border-amber-500/40 bg-slate-900"
                                : "border-slate-800"
                          }`}
                        >
                          {/* Header info & Badges */}
                          <div className="flex flex-wrap justify-between items-center gap-2 text-xs border-b border-slate-800/80 pb-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-amber-400 text-sm">
                                {log.user_name || "Guest User"}
                              </span>
                              {log.user_email && (
                                <span className="text-slate-500">
                                  ({log.user_email})
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Security Risk Indicator Badge */}
                              {isSecurityRisk && (
                                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 font-black text-[11px] flex items-center gap-1 animate-pulse">
                                  <ShieldAlert size={12} /> Security Alert /
                                  የደህንነት ጥያቄ
                                </span>
                              )}

                              {/* Unread Status Badge */}
                              {!log.is_read ? (
                                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 font-black text-[10px] uppercase tracking-wider flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                                  New / Unread
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-semibold">
                                  Read
                                </span>
                              )}

                              <span className="text-slate-500">
                                {new Date(log.created_at).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          {/* Question / Prompt Box */}
                          <div
                            className={`p-3.5 rounded-xl border text-sm text-white ${
                              isSecurityRisk
                                ? "bg-rose-950/20 border-rose-500/30"
                                : "bg-slate-950 border-slate-800"
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <span className="font-bold text-slate-400 shrink-0">
                                Q:
                              </span>
                              <p className="flex-1 text-slate-100">
                                {promptText}
                              </p>
                            </div>
                          </div>

                          {/* AI Response Box */}
                          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 text-sm text-slate-300">
                            <div className="flex items-start gap-2">
                              <span className="font-bold text-amber-400 shrink-0">
                                AI:
                              </span>
                              <p className="flex-1 text-slate-300 whitespace-pre-wrap">
                                {log.response || log.ai_response}
                              </p>
                            </div>
                          </div>

                          {/* Footer Actions */}
                          <div className="flex justify-between items-center pt-1 border-t border-slate-800/60 text-xs">
                            <div className="text-slate-500 text-[11px]">
                              {isSecurityRisk ? (
                                <span className="text-rose-400 font-semibold flex items-center gap-1">
                                  <AlertTriangle size={12} /> Contains
                                  credentials or security query
                                </span>
                              ) : (
                                <span>Standard User Inquiry</span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {!log.is_read && (
                                <button
                                  onClick={() => handleMarkAiLogRead(log.id)}
                                  className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg font-bold text-xs transition flex items-center gap-1"
                                >
                                  <Check size={13} /> Mark as Read
                                </button>
                              )}

                              <button
                                onClick={() => handleDeleteAiLog(log.id)}
                                className="p-1.5 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition border border-slate-700 hover:border-rose-500/30"
                                title="Delete Log"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

        {/* PAYMENTS TAB */}
        {activeTab === "payments" &&
          (() => {
            // Filtered payments calculation
            const filteredPayments = payments.filter((p) => {
              const matchesStatus =
                paymentFilter === "all" ||
                (p.status || "Pending").toLowerCase() ===
                  paymentFilter.toLowerCase();
              const query = paymentSearch.toLowerCase();
              const matchesQuery =
                !query ||
                (p.user_name && p.user_name.toLowerCase().includes(query)) ||
                (p.user_email && p.user_email.toLowerCase().includes(query)) ||
                (p.transaction_ref &&
                  p.transaction_ref.toLowerCase().includes(query)) ||
                (p.transaction_reference &&
                  p.transaction_reference.toLowerCase().includes(query)) ||
                (p.payment_method &&
                  p.payment_method.toLowerCase().includes(query)) ||
                (p.ad_type && p.ad_type.toLowerCase().includes(query));
              return matchesStatus && matchesQuery;
            });

            const totalRevenue = payments
              .filter((p) => p.status === "Approved")
              .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

            const pendingCount = payments.filter(
              (p) => p.status === "Pending",
            ).length;
            const approvedCount = payments.filter(
              (p) => p.status === "Approved",
            ).length;

            return (
              <div className="space-y-8 animate-fadeIn">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3">
                      <CreditCard className="text-amber-400" /> Payment &
                      Receipt Management
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                      Verify bank receipts, manage ad promotion payments,
                      generate printable transaction receipts, and track
                      revenue.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAddingPayment(true)}
                    className="px-5 py-3 bg-amber-500 text-slate-950 font-black rounded-2xl hover:bg-amber-400 transition flex items-center gap-2 shadow-lg self-start sm:self-auto"
                  >
                    <Plus size={18} /> Record New Payment
                  </button>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">
                        Total Payments
                      </p>
                      <p className="text-2xl font-black text-white mt-1">
                        {payments.length}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
                      <Receipt size={24} />
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">
                        Pending Review
                      </p>
                      <p className="text-2xl font-black text-amber-400 mt-1">
                        {pendingCount}
                      </p>
                    </div>
                    <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
                      <AlertCircle size={24} />
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">
                        Approved Payments
                      </p>
                      <p className="text-2xl font-black text-emerald-400 mt-1">
                        {approvedCount}
                      </p>
                    </div>
                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                      <CheckCircle size={24} />
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">
                        Total Revenue (ETB)
                      </p>
                      <p className="text-2xl font-black text-amber-400 mt-1">
                        {totalRevenue.toLocaleString()} ETB
                      </p>
                    </div>
                    <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
                      <DollarSign size={24} />
                    </div>
                  </div>
                </div>

                {/* Controls: Search & Filters */}
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="relative w-full md:w-96">
                    <Search
                      size={18}
                      className="absolute left-3.5 top-3.5 text-slate-500"
                    />
                    <input
                      type="text"
                      value={paymentSearch}
                      onChange={(e) => setPaymentSearch(e.target.value)}
                      placeholder="Search by payer, ref #, bank or ad..."
                      className="w-full bg-slate-950 border border-slate-800 text-white text-sm rounded-xl pl-10 pr-4 py-2.5 focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                    <span className="text-xs text-slate-400 font-bold flex items-center gap-1 shrink-0">
                      <Filter size={14} /> Filter:
                    </span>
                    {["all", "Pending", "Approved", "Rejected"].map(
                      (status) => (
                        <button
                          key={status}
                          onClick={() => setPaymentFilter(status)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition capitalize shrink-0 ${
                            paymentFilter === status
                              ? "bg-amber-500 text-slate-950 shadow-md"
                              : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                          }`}
                        >
                          {status}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                {/* Payments Table / Card List */}
                {filteredPayments.length === 0 ? (
                  <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl text-slate-400">
                    <Receipt
                      size={40}
                      className="mx-auto text-slate-600 mb-3"
                    />
                    <p className="text-base font-bold text-slate-300">
                      No payment records found.
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Try adjusting your search or filter options.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredPayments.map((p) => {
                      const refNum =
                        p.transaction_ref || p.transaction_reference || "N/A";
                      const receiptUrl = p.receipt_url || p.receipt_image_url;

                      return (
                        <div
                          key={p.id}
                          className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 hover:border-slate-700 transition shadow-lg"
                        >
                          <div className="space-y-2 flex-1">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="font-black text-white text-lg">
                                {p.user_name || "Anonymous User"}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold">
                                {p.user_role || "Payer"}
                              </span>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1 ${
                                  p.status === "Approved"
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                    : p.status === "Rejected"
                                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                      : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                }`}
                              >
                                {p.status === "Approved" && (
                                  <CheckCircle2 size={12} />
                                )}
                                {p.status === "Rejected" && (
                                  <XCircle size={12} />
                                )}
                                {p.status === "Pending" && (
                                  <AlertCircle size={12} />
                                )}
                                {p.status}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-1.5 gap-x-6 text-xs text-slate-300 pt-1">
                              <div>
                                <span className="text-slate-500 font-medium">
                                  Ad Promotion:
                                </span>{" "}
                                <strong className="text-amber-400">
                                  {p.ad_type}
                                </strong>
                                {p.house_id && (
                                  <span className="text-slate-400 ml-1">
                                    (House #{p.house_id})
                                  </span>
                                )}
                              </div>
                              <div>
                                <span className="text-slate-500 font-medium">
                                  Amount:
                                </span>{" "}
                                <strong className="text-emerald-400 text-sm">
                                  {Number(p.amount).toLocaleString()} ETB
                                </strong>
                              </div>
                              <div>
                                <span className="text-slate-500 font-medium">
                                  Payment Method:
                                </span>{" "}
                                <span className="text-white font-bold">
                                  {p.payment_method}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500 font-medium">
                                  Ref / Trans #:
                                </span>{" "}
                                <span className="font-mono bg-slate-950 px-2 py-0.5 rounded text-amber-300 border border-slate-800">
                                  {refNum}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500 font-medium">
                                  Recorded Date:
                                </span>{" "}
                                <span className="text-slate-300">
                                  {p.created_at
                                    ? new Date(
                                        p.created_at,
                                      ).toLocaleDateString()
                                    : "Recent"}
                                </span>
                              </div>
                              {p.admin_notes && (
                                <div className="col-span-1 sm:col-span-2">
                                  <span className="text-slate-500 font-medium">
                                    Admin Notes:
                                  </span>{" "}
                                  <span className="text-slate-400 italic">
                                    {p.admin_notes}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center shrink-0 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-800 w-full lg:w-auto justify-end">
                            {/* Receipt Inspector */}
                            {receiptUrl ? (
                              <button
                                onClick={() => {
                                  setInspectingPayment(p);
                                  setVerifyNotesInput(p.admin_notes || "");
                                  setVerifyRefInput(
                                    p.transaction_ref ||
                                      p.transaction_reference ||
                                      "",
                                  );
                                  setVerifyBankInput(p.payment_method || "");
                                }}
                                className="px-3.5 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                              >
                                <ShieldCheck size={15} /> Verify Receipt
                              </button>
                            ) : (
                              <span className="px-3 py-1.5 bg-slate-950 text-slate-500 border border-slate-800 rounded-xl text-xs font-medium italic">
                                No Uploaded Receipt
                              </span>
                            )}

                            {/* Print Official Receipt */}
                            <button
                              onClick={() => setPrintingReceipt(p)}
                              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                              title="Generate Official Printable Receipt"
                            >
                              <Printer size={15} /> Print Receipt
                            </button>

                            {/* Status Actions */}
                            {p.status !== "Approved" && (
                              <button
                                onClick={() =>
                                  handleUpdatePayment(p.id, "Approved")
                                }
                                className="px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1"
                              >
                                <Check size={14} /> Approve
                              </button>
                            )}

                            {p.status !== "Rejected" && (
                              <button
                                onClick={() =>
                                  handleUpdatePayment(p.id, "Rejected")
                                }
                                className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1"
                              >
                                <X size={14} /> Reject
                              </button>
                            )}

                            {/* Delete */}
                            <button
                              onClick={() => handleDeletePayment(p.id)}
                              className="p-2 bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl transition border border-slate-800 hover:border-rose-500/30"
                              title="Delete Record"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* MODAL 1: RECEIPT SECURITY INSPECTOR & VERIFIER */}
                {inspectingPayment &&
                  (() => {
                    const p = inspectingPayment;
                    const receiptUrl = p.receipt_url || p.receipt_image_url;
                    const refNum =
                      p.transaction_ref || p.transaction_reference || "N/A";

                    return (
                      <div className="fixed inset-0 z-[250] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
                        <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full p-6 md:p-8 space-y-6 shadow-2xl animate-fadeIn my-8 max-h-[90vh] overflow-y-auto">
                          <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <ShieldCheck
                                  size={22}
                                  className="text-amber-400"
                                />
                                <h3 className="text-2xl font-black text-white">
                                  Bank Receipt Security Verifier
                                </h3>
                              </div>
                              <p className="text-xs text-slate-400 mt-1">
                                Inspect bank transfer image proof and verify
                                reference code against official statements.
                              </p>
                            </div>
                            <button
                              onClick={() => setInspectingPayment(null)}
                              className="text-slate-400 hover:text-white p-1 rounded-xl"
                            >
                              <X size={24} />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Left Column: Image Viewer */}
                            <div className="lg:col-span-7 bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-center items-center">
                              <div className="relative w-full max-h-[420px] overflow-hidden rounded-xl bg-slate-900 flex items-center justify-center">
                                <OptimizedImage
                                  src={receiptUrl}
                                  alt="Bank Transfer Proof"
                                  className="max-h-[420px] w-auto object-contain hover:scale-110 transition-transform duration-300 cursor-zoom-in"
                                  width={800}
                                  height={600}
                                />
                              </div>
                              <div className="flex items-center justify-between w-full text-xs text-slate-400 px-2">
                                <span>Image Proof Verified</span>
                                <a
                                  href={receiptUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-amber-400 hover:underline flex items-center gap-1 font-bold"
                                >
                                  <ExternalLink size={13} /> Open Original
                                  Full-Size
                                </a>
                              </div>
                            </div>

                            {/* Right Column: Verification Details & Action */}
                            <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
                              <div className="space-y-3">
                                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-3">
                                  <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                                    የክፍያ ማጠቃለያ / Transaction Summary
                                  </span>
                                  <div className="text-sm text-slate-200 space-y-2">
                                    <p>
                                      <strong>Payer / ደንበኛ:</strong>{" "}
                                      {p.user_name || "N/A"} (
                                      {p.user_role || "User"})
                                    </p>
                                    <p>
                                      <strong>Amount / መጠን:</strong>{" "}
                                      <span className="text-emerald-400 font-black text-base">
                                        {Number(p.amount).toLocaleString()} ETB
                                      </span>
                                    </p>
                                    <p>
                                      <strong>Ad Type / አገልግሎት:</strong>{" "}
                                      <span className="text-amber-400 font-semibold">
                                        {p.ad_type}
                                      </span>
                                    </p>
                                  </div>
                                </div>

                                {/* Verification & Correction Fields */}
                                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-3">
                                  <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                                    ማረጋገጫ እና ማስተካከያ / Verification & Correction
                                  </span>

                                  <div className="space-y-2.5">
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                        Verified Bank Name / የባንክ ስም
                                      </label>
                                      <input
                                        type="text"
                                        value={verifyBankInput}
                                        onChange={(e) =>
                                          setVerifyBankInput(e.target.value)
                                        }
                                        className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:border-amber-400 focus:outline-none"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                        Verified Transaction Ref # / የትራንዛክሽን
                                        ቁጥር
                                      </label>
                                      <input
                                        type="text"
                                        value={verifyRefInput}
                                        onChange={(e) =>
                                          setVerifyRefInput(e.target.value)
                                        }
                                        className="w-full bg-slate-900 border border-slate-800 text-amber-400 font-mono rounded-xl px-3 py-2 text-xs focus:border-amber-400 focus:outline-none font-bold"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                        Verification Note / ማረጋገጫ ማስታወሻ
                                      </label>
                                      <textarea
                                        value={verifyNotesInput}
                                        onChange={(e) =>
                                          setVerifyNotesInput(e.target.value)
                                        }
                                        placeholder="ለደንበኛው የሚላክ ማስታወሻ (ለምሳሌ፡ በባንክ ሂሳብ ደርሷል...) Write a note to send to the client..."
                                        className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:border-amber-400 focus:outline-none h-16 resize-none"
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Security Checklist Banner */}
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-[11px] text-amber-200 space-y-1">
                                  <p className="font-bold">
                                    ⚠️ የደህንነት ማረጋገጫ ዝርዝር (Security Checklist):
                                  </p>
                                  <ul className="list-disc pl-4 space-y-0.5 text-slate-300">
                                    <li>
                                      የትራንዛክሽን ቁጥሩን በባንክ አካውንትዎ ላይ ያረጋግጡ (Verify
                                      ref # on statement)
                                    </li>
                                    <li>
                                      የደረሰኝ ምስሉ የተጭበረበረ አለመሆኑን ያረጋግጡ (Check
                                      screenshot authenticity)
                                    </li>
                                  </ul>
                                </div>
                              </div>

                              {/* Approval Actions inside verifier */}
                              <div className="space-y-3 border-t border-slate-800 pt-3">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-bold text-slate-400">
                                    Current Status:
                                  </span>
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                      p.status === "Approved"
                                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                        : p.status === "Rejected"
                                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                    }`}
                                  >
                                    {p.status}
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <button
                                    onClick={() =>
                                      handleUpdatePayment(
                                        p.id,
                                        "Approved",
                                        verifyNotesInput ||
                                          "Verified & approved by Management",
                                        verifyRefInput,
                                        verifyBankInput,
                                      )
                                    }
                                    className="py-2.5 bg-emerald-500 text-slate-950 font-black rounded-xl hover:bg-emerald-400 transition flex items-center justify-center gap-1.5 shadow-lg text-xs cursor-pointer"
                                  >
                                    <CheckCircle size={14} /> አጽድቅ (Approve)
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleUpdatePayment(
                                        p.id,
                                        "Rejected",
                                        verifyNotesInput ||
                                          "Invalid or unverified transaction reference",
                                        verifyRefInput,
                                        verifyBankInput,
                                      )
                                    }
                                    className="py-2.5 bg-rose-500 text-white font-black rounded-xl hover:bg-rose-400 transition flex items-center justify-center gap-1.5 shadow-lg text-xs cursor-pointer"
                                  >
                                    <XCircle size={14} /> ውድቅ አድርግ (Reject)
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                {/* MODAL 2: PRINTABLE OFFICIAL RECEIPT GENERATOR */}
                {printingReceipt &&
                  (() => {
                    const p = printingReceipt;
                    const refNum =
                      p.transaction_ref || p.transaction_reference || "N/A";

                    return (
                      <div className="fixed inset-0 z-[250] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
                        <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-6 shadow-2xl animate-fadeIn my-8">
                          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                            <div className="flex items-center gap-2">
                              <Printer size={20} className="text-amber-400" />
                              <h3 className="text-xl font-black text-white">
                                Official Payment Receipt Document
                              </h3>
                            </div>
                            <button
                              onClick={() => setPrintingReceipt(null)}
                              className="text-slate-400 hover:text-white p-1 rounded-xl"
                            >
                              <X size={22} />
                            </button>
                          </div>

                          {/* PRINTABLE RECEIPT CONTAINER (Light canvas for high-quality printout) */}
                          <div
                            id="official-printable-receipt"
                            className="bg-white text-slate-900 p-8 rounded-2xl shadow-xl space-y-6 border border-slate-200"
                          >
                            {/* Header */}
                            <div className="flex justify-between items-start border-b-2 border-amber-500 pb-4">
                              <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                                  INJIBARA HOUSE RENTALS
                                </h2>
                                <p className="text-xs font-semibold text-slate-600">
                                  እንጅባራ የቤት ኪራይ እና ማስተዋወቂያ አገልግሎት
                                </p>
                                <p className="text-[11px] text-slate-500 mt-1">
                                  Injibara Town, Awi Zone, Amhara, Ethiopia
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 font-black text-xs rounded-full uppercase border border-amber-300">
                                  Official Receipt
                                </span>
                                <p className="text-[11px] font-mono text-slate-500 mt-2">
                                  No: REC-{p.id || "001"}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  Date:{" "}
                                  {p.created_at
                                    ? new Date(
                                        p.created_at,
                                      ).toLocaleDateString()
                                    : new Date().toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            {/* Customer & Transaction Table */}
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <p className="text-slate-500 uppercase font-bold text-[10px]">
                                  Payer / Customer:
                                </p>
                                <p className="font-bold text-slate-900 text-sm">
                                  {p.user_name || "Valued Customer"}
                                </p>
                                <p className="text-slate-600">
                                  {p.user_role || "User"} | {p.user_email || ""}
                                </p>
                              </div>
                              <div>
                                <p className="text-slate-500 uppercase font-bold text-[10px]">
                                  Payment Details:
                                </p>
                                <p className="font-semibold text-slate-900">
                                  Method: {p.payment_method}
                                </p>
                                <p className="font-mono text-amber-700 font-bold">
                                  Ref #: {refNum}
                                </p>
                              </div>
                            </div>

                            {/* Line Items */}
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-slate-100 border-y border-slate-300">
                                  <th className="py-2.5 px-3 font-bold text-slate-700">
                                    Description / Service
                                  </th>
                                  <th className="py-2.5 px-3 font-bold text-slate-700 text-right">
                                    Amount (ETB)
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="border-b border-slate-200">
                                  <td className="py-3 px-3 font-medium text-slate-800">
                                    {p.ad_type}{" "}
                                    {p.house_id
                                      ? `(Property #${p.house_id})`
                                      : ""}
                                  </td>
                                  <td className="py-3 px-3 font-black text-slate-900 text-right text-sm">
                                    {Number(p.amount).toLocaleString()} ETB
                                  </td>
                                </tr>
                              </tbody>
                            </table>

                            {/* Total & Seal */}
                            <div className="flex justify-between items-end border-t border-slate-200 pt-4">
                              <div className="space-y-1">
                                <p className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                                  Status:{" "}
                                  <span className="uppercase">
                                    {p.status || "APPROVED"}
                                  </span>
                                </p>
                                <p className="text-[10px] text-slate-400 italic">
                                  Thank you for choosing Injibara House Rentals!
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-bold text-slate-500">
                                  TOTAL PAID:
                                </p>
                                <p className="text-2xl font-black text-emerald-600">
                                  {Number(p.amount).toLocaleString()} ETB
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Print Controls */}
                          <div className="flex justify-end gap-3 pt-2">
                            <button
                              onClick={() => window.print()}
                              className="px-6 py-3 bg-amber-500 text-slate-950 font-black rounded-xl hover:bg-amber-400 transition flex items-center gap-2 shadow-lg text-sm"
                            >
                              <Printer size={16} /> Print Official Receipt Now
                            </button>
                            <button
                              onClick={() => setPrintingReceipt(null)}
                              className="px-5 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition text-sm"
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                {/* MODAL 3: RECORD MANUAL PAYMENT */}
                {isAddingPayment && (
                  <div className="fixed inset-0 z-[250] bg-black/85 backdrop-blur-md flex items-start justify-center p-4 pt-16 sm:pt-24 pb-12 overflow-y-auto">
                    <div className="bg-slate-900 border border-slate-700 p-6 md:p-8 rounded-3xl w-full max-w-2xl shadow-2xl space-y-6 my-4 animate-fadeIn">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                        <h3 className="text-2xl font-black text-amber-400 flex items-center gap-2">
                          <Plus size={22} /> Record New Ad Payment
                        </h3>
                        <button
                          onClick={() => setIsAddingPayment(false)}
                          className="text-slate-400 hover:text-white p-1 rounded-lg"
                        >
                          <X size={22} />
                        </button>
                      </div>

                      <form
                        onSubmit={handleAddManualPaymentSubmit}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1">
                              Select User / Payer *
                            </label>
                            <select
                              required
                              value={newPayment.user_id}
                              onChange={(e) =>
                                setNewPayment({
                                  ...newPayment,
                                  user_id: e.target.value,
                                })
                              }
                              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm focus:border-amber-400 focus:outline-none"
                            >
                              <option value="">-- Choose User --</option>
                              {users.map((u) => (
                                <option
                                  key={u.user_id || u.id}
                                  value={u.user_id || u.id}
                                >
                                  {u.full_name || u.name} ({u.role || "User"} -{" "}
                                  {u.email || u.phone})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1">
                              Payer Role
                            </label>
                            <select
                              value={newPayment.user_role}
                              onChange={(e) =>
                                setNewPayment({
                                  ...newPayment,
                                  user_role: e.target.value,
                                })
                              }
                              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm focus:border-amber-400 focus:outline-none"
                            >
                              <option value="Landlord">Landlord</option>
                              <option value="Tenant">Tenant</option>
                              <option value="Agent">Agent</option>
                              <option value="Admin">Admin</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1">
                              Ad Promotion Type *
                            </label>
                            <select
                              value={newPayment.ad_type}
                              onChange={(e) =>
                                setNewPayment({
                                  ...newPayment,
                                  ad_type: e.target.value,
                                })
                              }
                              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm focus:border-amber-400 focus:outline-none"
                            >
                              <option value="Featured House Listing">
                                Featured House Listing
                              </option>
                              <option value="Urgent Rental Promotion">
                                Urgent Rental Promotion
                              </option>
                              <option value="Tenant Seeking Request Ad">
                                Tenant Seeking Request Ad
                              </option>
                              <option value="Banner Sponsor Ad">
                                Banner Sponsor Ad
                              </option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1">
                              Associated Property ID (Optional)
                            </label>
                            <input
                              type="number"
                              value={newPayment.house_id}
                              onChange={(e) =>
                                setNewPayment({
                                  ...newPayment,
                                  house_id: e.target.value,
                                })
                              }
                              placeholder="e.g. 12"
                              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm focus:border-amber-400 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1">
                              Amount Paid (ETB) *
                            </label>
                            <input
                              type="number"
                              required
                              value={newPayment.amount}
                              onChange={(e) =>
                                setNewPayment({
                                  ...newPayment,
                                  amount: e.target.value,
                                })
                              }
                              placeholder="500"
                              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm focus:border-amber-400 focus:outline-none font-bold text-emerald-400"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1">
                              Payment Method / Bank *
                            </label>
                            <select
                              value={newPayment.payment_method}
                              onChange={(e) =>
                                setNewPayment({
                                  ...newPayment,
                                  payment_method: e.target.value,
                                })
                              }
                              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm focus:border-amber-400 focus:outline-none"
                            >
                              <option value="CBE Bank">
                                Commercial Bank of Ethiopia (CBE)
                              </option>
                              <option value="Telebirr">
                                Telebirr Mobile Money
                              </option>
                              <option value="Bank of Abyssinia">
                                Bank of Abyssinia
                              </option>
                              <option value="Awash Bank">Awash Bank</option>
                              <option value="Cash / Hand Payment">
                                Cash / Hand Payment
                              </option>
                            </select>
                          </div>

                          <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-300 mb-1">
                              Transaction Ref / Reference Number *
                            </label>
                            <input
                              type="text"
                              required
                              value={newPayment.transaction_ref}
                              onChange={(e) =>
                                setNewPayment({
                                  ...newPayment,
                                  transaction_ref: e.target.value,
                                })
                              }
                              placeholder="e.g. FT240808XXXX or Ref Code"
                              className="w-full bg-slate-950 border border-slate-700 text-amber-300 font-mono rounded-xl p-3 text-sm focus:border-amber-400 focus:outline-none"
                            />
                          </div>

                          <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-300 mb-1">
                              Upload Receipt Image (Optional)
                            </label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                setManualReceiptFile(e.target.files[0] || null)
                              }
                              className="w-full bg-slate-950 border border-slate-700 text-slate-300 rounded-xl p-2.5 text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1">
                              Initial Status
                            </label>
                            <select
                              value={newPayment.status}
                              onChange={(e) =>
                                setNewPayment({
                                  ...newPayment,
                                  status: e.target.value,
                                })
                              }
                              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm focus:border-amber-400 focus:outline-none"
                            >
                              <option value="Approved">Approved</option>
                              <option value="Pending">Pending</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1">
                              Admin Notes
                            </label>
                            <input
                              type="text"
                              value={newPayment.admin_notes}
                              onChange={(e) =>
                                setNewPayment({
                                  ...newPayment,
                                  admin_notes: e.target.value,
                                })
                              }
                              placeholder="e.g. Verified by management"
                              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm focus:border-amber-400 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex gap-4 pt-4 border-t border-slate-800">
                          <button
                            type="submit"
                            className="flex-1 py-3.5 bg-amber-500 text-slate-950 font-black rounded-xl hover:bg-amber-400 transition shadow-lg"
                          >
                            Save & Record Payment
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsAddingPayment(false)}
                            className="px-6 py-3.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

        {/* HOMEPAGE NOTICES / NOTICE BOARD TAB */}
        {activeTab === "homepage_notices" && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black text-white">
                  Homepage Notice (ይፋዊ መግለጫዎች)
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  Add, edit, update, and delete the official notices displayed
                  on the homepage Notice Board.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-3 py-1.5 rounded-xl font-bold">
                  {
                    announcements.filter(
                      (a) => a.type === "homepage_notice" && a.is_active,
                    ).length
                  }{" "}
                  Active
                </span>
                <span className="bg-slate-800 border border-slate-700 text-slate-400 text-xs px-3 py-1.5 rounded-xl font-bold">
                  {
                    announcements.filter((a) => a.type === "homepage_notice")
                      .length
                  }{" "}
                  Total
                </span>
              </div>
            </div>

            {/* Live Preview */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4">
                Live Notice Board Card Preview
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {announcements
                  .filter((a) => a.type === "homepage_notice" && a.is_active)
                  .slice(0, 2)
                  .map((a, i) => (
                    <div
                      key={i}
                      className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3 relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <span className="bg-amber-500 text-slate-950 text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-wider">
                          {a.badge || "NEWS"}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Preview Mode
                        </span>
                      </div>
                      <h4 className="text-white font-bold text-base">
                        {language === "am" ? a.title_am : a.title_en}
                      </h4>
                      <p className="text-slate-400 text-xs line-clamp-3 leading-relaxed">
                        {language === "am" ? a.content_am : a.content_en}
                      </p>
                    </div>
                  ))}
                {announcements.filter(
                  (a) => a.type === "homepage_notice" && a.is_active,
                ).length === 0 && (
                  <div className="col-span-2 text-center py-6 text-slate-500 text-sm">
                    No active homepage notices to preview. Add one below!
                  </div>
                )}
              </div>
            </div>

            <form
              id="announcement-form"
              onSubmit={
                editingAnnouncement
                  ? handleUpdateAnnouncement
                  : handleAddAnnouncement
              }
              className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl space-y-6 shadow-xl relative overflow-hidden"
            >
              {editingAnnouncement && (
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
              )}
              <h3 className="text-xl font-bold text-amber-400 flex items-center gap-2">
                <Bell size={20} />{" "}
                {editingAnnouncement
                  ? "Edit Homepage Notice"
                  : "Add New Homepage Notice"}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Badge Tag / Type (e.g. NEWS, OFFER, SUPPORT)
                  </label>
                  <input
                    required
                    value={
                      editingAnnouncement
                        ? editingAnnouncement.badge || "NEWS"
                        : newAnnouncement.badge || "NEWS"
                    }
                    onChange={(e) =>
                      editingAnnouncement
                        ? setEditingAnnouncement({
                            ...editingAnnouncement,
                            badge: e.target.value.toUpperCase(),
                          })
                        : setNewAnnouncement({
                            ...newAnnouncement,
                            badge: e.target.value.toUpperCase(),
                          })
                    }
                    placeholder="e.g. NEWS, OFFER, NOTICE, SUPPORT"
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm uppercase font-bold tracking-wider"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Status
                  </label>
                  <select
                    value={
                      editingAnnouncement
                        ? editingAnnouncement.is_active
                          ? 1
                          : 0
                        : newAnnouncement.is_active
                          ? 1
                          : 0
                    }
                    onChange={(e) =>
                      editingAnnouncement
                        ? setEditingAnnouncement({
                            ...editingAnnouncement,
                            is_active: e.target.value === "1",
                          })
                        : setNewAnnouncement({
                            ...newAnnouncement,
                            is_active: e.target.value === "1",
                          })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                  >
                    <option value={1}>Active (Visible on Notice Board)</option>
                    <option value={0}>Inactive (Hidden)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Notice Title (English)
                  </label>
                  <input
                    required
                    value={
                      editingAnnouncement
                        ? editingAnnouncement.title_en
                        : newAnnouncement.title_en
                    }
                    onChange={(e) =>
                      editingAnnouncement
                        ? setEditingAnnouncement({
                            ...editingAnnouncement,
                            title_en: e.target.value,
                          })
                        : setNewAnnouncement({
                            ...newAnnouncement,
                            title_en: e.target.value,
                          })
                    }
                    placeholder="e.g. System upgrade scheduled on Sunday"
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Notice Title (Amharic)
                  </label>
                  <input
                    required
                    value={
                      editingAnnouncement
                        ? editingAnnouncement.title_am
                        : newAnnouncement.title_am
                    }
                    onChange={(e) =>
                      editingAnnouncement
                        ? setEditingAnnouncement({
                            ...editingAnnouncement,
                            title_am: e.target.value,
                          })
                        : setNewAnnouncement({
                            ...newAnnouncement,
                            title_am: e.target.value,
                          })
                    }
                    placeholder="e.g. እሁድ እለት የስርዓት ማሻሻያ ይደረጋል"
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Notice Details (English)
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={
                      editingAnnouncement
                        ? editingAnnouncement.content_en || ""
                        : newAnnouncement.content_en
                    }
                    onChange={(e) =>
                      editingAnnouncement
                        ? setEditingAnnouncement({
                            ...editingAnnouncement,
                            content_en: e.target.value,
                          })
                        : setNewAnnouncement({
                            ...newAnnouncement,
                            content_en: e.target.value,
                          })
                    }
                    placeholder="Detailed notice information in English..."
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Notice Details (Amharic)
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={
                      editingAnnouncement
                        ? editingAnnouncement.content_am || ""
                        : newAnnouncement.content_am
                    }
                    onChange={(e) =>
                      editingAnnouncement
                        ? setEditingAnnouncement({
                            ...editingAnnouncement,
                            content_am: e.target.value,
                          })
                        : setNewAnnouncement({
                            ...newAnnouncement,
                            content_am: e.target.value,
                          })
                    }
                    placeholder="ተጨማሪ መግለጫ በአማርኛ..."
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                {editingAnnouncement ? (
                  <>
                    <button
                      type="submit"
                      className="flex-1 py-4 bg-amber-500 text-slate-950 font-black rounded-2xl hover:bg-amber-400 transition shadow-lg"
                    >
                      Update Notice
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingAnnouncement(null)}
                      className="px-6 py-4 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-700 transition"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="submit"
                    className="w-full py-4 bg-amber-500 text-slate-950 font-black rounded-2xl hover:bg-amber-400 transition shadow-lg"
                  >
                    + Add Homepage Notice
                  </button>
                )}
              </div>
            </form>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">
                Active Homepage Notices (
                {
                  announcements.filter((a) => a.type === "homepage_notice")
                    .length
                }
                )
              </h3>
              {announcements
                .filter((a) => a.type === "homepage_notice")
                .map((ann, index) => (
                  <div
                    key={ann.id || index}
                    className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex justify-between items-center gap-4 shadow-md"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] px-2.5 py-0.5 rounded font-black tracking-wider uppercase">
                          {ann.badge || "NEWS"}
                        </span>
                        {ann.is_active === 0 || ann.is_active === false ? (
                          <span className="bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] px-2 py-0.5 rounded font-bold">
                            INACTIVE
                          </span>
                        ) : (
                          <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-bold">
                            ACTIVE
                          </span>
                        )}
                        <h4 className="text-white font-bold text-sm">
                          {ann.title_en}
                        </h4>
                      </div>
                      <p className="text-amber-400/90 text-xs font-amharic font-semibold">
                        {ann.title_am}
                      </p>
                      {ann.content_en && (
                        <p className="text-slate-400 text-xs mt-1">
                          {ann.content_en}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewingAnnouncement(ann)}
                        className="px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold hover:bg-blue-500/20 transition flex items-center gap-1.5"
                      >
                        <Eye size={14} /> Preview
                      </button>
                      <button
                        onClick={() => handleEditAnnouncement(ann)}
                        className="px-4 py-2 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold hover:bg-amber-500/20 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        className="p-2 text-red-400 hover:bg-red-500/10 border border-red-500/20 rounded-xl hover:border-red-500/40 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            {/* Preview Modal */}
            {previewingAnnouncement && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative animate-fadeIn">
                  <button
                    onClick={() => setPreviewingAnnouncement(null)}
                    className="absolute top-6 right-6 text-slate-400 hover:text-white p-2 rounded-full bg-slate-800"
                  >
                    <X size={20} />
                  </button>

                  <div className="flex items-center gap-3">
                    <span className="bg-amber-500 text-slate-950 text-xs font-black px-3 py-1 rounded-md uppercase tracking-wider">
                      {previewingAnnouncement.badge || "NEWS"}
                    </span>
                    <span className="text-slate-400 text-xs font-semibold">
                      Posted:{" "}
                      {previewingAnnouncement.created_at
                        ? previewingAnnouncement.created_at.substring(0, 10)
                        : "2026-08-09"}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                        English Title / Content
                      </h4>
                      <h3 className="text-lg font-bold text-white mb-2">
                        {previewingAnnouncement.title_en}
                      </h3>
                      {previewingAnnouncement.content_en && (
                        <p className="text-slate-300 text-sm bg-slate-950 p-4 rounded-2xl border border-slate-800 leading-relaxed">
                          {previewingAnnouncement.content_en}
                        </p>
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
                        Amharic Title / Content (የአማርኛ ርዕስ እና ይዘት)
                      </h4>
                      <h3 className="text-lg font-bold text-amber-300 font-amharic mb-2">
                        {previewingAnnouncement.title_am}
                      </h3>
                      {previewingAnnouncement.content_am && (
                        <p className="text-slate-300 text-sm bg-slate-950 p-4 rounded-2xl border border-slate-800 leading-relaxed font-amharic">
                          {previewingAnnouncement.content_am}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-800">
                    <button
                      onClick={() => setPreviewingAnnouncement(null)}
                      className="px-6 py-3 bg-amber-500 text-slate-950 font-black rounded-xl hover:bg-amber-400 transition"
                    >
                      Close Preview
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PROMOTIONAL NOTICES / SLIDING TICKER TEXT TAB */}
        {activeTab === "promotional_notices" && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black text-white">
                  promotional_Notice (የፕሮሞሽን ማስታወቂያዎች)
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  Add, edit, update, and delete the lines of text that
                  continuously slide across the homepage banner marquee ticker.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-3 py-1.5 rounded-xl font-bold">
                  {
                    announcements.filter(
                      (a) => a.type !== "homepage_notice" && a.is_active,
                    ).length
                  }{" "}
                  Active
                </span>
                <span className="bg-slate-800 border border-slate-700 text-slate-400 text-xs px-3 py-1.5 rounded-xl font-bold">
                  {
                    announcements.filter((a) => a.type !== "homepage_notice")
                      .length
                  }{" "}
                  Total
                </span>
              </div>
            </div>

            {/* Live Preview */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl overflow-hidden">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4">
                Live Homepage Ticker Preview
              </h3>
              <div className="bg-amber-500 text-slate-950 font-black py-3 overflow-hidden relative border-y border-amber-600 rounded-xl">
                <style>{`
                  @keyframes admin-ticker-slide {
                    0% { transform: translate3d(0, 0, 0); }
                    100% { transform: translate3d(-50%, 0, 0); }
                  }
                  .admin-animate-ticker {
                    display: inline-flex;
                    white-space: nowrap;
                    animation: admin-ticker-slide 20s linear infinite;
                  }
                `}</style>
                <div className="flex w-max">
                  <div className="admin-animate-ticker flex items-center gap-12 text-xs tracking-wide uppercase">
                    {announcements.filter(
                      (a) => a.type !== "homepage_notice" && a.is_active,
                    ).length > 0 ? (
                      <>
                        {[
                          ...announcements.filter(
                            (a) => a.type !== "homepage_notice" && a.is_active,
                          ),
                          ...announcements.filter(
                            (a) => a.type !== "homepage_notice" && a.is_active,
                          ),
                        ].map((a, i) => (
                          <span key={i} className="flex items-center gap-2">
                            <span className="bg-slate-950 text-amber-400 text-[10px] px-2 py-0.5 rounded font-black">
                              {a.badge || "NEWS"}
                            </span>
                            <span>
                              {language === "am" ? a.title_am : a.title_en}
                            </span>
                            <span className="ml-8">•</span>
                          </span>
                        ))}
                      </>
                    ) : (
                      <span className="text-slate-800">
                        No active ticker texts to display. Add one below!
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <form
              id="announcement-form"
              onSubmit={
                editingAnnouncement
                  ? handleUpdateAnnouncement
                  : handleAddAnnouncement
              }
              className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl space-y-6 shadow-xl relative overflow-hidden"
            >
              {editingAnnouncement && (
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
              )}
              <h3 className="text-xl font-bold text-amber-400 flex items-center gap-2">
                <Bell size={20} />{" "}
                {editingAnnouncement
                  ? "Edit Sliding Ticker Text"
                  : "Add New Sliding Ticker Line Text"}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Badge Tag / Type (e.g. NEWS, OFFER, SUPPORT)
                  </label>
                  <input
                    required
                    value={
                      editingAnnouncement
                        ? editingAnnouncement.badge || "NEWS"
                        : newAnnouncement.badge || "NEWS"
                    }
                    onChange={(e) =>
                      editingAnnouncement
                        ? setEditingAnnouncement({
                            ...editingAnnouncement,
                            badge: e.target.value.toUpperCase(),
                          })
                        : setNewAnnouncement({
                            ...newAnnouncement,
                            badge: e.target.value.toUpperCase(),
                          })
                    }
                    placeholder="e.g. NEWS, OFFER, NOTICE, SUPPORT"
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm uppercase font-bold tracking-wider"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Status
                  </label>
                  <select
                    value={
                      editingAnnouncement
                        ? editingAnnouncement.is_active
                          ? 1
                          : 0
                        : newAnnouncement.is_active
                          ? 1
                          : 0
                    }
                    onChange={(e) =>
                      editingAnnouncement
                        ? setEditingAnnouncement({
                            ...editingAnnouncement,
                            is_active: e.target.value === "1",
                          })
                        : setNewAnnouncement({
                            ...newAnnouncement,
                            is_active: e.target.value === "1",
                          })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                  >
                    <option value={1}>Active (Visible on Homepage)</option>
                    <option value={0}>Inactive (Hidden)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Sliding Line Text (English)
                  </label>
                  <input
                    required
                    value={
                      editingAnnouncement
                        ? editingAnnouncement.title_en
                        : newAnnouncement.title_en
                    }
                    onChange={(e) =>
                      editingAnnouncement
                        ? setEditingAnnouncement({
                            ...editingAnnouncement,
                            title_en: e.target.value,
                          })
                        : setNewAnnouncement({
                            ...newAnnouncement,
                            title_en: e.target.value,
                          })
                    }
                    placeholder="e.g. 🔥 SPECIAL OFFER: List your rental property now for free!"
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Sliding Line Text (Amharic)
                  </label>
                  <input
                    required
                    value={
                      editingAnnouncement
                        ? editingAnnouncement.title_am
                        : newAnnouncement.title_am
                    }
                    onChange={(e) =>
                      editingAnnouncement
                        ? setEditingAnnouncement({
                            ...editingAnnouncement,
                            title_am: e.target.value,
                          })
                        : setNewAnnouncement({
                            ...newAnnouncement,
                            title_am: e.target.value,
                          })
                    }
                    placeholder="e.g. 🔥 ልዩ ማስታወቂያ: ቤትዎን በነጻ ያስመዝግቡ!"
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Optional Details (English)
                  </label>
                  <textarea
                    rows={2}
                    value={
                      editingAnnouncement
                        ? editingAnnouncement.content_en || ""
                        : newAnnouncement.content_en
                    }
                    onChange={(e) =>
                      editingAnnouncement
                        ? setEditingAnnouncement({
                            ...editingAnnouncement,
                            content_en: e.target.value,
                          })
                        : setNewAnnouncement({
                            ...newAnnouncement,
                            content_en: e.target.value,
                          })
                    }
                    placeholder="Optional detailed description..."
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Optional Details (Amharic)
                  </label>
                  <textarea
                    rows={2}
                    value={
                      editingAnnouncement
                        ? editingAnnouncement.content_am || ""
                        : newAnnouncement.content_am
                    }
                    onChange={(e) =>
                      editingAnnouncement
                        ? setEditingAnnouncement({
                            ...editingAnnouncement,
                            content_am: e.target.value,
                          })
                        : setNewAnnouncement({
                            ...newAnnouncement,
                            content_am: e.target.value,
                          })
                    }
                    placeholder="ተጨማሪ መግለጫ (አማራጭ)..."
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                {editingAnnouncement ? (
                  <>
                    <button
                      type="submit"
                      className="flex-1 py-4 bg-amber-500 text-slate-950 font-black rounded-2xl hover:bg-amber-400 transition shadow-lg"
                    >
                      Update Ticker Text
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingAnnouncement(null)}
                      className="px-6 py-4 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-700 transition"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="submit"
                    className="w-full py-4 bg-amber-500 text-slate-950 font-black rounded-2xl hover:bg-amber-400 transition shadow-lg"
                  >
                    + Add Ticker Text / Announcement
                  </button>
                )}
              </div>
            </form>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">
                Active Sliding Line Texts (
                {
                  announcements.filter((a) => a.type !== "homepage_notice")
                    .length
                }
                )
              </h3>
              {announcements
                .filter((a) => a.type !== "homepage_notice")
                .map((ann, index) => (
                  <div
                    key={ann.id || index}
                    className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex justify-between items-center gap-4 shadow-md"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] px-2.5 py-0.5 rounded font-black tracking-wider uppercase">
                          {ann.badge || "NEWS"}
                        </span>
                        {ann.is_active === 0 || ann.is_active === false ? (
                          <span className="bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] px-2 py-0.5 rounded font-bold">
                            INACTIVE
                          </span>
                        ) : (
                          <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-bold">
                            ACTIVE
                          </span>
                        )}
                        <h4 className="text-white font-bold text-sm">
                          {ann.title_en}
                        </h4>
                      </div>
                      <p className="text-amber-400/90 text-xs font-amharic font-semibold">
                        {ann.title_am}
                      </p>
                      {ann.content_en && (
                        <p className="text-slate-400 text-xs mt-1">
                          {ann.content_en}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewingAnnouncement(ann)}
                        className="px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold hover:bg-blue-500/20 transition flex items-center gap-1.5"
                      >
                        <Eye size={14} /> Preview
                      </button>
                      <button
                        onClick={() => handleEditAnnouncement(ann)}
                        className="px-4 py-2 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold hover:bg-amber-500/20 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        className="p-2 text-red-400 hover:bg-red-500/10 border border-red-500/20 rounded-xl hover:border-red-500/40 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            {/* Preview Modal */}
            {previewingAnnouncement && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative animate-fadeIn">
                  <button
                    onClick={() => setPreviewingAnnouncement(null)}
                    className="absolute top-6 right-6 text-slate-400 hover:text-white p-2 rounded-full bg-slate-800"
                  >
                    <X size={20} />
                  </button>

                  <div className="flex items-center gap-3">
                    <span className="bg-amber-500 text-slate-950 text-xs font-black px-3 py-1 rounded-md uppercase tracking-wider">
                      {previewingAnnouncement.badge || "NEWS"}
                    </span>
                    <span className="text-slate-400 text-xs font-semibold">
                      Posted:{" "}
                      {previewingAnnouncement.created_at
                        ? previewingAnnouncement.created_at.substring(0, 10)
                        : "2026-08-09"}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                        English Title / Content
                      </h4>
                      <h3 className="text-lg font-bold text-white mb-2">
                        {previewingAnnouncement.title_en}
                      </h3>
                      {previewingAnnouncement.content_en && (
                        <p className="text-slate-300 text-sm bg-slate-950 p-4 rounded-2xl border border-slate-800 leading-relaxed">
                          {previewingAnnouncement.content_en}
                        </p>
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
                        Amharic Title / Content (የአማርኛ ርዕስ እና ይዘት)
                      </h4>
                      <h3 className="text-lg font-bold text-amber-300 font-amharic mb-2">
                        {previewingAnnouncement.title_am}
                      </h3>
                      {previewingAnnouncement.content_am && (
                        <p className="text-slate-300 text-sm bg-slate-950 p-4 rounded-2xl border border-slate-800 leading-relaxed font-amharic">
                          {previewingAnnouncement.content_am}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-800">
                    <button
                      onClick={() => setPreviewingAnnouncement(null)}
                      className="px-6 py-3 bg-amber-500 text-slate-950 font-black rounded-xl hover:bg-amber-400 transition"
                    >
                      Close Preview
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TESTIMONIALS TAB */}
        {activeTab === "testimonials" && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black text-white">
                  Testimonials & Client Reviews
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  Review customer submissions. Approve valid reviews to display
                  them directly on the homepage.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-3 py-1.5 rounded-xl font-bold">
                  {
                    testimonials.filter(
                      (t) =>
                        t.is_approved === 1 ||
                        t.is_approved === true ||
                        t.is_approved === undefined,
                    ).length
                  }{" "}
                  Published
                </span>
                <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs px-3 py-1.5 rounded-xl font-bold">
                  {
                    testimonials.filter(
                      (t) => t.is_approved === 0 || t.is_approved === false,
                    ).length
                  }{" "}
                  Pending Review
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {testimonials.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center text-slate-400">
                  No testimonials found.
                </div>
              ) : (
                testimonials.map((test, index) => {
                  const isApproved =
                    test.is_approved === 1 ||
                    test.is_approved === true ||
                    test.is_approved === undefined;
                  return (
                    <div
                      key={test.id || index}
                      className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-lg"
                    >
                      <div className="flex items-start gap-4 flex-1">
                        <OptimizedImage
                          src={
                            test.avatar ||
                            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80"
                          }
                          alt={test.name}
                          className="w-14 h-14 rounded-2xl object-cover border border-amber-500/30 flex-shrink-0"
                          width={56}
                          height={56}
                        />
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-white font-bold text-base">
                              {test.name}
                            </h4>
                            <span className="text-amber-400 text-xs font-semibold">
                              (
                              {test.role_en ||
                                test.role_am ||
                                test.role ||
                                "Tenant"}
                              )
                            </span>
                            <span className="text-slate-500 text-xs">
                              •{" "}
                              {test.location_en ||
                                test.location_am ||
                                test.location ||
                                "Injibara"}
                            </span>

                            {/* Status Badge */}
                            {isApproved ? (
                              <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] px-2.5 py-0.5 rounded-md font-black uppercase tracking-wider">
                                ✓ PUBLISHED ON HOMEPAGE
                              </span>
                            ) : (
                              <span className="bg-amber-500/20 border border-amber-500/50 text-amber-300 text-[10px] px-2.5 py-0.5 rounded-md font-black uppercase tracking-wider animate-pulse">
                                ⏳ PENDING ADMIN APPROVAL
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 text-amber-400">
                            {[...Array(test.rating || 5)].map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                className="fill-amber-400 text-amber-400"
                              />
                            ))}
                            <span className="text-xs text-slate-400 ml-2">
                              Property:{" "}
                              <strong className="text-slate-200">
                                {test.house_type_en ||
                                  test.house_type_am ||
                                  test.houseType ||
                                  "Rented House"}
                              </strong>
                            </span>
                          </div>

                          <p className="text-slate-300 text-sm italic font-light bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                            "
                            {test.comment_en || test.comment_am || test.comment}
                            "
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-slate-800 justify-end flex-shrink-0">
                        <button
                          onClick={() =>
                            handleApproveTestimonial(
                              test.id,
                              isApproved ? 1 : 0,
                            )
                          }
                          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
                            isApproved
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20"
                              : "bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-black shadow-lg"
                          }`}
                        >
                          {isApproved
                            ? "Hide from Homepage"
                            : "✓ Approve & Publish"}
                        </button>

                        <button
                          onClick={() => handleDeleteTestimonial(test.id)}
                          className="p-2.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/20 transition"
                          title="Delete Testimonial"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
          </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h1 className="text-3xl font-black text-white">
                Settings
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Manage all platform configuration from one place.
              </p>
            </div>
            <SettingsLayout activeTab={settingsSubTab} onTabChange={setSettingsSubTab}>
              {settingsSubTab === 'general' && <GeneralSettings />}
              {settingsSubTab === 'payments' && <PaymentSettings />}
              {settingsSubTab === 'contact' && <ContactSettings />}
              {settingsSubTab === 'seo' && <SEOSettings />}
              {settingsSubTab === 'media' && <MediaSettings />}
              {settingsSubTab === 'content' && <ContentSettings />}
              {settingsSubTab === 'categories' && <CategorySettings />}
              {settingsSubTab === 'locations' && <LocationSettings />}
              {settingsSubTab === 'fees' && <FeeSettings />}
            </SettingsLayout>
          </div>
        )}
      </main>
    </div>
  );
}
