import AdminFeeEditor from "../components/AdminFeeEditor";
import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import {
  MessageSquare,
  Send,
  User,
  Building,
  Phone,
  Mail,
  ArrowLeft,
  Search,
  CheckCheck,
  Clock,
  ShieldCheck,
  AlertCircle,
  X,
  CheckCircle2,
  Copy,
  Upload,
  CreditCard,
} from "lucide-react";
import { formatEthiopianDateTime } from "../utils/date";
import OptimizedImage from "../components/OptimizedImage";
import MessageListSkeleton from "../components/MessageListSkeleton";
import ButtonSpinner from "../components/ButtonSpinner";
import CITY_CONFIG from "../config/cityConfig";
import { useLanguage } from "../context/LanguageContext";

export default function Messages() {
  const { user, token } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const targetUserIdParam = searchParams.get("user");
  const houseIdParam = searchParams.get("house");

  const [conversations, setConversations] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [houseInfo, setHouseInfo] = useState(null);
  const [landlordsList, setLandlordsList] = useState([]);
  const [showLandlordSelect, setShowLandlordSelect] = useState(false);

  const messagesEndRef = useRef(null);

  // Tenant/Seeker payment status states
  const [paymentStatus, setPaymentStatus] = useState({
    hasPaid: false,
    status: "Pending",
    feeAmount: 200,
    isExempt: false,
  });
  const [payConfig, setPayConfig] = useState({ fees: {}, payments: {} });
  const [payMethod, setPayMethod] = useState("telebirr");
  const [payTxRef, setPayTxRef] = useState("");
  const [payReceipt, setPayReceipt] = useState(null);
  const [payError, setPayError] = useState("");
  const [paySuccess, setPaySuccess] = useState("");
  const [paySubmitting, setPaySubmitting] = useState(false);
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

  const normalizeConfig = (raw) => {
    const data = raw?.data || raw || {};
    return {
      fees: data.fees || {},
      payments: data.payments || {},
    };
  };

  const formatMessageTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";

    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const timeStr = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    if (isToday) {
      return `${t("today")} ${timeStr}`;
    }

    const ethDateStr = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    return `${ethDateStr} ${timeStr}`;
  };

  // Fetch conversations list
  const fetchConversations = async () => {
    if (!user) return [];
    try {
      const res = await axios.get("/api/messages/conversations");
      const data = Array.isArray(res.data) ? res.data : [];
      setConversations(data);
      return data;
    } catch (err) {
      if (err.response?.status !== 401) {
        console.error("Failed to fetch conversations", err);
      }
      setConversations([]);
      return [];
    }
  };

  // Fetch messages thread with selected partner
  const fetchChatThread = async (partnerId) => {
    if (!user || !partnerId) return;
    try {
      const res = await axios.get(`/api/messages/chat/${partnerId}`);
      setSelectedPartner(res.data?.partner || null);
      setMessages(Array.isArray(res.data?.messages) ? res.data.messages : []);
    } catch (err) {
      if (err.response?.status !== 401) {
        console.error("Failed to fetch chat thread", err);
      }
      setMessages([]);
    }
  };

  // Fetch list of Landlords & Admins
  useEffect(() => {
    if (user) {
      axios
        .get("/api/auth/landlords")
        .then((res) =>
          setLandlordsList(Array.isArray(res.data) ? res.data : []),
        )
        .catch((err) => console.error(err));
    }
  }, [user]);

  // If houseIdParam is present, fetch house info
  useEffect(() => {
    if (houseIdParam && user) {
      axios
        .get(`/api/houses/${houseIdParam}`)
        .then((res) => setHouseInfo(res.data))
        .catch((err) => console.error(err));
    }
  }, [houseIdParam, user]);

  // Initial load
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const init = async () => {
      setLoading(true);

      // Check payment status for non-admin and non-landlord users
      if (user && user.role !== "Admin" && user.role !== "Landlord") {
        try {
          const statusRes = await axios.get("/api/payments/tenant-status");
          setPaymentStatus(statusRes.data);

          if (!statusRes.data.hasPaid) {
            const configRes = await axios.get("/api/payments/config");
            setPayConfig(normalizeConfig(configRes.data));
          }
        } catch (e) {
          console.error("Failed to fetch payment status", e);
        }
      }

      const convs = await fetchConversations();

      if (targetUserIdParam) {
        await fetchChatThread(targetUserIdParam);
      } else if (convs.length > 0) {
        await fetchChatThread(convs[0].other_user_id);
      }
      setLoading(false);
    };

    init();
  }, [targetUserIdParam, user]);

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setPayError("");
    setPaySuccess("");

    const configuredMethods = Object.keys(payConfig.payments || {});
    if (!configuredMethods.includes(payMethod)) {
      setPayError(
        language === "am"
          ? "እባክዎን የክፍያ ዘዴ ይምረጡ"
          : "Please select a valid payment method.",
      );
      return;
    }

    if (!payTxRef.trim()) {
      setPayError(
        language === "am"
          ? "እባክዎን የትራንዛክሽን ቁጥር ያስገቡ"
          : "Please enter Transaction Reference Number.",
      );
      return;
    }

    setPaySubmitting(true);
    try {
      const formData = new FormData();
      formData.append("ad_type", "Tenant Contact Access");
      formData.append("amount", paymentStatus.feeAmount || "150");
      formData.append("payment_method", payMethod);
      formData.append("transaction_ref", payTxRef.trim());
      if (payReceipt) formData.append("receipt", payReceipt);

      await axios.post("/api/payments/submit", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setPaySuccess(
        language === "am"
          ? "ክፍያዎ በተሳካ ሁኔታ ተልኳል! አድሚን ሲያረጋግጠው ቻት መጀመር ይችላሉ።"
          : "Payment submitted successfully! You will have access once verified by admin.",
      );
      setPaymentStatus((prev) => ({ ...prev, status: "Pending" }));
    } catch (err) {
      console.error(err);
      setPayError(
        err.response?.data?.error ||
          (language === "am"
            ? "ክፍያው መላክ አልተቻለም፡ እባክዎን እንደገና ይሞክሩ"
            : "Failed to submit payment."),
      );
    } finally {
      setPaySubmitting(false);
    }
  };

  // Auto poll for new messages every 2 seconds
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      fetchConversations();
      if (selectedPartner) {
        fetchChatThread(selectedPartner.user_id);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [selectedPartner, user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedPartner || sending) return;

    setSending(true);
    try {
      let validHouseId = houseIdParam;
      if (validHouseId === "null" || validHouseId === "undefined")
        validHouseId = null;

      const receiverId =
        selectedPartner.user_id ||
        selectedPartner.id ||
        selectedPartner.other_user_id ||
        targetUserIdParam;

      await axios.post("/api/messages/send", {
        receiver_id: receiverId,
        house_id: validHouseId || null,
        content: newMessage.trim(),
      });

      setNewMessage("");
      await fetchChatThread(receiverId);
      await fetchConversations();
    } catch (err) {
      console.error("Error sending message:", err);
      alert(err.response?.data?.error || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = (
    Array.isArray(conversations) ? conversations : []
  ).filter(
    (c) =>
      (c.other_user_name &&
        c.other_user_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.house_title &&
        c.house_title.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  if (loading) {
    return <MessageListSkeleton count={6} />;
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center text-white shadow-2xl">
        <MessageSquare className="w-16 h-16 text-amber-400 mx-auto mb-4" />
        <h2 className="text-2xl font-black mb-2">{t("loginToMessage")}</h2>
        <p className="text-sm text-slate-300 mb-6">
          {t("loginToMessageDesc")}
          <br />
          <span className="text-xs text-amber-400/80">
            (Please log in to view and send direct rental messages)
          </span>
        </p>
        <button
          onClick={() => navigate("/login", { state: { from: "/messages" } })}
          className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl shadow-lg transition uppercase tracking-wider text-sm cursor-pointer"
        >
          {t("signIn")} (Log In)
        </button>
      </div>
    );
  }

  // Block non-admin/non-landlord users who have not paid the required 150 ETB fee
  if (
    user &&
    user.role !== "Admin" &&
    user.role !== "Landlord" &&
    !paymentStatus.hasPaid
  ) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 relative">
        <button
          onClick={() => navigate("/")}
          className="absolute top-2 right-6 p-2 bg-slate-200 hover:bg-slate-300 rounded-full text-slate-700 transition z-10"
        >
          <X size={20} />
        </button>
        <AdminFeeEditor
          configKey="ad_fee_tenant_contact"
          currentFee={paymentStatus.feeAmount || 150}
          onUpdate={(val) =>
            setPaymentStatus((prev) => ({ ...prev, feeAmount: val }))
          }
        />
        <div className="bg-gradient-to-r from-gray-900 via-black to-yellow-950 text-white rounded-3xl p-6 md:p-8 mb-8 shadow-xl border border-yellow-500/20 text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-yellow-400 font-bold uppercase tracking-wider text-xs mb-2 justify-center md:justify-start">
              <CreditCard className="w-4 h-4" />
              {language === "am"
                ? "የአገልግሎት ክፍያ ማረጋገጫ"
                : "Service Fee Verification"}
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">
              {language === "am"
                ? "የቀጥታ ግንኙነት የአገልግሎት ክፍያ"
                : "Direct Access Fee Required"}
            </h1>
            <p className="text-gray-300 text-sm mt-2 max-w-xl">
              {language === "am"
                ? `በእንጅባራ የቤት ኪራይ መድረክ ላይ የቤት አከራዮችን በቀጥታ በስልክና በውስጥ መልዕክት ለማግኘት እንዲሁም የቤት ኪራይ ጥያቄ ለመላክ መጀመሪያ የአንድ ጊዜ ${paymentStatus.feeAmount || 200} ብር የአገልግሎት ክፍያ መክፈል ግዴታ ነው።`
                : `To contact property owners directly via phone, internal messaging, or request bookings, you must pay a one-time ${paymentStatus.feeAmount || 200} ETB service fee.`}
            </p>
          </div>
          <div className="shrink-0 flex items-center justify-center bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 px-6 py-4 rounded-2xl">
            <div>
              <span className="block text-xs uppercase text-yellow-400 font-bold">
                {language === "am" ? "የክፍያ መጠን" : "Amount Due"}
              </span>
              <span className="text-3xl font-black">
                {paymentStatus.feeAmount || "200"}{" "}
                <span className="text-sm font-bold text-white">ETB</span>
              </span>
            </div>
          </div>
        </div>

        {paymentStatus.status === "Pending" ? (
          <div className="bg-white border border-gray-200 rounded-3xl p-8 text-center space-y-4 shadow-xl max-w-md mx-auto">
            <div className="w-16 h-16 bg-amber-500/10 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-10 h-10 animate-pulse" />
            </div>
            <h3 className="text-2xl font-black text-slate-950">
              {language === "am"
                ? "ክፍያዎ በመረጋገጥ ላይ ነው"
                : "Payment Verification Pending"}
            </h3>
            <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100 leading-relaxed">
              {language === "am"
                ? "ያቀረቡት የክፍያ ማረጋገጫ በአስተዳዳሪው እየተጣራ ነው። ክፍያው ሲረጋገጥ ወዲያውኑ ሙሉ በሙሉ የቤት አከራዮችን ማግኘትና ቻት መጀመር ይችላሉ። ብዙውን ጊዜ ይህ ከ 5 እስከ 15 ደቂቃ ይወስዳል።"
                : "Your payment verification is currently being reviewed by our administration team. You will have full access once it is verified. This usually takes between 5 to 15 minutes."}
            </p>
            <div className="pt-2">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-slate-950 hover:bg-black text-amber-400 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg cursor-pointer"
              >
                {language === "am"
                  ? "እንደገና ጫን (Refresh)"
                  : "Check Status (Refresh)"}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left side: payment accounts */}
            <div className="lg:col-span-6 bg-white border border-gray-200 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="text-green-600 w-5 h-5" />
                {language === "am"
                  ? "ኦፊሴላዊ የክፍያ ሂሳብ ቁጥሮች"
                  : "Official Payment Bank Accounts"}
              </h3>
              <p className="text-xs text-slate-500">
                {language === "am"
                  ? "ከታች ባሉት የባንክ አካውንቶች ክፍያውን ከፈጸሙ በኋላ የትራንዛክሽን ማረጋገጫ ቁጥሩን በስተቀኝ በኩል ባለው ፎርም ላይ ያስገቡ።"
                  : "Please complete the transfer to any of the accounts below, then enter the transaction reference number in the form."}
              </p>

              {payConfig && Object.keys(payConfig.payments || {}).length > 0 ? (
                <div className="space-y-3.5 pt-2">
                  {Object.entries(payConfig.payments).map(([key, val]) => {
                    const label = PAYMENT_LABELS[key] || key;
                    const icon = PAYMENT_ICONS[key] || "💳";
                    const accountValue = val.account || val.phone || "";
                    const accountName = val.name || "";
                    const valueLabel =
                      key === "telebirr" ? "Phone Number" : "Account Number";

                    return (
                      <div
                        key={key}
                        className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between font-bold text-slate-950 border-b border-slate-200 pb-2">
                          <span className="font-extrabold">
                            {icon} {label}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="font-mono">{accountValue}</span>
                            <button
                              onClick={() =>
                                handleCopy(accountValue, key)
                              }
                              className="p-1 hover:bg-slate-200 rounded text-slate-500"
                            >
                              {copiedField === key ? (
                                <CheckCircle2
                                  size={14}
                                  className="text-green-600"
                                />
                              ) : (
                                <Copy size={14} />
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>
                            {language === "am"
                              ? "የአካውንት ስም (Name)"
                              : "Account Name"}
                          </span>
                          <span className="font-bold text-slate-900 text-right">
                            {accountName}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs text-slate-500 text-center py-3">
                  {language === "am"
                    ? "በአሁኑ ሰዓት የክፍያ መረጃ የለም። እባክዎን ከድጋፍ ጥረት ጋር ይገናኙ።"
                    : "Payment information is currently unavailable. Please contact support."}
                </div>
              )}
            </div>

            {/* Right side: payment form */}
            <div className="lg:col-span-6 bg-white border border-gray-200 rounded-3xl p-6 shadow-xl">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 mb-4">
                <CreditCard className="text-amber-500 w-5 h-5" />
                {language === "am"
                  ? "የክፍያ ማረጋገጫ ማስገቢያ ፎርም"
                  : "Submit Payment Form"}
              </h3>

              {payError && (
                <div className="mb-4 p-4 bg-red-50 text-red-700 text-xs rounded-2xl flex items-center gap-3 border border-red-100">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{payError}</span>
                </div>
              )}

              {paySuccess && (
                <div className="mb-4 p-4 bg-emerald-50 text-emerald-800 text-xs rounded-2xl flex items-center gap-3 border border-emerald-100">
                  <CheckCircle2
                    size={16}
                    className="text-emerald-600 shrink-0"
                  />
                  <span>{paySuccess}</span>
                </div>
              )}

              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                    {language === "am" ? "ክፍያ የፈጸሙበት ባንክ" : "Bank You Used"}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.keys(payConfig.payments || {}).map((key) => {
                      const label = PAYMENT_LABELS[key] || key;
                      const isSelected = payMethod === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setPayMethod(key)}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                            isSelected
                              ? "border-amber-500 bg-amber-500/10 text-amber-950 font-black"
                              : "border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {PAYMENT_ICONS[key] || "💳"} {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    {language === "am"
                      ? "የክፍያ ማረጋገጫ ቁጥር (Transaction Ref)"
                      : "Transaction Reference Number"}
                  </label>
                  <input
                    type="text"
                    value={payTxRef}
                    onChange={(e) => setPayTxRef(e.target.value)}
                    placeholder="e.g. TXN12345678 or 100012345"
                    className="w-full text-sm px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    {language === "am"
                      ? "የደረሰኝ ፎቶ (አማራጭ)"
                      : "Receipt File / Photo (Optional)"}
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-slate-300 hover:border-amber-500 rounded-xl cursor-pointer text-xs font-bold text-slate-700 bg-slate-50 hover:bg-amber-50/20 transition">
                      <Upload size={16} className="text-slate-500" />
                      <span>
                        {payReceipt
                          ? payReceipt.name
                          : language === "am"
                            ? "ፎቶ አስገባ"
                            : "Upload Receipt"}
                      </span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => setPayReceipt(e.target.files[0])}
                      />
                    </label>
                    {payReceipt && (
                      <button
                        type="button"
                        onClick={() => setPayReceipt(null)}
                        className="px-3 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition"
                      >
                        {language === "am" ? "ሰርዝ" : "Remove"}
                      </button>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={paySubmitting}
                  className="w-full bg-slate-950 hover:bg-black text-amber-400 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
                >
                  {paySubmitting ? (
                    <>
                      <ButtonSpinner size={16} />
                      <span>
                        {language === "am" ? "በመላክ ላይ..." : "Submitting..."}
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>
                        {language === "am"
                          ? "የክፍያ ማረጋገጫ አስገባ"
                          : "Submit Payment Proof"}
                      </span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-gray-900 via-black to-yellow-900 text-white rounded-3xl p-6 md:p-8 mb-8 shadow-xl border border-yellow-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-yellow-400 font-bold uppercase tracking-wider text-xs mb-2">
              <MessageSquare className="w-4 h-4" />
              {language === "am"
                ? CITY_CONFIG.cityNameAm
                : CITY_CONFIG.cityNameEn}{" "}
              {t("inAppDirectMessaging")}
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              {language === "am"
                ? CITY_CONFIG.brandNameAm
                : CITY_CONFIG.brandNameEn}{" "}
              - {t("messages")}
            </h1>
            <p className="text-gray-300 text-sm mt-1">
              {t("messagesSubtitle")}
            </p>
          </div>

          <button
            onClick={() => navigate("/houses")}
            className="self-start md:self-auto bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-5 py-2.5 rounded-xl shadow-lg transition flex items-center gap-2 text-sm uppercase"
          >
            <Building className="w-4 h-4" />
            {t("exploreProperties")}
          </button>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[650px]">
        {/* Left Sidebar: Conversations List */}
        <div className="md:col-span-4 border-r border-gray-200 flex flex-col bg-gray-50/50">
          {/* Search Box & Quick Landlords Menu */}
          <div className="p-4 border-b border-gray-200 bg-white space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="text"
                placeholder={t("searchMessages")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-300 focus:border-amber-500 focus:bg-white text-slate-950 font-bold rounded-xl text-sm placeholder-slate-500 transition focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            {landlordsList.length > 0 && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowLandlordSelect(!showLandlordSelect)}
                  className="w-full text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 border border-amber-300 py-1.5 px-3 rounded-lg flex items-center justify-between transition"
                >
                  <span className="flex items-center gap-1.5">
                    <User size={14} className="text-amber-600" />
                    {t("contactLandlords")}
                  </span>
                  <span>{showLandlordSelect ? "▲" : "▼"}</span>
                </button>

                {showLandlordSelect && (
                  <div className="mt-2 p-2 bg-slate-900 border border-slate-800 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-800">
                    {landlordsList.map((landlord) => (
                      <div
                        key={landlord.user_id}
                        onClick={() => {
                          fetchChatThread(landlord.user_id);
                          setShowLandlordSelect(false);
                        }}
                        className="p-2 hover:bg-slate-800 rounded-lg cursor-pointer flex items-center justify-between transition"
                      >
                        <div>
                          <p className="text-xs font-bold text-white flex items-center gap-1.5">
                            {landlord.name}
                            <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.2 rounded uppercase">
                              {landlord.role}
                            </span>
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {landlord.phone || landlord.email}
                          </p>
                        </div>
                        <span className="text-[11px] text-amber-400 font-bold">
                          {t("sendMessageAction")} →
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Conversations Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="font-semibold text-sm">
                  {t("noConversationsFound")}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {t("startChatting")}
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected =
                  selectedPartner?.user_id === conv.other_user_id;
                return (
                  <div
                    key={conv.other_user_id}
                    onClick={() => fetchChatThread(conv.other_user_id)}
                    className={`p-4 cursor-pointer transition flex items-start gap-3 ${
                      isSelected
                        ? "bg-yellow-500/10 border-l-4 border-yellow-500"
                        : "hover:bg-white"
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-11 h-11 bg-yellow-500 text-black font-extrabold rounded-full flex items-center justify-center shadow-sm">
                        {conv.other_user_name.charAt(0).toUpperCase()}
                      </div>
                      {conv.is_online && (
                        <span
                          className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm"
                          title="ኦንላይን ላይ ይገኛሉ (Online)"
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h4 className="font-bold text-gray-900 text-sm truncate flex items-center gap-1.5">
                          {conv.other_user_name}
                          {conv.is_online && (
                            <span className="text-[9px] font-black text-emerald-600 bg-emerald-100 px-1.5 py-0.2 rounded-md">
                              {t("onlineCaps")}
                            </span>
                          )}
                        </h4>
                        <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                          {conv.last_message_time
                            ? formatMessageTime(conv.last_message_time)
                            : ""}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-bold uppercase">
                          {conv.other_user_role}
                        </span>
                        {conv.house_title && (
                          <span className="text-xs text-yellow-700 font-semibold truncate">
                            🏡 {conv.house_title}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 truncate">
                        {conv.last_message}
                      </p>
                    </div>

                    {conv.unread_count > 0 && (
                      <span className="bg-yellow-500 text-black font-extrabold text-xs w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Active Chat Thread */}
        <div className="md:col-span-8 flex flex-col bg-white">
          {selectedPartner ? (
            <>
              {/* Partner Header */}
              <div className="p-4 md:p-5 border-b border-gray-200 flex items-center justify-between bg-white shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-amber-500 text-slate-950 font-black rounded-full flex items-center justify-center text-lg shadow-md">
                      {selectedPartner.name.charAt(0).toUpperCase()}
                    </div>
                    {selectedPartner.is_online && (
                      <span
                        className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-md"
                        title="Online Now"
                      />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base flex flex-wrap items-center gap-2">
                      <span>{selectedPartner.name}</span>
                      <span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        {selectedPartner.role}
                      </span>
                      {selectedPartner.is_online ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          🟢 {t("onlineStatus")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                          ⚪ {t("offlineStatus")}
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-gray-500 flex items-center gap-3 mt-0.5">
                      <span>✉️ {selectedPartner.email}</span>
                      {selectedPartner.phone && (
                        <span>📞 {selectedPartner.phone}</span>
                      )}
                    </p>
                  </div>
                </div>

                {houseInfo && (
                  <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-300/60 p-2.5 rounded-2xl">
                    <OptimizedImage
                      src={
                        houseInfo.image_url ||
                        "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&q=80"
                      }
                      alt=""
                      className="w-12 h-12 object-cover rounded-xl border border-amber-300/40"
                      width={48}
                      height={48}
                    />
                    <div className="text-left">
                      <p className="text-xs font-black text-slate-900 truncate max-w-[180px]">
                        {houseInfo.title}
                      </p>
                      <p className="text-xs font-black text-amber-800">
                        ETB {Number(houseInfo.price).toLocaleString()} /ወር
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate("/houses")}
                        className="text-[10px] font-bold text-amber-700 hover:underline flex items-center gap-1 mt-0.5"
                      >
                        <Building size={11} /> {t("viewDetailsAction")}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {selectedPartner.user_id === user?.id && (
                <div className="bg-amber-500/15 border-b border-amber-300/50 px-4 py-2 text-xs font-bold text-amber-900 flex items-center justify-between">
                  <span>📌 {t("testingModeMsg")}</span>
                </div>
              )}

              {/* Messages Scroll Body */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50/30">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <MessageSquare className="w-12 h-12 text-yellow-400/40 mx-auto mb-2" />
                    <p className="font-semibold text-sm">
                      {t("beginningOfConversation")}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {t("askQuestions")}
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl p-4 shadow-sm text-sm leading-relaxed ${
                            isMe
                              ? "bg-amber-500 text-slate-950 font-bold rounded-br-none shadow-md"
                              : "bg-slate-800 border border-slate-700 text-white rounded-bl-none shadow-md font-medium"
                          }`}
                        >
                          <p>{msg.content}</p>
                          <div
                            className={`text-[11px] mt-2 flex items-center gap-1.5 font-semibold ${isMe ? "text-slate-900/80 justify-end" : "text-slate-300"}`}
                          >
                            <Clock className="w-3 h-3 opacity-70" />
                            <span>{formatMessageTime(msg.created_at)}</span>
                            {isMe && (
                              <span className="flex items-center gap-0.5 text-slate-950 font-black ml-1">
                                <CheckCheck className="w-3.5 h-3.5" />
                                <span className="text-[9.5px]">
                                  {t("sentStatus")}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Message Form */}
              <form
                onSubmit={handleSendMessage}
                className="p-4 border-t border-slate-200 bg-slate-50 flex gap-3"
              >
                <input
                  type="text"
                  placeholder={`${t("writeMessageTo")} ${selectedPartner.name}...`}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 px-4 py-3.5 bg-white text-slate-950 font-bold placeholder-slate-500 border-2 border-slate-300 rounded-2xl text-sm focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition shadow-sm"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black px-6 py-3.5 rounded-2xl shadow-lg shadow-amber-500/20 transition flex items-center gap-2 text-sm uppercase tracking-wider cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{t("sendAction")}</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400">
              <MessageSquare className="w-16 h-16 text-yellow-500/30 mb-4" />
              <h3 className="text-lg font-bold text-gray-800">
                {t("selectConversation")}
              </h3>
              <p className="text-sm text-gray-500 mt-1 max-w-sm">
                {t("chooseToStartChatting")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
