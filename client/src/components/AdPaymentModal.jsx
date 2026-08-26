import AdminFeeEditor from "./AdminFeeEditor";
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  X,
  Check,
  Copy,
  Upload,
  AlertCircle,
  Sparkles,
  Building,
  Search,
  CreditCard,
  CheckCircle2,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function AdPaymentModal({
  isOpen,
  onClose,
  defaultHouseId,
  defaultSeekingAdId,
  defaultAdType,
  onPaymentSubmitted,
}) {
  const { language } = useLanguage();
  const [config, setConfig] = useState({ fees: {}, payments: {} });
  const [myHouses, setMyHouses] = useState([]);
  const [mySeekingAds, setMySeekingAds] = useState([]);

  const [adType, setAdType] = useState(defaultAdType || "Featured Listing");
  const [selectedHouseId, setSelectedHouseId] = useState(defaultHouseId || "");
  const [selectedSeekingAdId, setSelectedSeekingAdId] = useState(
    defaultSeekingAdId || "",
  );
  const [selectedPaymentKey, setSelectedPaymentKey] = useState(null);
  const [transactionRef, setTransactionRef] = useState("");
  const [receiptFile, setReceiptFile] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [configLoading, setConfigLoading] = useState(false);

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

  const paymentMethods = Object.keys(config.payments || {});
  const selectedPayment = selectedPaymentKey
    ? config.payments[selectedPaymentKey]
    : null;
  const paymentMethod =
    selectedPaymentKey && PAYMENT_LABELS[selectedPaymentKey]
      ? PAYMENT_LABELS[selectedPaymentKey]
      : paymentMethods.length > 0
        ? PAYMENT_LABELS[paymentMethods[0]] || paymentMethods[0]
        : "";

  useEffect(() => {
    if (isOpen) {
      fetchConfig();
      fetchUserData();
      if (defaultAdType) setAdType(defaultAdType);
      if (defaultHouseId) setSelectedHouseId(defaultHouseId);
      if (defaultSeekingAdId) setSelectedSeekingAdId(defaultSeekingAdId);
    }
  }, [isOpen]);

  const normalizeConfig = (raw) => {
    const data = raw?.data || raw || {};
    return {
      fees: data.fees || {},
      payments: data.payments || {},
    };
  };

  const fetchConfig = async () => {
    setConfigLoading(true);
    try {
      const res = await axios.get("/api/payments/config");
      const normalized = normalizeConfig(res.data);
      setConfig(normalized);
      const methods = Object.keys(normalized.payments || {});
      if (methods.length > 0 && !selectedPaymentKey) {
        setSelectedPaymentKey(methods[0]);
      }
    } catch (e) {
      console.error(e);
      setError(
        language === "am"
          ? "የክፍያ መረጃ ማግኘት አልተቻለም። እባክዎን እንደገና ይሞክሩ።"
          : "Payment information is temporarily unavailable. Please try again.",
      );
    } finally {
      setConfigLoading(false);
    }
  };

  const fetchUserData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const [housesRes, adsRes] = await Promise.all([
        axios
          .get("/api/houses/my-houses", {
            headers: { Authorization: `Bearer ${token}` },
          })
          .catch(() => ({ data: [] })),
        axios
          .get("/api/seeking-ads/my-ads", {
            headers: { Authorization: `Bearer ${token}` },
          })
          .catch(() => ({ data: [] })),
      ]);
      setMyHouses(housesRes.data || []);
      setMySeekingAds(adsRes.data || []);

      if (!selectedHouseId && housesRes.data && housesRes.data.length > 0) {
        setSelectedHouseId(housesRes.data[0].house_id);
      }
      if (!selectedSeekingAdId && adsRes.data && adsRes.data.length > 0) {
        setSelectedSeekingAdId(adsRes.data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getAmount = () => {
    if (adType === "Featured Listing") return config.fees?.featured_house || "500";
    if (adType === "Tenant Seeking Ad") return config.fees?.tenant_seeking || "250";
    if (adType === "Top Banner") return config.fees?.banner || "1000";
    return "500";
  };

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!selectedPaymentKey || !config.payments[selectedPaymentKey]) {
      setError(
        language === "am"
          ? "እባክዎን የክፍያ ዘዴ ይምረጡ"
          : "Please select a valid payment method.",
      );
      return;
    }

    if (!transactionRef.trim()) {
      setError(
        language === "am"
          ? "እባክዎን የትራንዛክሽን ቁጥር (Transaction Ref Number) ያስገቡ"
          : "Please enter your Transaction Reference Number.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("ad_type", adType);
      formData.append("amount", getAmount());
      formData.append("payment_method", selectedPaymentKey);
      formData.append("transaction_ref", transactionRef.trim());
      if (selectedHouseId) formData.append("house_id", selectedHouseId);
      if (selectedSeekingAdId)
        formData.append("seeking_ad_id", selectedSeekingAdId);
      if (receiptFile) formData.append("receipt", receiptFile);

      const res = await axios.post("/api/payments/submit", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccessMsg(
        language === "am"
          ? "የክፍያ ማረጋገጫ ጥያቄዎ በተሳካ ሁኔታ ተልኳል። አድሚኑ ከተመለከተው በኋላ ማስታወቂያዎ ይበራል።"
          : "Payment submitted successfully! Admin will verify and activate your ad.",
      );
      setTransactionRef("");
      setReceiptFile(null);
      onPaymentSubmitted?.();
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error ||
          (language === "am"
            ? "ክፍያው መላክ አልተቻለም፡ እባክዎን እንደገና ይሞክሩ"
            : "Failed to submit payment."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-start justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto pt-16 sm:pt-24 pb-12">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-4 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
        >
          <X size={20} />
        </button>
        <AdminFeeEditor
          configKey={
            adType === "Featured Listing"
              ? "ad_fee_featured_house"
              : adType === "Tenant Seeking Ad"
                ? "ad_fee_tenant_seeking"
                : "ad_fee_banner"
          }
          currentFee={
            adType === "Featured Listing"
              ? config.ad_fee_featured_house
              : adType === "Tenant Seeking Ad"
                ? config.ad_fee_tenant_seeking
                : config.ad_fee_banner
          }
          onUpdate={(val) =>
            setConfig((prev) => ({
              ...prev,
              [adType === "Featured Listing"
                ? "ad_fee_featured_house"
                : adType === "Tenant Seeking Ad"
                  ? "ad_fee_tenant_seeking"
                  : "ad_fee_banner"]: val,
            }))
          }
        />

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold flex-shrink-0">
            <Sparkles size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900">
              {language === "am"
                ? "የማስታወቂያ እና የአገልግሎት ክፍያ"
                : "Ad Payment & Sponsorship"}
            </h3>
            <p className="text-sm text-slate-500">
              {language === "am"
                ? "ቤትዎን ወይም ማስታወቂያዎን በመጀመሪያ ገጽ ላይ ያሳዩ"
                : "Boost your property or request listing on top"}
            </p>
          </div>
        </div>

        {/* 30-Day Free Advertising Policy Notice */}
        <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-emerald-700 text-sm">
            <CheckCircle2 size={16} />
            <span>
              🎉 መደበኛ ማስታወቂያ ለመጀመሪያዎቹ 30 ቀናት 100% ነፃ ነው! (30 Days Free Trial
              Active)
            </span>
          </div>
          <p className="text-emerald-800 text-[11px] leading-relaxed">
            በሲስተማችን ላይ የሚወጡ ማናቸውም የቤት እና የቤት ፈላጊ ማስታወቂያዎች ለመጀመሪያዎቹ 30 ቀናት በነጻ
            ይስተናገዳሉ። ክፍያ የሚጠየቀው ማስታወቂያዎን በከፍተኛ ገጽ ላይ (VIP Boost) ለማደመቅ ወይም ከ30
            ቀናት በኋላ ነው::
          </p>
        </div>

        {error && (
          <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
            <AlertCircle size={18} className="flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              type="button"
              onClick={fetchConfig}
              className="text-xs font-bold underline"
            >
              {language === "am" ? "እንደገና ሞክር" : "Retry"}
            </button>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
            <CheckCircle2
              size={18}
              className="flex-shrink-0 text-emerald-600"
            />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Ad Type Select */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">
              {language === "am"
                ? "የማስታወቂያ ዓይነት ይምረጡ"
                : "Select Advertising Package"}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setAdType("Featured Listing")}
                className={`p-3.5 rounded-2xl border text-left transition ${
                  adType === "Featured Listing"
                    ? "border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20 text-slate-900"
                    : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-xs uppercase tracking-wide text-amber-600">
                    Landlord
                  </span>
                  <Building size={16} className="text-amber-500" />
                </div>
                <div className="font-black text-sm">ልዩ ቤት (VIP)</div>
                <div className="text-base font-black text-slate-900 mt-1">
                  {config.ad_fee_featured_house} ETB
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAdType("Tenant Seeking Ad")}
                className={`p-3.5 rounded-2xl border text-left transition ${
                  adType === "Tenant Seeking Ad"
                    ? "border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20 text-slate-900"
                    : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-xs uppercase tracking-wide text-amber-600">
                    Tenant
                  </span>
                  <Search size={16} className="text-amber-500" />
                </div>
                <div className="font-black text-sm">ቤት ፈላጊ ማስታወቂያ</div>
                <div className="text-base font-black text-slate-900 mt-1">
                  {config.ad_fee_tenant_seeking} ETB
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAdType("Top Banner")}
                className={`p-3.5 rounded-2xl border text-left transition ${
                  adType === "Top Banner"
                    ? "border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20 text-slate-900"
                    : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-xs uppercase tracking-wide text-amber-600">
                    Banner
                  </span>
                  <Sparkles size={16} className="text-amber-500" />
                </div>
                <div className="font-black text-sm">ዋና ባነር ማስታወቂያ</div>
                <div className="text-base font-black text-slate-900 mt-1">
                  {config.ad_fee_banner} ETB
                </div>
              </button>
            </div>
          </div>

          {/* Target Item Selection */}
          {adType === "Featured Listing" && myHouses.length > 0 && (
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1">
                {language === "am" ? "የሚተወቀው ቤት" : "Select House to Promote"}
              </label>
              <select
                value={selectedHouseId}
                onChange={(e) => setSelectedHouseId(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              >
                {myHouses.map((h) => (
                  <option key={h.house_id} value={h.house_id}>
                    {h.title} - {Number(h.price).toLocaleString()} ETB ({h.city}
                    )
                  </option>
                ))}
              </select>
            </div>
          )}

          {adType === "Tenant Seeking Ad" && mySeekingAds.length > 0 && (
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1">
                {language === "am"
                  ? "የሚተወቀው የቤት ፈላጊ ማስታወቂያ"
                  : "Select Seeking Ad"}
              </label>
              <select
                value={selectedSeekingAdId}
                onChange={(e) => setSelectedSeekingAdId(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              >
                {mySeekingAds.map((ad) => (
                  <option key={ad.id} value={ad.id}>
                    {ad.title} (Max: {Number(ad.budget_max).toLocaleString()}{" "}
                    ETB)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Payment Account Details Card */}
          {configLoading ? (
            <div className="bg-slate-900 text-white p-8 rounded-2xl text-center">
              <div className="text-amber-400 text-sm font-bold animate-pulse">
                {language === "am" ? "በመጫን ላይ..." : "Loading payment information..."}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-4 relative overflow-hidden">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                {language === "am"
                  ? "የክፍያ አካውንቶች"
                  : "Official Payment Accounts"}
              </span>
              <span className="text-lg font-black text-amber-400">
                {getAmount()} ETB
              </span>
            </div>

            {/* Payment Method Selector */}
            {paymentMethods.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-3">
                {language === "am"
                  ? "በአሁኑ ሰዓት የክፍያ መረጃ የለም። እባክዎን ከድጋፍ ጥረት ጋር ይገናኙ።"
                  : "No payment methods configured. Please contact support."}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {paymentMethods.map((key) => {
                  const label = PAYMENT_LABELS[key] || key;
                  const isSelected = selectedPaymentKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedPaymentKey(key)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? "bg-amber-500 text-slate-950 shadow-lg"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                      }`}
                    >
                      <span>{PAYMENT_ICONS[key] || "💳"}</span>
                      <span className="truncate">{label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Active Method Details */}
            {selectedPayment ? (
              (() => {
                const label =
                  selectedPaymentKey && PAYMENT_LABELS[selectedPaymentKey]
                    ? PAYMENT_LABELS[selectedPaymentKey]
                    : selectedPaymentKey || "Payment";
                const accountValue =
                  selectedPayment.account || selectedPayment.phone || "";
                const accountName = selectedPayment.name || "";
                const valueLabel =
                  selectedPaymentKey === "telebirr"
                    ? "Phone Number"
                    : "Account Number";

                return (
                  <div className="bg-slate-800/80 p-3.5 rounded-xl flex items-center justify-between border border-slate-700">
                    <div className="min-w-0">
                      <div className="text-xs text-slate-400">{label}:</div>
                      <div className="text-base font-black text-white truncate">
                        {accountValue}
                      </div>
                      {accountName && (
                        <div className="text-xs text-amber-400 font-medium truncate">
                          {accountName}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                        {valueLabel}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(accountValue, selectedPaymentKey)
                        }
                        className="bg-amber-500/20 hover:bg-amber-500 hover:text-slate-950 text-amber-400 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                      >
                        {copiedField === selectedPaymentKey ? (
                          <Check size={14} />
                        ) : (
                          <Copy size={14} />
                        )}
                        {copiedField === selectedPaymentKey ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 text-xs text-slate-400 text-center py-2">
                {language === "am"
                  ? "እባክዎን የክፍያ ዘዴ ይምረጡ"
                  : "Please select a payment method above"}
              </div>
            )}
          </div>
          )}

          {/* Transaction Reference Input */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1">
              {language === "am"
                ? "የትራንዛክሽን ቁጥር (Transaction Ref No)"
                : "Transaction Reference / SMS Code"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder="e.g. 100029384812 or TXN982341"
              className="w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-900 font-mono text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
            />
          </div>

          {/* Receipt File Upload */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1">
              {language === "am"
                ? "የደረሰኝ ፎቶ/ስክሪንሾት (Receipt Upload)"
                : "Upload Receipt / Payment Screenshot"}
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-amber-500 transition bg-slate-50">
              <input
                type="file"
                id="receiptUpload"
                accept="image/*,.pdf"
                onChange={(e) => setReceiptFile(e.target.files[0])}
                className="hidden"
              />
              <label
                htmlFor="receiptUpload"
                className="cursor-pointer flex flex-col items-center justify-center gap-1 text-slate-600"
              >
                <Upload size={20} className="text-amber-500" />
                <span className="text-xs font-bold">
                  {receiptFile
                    ? receiptFile.name
                    : language === "am"
                      ? "ደረሰኝ ለመጫን እዚህ ይጫኑ"
                      : "Click to attach payment receipt"}
                </span>
                <span className="text-[10px] text-slate-400">
                  JPG, PNG, PDF max 10MB
                </span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-base rounded-xl transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <span>{language === "am" ? "በመላክ ላይ..." : "Submitting..."}</span>
            ) : (
              <>
                <CreditCard size={20} />
                <span>
                  {language === "am"
                    ? "ክፍያውን አረጋግጥ እና ላክ"
                    : "Submit Payment Request"}
                </span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
