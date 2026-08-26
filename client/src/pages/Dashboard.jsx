import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  Plus,
  MessageSquare,
  Trash2,
  CheckCircle,
  XCircle,
  MapPin,
  Home as HomeIcon,
  LayoutDashboard,
  Star,
  Heart,
  CreditCard,
  Sparkles,
  Megaphone,
  Clock,
  Info,
  FileText,
  Video,
  Bell,
  Mail,
  Filter,
  User,
  Menu,
  ChevronLeft,
  ChevronRight,
  Printer,
  Download,
  X,
  Upload,
} from "lucide-react";
import { ethiopianLocations, regions } from "../utils/locations";
import { formatEthiopianDate } from "../utils/date";
import HouseGrid from "../components/HouseGrid";
import OptimizedImage from "../components/OptimizedImage";
import AdPaymentModal from "../components/AdPaymentModal";
import HousePaymentModal from "../components/HousePaymentModal";
import RentReminderWidget from "../components/RentReminderWidget";
import RentalContractModal from "../components/RentalContractModal";
import ImageInputSelector from "../components/ImageInputSelector";
import MultiImageUploader from "../components/MultiImageUploader";
import VideoUploader from "../components/VideoUploader";
import ButtonSpinner from "../components/ButtonSpinner";

const {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} = lazy(() => import("recharts"));
const jsPDF = lazy(() => import("jspdf"));
const html2canvas = lazy(() => import("html2canvas"));

const Dashboard = () => {
  const { user, updateUserContext } = useAuth();
  const { language, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [houses, setHouses] = useState([]);
  const [requests, setRequests] = useState([]);
  const [wishlists, setWishlists] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showHousePaymentModal, setShowHousePaymentModal] = useState(false);
  const [isCustomCity, setIsCustomCity] = useState(false);
  const [activeTab, setActiveTab] = useState(
    user?.role === "Landlord" || user?.role === "Admin"
      ? "properties"
      : "favorites",
  );
  const [imageFile, setImageFile] = useState(null); // File upload state
  const [videoFile, setVideoFile] = useState(null); // Video upload state
  const [multipleImages, setMultipleImages] = useState([]); // Multiple images state
  const [receiptFile, setReceiptFile] = useState(null); // Receipt upload state
  const [housePaymentMethod, setHousePaymentMethod] = useState("Telebirr");
  const [houseTransactionRef, setHouseTransactionRef] = useState("");

  // Tenant seeking ad payment states
  const [tenantPaymentMethod, setTenantPaymentMethod] = useState("telebirr");
  const [tenantTransactionRef, setTenantTransactionRef] = useState("");
  const [tenantReceiptFile, setTenantReceiptFile] = useState(null);

  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedContractHouse, setSelectedContractHouse] = useState(null);
  const [landlordsList, setLandlordsList] = useState([]);
  const [payConfig, setPayConfig] = useState({ fees: {}, payments: {} });
  const normalizeConfig = (raw) => {
    const data = raw?.data || raw || {};
    return { fees: data.fees || {}, payments: data.payments || {} };
  };
  useEffect(() => {
    axios
      .get("/api/payments/config")
      .then((res) => setPayConfig(normalizeConfig(res.data)))
      .catch(() => {});
  }, []);

  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const dashboardTabs = [
    {
      id: "profile",
      label: t("profile"),
      icon: User,
      roles: ["Tenant", "Landlord", "Admin"],
    },
    {
      id: "properties",
      label: t("properties"),
      icon: HomeIcon,
      roles: ["Landlord", "Admin"],
    },
    {
      id: "requests",
      label: t("rentRequests"),
      icon: Filter,
      roles: ["Tenant", "Landlord", "Admin"],
    },
    {
      id: "analytics",
      label: t("analytics"),
      icon: LayoutDashboard,
      roles: ["Landlord", "Admin"],
    },
    {
      id: "seeking_ads",
      label: t("seekingAds"),
      icon: Megaphone,
      roles: ["Tenant"],
    },
    { id: "alerts", label: t("savedAlerts"), icon: Bell, roles: ["Tenant"] },
    {
      id: "favorites",
      label: t("favs"),
      icon: Heart,
      roles: ["Tenant", "Landlord", "Admin"],
    },
    {
      id: "reminders",
      label: t("rentReminders"),
      icon: Clock,
      roles: ["Tenant", "Landlord", "Admin"],
    },
    {
      id: "contracts",
      label: t("contracts"),
      icon: FileText,
      roles: ["Tenant", "Landlord", "Admin"],
    },
    {
      id: "payments",
      label: t("payments"),
      icon: CreditCard,
      roles: ["Tenant", "Landlord", "Admin"],
    },
  ];

  const filteredTabs = dashboardTabs.filter((tab) =>
    tab.roles.includes(user?.role),
  );

  const [formData, setFormData] = useState({
    title: "",
    title_am: "",
    description: "",
    description_am: "",
    type: "የመኖሪያ ቤት",
    region: "Injibara",
    city: "Injibara",
    sub_city: "",
    address: "",
    price: "",
    rooms: 1,
    bathrooms: 1,
    square_meter: "",
    image_url: "",
    video_url: "",
    owner_id: "",
  });

  // Profile Edit State
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

  // Tenant Seeking Ads State
  const [adData, setAdData] = useState({
    title: "",
    description: "",
    budget_max: "",
    preferred_location: "",
  });
  const [myAds, setMyAds] = useState([]);

  // Payments & Ad Promotion State
  const [myPayments, setMyPayments] = useState([]);
  const [isAdPaymentModalOpen, setIsAdPaymentModalOpen] = useState(false);
  const [promotionHouseId, setPromotionHouseId] = useState(null);
  const [promotionSeekingAdId, setPromotionSeekingAdId] = useState(null);
  const [promotionAdType, setPromotionAdType] = useState("Featured Listing");
  const [analyticsData, setAnalyticsData] = useState(null);
  const [printingReceipt, setPrintingReceipt] = useState(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const receiptRef = useRef(null);

  // Property Alerts State
  const [myAlerts, setMyAlerts] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);
  const [alertForm, setAlertForm] = useState({
    house_type: "የመኖሪያ ቤት",
    min_price: "",
    max_price: "",
    location_keyword: "",
    min_rooms: "",
    notification_email: user?.email || "",
  });
  const [showEmailPreview, setShowEmailPreview] = useState(null);

  useEffect(() => {
    if (user) {
      if (user.role === "Landlord" || user.role === "Admin") {
        fetchMyHouses();
        fetchLandlordRequests();
        fetchAnalytics();
        if (user.role === "Admin") {
          fetchLandlords();
        }
      } else {
        fetchTenantRequests();
        fetchMyAds();
        fetchMyAlerts();
        fetchEmailLogs();
      }
      fetchWishlists();
      fetchMyPayments();
    }
  }, [user]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get("tab");
    const openForm = searchParams.get("openForm");
    if (tab) {
      setActiveTab(tab);
    }
    if (openForm === "true") {
      setShowForm(true);
    }
  }, [location]);

  const fetchMyAlerts = async () => {
    try {
      const res = await axios.get("/api/alerts/my-alerts", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setMyAlerts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
    }
  };

  const handleViewMatchedProperties = (alert) => {
    const params = new URLSearchParams();
    if (alert.house_type && alert.house_type !== 'All') {
      params.append("type", alert.house_type);
    }
    if (alert.min_price) {
      params.append("minPrice", alert.min_price);
    }
    if (alert.max_price) {
      params.append("maxPrice", alert.max_price);
    }
    if (alert.location_keyword) {
      params.append("sub_city", alert.location_keyword);
    }
    if (alert.min_rooms) {
      params.append("rooms", alert.min_rooms);
    }
    navigate(`/houses?${params.toString()}`);
  };

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get("/api/houses/analytics", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setAnalyticsData(res.data);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    }
  };

  const fetchEmailLogs = async () => {
    try {
      const res = await axios.get("/api/alerts/email-logs", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setEmailLogs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch email logs:", err);
    }
  };

  const fetchLandlords = async () => {
    try {
      const res = await axios.get("/api/auth/landlords");
      setLandlordsList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch landlords list:", err);
    }
  };

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/alerts", alertForm, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      fetchMyAlerts();
      setAlertForm({
        house_type: "የመኖሪያ ቤት",
        min_price: "",
        max_price: "",
        location_keyword: "",
        min_rooms: "",
        notification_email: user?.email || "",
      });
      alert(
        language === "am"
          ? "የቤት ፍለጋ መስፈርት ተቀምጧል!"
          : "Alert criteria saved successfully!",
      );
    } catch (err) {
      console.error("Failed to create alert:", err);
    }
  };

  const handleDeleteAlert = async (id) => {
    if (
      !window.confirm(
        language === "am"
          ? "እርግጠኛ ነዎት መሰረዝ ይፈልጋሉ?"
          : "Are you sure you want to delete this alert?",
      )
    )
      return;
    try {
      await axios.delete(`/api/alerts/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      fetchMyAlerts();
    } catch (err) {
      console.error("Failed to delete alert:", err);
    }
  };

  const handleTestAlert = async () => {
    try {
      const res = await axios.post(
        "/api/alerts/test-send",
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      fetchEmailLogs();
      fetchTenantRequests(); // to refresh notifications if any
      // Show preview reminder
      alert(
        language === "am"
          ? 'የሙከራ ኢሜይል ተልኳል! ከታች ባለው ዝርዝር ውስጥ "Preview" የሚለውን በመጫን ማየት ይችላሉ።'
          : 'Test alert sent! Click "Preview" in the list below to see it.',
      );
    } catch (err) {
      console.error("Failed to send test alert:", err);
      alert("Error sending test alert");
    }
  };

  const fetchMyPayments = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await axios.get("/api/payments/my-payments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyPayments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch my payments", err);
    }
  };

  const handleDownloadReceiptPDF = async (p) => {
    if (!receiptRef.current) {
      console.error("Receipt element not found");
      return;
    }
    try {
      setIsGeneratingPDF(true);
      const element = receiptRef.current;

      const [{ default: html2canvasLib }, { default: jsPDFLib }] =
        await Promise.all([import("html2canvas"), import("jspdf")]);

      const canvas = await html2canvasLib(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDFLib("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(
        imgData,
        "PNG",
        0,
        position,
        imgWidth,
        Math.min(imgHeight, pageHeight),
      );
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(
          imgData,
          "PNG",
          0,
          position,
          imgWidth,
          Math.min(imgHeight, pageHeight),
        );
        heightLeft -= pageHeight;
      }

      pdf.save(`Injibara_House_Rentals_Receipt_REC-${p.id || "001"}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("PDF generation failed, please try printing instead.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const fetchMyAds = async () => {
    try {
      const res = await axios.get("/api/seeking-ads/my-ads", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setMyAds(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch my ads", err);
    }
  };

  const fetchWishlists = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      try {
        let localSaved = JSON.parse(
          localStorage.getItem("wishlist_houses") || "[]",
        );
        if (localSaved.length > 0) {
          const housesRes = await axios.get("/api/houses");
          const allHouses = Array.isArray(housesRes.data) ? housesRes.data : [];
          setWishlists(
            allHouses.filter(
              (h) =>
                localSaved.includes(String(h.house_id)) ||
                localSaved.includes(Number(h.house_id)),
            ),
          );
        } else {
          setWishlists([]);
        }
      } catch (e) {
        setWishlists([]);
      }
      return;
    }

    try {
      const res = await axios.get("/api/wishlist", {
        headers: { Authorization: `Bearer ${token}` },
      });
      let serverWishlists = Array.isArray(res.data) ? res.data : [];

      let localSaved = [];
      try {
        localSaved = JSON.parse(
          localStorage.getItem("wishlist_houses") || "[]",
        );
      } catch (e) {
        localSaved = [];
      }

      if (localSaved.length > 0) {
        const housesRes = await axios.get("/api/houses");
        const allHouses = Array.isArray(housesRes.data) ? housesRes.data : [];
        const localHouses = allHouses.filter(
          (h) =>
            localSaved.includes(String(h.house_id)) ||
            localSaved.includes(Number(h.house_id)),
        );

        const existingIds = new Set(serverWishlists.map((h) => h.house_id));
        localHouses.forEach((lh) => {
          if (!existingIds.has(lh.house_id)) {
            serverWishlists.push(lh);
          }
        });
      }

      setWishlists(serverWishlists);
    } catch (err) {
      if (err.response?.status !== 401 && err.response?.status !== 403) {
        console.error("Failed to fetch wishlists", err);
      }
      try {
        let localSaved = JSON.parse(
          localStorage.getItem("wishlist_houses") || "[]",
        );
        if (localSaved.length > 0) {
          const housesRes = await axios.get("/api/houses");
          const allHouses = Array.isArray(housesRes.data) ? housesRes.data : [];
          setWishlists(
            allHouses.filter(
              (h) =>
                localSaved.includes(String(h.house_id)) ||
                localSaved.includes(Number(h.house_id)),
            ),
          );
        } else {
          setWishlists([]);
        }
      } catch (e) {
        setWishlists([]);
      }
    }
  };

  const fetchMyHouses = async () => {
    try {
      const res = await axios.get("/api/houses/my-houses");
      setHouses(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch houses", err);
      setHouses([]);
    }
  };

  const fetchLandlordRequests = async () => {
    try {
      const res = await axios.get("/api/requests/received");
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch requests", err);
      setRequests([]);
    }
  };

  const fetchTenantRequests = async () => {
    try {
      const res = await axios.get("/api/requests/my-requests");
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch requests", err);
      setRequests([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (user?.role === "Landlord") {
      const fee = payConfig?.ad_fee_landlord_post || "250";
      if (fee && fee !== "0") {
        setShowHousePaymentModal(true);
        return;
      }
    }
    await processHouseSubmit(null, null, null);
  };

  const processHouseSubmit = async (
    paymentMethod,
    transactionRef,
    receiptData,
  ) => {
    try {
      const formPayload = new FormData();
      Object.keys(formData).forEach((key) => {
        formPayload.append(key, formData[key]);
      });
      if (imageFile) {
        formPayload.append("image", imageFile);
      }
      if (videoFile) {
        formPayload.append("video", videoFile);
      }
      if (multipleImages.length > 0) {
        multipleImages.forEach((img) => {
          formPayload.append("images", img);
        });
      }
      if (paymentMethod && transactionRef) {
        formPayload.append("payment_method", paymentMethod);
        formPayload.append("transaction_ref", transactionRef);
        if (receiptData) {
          formPayload.append("receipt", receiptData);
        }
      }
      const res = await axios.post("/api/houses", formPayload, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      alert(
        res.data?.message ||
          (language === "am"
            ? "ቤት በተሳካ ሁኔታ ተመዝግቧል!"
            : "House listed successfully!"),
      );

      setShowForm(false);
      setIsCustomCity(false);
      setImageFile(null);
      setVideoFile(null);
      setMultipleImages([]);
      setReceiptFile(null);
      setHouseTransactionRef("");
      setFormData({
        title: "",
        title_am: "",
        description: "",
        description_am: "",
        type: "የመኖሪያ ቤት",
        region: "Injibara",
        city: "Injibara",
        sub_city: "",
        address: "",
        price: "",
        rooms: 1,
        bathrooms: 1,
        square_meter: "",
        image_url: "",
        video_url: "",
      });
      fetchMyHouses();
      fetchMyPayments();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to create house");
    }
  };

  const handleDeleteHouse = async (id) => {
    if (!window.confirm("Are you sure you want to delete this property?"))
      return;
    try {
      await axios.delete(`/api/houses/${id}`);
      fetchMyHouses();
    } catch (err) {
      alert("Failed to delete");
    }
  };

  const handleRequestStatus = async (id, status) => {
    try {
      await axios.put(`/api/requests/${id}/status`, { status });
      fetchLandlordRequests();
      fetchMyHouses();
    } catch (err) {
      alert("Failed to update request");
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(profileData).forEach((key) =>
        formData.append(key, profileData[key] || ""),
      );
      if (profileAvatarFile) {
        formData.append("avatar_file", profileAvatarFile);
      }
      const res = await axios.put("/api/auth/profile", formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setProfileMessage(
        language === "am"
          ? "ፕሮፋይልዎ በተሳካ ሁኔታ ተዘምኗል!"
          : "Profile updated successfully!",
      );
      setTimeout(() => setProfileMessage(""), 3000);
      if (res.data.user) {
        updateUserContext(res.data.user);
        setProfileData({
          name: res.data.user.name || "",
          phone: res.data.user.phone || "",
          region: res.data.user.region || "",
          city: res.data.user.city || "",
          sub_city: res.data.user.sub_city || "",
          address: res.data.user.address || "",
          avatar: res.data.user.avatar || "",
        });
      }
    } catch (err) {
      setProfileMessage(
        language === "am" ? "ፕሮፋይል ማዘመን አልተቻለም።" : "Failed to update profile.",
      );
    }
  };

  const handleAdSubmit = async (e) => {
    e.preventDefault();
    try {
      const formPayload = new FormData();
      Object.keys(adData).forEach((key) => {
        formPayload.append(key, adData[key]);
      });
      formPayload.append("payment_method", tenantPaymentMethod);
      formPayload.append("transaction_ref", tenantTransactionRef);
      if (tenantReceiptFile) {
        formPayload.append("receipt", tenantReceiptFile);
      }

      const res = await axios.post("/api/seeking-ads", formPayload, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      alert(
        res.data?.message ||
          (language === "am"
            ? "ማስታወቂያው በተሳካ ሁኔታ ተመዝግቧል!"
            : "Ad posted successfully!"),
      );

      setAdData({
        title: "",
        description: "",
        budget_max: "",
        preferred_location: "",
      });
      setTenantTransactionRef("");
      setTenantReceiptFile(null);
      setShowForm(false);
      fetchMyAds();
      fetchMyPayments();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to post ad");
    }
  };

  const handleDeleteAd = async (id) => {
    if (!window.confirm("Are you sure you want to delete this request?"))
      return;
    try {
      await axios.delete(`/api/seeking-ads/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      fetchMyAds();
    } catch (err) {
      alert("Failed to delete ad");
    }
  };

  const selectedRegion = formData.region;
  const cities =
    selectedRegion && Array.isArray(ethiopianLocations[selectedRegion])
      ? ethiopianLocations[selectedRegion]
      : [];

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-80px)] bg-slate-950 w-full overflow-x-hidden">
      {/* Dashboard Sidebar - Desktop & Tablet */}
      <aside
        className={`hidden md:flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 relative z-20 ${
          isSidebarCollapsed ? "w-20" : "w-72"
        }`}
      >
        <div className="p-4 border-b border-slate-800/50 flex items-center justify-between overflow-hidden">
          {!isSidebarCollapsed ? (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center text-slate-950 font-black shadow-md">
                <LayoutDashboard size={16} />
              </div>
              <span className="text-xs font-black text-amber-500 uppercase tracking-wider truncate">
                {t("dashboard")}
              </span>
            </div>
          ) : (
            <div className="mx-auto w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-slate-950 font-black shadow-md">
              <LayoutDashboard size={18} />
            </div>
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`p-2 rounded-xl bg-slate-800 text-amber-400 hover:bg-slate-700 hover:text-white transition-all shadow-sm border border-slate-700/80 active:scale-95 ${isSidebarCollapsed ? "mt-2 mx-auto" : ""}`}
            title={
              isSidebarCollapsed
                ? language === "am"
                  ? "ሳይድባር ክፈት"
                  : "Expand Sidebar"
                : language === "am"
                  ? "ሳይድባር ዘጋ"
                  : "Collapse Sidebar"
            }
            aria-label="Toggle Sidebar"
          >
            {isSidebarCollapsed ? (
              <ChevronRight size={18} />
            ) : (
              <ChevronLeft size={18} />
            )}
          </button>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto custom-scrollbar">
          {filteredTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setShowForm(false);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group cursor-pointer ${
                  isActive
                    ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                } ${isSidebarCollapsed ? "justify-center" : ""}`}
                title={tab.label}
              >
                <Icon
                  size={20}
                  className={
                    isActive
                      ? "text-slate-950"
                      : "text-amber-400/90 group-hover:text-amber-400 group-hover:scale-110 transition-transform"
                  }
                />
                {!isSidebarCollapsed && (
                  <span className="text-sm font-bold truncate">
                    {tab.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Sidebar Modal/Drawer */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-[120] flex overflow-hidden">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="relative bg-slate-900 w-80 max-w-[85vw] h-full shadow-2xl flex flex-col border-r border-slate-800 animate-slideRight">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <LayoutDashboard size={20} className="text-slate-950" />
                </div>
                <div>
                  <span className="font-black text-white text-sm uppercase tracking-wider block">
                    {t("dashboard")}
                  </span>
                  <span className="text-[10px] text-amber-400 font-bold">
                    {user?.role}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition border border-slate-700 flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer group"
                aria-label="Close menu"
                title={language === "am" ? "ዘጋ" : "Close"}
              >
                <X
                  size={18}
                  className="text-amber-400 group-hover:rotate-90 transition-transform duration-300"
                />
                <span>{language === "am" ? "ዘጋ" : "Close"}</span>
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
              {filteredTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setShowForm(false);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3.5 p-3.5 rounded-2xl transition-all cursor-pointer ${
                      isActive
                        ? "bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20"
                        : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                    }`}
                  >
                    <Icon
                      size={20}
                      className={isActive ? "text-slate-950" : "text-amber-400"}
                    />
                    <span className="text-sm font-bold">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar">
        {/* Mobile Top Nav for Dashboard - Inside scroll area to prevent layout overlap */}
        <div className="md:hidden sticky top-0 z-[30] bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3.5 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center shadow-md text-slate-950 font-black shrink-0">
              <LayoutDashboard size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-black text-white text-xs uppercase tracking-wider block truncate">
                {t("dashboard")}
              </span>
              <span className="text-amber-400 text-[11px] font-bold truncate block">
                {filteredTabs.find((t) => t.id === activeTab)?.label || ""}
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="px-4 py-2.5 bg-amber-500 text-slate-950 hover:bg-amber-400 font-black rounded-xl flex items-center gap-2 text-xs sm:text-sm active:scale-95 transition-all shadow-lg shadow-amber-500/20 border border-amber-400 cursor-pointer shrink-0"
            aria-label="Open sidebar menu"
          >
            <Menu size={20} />
            <span className="whitespace-nowrap font-black tracking-wide">
              {language === "am" ? "ማውጫ" : "Menu"}
            </span>
          </button>
        </div>

        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
          <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-center shadow-2xl border border-slate-800 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
              <HomeIcon className="w-64 h-64 text-amber-500" />
            </div>
            <div className="relative z-10 flex items-center gap-6 mb-6 md:mb-0">
              <div className="relative">
                {user?.avatar ? (
                  <OptimizedImage
                    src={user.avatar}
                    alt={user.name}
                    className="w-20 h-20 rounded-2xl object-cover shadow-2xl border-2 border-amber-500/50"
                    width={80}
                    height={80}
                  />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center text-3xl font-black text-slate-950 shadow-2xl">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-slate-900"
                  title="Online"
                />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none mb-2">
                  {user?.name}
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-amber-500/10 text-amber-400 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
                    {user?.role} {t("dashboard")}
                  </span>
                  <span className="text-slate-400 text-xs font-medium">
                    {user?.email}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {user?.role === "Tenant" && (
                <button
                  onClick={() => navigate("/messages?user=1")}
                  className="relative z-10 bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 py-3 rounded-xl font-black shadow-lg transition uppercase tracking-wider text-xs flex items-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />{" "}
                  {t("requestPropertyPost")}
                </button>
              )}

              {(user?.role === "Landlord" || user?.role === "Admin") && (
                <button
                  onClick={() => {
                    setShowForm(!showForm);
                    setActiveTab("properties");
                  }}
                  className={`relative z-10 px-5 py-3 rounded-xl font-black shadow-lg transition uppercase tracking-wider text-xs flex items-center gap-2 cursor-pointer ${
                    showForm
                      ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      : "bg-amber-500 hover:bg-amber-400 text-slate-950"
                  }`}
                >
                  {showForm ? (
                    t("cancel")
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> {t("addProperty")}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Tenant Requests View */}
          {user?.role === "Tenant" && activeTab === "requests" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(Array.isArray(requests) ? requests : []).map((req) => (
                <div
                  key={req.request_id}
                  className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 overflow-hidden hover:border-slate-700 transition"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <span
                        className={`px-3 py-1 text-xs font-black rounded-full ${req.status === "Approved" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : req.status === "Rejected" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"}`}
                      >
                        {req.status}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-white mb-2">
                      {req.title}
                    </h3>
                    <div className="flex items-center text-slate-400 text-xs mb-3">
                      <MapPin className="w-4 h-4 mr-1 text-amber-400 shrink-0" />
                      {req.city}, {req.region}
                    </div>
                    {req.message && (
                      <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl mb-4 border border-slate-800">
                        {req.message}
                      </p>
                    )}
                    <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                      <span className="font-black text-amber-400 text-base">
                        {req.price?.toLocaleString()} ETB/mo
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {formatEthiopianDate(req.created_at, true)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {(!Array.isArray(requests) || requests.length === 0) && (
                <div className="col-span-full py-16 text-center bg-slate-900/60 rounded-2xl border border-slate-800 border-dashed">
                  <p className="text-slate-400 font-bold text-sm">
                    You haven't made any rental requests yet.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Landlord Views */}
          {(user?.role === "Landlord" || user?.role === "Admin") &&
            activeTab === "properties" &&
            showForm && (
              <div className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 p-6 sm:p-8 mb-8 text-white">
                <div className="flex flex-col lg:flex-row gap-8">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                          <HomeIcon className="text-amber-400 w-6 h-6" />{" "}
                          {t("addPropertyTitle")}
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">
                          {t("addPropertySubtitle")}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowForm(false)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                      >
                        ✕ {t("close")}
                      </button>
                    </div>

                    <form
                      onSubmit={handleSubmit}
                      className="grid grid-cols-1 gap-y-5 sm:grid-cols-6 gap-x-5"
                    >
                      {user?.role === "Admin" && (
                        <div className="sm:col-span-6 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                          <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1.5">
                            {t("ownerSelection")} (Admin Only) *
                          </label>
                          <select
                            value={formData.owner_id || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                owner_id: e.target.value,
                              })
                            }
                            className="block w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                          >
                            <option value="">
                              {t("ownerSelectPlaceholder")}
                            </option>
                            {landlordsList.map((l) => (
                              <option key={l.user_id} value={l.user_id}>
                                {l.name} ({l.role}) - {l.phone || l.email}
                              </option>
                            ))}
                          </select>
                          <p className="text-[11px] text-slate-400 mt-1">
                            {t("ownerSelectDesc")}
                          </p>
                        </div>
                      )}

                      <div className="sm:col-span-4">
                        <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">
                          {t("propertyTitle")} *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.title}
                          onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                          }
                          className="block w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                          placeholder={t("propertyTitlePlaceholder")}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">
                          {t("propertyType")} *
                        </label>
                        <select
                          required
                          value={formData.type}
                          onChange={(e) =>
                            setFormData({ ...formData, type: e.target.value })
                          }
                          className="block w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                        >
                          <option value="የመኖሪያ ቤት">
                            {t("residentialHouse")}
                          </option>
                          <option value="የንግድ ሱቅ">{t("commercialShop")}</option>
                          <option value="ለሆቴል እና ለምግብ (ሽሮ) ቤት">
                            {t("hotelShiro")}
                          </option>
                          <option value="ለኤሌክትሮኒክስ እና ፎቶ ቤት">
                            {t("electronicsPhoto")}
                          </option>
                          <option value="ለፋርማሲ እና ክሊኒክ">
                            {t("pharmacyClinic")}
                          </option>
                          <option value="ሌሎች የንግድና የአገልግሎት ቦታዎች">
                            {t("otherCommercial")}
                          </option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">
                          ክልል / አካባቢ (Region) *
                        </label>
                        <select
                          required
                          value={formData.region}
                          onChange={(e) =>
                            setFormData({ ...formData, region: e.target.value })
                          }
                          className="block w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                        >
                          <option value="Injibara">
                            እንጅባራ እና አካባቢው (Injibara & Area)
                          </option>
                          <option value="Bahir Dar">ባህር ዳር (Bahir Dar)</option>
                          <option value="Gondar">ጎንደር (Gondar)</option>
                          <option value="Dessie">ደሴ (Dessie)</option>
                          <option value="Awi Zone">አዊ ዞን (Awi Zone)</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider">
                            ዞን / ከተማ (City/Zone) *
                          </label>
                        </div>

                        <input
                          type="text"
                          required
                          list="dashboard-city-options"
                          value={formData.city}
                          onChange={(e) =>
                            setFormData({ ...formData, city: e.target.value })
                          }
                          className="block w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                          placeholder="ምሳሌ፡ Injibara, Dangila, Chagni..."
                        />
                        <datalist id="dashboard-city-options">
                          <option value="Injibara">እንጅባራ ከተማ (Injibara)</option>
                          <option value="Dangila">ዳንግላ (Dangila)</option>
                          <option value="Chagni">ጫግኒ (Chagni)</option>
                          <option value="Addis Ababa">
                            አዲስ አበባ (Addis Ababa)
                          </option>
                        </datalist>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">
                          ወረዳ / ክፍለ ከተማ (Sub-City)
                        </label>
                        <input
                          type="text"
                          value={formData.sub_city}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              sub_city: e.target.value,
                            })
                          }
                          className="block w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                          placeholder="ምሳሌ፡ ወረዳ 01 / አዊ"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">
                          የወር ኪራይ በብር (Rent Price ETB/mo) *
                        </label>
                        <input
                          type="number"
                          required
                          value={formData.price}
                          onChange={(e) =>
                            setFormData({ ...formData, price: e.target.value })
                          }
                          className="block w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white font-black text-amber-400 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                          placeholder="ምሳሌ፡ 8500"
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">
                          ክፍሎች (Rooms)
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={formData.rooms}
                          onChange={(e) =>
                            setFormData({ ...formData, rooms: e.target.value })
                          }
                          className="block w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white focus:border-amber-500 focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">
                          መታጠቢያ (Baths)
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={formData.bathrooms}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              bathrooms: e.target.value,
                            })
                          }
                          className="block w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white focus:border-amber-500 focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">
                          ስፋት በካሬ ሜትር (Square Meters)
                        </label>
                        <input
                          type="number"
                          value={formData.square_meter}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              square_meter: e.target.value,
                            })
                          }
                          className="block w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                          placeholder="ምሳሌ፡ 120"
                        />
                      </div>

                      <div className="sm:col-span-6">
                        <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">
                          ቀበሌ / ሰፈር / ልዩ ቦታ አድራሻ (Kebele & Address) *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.address}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              address: e.target.value,
                            })
                          }
                          className="block w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                          placeholder="ምሳሌ፡ ቀበሌ 01 ከሆስፒታሉ ጀርባ / Near Injibara Referral Hospital"
                        />
                      </div>

                      {/* Additional Amenities */}
                      <div className="sm:col-span-6 bg-slate-950/90 p-4 rounded-2xl border border-slate-800">
                        <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2.5">
                          የቤቱ አገልግሎቶችና ምቾቶች (Amenities)
                        </h4>
                        <div className="flex flex-wrap gap-4 text-xs text-slate-300">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              className="w-4 h-4 accent-amber-500 rounded"
                              onChange={(e) => {
                                const desc = formData.description;
                                const text = "Has Water (ውሃ አለው)";
                                if (e.target.checked)
                                  setFormData({
                                    ...formData,
                                    description: desc
                                      ? desc + "\n- " + text
                                      : "- " + text,
                                  });
                              }}
                            />
                            <span>ውሃ አለው (Water Tank)</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              className="w-4 h-4 accent-amber-500 rounded"
                              onChange={(e) => {
                                const desc = formData.description;
                                const text = "Has Electricity (መብራት አለው)";
                                if (e.target.checked)
                                  setFormData({
                                    ...formData,
                                    description: desc
                                      ? desc + "\n- " + text
                                      : "- " + text,
                                  });
                              }}
                            />
                            <span>የራሱ መብራት ቆጣሪ (Separate Meter)</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              className="w-4 h-4 accent-amber-500 rounded"
                              onChange={(e) => {
                                const desc = formData.description;
                                const text = "Has Fence (አጥር አለው)";
                                if (e.target.checked)
                                  setFormData({
                                    ...formData,
                                    description: desc
                                      ? desc + "\n- " + text
                                      : "- " + text,
                                  });
                              }}
                            />
                            <span>የተጠበቀ አጥር (Fenced Compound)</span>
                          </label>
                        </div>
                      </div>

                      {/* Multi-Image Upload */}
                      <div className="sm:col-span-6">
                        <MultiImageUploader
                          images={multipleImages}
                          onChange={setMultipleImages}
                          disabled={false}
                        />
                      </div>

                      {/* Video Upload */}
                      <div className="sm:col-span-6">
                        <VideoUploader
                          video={videoFile}
                          onChange={setVideoFile}
                          disabled={false}
                        />
                      </div>

                      <div className="sm:col-span-6">
                        <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">
                          ስለ ቤቱ ዝርዝር መግለጫ (Detailed Description) *
                        </label>
                        <textarea
                          rows={3}
                          required
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              description: e.target.value,
                            })
                          }
                          className="block w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                          placeholder="ስለ ቤቱ አቀማመጥ፣ ምቾት እና ተጨማሪ መረጃዎችን እዚህ ይጻፉ..."
                        />
                      </div>

                      <div className="sm:col-span-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => setShowForm(false)}
                          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          ሰርዝ (Cancel)
                        </button>

                        <button
                          type="submit"
                          className="px-8 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition cursor-pointer"
                        >
                          ቤቱን መዝግብ (Save Property)
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Guidance Panel */}
                  <div className="lg:w-80 flex-shrink-0 bg-gradient-to-br from-amber-500/10 to-slate-950 rounded-3xl p-6 border border-amber-500/20 shadow-2xl h-fit sticky top-24 backdrop-blur-md">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center shadow-lg text-slate-950 font-black">
                        <Info className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-black text-lg text-white leading-tight">
                          የአመዘጋገብ መመሪያ
                        </h3>
                        <p className="text-amber-400 font-bold text-[10px] uppercase tracking-widest">
                          {t("listingGuide")}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-base">📍</span>
                          <h4 className="font-bold text-xs text-amber-300">
                            ትክክለኛ አድራሻ
                          </h4>
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          ከተማ፣ ወረዳ እና ቀበሌ በግልፅ ያስገቡ። ለምሳሌ፡ እንጅባራ ቀበሌ 01 ዩኒቨርሲቲ
                          አካባቢ።
                        </p>
                      </div>

                      <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-base">🏠</span>
                          <h4 className="font-bold text-xs text-amber-300">
                            ክፍሎች እና አገልግሎት
                          </h4>
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          የክፍሎች ብዛት፣ የውሃ ታንከር፣ የመብራት ቆጣሪ እና የአጥር ሁኔታ መኖሩን ምልክት
                          ያድርጉ።
                        </p>
                      </div>

                      <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-base">📸</span>
                          <h4 className="font-bold text-xs text-amber-300">
                            ጥራት ያለው ምስል
                          </h4>
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          ከስልክዎ ግልፅ ፎቶ ይምረጡ ወይም የምስል ሊንክ (URL) ያስገቡ።
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {(user?.role === "Landlord" || user?.role === "Admin") &&
            activeTab === "properties" &&
            !showForm && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {(Array.isArray(houses) ? houses : []).map((house) => (
                  <div
                    key={house.house_id}
                    className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 overflow-hidden flex flex-col group hover:border-slate-700 transition-all"
                  >
                    <div className="h-56 relative overflow-hidden">
                      <OptimizedImage
                        src={
                          house.image_url ||
                          "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80"
                        }
                        className="w-full h-full"
                        imgClassName="group-hover:scale-105"
                        alt={house.title}
                      />
                      <div className="absolute top-4 left-4 flex flex-col gap-1">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${house.status === "Available" ? "bg-emerald-500 text-slate-950" : house.status === "Rented" ? "bg-amber-500 text-slate-950" : "bg-rose-500 text-white"}`}
                        >
                          {house.status}
                        </span>
                        <span className="bg-emerald-600/90 text-white font-bold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-md backdrop-blur-md">
                          <Clock size={12} /> 30-Day Free Active
                        </span>
                        {house.is_featured === 1 && (
                          <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-md">
                            <Sparkles size={12} /> ⭐ VIP Featured
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="text-xl font-black text-white mb-2">
                        {house.title}
                      </h3>
                      <div className="flex items-center text-slate-400 text-xs mb-4">
                        <MapPin className="w-4 h-4 mr-1 text-amber-400 shrink-0" />{" "}
                        {house.sub_city ? `${house.sub_city}, ` : ""}
                        {house.city}
                      </div>
                      <div className="mt-auto pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                        <span className="font-black text-amber-400 text-base">
                          {house.price?.toLocaleString()} ETB/mo
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setPromotionHouseId(house.house_id);
                              setPromotionAdType("Featured Listing");
                              setIsAdPaymentModalOpen(true);
                            }}
                            className="bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 border border-amber-500/30 cursor-pointer"
                          >
                            <Sparkles size={14} /> Promote
                          </button>
                          <button
                            onClick={() => handleDeleteHouse(house.house_id)}
                            className="text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 p-2 rounded-xl transition border border-rose-500/20 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {(!Array.isArray(houses) || houses.length === 0) && (
                  <div className="col-span-full text-center py-20 bg-slate-900/60 rounded-2xl border border-slate-800 border-dashed">
                    <HomeIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-white">
                      {t("noPropertiesListed")}
                    </h3>
                    <button
                      onClick={() => setShowForm(true)}
                      className="mt-4 text-amber-400 font-bold hover:text-amber-300 cursor-pointer"
                    >
                      {t("addYourFirstProperty")}
                    </button>
                  </div>
                )}
              </div>
            )}

          {(user?.role === "Landlord" || user?.role === "Admin") &&
            activeTab === "requests" && (
              <div className="bg-slate-900 shadow-xl border border-slate-800 rounded-2xl overflow-hidden">
                <ul className="divide-y divide-slate-800">
                  {(Array.isArray(requests) ? requests : []).map((req) => (
                    <li
                      key={req.request_id}
                      className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-800/50 transition"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-lg text-lg">
                          {req.tenant_name
                            ? req.tenant_name.charAt(0).toUpperCase()
                            : "T"}
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-white">
                            {req.tenant_name}
                          </h4>
                          <p className="text-sm text-slate-400">
                            {req.tenant_email}
                          </p>
                          <div className="mt-2 text-xs text-slate-300 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl inline-block">
                            Requesting:{" "}
                            <span className="font-bold text-amber-400">
                              {req.house_title}
                            </span>
                          </div>
                          {req.message && (
                            <p className="text-xs text-slate-300 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl mt-2 max-w-md">
                              {req.message}
                            </p>
                          )}
                          <p className="text-xs text-slate-400 mt-1.5">
                            Submitted:{" "}
                            {formatEthiopianDate(req.created_at, true)} (
                            {formatEthiopianDate(req.created_at)})
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {req.status === "Pending" ? (
                          <>
                            <button
                              onClick={() =>
                                handleRequestStatus(req.request_id, "Approved")
                              }
                              className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 py-2.5 rounded-xl font-black transition uppercase text-xs tracking-wider cursor-pointer shadow-md"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() =>
                                handleRequestStatus(req.request_id, "Rejected")
                              }
                              className="bg-slate-800 text-slate-300 border border-slate-700 px-5 py-2.5 rounded-xl font-bold hover:bg-slate-700 transition uppercase text-xs tracking-wider cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span
                            className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${req.status === "Approved" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/20 text-rose-400 border border-rose-500/30"}`}
                          >
                            {req.status}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                  {(!Array.isArray(requests) || requests.length === 0) && (
                    <li className="p-16 text-center text-slate-400 font-bold">
                      You haven't received any rental requests yet.
                    </li>
                  )}
                </ul>
              </div>
            )}

          {/* Profile View */}
          {activeTab === "profile" && (
            <div className="bg-slate-900 rounded-3xl shadow-xl border border-slate-800 p-8 mb-8 max-w-4xl">
              <h2 className="text-2xl font-black text-white mb-2">
                {language === "am" ? "ፕሮፋይልዎን ያስተካክሉ" : "Edit Profile"}
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                {language === "am"
                  ? "የግል መረጃዎን እና የመገለጫ ምስልዎን እዚህ ያዘምኑ።"
                  : "Update your personal information and profile avatar here."}
              </p>
              {profileMessage && (
                <div className="mb-4 text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-xs">
                  {profileMessage}
                </div>
              )}
              <form
                onSubmit={handleProfileSubmit}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    {language === "am" ? "ሙሉ ስም *" : "Full Name *"}
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-950 border-slate-800 rounded-xl shadow-sm py-2.5 px-3.5 border focus:ring-amber-500 focus:border-amber-500 text-white text-sm"
                    value={profileData.name}
                    onChange={(e) =>
                      setProfileData({ ...profileData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    {language === "am" ? "ስልክ ቁጥር *" : "Phone Number *"}
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-950 border-slate-800 rounded-xl shadow-sm py-2.5 px-3.5 border focus:ring-amber-500 focus:border-amber-500 text-white text-sm"
                    value={profileData.phone}
                    onChange={(e) =>
                      setProfileData({ ...profileData, phone: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <ImageInputSelector
                    imageFile={profileAvatarFile}
                    setImageFile={setProfileAvatarFile}
                    imageUrl={profileData.avatar}
                    setImageUrl={(url) =>
                      setProfileData((prev) => ({ ...prev, avatar: url }))
                    }
                    label={
                      language === "am"
                        ? "የመገለጫ ፎቶ (አቫታር) *"
                        : "Profile Avatar *"
                    }
                    subLabel={
                      language === "am"
                        ? "ከስልክዎ ፎቶ አፕሎድ ያድርጉ ወይም የምስል ሊንክ ያስገቡ"
                        : "Upload photo from your device or enter image URL"
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    {language === "am" ? "ክልል" : "Region"}
                  </label>
                  <select
                    className="w-full bg-slate-950 border-slate-800 rounded-xl shadow-sm py-2.5 px-3.5 border focus:ring-amber-500 focus:border-amber-500 text-white text-sm"
                    value={profileData.region}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        region: e.target.value,
                        city: "",
                      })
                    }
                  >
                    <option value="">Select Region</option>
                    {regions.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    {language === "am" ? "ከተማ" : "City"}
                  </label>
                  <input
                    type="text"
                    list="profile-city-options"
                    className="w-full bg-slate-950 border-slate-800 rounded-xl shadow-sm py-2.5 px-3.5 border focus:ring-amber-500 focus:border-amber-500 text-white text-sm"
                    value={profileData.city}
                    onChange={(e) =>
                      setProfileData({ ...profileData, city: e.target.value })
                    }
                    placeholder="Select or type city..."
                  />
                  <datalist id="profile-city-options">
                    {(ethiopianLocations[profileData.region] || []).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    {language === "am" ? "ወረዳ / ክፍለ ከተማ" : "Sub City"}
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-950 border-slate-800 rounded-xl shadow-sm py-2.5 px-3.5 border focus:ring-amber-500 focus:border-amber-500 text-white text-sm"
                    value={profileData.sub_city}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        sub_city: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    {language === "am" ? "ዝርዝር አድራሻ" : "Address Details"}
                  </label>
                  <textarea
                    className="w-full bg-slate-950 border-slate-800 rounded-xl shadow-sm py-2.5 px-3.5 border focus:ring-amber-500 focus:border-amber-500 text-white text-sm"
                    rows="3"
                    value={profileData.address}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        address: e.target.value,
                      })
                    }
                  ></textarea>
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 px-8 rounded-xl shadow-lg transition text-xs uppercase tracking-wider cursor-pointer"
                  >
                    ፕሮፋይል አዘምን (Save Profile Changes)
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tenant Seeking Ads View */}
          {user?.role === "Tenant" && activeTab === "seeking_ads" && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-white">
                  {t("myHouseSeekingAds")}
                </h2>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-6 py-2.5 rounded-xl font-black flex items-center gap-2 transition cursor-pointer shadow-lg text-xs uppercase tracking-wider"
                >
                  <Plus size={18} /> {showForm ? "Cancel" : "Create New Ad"}
                </button>
              </div>

              {showForm && (
                <div className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 p-8 mb-8 max-w-4xl">
                  <h3 className="text-xl font-black text-white mb-6">
                    What kind of house are you looking for?
                  </h3>
                  <form onSubmit={handleAdSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        {language === "am"
                          ? "ዋና ርዕስ (ምሳሌ፡ እንጅባራ ቀበሌ 01 2 ክፍል ቤት እፈልጋለሁ)"
                          : "Headline (e.g. Looking for a 2-bedroom in Injibara Kebele 01)"}
                      </label>
                      <input
                        required
                        type="text"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                        value={adData.title}
                        onChange={(e) =>
                          setAdData({ ...adData, title: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        {language === "am"
                          ? "ዝርዝር መረጃ (የቤተሰብ ብዛት፣ የሚፈልጉት ተጨማሪ ነገሮች...)"
                          : "Detailed Description (Amenities needed, family size, etc.)"}
                      </label>
                      <textarea
                        required
                        rows="4"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                        value={adData.description}
                        onChange={(e) =>
                          setAdData({ ...adData, description: e.target.value })
                        }
                      ></textarea>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          {t("houseType") || "የቤት ዓይነት (House Type)"}
                        </label>
                        <select
                          required
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                          value={adData.house_type || "Apartment"}
                          onChange={(e) =>
                            setAdData({ ...adData, house_type: e.target.value })
                          }
                        >
                          <option value="Apartment">አፓርትመንት (Apartment)</option>
                          <option value="Condominium">
                            ኮንዶሚኒየም (Condominium)
                          </option>
                          <option value="Villa">ቪላ (Villa)</option>
                          <option value="Studio">ስቱዲዮ (Studio)</option>
                          <option value="Commercial">ለንግድ (Commercial)</option>
                          <option value="Warehouse">መጋዘን (Warehouse)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          {language === "am"
                            ? "ከፍተኛ በጀት (ብር/በወር)"
                            : "Max Budget (ETB/month)"}
                        </label>
                        <input
                          required
                          type="number"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                          value={adData.budget_max}
                          onChange={(e) =>
                            setAdData({ ...adData, budget_max: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          {t("preferredLocation")}
                        </label>
                        <input
                          required
                          type="text"
                          placeholder="e.g. Kebele 01, University Area"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                          value={adData.preferred_location}
                          onChange={(e) =>
                            setAdData({
                              ...adData,
                              preferred_location: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    {/* Service Fee Payment for Tenants */}
                    <div className="bg-slate-950 p-6 rounded-2xl border border-amber-500/30 text-white mt-6">
                      <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-amber-500" />{" "}
                        የአገልግሎት ክፍያ (Service Fee Payment)
                      </h3>
                      <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                        ማስታወቂያዎ እንዲለጠፍ እባክዎን የአገልግሎት ክፍያ{" "}
                        <strong>
                          {payConfig.fees?.tenant_seeking || "200"} ብር
                        </strong>{" "}
                        ከታች ባሉት የባንክ አካውንቶች ያስገቡና የክፍያ ማረጋገጫውን እዚህ ይሙሉ።
                      </p>

                       {/* Bank Info Cards */}
                       {Object.keys(payConfig.payments || {}).length === 0 ? (
                         <div className="text-xs text-slate-500 text-center py-2 col-span-full">
                           {language === "am"
                             ? "በአሁኑ ሰዓት የክፍያ መረጃ የለም።"
                             : "No payment methods configured."}
                         </div>
                       ) : (
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                           {Object.entries(payConfig.payments || {}).map(([key, val]) => {
                             const label =
                               key === "telebirr"
                                 ? "Telebirr"
                                 : key === "cbe"
                                   ? "CBE"
                                   : key === "abyssinia"
                                     ? "Abyssinia"
                                     : key === "mpesa"
                                       ? "M-Pesa"
                                       : key === "amhara"
                                         ? "Amhara"
                                         : key;
                             const icon =
                               key === "telebirr"
                                 ? "📱"
                                 : key === "mpesa"
                                   ? "💸"
                                   : "🏦";
                             const accountValue = val.account || val.phone || "";
                             const accountName = val.name || "";
                             const valueLabel =
                               key === "telebirr"
                                 ? language === "am"
                                   ? "የስልክ ቁጥር"
                                   : "Phone Number"
                                 : language === "am"
                                   ? "የሂሳብ ቁጥር"
                                   : "Account Number";

                             return (
                               <div
                                 key={key}
                                 className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs"
                               >
                                 <div className="font-bold text-amber-400 mb-1 flex items-center gap-1 font-sans">
                                   {icon} {label}
                                 </div>
                                 <div className="text-[11px] text-slate-400">
                                   {valueLabel}:{" "}
                                   <span className="font-mono text-white text-xs font-bold">
                                     {accountValue}
                                   </span>
                                 </div>
                                 <div className="text-[11px] text-slate-400">
                                   {language === "am" ? "ስም (Name)" : "Name"}:{" "}
                                   <span className="text-white font-semibold">
                                     {accountName}
                                   </span>
                                 </div>
                               </div>
                             );
                           })}
                         </div>
                       )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                            {language === "am"
                              ? "የከፈሉበት ዘዴ *"
                              : "Payment Method *"}
                          </label>
                           <select
                             value={tenantPaymentMethod}
                             onChange={(e) =>
                               setTenantPaymentMethod(e.target.value)
                             }
                             className="block w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:border-amber-500 focus:outline-none"
                           >
                              {Object.keys(payConfig.payments || {}).map((key) => {
                                const label =
                                  key === "telebirr"
                                    ? "Telebirr"
                                    : key === "cbe"
                                      ? "CBE"
                                      : key === "abyssinia"
                                        ? "Abyssinia"
                                        : key === "mpesa"
                                          ? "M-Pesa"
                                          : key === "amhara"
                                            ? "Amhara"
                                            : key;
                                return (
                                  <option key={key} value={key}>
                                    {label}
                                  </option>
                                );
                              })}
                           </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                            {language === "am"
                              ? "የትራንዛክሽን ቁጥር *"
                              : "Transaction Ref Number *"}
                          </label>
                          <input
                            type="text"
                            required
                            value={tenantTransactionRef}
                            onChange={(e) =>
                              setTenantTransactionRef(e.target.value)
                            }
                            placeholder="ምሳሌ፡ FT231..."
                            className="block w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                          />
                        </div>
                      </div>

                       <div className="mt-4 bg-slate-900 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-3">
                         {tenantPaymentMethod && payConfig.payments && (() => {
                           const selectedKey = payConfig.payments[tenantPaymentMethod] ? tenantPaymentMethod : null;

                           if (!selectedKey) {
                             return (
                               <p className="text-slate-400 text-center py-2">
                                 {language === "am"
                                   ? "እባክዎን የክፍያ ዘዴ ይምረጡ"
                                   : "Please select a payment method above"}
                               </p>
                             );
                           }

                           const payment = payConfig.payments[selectedKey];
                           const accountValue = payment.account || payment.phone || "";
                           const accountName = payment.name || "";
                           const valueLabel =
                             selectedKey === "telebirr"
                               ? language === "am"
                                 ? "የስልክ ቁጥር"
                                 : "Phone Number"
                               : language === "am"
                                 ? "የሂሳብ ቁጥር"
                                 : "Account Number";

                           return (
                             <>
                               <p className="text-slate-400 font-semibold">
                                 {valueLabel}:
                               </p>
                               <p className="text-amber-400 font-mono font-bold text-sm">
                                 {accountValue}
                               </p>
                               <p className="text-slate-400 font-semibold">
                                 {language === "am" ? "የሂሳብ ስም" : "Account Name"}:
                               </p>
                               <p className="text-slate-200">{accountName}</p>
                             </>
                           );
                         })()}
                       </div>

                      <div className="mt-4">
                        <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                          {language === "am"
                            ? "የክፍያ ደረሰኝ ፎቶ (አማራጭ)"
                            : "Receipt Image / PDF (Optional)"}
                        </label>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 cursor-pointer bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white px-4 py-2 rounded-xl text-xs transition">
                            <Upload className="w-4 h-4 text-amber-400" />
                            <span>
                              {language === "am" ? "ፋይል ምረጥ" : "Choose File"}
                            </span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              className="hidden"
                              onChange={(e) =>
                                setTenantReceiptFile(e.target.files[0])
                              }
                            />
                          </label>
                          <span className="text-[11px] text-slate-400 truncate">
                            {tenantReceiptFile
                              ? tenantReceiptFile.name
                              : language === "am"
                                ? "ምንም ፋይል አልተመረጠም"
                                : "No file chosen"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full md:w-auto bg-amber-500 text-slate-950 font-black py-3 px-8 rounded-xl mt-4 hover:bg-amber-400 transition shadow-lg cursor-pointer text-xs uppercase tracking-wider"
                    >
                      {t("postRequestAd")}
                    </button>
                  </form>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {!myAds || myAds.length === 0 ? (
                  <div className="col-span-full bg-slate-900/60 p-12 rounded-2xl border border-dashed border-slate-800 text-center text-slate-400 font-bold">
                    You haven't posted any seeking ads yet.
                  </div>
                ) : (
                  (myAds || []).map((ad) => (
                    <div
                      key={ad.id}
                      className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 p-6 flex flex-col hover:border-slate-700 transition"
                    >
                      <h3 className="text-lg font-black text-white mb-2">
                        {ad.title}
                      </h3>
                      <p className="text-sm text-slate-300 mb-4 flex-1">
                        {ad.description}
                      </p>
                      <div className="flex justify-between items-end mb-4 border-t border-slate-800 pt-4">
                        <div className="text-xs font-bold text-slate-400 flex flex-col gap-1">
                          <span className="flex items-center gap-1 text-slate-300">
                            <MapPin size={14} className="text-amber-400" />{" "}
                            {ad.preferred_location}
                          </span>
                          <span className="text-amber-400 font-black text-sm">
                            ETB {Number(ad.budget_max).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setPromotionSeekingAdId(ad.id);
                            setPromotionAdType("Tenant Seeking Ad");
                            setIsAdPaymentModalOpen(true);
                          }}
                          className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1 cursor-pointer shadow-md"
                        >
                          <Sparkles size={14} /> Promote (ማስታወቂያ)
                        </button>
                        <button
                          onClick={() => handleDeleteAd(ad.id)}
                          className="px-3 text-center text-rose-400 hover:bg-rose-500/20 font-bold py-2.5 rounded-xl transition border border-rose-500/20 text-xs cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Saved Alerts View */}
          {activeTab === "alerts" && user?.role === "Tenant" && (
            <div className="space-y-8">
              <div className="bg-[#1A1A1A] rounded-3xl p-8 text-white shadow-2xl border border-gray-800 relative overflow-hidden">
                <div className="absolute -right-10 -top-10 opacity-10">
                  <Bell size={200} className="text-yellow-500" />
                </div>
                <div className="relative z-10 max-w-2xl">
                  <div className="inline-flex items-center gap-2 bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4">
                    <Sparkles size={12} /> Automated Property Alerts
                  </div>
                  <h2 className="text-3xl font-black mb-3">
                    አውቶማቲክ የቤት ፍለጋ ማሳወቂያ (Property Alerts)
                  </h2>
                  <p className="text-gray-400 text-sm leading-relaxed mb-6">
                    የሚፈልጉትን የቤት አይነት እና ዋጋ እዚህ ያስመዝግቡ። የእርስዎ መስፈርት ጋር የሚስማማ አዲስ
                    ቤት ሲመዘገብ ወዲያውኑ በኢሜይል (Email) እና በስልክዎ ማሳወቂያ ይደርስዎታል።
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-300 bg-gray-800/50 px-4 py-2 rounded-xl">
                      <CheckCircle size={14} className="text-emerald-500" />{" "}
                      Real-time Email Notifications
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-300 bg-gray-800/50 px-4 py-2 rounded-xl">
                      <CheckCircle size={14} className="text-emerald-500" />{" "}
                      Instant Match Dashboard
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create Alert Form */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sticky top-24">
                    <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                      <Plus className="text-amber-500" /> አዲስ መስፈርት መዝግብ
                    </h3>
                    <form onSubmit={handleCreateAlert} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5">
                          የቤት አይነት (House Type)
                        </label>
                        <select
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition"
                          value={alertForm.house_type}
                          onChange={(e) =>
                            setAlertForm({
                              ...alertForm,
                              house_type: e.target.value,
                            })
                          }
                        >
                          <option value="All">ሁሉም (All Types)</option>
                          <option value="የመኖሪያ ቤት">
                            የመኖሪያ ቤት (Residential)
                          </option>
                          <option value="የንግድ ሱቅ">
                            የንግድ ሱቅ (Commercial Shop)
                          </option>
                          <option value="ለሆቴል እና ለምግብ (ሽሮ) ቤት">
                            ለሆቴል እና ለምግብ ቤት
                          </option>
                          <option value="ለፋርማሲ እና ክሊኒክ">ለፋርማሲ እና ክሊኒክ</option>
                          <option value="ለኤሌክትሮኒክስ እና ፎቶ ቤት">
                            ለኤሌክትሮኒክስ እና ፎቶ ቤት
                          </option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5">
                            ዝቅተኛ ዋጋ (Min Budget)
                          </label>
                          <input
                            type="number"
                            placeholder="0"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition"
                            value={alertForm.min_price}
                            onChange={(e) =>
                              setAlertForm({
                                ...alertForm,
                                min_price: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5">
                            ከፍተኛ ዋጋ (Max Budget)
                          </label>
                          <input
                            type="number"
                            placeholder="ምሳሌ: 10000"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition"
                            value={alertForm.max_price}
                            onChange={(e) =>
                              setAlertForm({
                                ...alertForm,
                                max_price: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5">
                          የቦታ ቁልፍ ቃል (Location/Keyword)
                        </label>
                        <input
                          type="text"
                          placeholder="ምሳሌ: ቀበሌ 01, ዩኒቨርሲቲ..."
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition"
                          value={alertForm.location_keyword}
                          onChange={(e) =>
                            setAlertForm({
                              ...alertForm,
                              location_keyword: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5">
                          የማሳወቂያ ኢሜይል (Alert Email)
                        </label>
                        <input
                          type="email"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition"
                          value={alertForm.notification_email}
                          onChange={(e) =>
                            setAlertForm({
                              ...alertForm,
                              notification_email: e.target.value,
                            })
                          }
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3.5 rounded-xl shadow-lg transition text-[11px] uppercase tracking-widest mt-4"
                      >
                        መስፈርቱን መዝግብ (Save Alert Criteria)
                      </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-gray-100">
                      <h4 className="text-xs font-black text-gray-900 mb-2">
                        የተስተካከሉ ንብረቶች (Matched Properties)
                      </h4>
                      <p className="text-[10px] text-gray-500 mb-4">
                        ከእርስዎ የፍለጋ መስፈርት ጋር የሚስማማ ንብረቶችን ለማየት ይጫኑ።
                      </p>
                      <button
                        onClick={() => handleViewMatchedProperties(alertForm)}
                        className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 rounded-xl text-[10px] uppercase tracking-wider transition flex items-center justify-center gap-2"
                      >
                        <HomeIcon size={14} /> የተስተካከሉ ንብረቶችን አሳይ (View Matched Properties)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Alerts List & Email Logs */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Active Alerts */}
                  <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                      <h3 className="font-black text-gray-900 flex items-center gap-2">
                        <Filter className="text-amber-500" size={18} /> የኔ የፍለጋ
                        መስፈርቶች (Active Search Alerts)
                      </h3>
                      <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-lg">
                        {myAlerts.length} Active
                      </span>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {myAlerts.length > 0 ? (
                        myAlerts.map((alert) => (
                          <div
                            key={alert.id}
                            className="p-6 hover:bg-gray-50 transition group"
                          >
                            <div className="flex justify-between items-start">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">
                                    {alert.house_type}
                                  </span>
                                  <span className="text-xs font-black text-amber-600">
                                    ETB{" "}
                                    {Number(
                                      alert.min_price || 0,
                                    ).toLocaleString()}{" "}
                                    -{" "}
                                    {alert.max_price
                                      ? Number(alert.max_price).toLocaleString()
                                      : "Any"}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1">
                                  {alert.location_keyword && (
                                    <span className="text-[11px] font-bold text-gray-600 flex items-center gap-1">
                                      <MapPin
                                        size={12}
                                        className="text-gray-400"
                                      />{" "}
                                      {alert.location_keyword}
                                    </span>
                                  )}
                                  <span className="text-[11px] font-bold text-gray-600 flex items-center gap-1">
                                    <Mail size={12} className="text-gray-400" />{" "}
                                    {alert.notification_email}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeleteAlert(alert.id)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-12 text-center">
                          <Bell
                            size={40}
                            className="mx-auto text-gray-200 mb-4"
                          />
                          <p className="text-gray-400 font-bold text-sm">
                            ምንም የተቀመጠ መስፈርት የለም።
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Email Notification Inbox (Sent History) */}
                  <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 bg-gray-50/50">
                      <h3 className="font-black text-gray-900 flex items-center gap-2">
                        <Mail className="text-amber-500" size={18} /> የተላኩ
                        የማሳወቂያ ኢሜይሎች (Sent Notifications History)
                      </h3>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {emailLogs.length > 0 ? (
                        emailLogs.map((log) => (
                          <div
                            key={log.id}
                            className="p-6 hover:bg-gray-50 transition flex items-center justify-between"
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <div className="bg-amber-100 p-2.5 rounded-2xl">
                                <Mail className="text-amber-600" size={20} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-black text-gray-900 truncate">
                                  {log.subject}
                                </h4>
                                <p className="text-[10px] text-gray-500 flex items-center gap-2 mt-0.5">
                                  <Clock size={10} />{" "}
                                  {new Date(log.sent_at).toLocaleString()}
                                  <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[8px] font-black uppercase">
                                    {log.status}
                                  </span>
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => setShowEmailPreview(log)}
                              className="bg-gray-100 hover:bg-amber-500 hover:text-white text-gray-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition whitespace-nowrap"
                            >
                              Preview HTML
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="p-12 text-center">
                          <Mail
                            size={40}
                            className="mx-auto text-gray-200 mb-4"
                          />
                          <p className="text-gray-400 font-bold text-sm">
                            እስካሁን ምንም የተላከ ኢሜይል የለም።
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Email Preview Modal */}
          {showEmailPreview && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
              <div className="bg-[#0f172a] w-full max-w-3xl rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] border border-slate-800 flex flex-col h-[92vh]">
                {/* Professional Email Header */}
                <div className="p-8 border-b border-slate-800 bg-slate-900">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-amber-500 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <Mail className="text-slate-950" size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white tracking-tight">
                          {showEmailPreview.subject}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-1">
                          <Clock size={12} /> Sent on{" "}
                          {new Date(showEmailPreview.sent_at).toLocaleString(
                            "en-US",
                            { dateStyle: "full", timeStyle: "short" },
                          )}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowEmailPreview(null)}
                      className="bg-slate-800 hover:bg-red-500/10 hover:text-red-500 p-2.5 rounded-2xl text-slate-400 transition-all duration-300"
                    >
                      <XCircle size={24} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/50">
                      <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                        {t("recipient")}
                      </span>
                      <span className="text-sm font-bold text-slate-200">
                        {showEmailPreview.recipient_email}
                      </span>
                    </div>
                    <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/50">
                      <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                        {t("status")}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-sm font-bold text-emerald-400 uppercase tracking-wider">
                          {showEmailPreview.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Email Body Iframe */}
                <div className="flex-1 bg-white relative">
                  <div className="absolute inset-0 overflow-hidden">
                    <iframe
                      srcDoc={showEmailPreview.body_html}
                      title="Email Preview"
                      className="w-full h-full border-none"
                    />
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-slate-900 border-t border-slate-800 flex justify-between items-center">
                  <p className="text-[10px] text-slate-500 font-bold max-w-[60%]">
                    ይህ የተላከው ማሳወቂያ በሲስተሙ ተዘጋጅቶ ለተጠቃሚው ደርሷል። (This is a
                    system-generated notification sent to the tenant.)
                  </p>
                  <button
                    onClick={() => setShowEmailPreview(null)}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-8 py-3 rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-amber-500/10 transition-all duration-300"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Analytics View */}
          {activeTab === "analytics" &&
            (user?.role === "Landlord" || user?.role === "Admin") && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl border border-slate-800 relative overflow-hidden">
                  <div className="absolute -right-20 -top-20 opacity-10">
                    <LayoutDashboard size={300} className="text-amber-500" />
                  </div>
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-500 border border-amber-500/30 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                      <Sparkles size={14} /> Real-time Property Performance
                    </div>
                    <h2 className="text-4xl font-black mb-4 tracking-tight">
                      የንብረት ትንተና ዳሽቦርድ (Property Analytics)
                    </h2>
                    <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
                      የቤቶችዎን አጠቃላይ እንቅስቃሴ፣ የኪራይ ሁኔታ እና የወርሃዊ ለውጦችን እዚህ ይከታተሉ።
                      (Track your listing performance, rental status, and
                      monthly trends.)
                    </p>
                  </div>
                </div>

                {/* Quick Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100 group hover:border-amber-200 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-amber-100 p-3 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-colors text-amber-600">
                        <HomeIcon size={24} />
                      </div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {t("totalListings")}
                      </span>
                    </div>
                    <div className="text-4xl font-black text-slate-950">
                      {analyticsData
                        ? Number(analyticsData.summary?.Available || 0) +
                          Number(analyticsData.summary?.Rented || 0)
                        : "0"}
                    </div>
                    <p className="text-xs text-gray-500 mt-2 font-bold">
                      {t("allPropertiesPosted")}
                    </p>
                  </div>

                  <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100 group hover:border-emerald-200 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-emerald-100 p-3 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-colors text-emerald-600">
                        <CheckCircle size={24} />
                      </div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {t("activeListingsStatus")}
                      </span>
                    </div>
                    <div className="text-4xl font-black text-slate-950">
                      {analyticsData?.summary?.Available || 0}
                    </div>
                    <p className="text-xs text-gray-500 mt-2 font-bold">
                      {t("currentlyAvailable")}
                    </p>
                  </div>

                  <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100 group hover:border-blue-200 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-blue-100 p-3 rounded-2xl group-hover:bg-blue-500 group-hover:text-white transition-colors text-blue-600">
                        <Sparkles size={24} />
                      </div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {t("successfullyRented")}
                      </span>
                    </div>
                    <div className="text-4xl font-black text-slate-950">
                      {analyticsData?.summary?.Rented || 0}
                    </div>
                    <p className="text-xs text-gray-500 mt-2 font-bold">
                      {t("totalOccupied")}
                    </p>
                  </div>
                </div>

                {/* Charts Section */}
                <Suspense
                  fallback={
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
                        <div className="h-80 bg-gray-100 rounded-2xl animate-shimmer" />
                      </div>
                      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
                        <div className="h-80 bg-gray-100 rounded-2xl animate-shimmer" />
                      </div>
                    </div>
                  }
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Area Chart: Trends Over Time */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h3 className="text-lg font-black text-slate-950">
                            Listing Trends (Monthly)
                          </h3>
                          <p className="text-xs text-gray-500 font-bold">
                            Posted vs. Rented properties over time
                          </p>
                        </div>
                        <div className="flex gap-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                            <span className="text-[10px] font-black uppercase text-gray-400">
                              {t("posted")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                            <span className="text-[10px] font-black uppercase text-gray-400">
                              {t("rentedStatus")}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={analyticsData?.performanceData || []}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke="#f1f5f9"
                            />
                            <XAxis
                              dataKey="month"
                              axisLine={false}
                              tickLine={false}
                              tick={{
                                fill: "#94a3b8",
                                fontSize: 10,
                                fontWeight: 700,
                              }}
                              dy={10}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{
                                fill: "#94a3b8",
                                fontSize: 10,
                                fontWeight: 700,
                              }}
                            />
                            <Tooltip
                              contentStyle={{
                                borderRadius: "16px",
                                border: "none",
                                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                                fontSize: "12px",
                                fontWeight: "bold",
                              }}
                              cursor={{ stroke: "#f59e0b", strokeWidth: 2 }}
                            />
                            <Line
                              type="monotone"
                              dataKey="posted"
                              stroke="#f59e0b"
                              strokeWidth={4}
                              dot={{ r: 4, fill: "#f59e0b", strokeWidth: 2 }}
                              activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                            <Line
                              type="monotone"
                              dataKey="rented"
                              stroke="#10b981"
                              strokeWidth={4}
                              dot={{ r: 4, fill: "#10b981", strokeWidth: 2 }}
                              activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Bar Chart: Comparison */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h3 className="text-lg font-black text-slate-950">
                            {t("propertyConversion")}
                          </h3>
                          <p className="text-xs text-gray-500 font-bold">
                            {t("relativeComparison")}
                          </p>
                        </div>
                      </div>

                      <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={[
                              {
                                name: "Available",
                                value: analyticsData?.summary?.Available || 0,
                              },
                              {
                                name: "Rented",
                                value: analyticsData?.summary?.Rented || 0,
                              },
                            ]}
                          >
                            <XAxis
                              dataKey="name"
                              axisLine={false}
                              tickLine={false}
                              tick={{
                                fill: "#94a3b8",
                                fontSize: 10,
                                fontWeight: 700,
                              }}
                              dy={10}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{
                                fill: "#94a3b8",
                                fontSize: 10,
                                fontWeight: 700,
                              }}
                            />
                            <Tooltip
                              contentStyle={{
                                borderRadius: "16px",
                                border: "none",
                                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                                fontSize: "12px",
                                fontWeight: "bold",
                              }}
                            />
                            <Bar
                              dataKey="value"
                              radius={[10, 10, 10, 10]}
                              barSize={60}
                            >
                              {[
                                { name: "Available", color: "#f59e0b" },
                                { name: "Rented", color: "#10b981" },
                              ].map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.color}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </Suspense>

                {/* Performance Insight Box */}
                <div className="bg-amber-50 rounded-[2rem] p-8 border border-amber-100 flex flex-col md:flex-row items-center gap-6">
                  <div className="bg-amber-500 p-4 rounded-2xl text-white shadow-lg shadow-amber-500/20">
                    <Sparkles size={32} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-amber-900">
                      {t("performanceInsight")}
                    </h4>
                    <p className="text-amber-700 text-sm font-medium">
                      Your listings are performing well! The conversion rate
                      from Available to Rented is
                      <span className="font-black px-1.5 py-0.5 bg-amber-200 rounded mx-1">
                        {analyticsData
                          ? Math.round(
                              (analyticsData.summary?.Rented /
                                (analyticsData.summary?.Available +
                                  analyticsData.summary?.Rented || 1)) *
                                100,
                            )
                          : 0}
                        %
                      </span>
                      across all properties. Keep your listings updated to
                      maintain visibility.
                    </p>
                  </div>
                </div>
              </div>
            )}

          {/* Favorites View */}
          {activeTab === "favorites" && (
            <div>
              <h2 className="text-2xl font-black text-white mb-6">
                {t("yourSavedProperties")}
              </h2>
              <HouseGrid
                houses={wishlists}
                loading={false}
                columns={3}
                emptyTitle="No Saved Properties"
                emptyMessage="You haven't saved any properties to your wishlist yet. Explore the listings and click the heart icon to save them!"
                onFavoriteToggle={fetchWishlists}
              />
            </div>
          )}

          {/* Rent Reminders View */}
          {activeTab === "reminders" && (
            <div>
              <RentReminderWidget user={user} />
            </div>
          )}

          {/* Rental Contracts View */}
          {activeTab === "contracts" && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-400 font-bold text-xs uppercase tracking-wider px-3 py-1 rounded-full mb-3 border border-amber-500/30">
                    <FileText size={14} /> Official Injibara House Rental
                    Contract
                  </div>
                  <h2 className="text-2xl font-black mb-2">
                    ዲጂታል የቤት ኪራይ ውል ስምምነት (Rental Contract Generator)
                  </h2>
                  <p className="text-slate-300 text-sm max-w-xl">
                    በአከራይ እና በተከራይ መካከል የሚደረግ የህግ ውል ስምምነት ሰነድን በ PDF አዘጋጅተው
                    ያውርዱ ወይም ያትሙ።
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedContractHouse(
                      houses.length > 0 ? houses[0] : null,
                    );
                    setShowContractModal(true);
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 py-3.5 rounded-2xl shadow-lg transition flex items-center gap-2 whitespace-nowrap cursor-pointer text-sm"
                >
                  <FileText size={18} /> አዲስ ውል አዘጋጅ (Generate New Contract)
                </button>
              </div>

              <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl text-center py-12">
                <FileText className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                <h3 className="text-lg font-black text-white mb-2">
                  ዲጂታል የቤት ኪራይ ውል ስምምነት ማዘጋጃ
                </h3>
                <p className="text-sm text-slate-300 max-w-md mx-auto mb-6">
                  ለማንኛውም የተከራዩት ወይም ያከራዩት ቤት ከእንጅባራ የቤት ኪራይ መድረክ ይፋዊ የህግ ውል በ
                  PDF ማውረድ ይችላሉ።
                </p>
                <button
                  onClick={() => {
                    setSelectedContractHouse(
                      houses.length > 0 ? houses[0] : null,
                    );
                    setShowContractModal(true);
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 py-3 rounded-xl shadow-lg transition text-xs uppercase tracking-wider cursor-pointer"
                >
                  የውል ስምምነት PDF ማዘጋጃ ክፈት
                </button>
              </div>
            </div>
          )}

          {/* Ad Payments View */}
          {activeTab === "payments" && (
            <div className="space-y-8">
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-400 font-bold text-xs uppercase tracking-wider px-3 py-1 rounded-full mb-3 border border-amber-500/30">
                    <Sparkles size={14} /> VIP Advertising & Boosting
                  </div>
                  <h2 className="text-3xl font-black mb-2">
                    ማስታወቂያ ያስተውቁ & ክፍያዎችን ይከታተሉ
                  </h2>
                  <p className="text-slate-300 text-sm max-w-xl">
                    ቤትዎን ወይም የቤት ፈላጊ ማስታወቂያዎን በመጀመሪያ ገፅ ላይ በማውጣት በሺዎች የሚቆጠሩ
                    አከራዮች እና ተከራዮች በፍጥነት እንዲያዩት ያድርጉ።
                  </p>
                </div>
                <button
                  onClick={() => {
                    setPromotionHouseId(null);
                    setPromotionSeekingAdId(null);
                    setPromotionAdType("Featured Listing");
                    setIsAdPaymentModalOpen(true);
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-7 py-4 rounded-2xl shadow-lg transition flex items-center gap-2 whitespace-nowrap cursor-pointer text-base"
                >
                  <Megaphone size={20} /> ማስታወቂያ ያስተውቁ (Pay Ad Fee)
                </button>
              </div>

              {/* Payment History Table */}
              <div className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="font-black text-white text-lg flex items-center gap-2">
                    <CreditCard size={20} className="text-amber-400" />
                    የክፍያ ጥያቄዎች ታሪክ (Payment Requests)
                  </h3>
                  <button
                    onClick={fetchMyPayments}
                    className="text-xs font-bold text-amber-400 hover:text-amber-300 cursor-pointer"
                  >
                    Refresh Status
                  </button>
                </div>

                {myPayments.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <p className="font-bold text-slate-200 mb-1">
                      እስካሁን ያቀረቡት የማስታወቂያ ክፍያ የለም
                    </p>
                    <p className="text-xs text-slate-400">
                      ቤትዎን ለመጀመር ከላይ ያለውን "ማስታወቂያ ያስተውቁ" የሚለውን ይጫኑ።
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-950 text-slate-400 font-black text-xs uppercase tracking-wider border-b border-slate-800">
                          <th className="p-4">Ad Type / ዓይነት</th>
                          <th className="p-4">Item / ንብረት</th>
                          <th className="p-4">Amount / መጠን</th>
                          <th className="p-4">Method / መንገድ</th>
                          <th className="p-4">Ref No / ቁጥር</th>
                          <th className="p-4">Status / ሁኔታ</th>
                          <th className="p-4">Date / ቀን</th>
                          <th className="p-4">Actions / ተግባራት</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-sm font-medium text-slate-300">
                        {(myPayments || []).map((p) => (
                          <tr
                            key={p.id}
                            className="hover:bg-slate-800/50 transition"
                          >
                            <td className="p-4 font-black text-white">
                              {p.ad_type}
                            </td>
                            <td className="p-4 text-slate-300">
                              {p.house_title ||
                                p.seeking_ad_title ||
                                "General Ad"}
                            </td>
                            <td className="p-4 font-black text-amber-400">
                              {p.amount} ETB
                            </td>
                            <td className="p-4">{p.payment_method}</td>
                            <td className="p-4 font-mono text-xs text-slate-400">
                              {p.transaction_ref}
                            </td>
                            <td className="p-4">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-black ${
                                  p.status === "Approved"
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                    : p.status === "Rejected"
                                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                      : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                }`}
                              >
                                {p.status === "Approved"
                                  ? "✓ ተረጋግጧል (Approved)"
                                  : p.status === "Rejected"
                                    ? "✕ ውድቅ ተደርጓል"
                                    : "⏳ በግምገማ ላይ (Pending)"}
                              </span>
                            </td>
                            <td className="p-4 text-xs text-slate-400">
                              {formatEthiopianDate(p.created_at, true)}
                            </td>
                            <td className="p-4">
                              {p.status === "Approved" ? (
                                <button
                                  onClick={() => setPrintingReceipt(p)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl transition text-xs shadow-md cursor-pointer whitespace-nowrap"
                                >
                                  <FileText size={14} />
                                  <span>ደረሰኝ (Receipt)</span>
                                </button>
                              ) : (
                                <span className="text-slate-400 text-xs italic">
                                  {p.status === "Rejected"
                                    ? "ውድቅ የተደረገ"
                                    : "ሲረጋገጥ ይገኛል"}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <HousePaymentModal
        isOpen={showHousePaymentModal}
        onClose={() => setShowHousePaymentModal(false)}
        onConfirm={(paymentMethod, transactionRef, receiptData) => {
          setShowHousePaymentModal(false);
          processHouseSubmit(paymentMethod, transactionRef, receiptData);
        }}
      />

      {/* Ad Payment Modal */}
      <AdPaymentModal
        isOpen={isAdPaymentModalOpen}
        onClose={() => setIsAdPaymentModalOpen(false)}
        defaultHouseId={promotionHouseId}
        defaultSeekingAdId={promotionSeekingAdId}
        defaultAdType={promotionAdType}
        onPaymentSubmitted={() => {
          fetchMyPayments();
          fetchMyHouses();
          fetchMyAds();
        }}
      />

      {/* Digital Rental Contract Modal */}
      {showContractModal && (
        <RentalContractModal
          house={selectedContractHouse}
          isOpen={showContractModal}
          onClose={() => setShowContractModal(false)}
        />
      )}

      {/* Official Printable Receipt Modal */}
      {printingReceipt &&
        (() => {
          const p = printingReceipt;
          const refNum = p.transaction_ref || "N/A";

          return (
            <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-6 shadow-2xl animate-fadeIn my-8">
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <Printer size={20} className="text-amber-400" />
                    <h3 className="text-xl font-black text-white">
                      የክፍያ ደረሰኝ (Payment Receipt)
                    </h3>
                  </div>
                  <button
                    onClick={() => setPrintingReceipt(null)}
                    className="text-slate-400 hover:text-white p-1.5 rounded-xl cursor-pointer"
                  >
                    <X size={22} />
                  </button>
                </div>

                {/* PRINTABLE RECEIPT CONTAINER (Light canvas for high-quality printout) */}
                <div
                  ref={receiptRef}
                  id="official-printable-receipt"
                  className="bg-white text-slate-900 p-8 rounded-2xl shadow-xl space-y-6 border border-slate-200"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start border-b-2 border-amber-500 pb-4">
                    <div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">
                        INJIBARA HOUSE RENTALS
                      </h2>
                      <p className="text-xs font-semibold text-slate-600">
                        እንጅባራ የቤት ኪራይ እና ማስተዋወቂያ አገልግሎት
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Injibara Town, Awi Zone, Amhara, Ethiopia
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full uppercase border border-emerald-300">
                        PAID / ተከፍሏል
                      </span>
                      <p className="text-[10px] font-mono text-slate-500 mt-2">
                        No: REC-{p.id || "001"}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Date: {formatEthiopianDate(p.created_at, false)}
                      </p>
                    </div>
                  </div>

                  {/* Customer & Transaction */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-slate-500 uppercase font-bold text-[9px]">
                        Payer / Customer (ደንበኛ):
                      </p>
                      <p className="font-bold text-slate-900 text-sm">
                        {user?.name || "Valued Customer"}
                      </p>
                      <p className="text-slate-600">
                        {user?.role} | {user?.phone || user?.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 uppercase font-bold text-[9px]">
                        Payment Details (የክፍያ መረጃ):
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
                        <th className="py-2 px-3 font-bold text-slate-700">
                          Description / Service (የአገልግሎቱ ዓይነት)
                        </th>
                        <th className="py-2 px-3 font-bold text-slate-700 text-right">
                          Amount (መጠን)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="py-3 px-3">
                          <p className="font-semibold text-slate-800">
                            {p.ad_type}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {p.house_title ||
                              p.seeking_ad_title ||
                              "General Platform Boosting Service"}
                          </p>
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
                      <p className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
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
                      <p className="text-[10px] font-bold text-slate-500">
                        TOTAL PAID (አጠቃላይ ክፍያ):
                      </p>
                      <p className="text-xl font-black text-emerald-600">
                        {Number(p.amount).toLocaleString()} ETB
                      </p>
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex flex-wrap justify-end gap-3 pt-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition flex items-center gap-2 text-xs cursor-pointer border border-slate-700"
                  >
                    <Printer size={15} />
                    <span>ደረሰኝ አትም (Print Receipt)</span>
                  </button>
                  <button
                    onClick={() => handleDownloadReceiptPDF(p)}
                    disabled={isGeneratingPDF}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl transition flex items-center gap-2 text-xs shadow-lg cursor-pointer disabled:opacity-70"
                  >
                    {isGeneratingPDF ? (
                      <>
                        <ButtonSpinner size={15} />
                        <span>በማዘጋጀት ላይ...</span>
                      </>
                    ) : (
                      <>
                        <Download size={15} />
                        <span>ፒዲኤፍ አውርድ (Download PDF)</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setPrintingReceipt(null)}
                    className="px-4 py-2.5 bg-slate-700 text-slate-300 font-bold rounded-xl hover:bg-slate-600 transition text-xs cursor-pointer"
                  >
                    ዝጋ (Close)
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
};

export default Dashboard;
