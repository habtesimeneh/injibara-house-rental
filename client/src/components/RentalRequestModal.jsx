import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Home,
  Calendar as CalendarIcon,
  Send,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  Star,
  MessageSquare,
  CreditCard,
} from "lucide-react";
import EthiopianDatePicker from "./EthiopianDatePicker";
import { formatEthiopianDate } from "../utils/date";
import HouseReviews from "./HouseReviews";
import RentalContractModal from "./RentalContractModal";
import TenantPaymentModal from "./TenantPaymentModal";
import CITY_CONFIG from "../config/cityConfig";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";

export default function RentalRequestModal({
  house,
  isOpen,
  onClose,
  onSuccess,
}) {
  const { language, t } = useLanguage();
  const { user, token } = useAuth();
  const [moveInDate, setMoveInDate] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("request"); // 'request' or 'reviews'
  const [showContractModal, setShowContractModal] = useState(false);

  // Payment gating state (authoritative value comes from the backend)
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [showTenantPaymentModal, setShowTenantPaymentModal] = useState(false);

  useEffect(() => {
    if (!isOpen || !house) return;

    const checkPaymentStatus = async () => {
      if (!token) {
        // Not authenticated: the request submit will force login.
        setPaymentStatus(null);
        setPaymentRequired(false);
        return;
      }
      // Admins and Landlords don't need to pay contact/request fees.
      if (user?.role === "Admin" || user?.role === "Landlord") {
        setPaymentRequired(false);
        setPaymentStatus({ hasPaid: true, status: "Approved", isExempt: true });
        return;
      }

      try {
        const res = await axios.get("/api/payments/tenant-status", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPaymentStatus(res.data);
        if (res.data.hasPaid || res.data.isExempt) {
          setPaymentRequired(false);
          setError("");
        } else {
          setPaymentRequired(true);
          setError(
            language === "am"
              ? "ይህንን የቤት ኪራይ ለመጠየቅ መጀመሪያ የ 200 ብር የአገልግሎት ክፍያ መክፈል ይኖርብዎታል።"
              : "To submit a rental request, you must first pay the 200 Birr service fee.",
          );
        }
      } catch (err) {
        console.error("Failed to verify payment status:", err);
      }
    };

    checkPaymentStatus();
  }, [isOpen, house, token, user, language]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const notesWithDate = moveInDate
        ? `[Requested Move-in Date: ${formatEthiopianDate(moveInDate, true)} (${moveInDate} GC)] ${message}`
        : message;

      await axios.post("/api/requests", {
        house_id: house.house_id,
        message: notesWithDate,
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        if (onSuccess) onSuccess();
        onClose();
      }, 1800);
    } catch (err) {
      console.error("Failed to submit rental request:", err);
      // Backend is authoritative: a 403 means the service fee is still required.
      if (err.response?.status === 403) {
        setPaymentRequired(true);
      }
      setError(
        err.response?.data?.error ||
          "Failed to submit rental request. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !house) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 pt-20 sm:pt-28 pb-12 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl border border-gray-100 transform transition-all my-4">
        {/* Header */}
        <div className="bg-[#1A1A1A] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-gray-400 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-yellow-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Home className="w-4 h-4" />{" "}
            {language === "am"
              ? CITY_CONFIG.cityNameAm
              : CITY_CONFIG.cityNameEn}{" "}
            {t("houseRentalBooking", "House Rental Booking")}
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {house.title}
          </h2>
          <p className="text-gray-300 text-sm mt-1">
            {house.city ||
              (language === "am"
                ? CITY_CONFIG.cityNameAm
                : CITY_CONFIG.cityNameEn)}{" "}
            • {house.price?.toLocaleString()} ETB/{t("price")}
          </p>

          {/* Top Quick Contract Generator Button */}
          <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs text-gray-400">
              {t("prepareContract")}
            </span>
            <button
              type="button"
              onClick={() => setShowContractModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow transition"
            >
              <FileText className="w-4 h-4" /> {t("digitalContract")}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-6 pt-3 gap-3">
          <button
            onClick={() => setActiveTab("request")}
            className={`pb-3 font-bold text-xs flex items-center gap-1.5 border-b-2 transition ${
              activeTab === "request"
                ? "border-yellow-500 text-yellow-700"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <Home className="w-4 h-4" /> {t("bookingRequest")}
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`pb-3 font-bold text-xs flex items-center gap-1.5 border-b-2 transition ${
              activeTab === "reviews"
                ? "border-yellow-500 text-yellow-700"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <Star className="w-4 h-4 text-amber-500" /> {t("reviews")}
          </button>
        </div>

        {/* Content Body */}
        {activeTab === "reviews" ? (
          <div className="p-6">
            <HouseReviews houseId={house.house_id} />
          </div>
        ) : house.status === "Rented" ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-red-600">
              {t("propertyRented")}
            </h3>
            <p className="text-sm font-semibold text-gray-800 bg-red-50 p-4 rounded-xl border border-red-200">
              {t("alreadyRentedMsg")}
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold uppercase tracking-wider"
            >
              {t("cancel")}
            </button>
          </div>
        ) : success ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {t("bookingSuccess")}
            </h3>
            <p className="text-sm text-gray-600">{t("bookingSuccessMsg")}</p>
          </div>
        ) : paymentStatus?.status === "Pending" ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-amber-500/10 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-10 h-10 animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-slate-950">
              {language === "am"
                ? "ክፍያዎ በመረጋገጥ ላይ ነው"
                : "Payment Verification Pending"}
            </h3>
            <p className="text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed max-w-md mx-auto">
              {language === "am"
                ? "ያቀረቡት የክፍያ ማረጋገጫ በአስተዳዳሪው እየተጣራ ነው። ክፍያው ሲረጋገጥ ወዲያውኑ የቤት ኪራይ መጠየቅ ይችላሉ። ብዙውን ጊዜ ይህ ከ 5 እስከ 15 ደቂቃ ይወስዳል።"
                : "Your payment verification is currently being reviewed by our administration team. You will have full access once it is verified. This usually takes between 5 to 15 minutes."}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await axios.get("/api/payments/tenant-status", {
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    setPaymentStatus(res.data);
                    if (res.data.hasPaid || res.data.isExempt) {
                      setPaymentRequired(false);
                      setError("");
                    }
                  } catch (e) {
                    console.error("Failed to refresh status:", e);
                  }
                }}
                className="px-6 py-2.5 bg-slate-950 hover:bg-black text-amber-400 rounded-lg font-bold text-xs uppercase tracking-wider shadow-lg cursor-pointer transition"
              >
                {language === "am"
                  ? "እንደገና ጫን (Refresh)"
                  : "Check Status (Refresh)"}
              </button>
            </div>
          </div>
        ) : paymentRequired ? (
          <div className="p-6 space-y-6">
            <div className="bg-gradient-to-r from-slate-900 to-amber-950 text-white rounded-2xl p-5 shadow-md border border-amber-500/20">
              <div className="flex items-center gap-1.5 text-yellow-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                <CreditCard className="w-3.5 h-3.5" />
                {language === "am"
                  ? "የአገልግሎት ክፍያ ማረጋገጫ"
                  : "Service Fee Verification"}
              </div>
              <h3 className="text-lg font-black text-white">
                {language === "am"
                  ? "የኪራይ ጥያቄ ለመላክ የአገልግሎት ክፍያ"
                  : "Access Fee Required to Send Requests"}
              </h3>
              <p className="text-gray-300 text-xs mt-1.5 leading-relaxed">
                {language === "am"
                  ? `በእንጅባራ የቤት ኪራይ መድረክ ላይ ባለቤቶችን በቀጥታ ለማግኘት እና የቤት ኪራይ ጥያቄ ለመላክ መጀመሪያ የአንድ ጊዜ ${paymentStatus?.feeAmount || 200} ብር የአገልግሎት ክፍያ መክፈል ግዴታ ነው።`
                  : `To contact property owners and submit rental requests, you must pay a one-time ${paymentStatus?.feeAmount || 200} ETB service fee.`}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center space-y-3">
              <p className="text-xs text-slate-600">
                {language === "am"
                  ? "ክፍያውን ለመፈጸም የተዘጋጀውን የክፍያ ሞዱል ይክፈሉ። ሁሉም የባንክ መለያዎች እና የክፍያ ዘዴዎች በስርዓቱ ይቀረታሉ።"
                  : "Open the secure payment modal to complete your fee. All bank details and methods are provided by the system."}
              </p>
              <button
                type="button"
                onClick={() => setShowTenantPaymentModal(true)}
                className="w-full py-3 rounded-xl bg-slate-950 hover:bg-black text-amber-400 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition"
              >
                <CreditCard className="w-4 h-4" />
                {language === "am" ? "የአገልግሎት ክፍያ ክፈል" : "Pay Service Fee"}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-850 text-xs rounded-xl flex flex-col gap-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <span className="font-medium text-red-700">{error}</span>
                </div>
              </div>
            )}

            {/* Ethiopian Date Picker for Move-in date */}
            <div>
              <EthiopianDatePicker
                label={t("moveInDate")}
                value={moveInDate}
                onChange={setMoveInDate}
                placeholder="Select date..."
                minDate={new Date().toISOString().split("T")[0]}
              />
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-yellow-600" />{" "}
                {t("calendarInfo")}
              </p>
            </div>

            {/* Note / Message to Landlord */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("noteToOwner")}
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="..."
                className="w-full border-gray-300 border rounded-lg p-3 text-sm text-slate-900 bg-white placeholder-slate-400 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold text-xs hover:bg-gray-50 transition"
              >
                {t("cancel")}
              </button>
              <button
                type="submit"
                disabled={submitting || paymentRequired}
                className="px-6 py-2.5 rounded-lg bg-[#1A1A1A] hover:bg-black text-yellow-500 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {submitting ? "..." : t("sendRequest")}
              </button>
            </div>
          </form>
        )}

        {/* Digital Rental Contract Modal */}
        {showContractModal && (
          <RentalContractModal
            house={house}
            isOpen={showContractModal}
            onClose={() => setShowContractModal(false)}
          />
        )}

        {/* Tenant Service-Fee Payment Modal (shared with Messages) */}
        {showTenantPaymentModal && (
          <TenantPaymentModal
            isOpen={showTenantPaymentModal}
            onClose={() => setShowTenantPaymentModal(false)}
            onPaymentSubmitted={() => {
              // Payment is now Pending (server-authoritative). Surface the
              // pending state and let the tenant check for admin approval.
              setPaymentStatus((prev) => ({ ...prev, status: "Pending" }));
              setShowTenantPaymentModal(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
