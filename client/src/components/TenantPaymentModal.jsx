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
  CreditCard,
  CheckCircle2,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import ButtonSpinner from "../components/ButtonSpinner";

export default function TenantPaymentModal({
  isOpen,
  onClose,
  onPaymentSubmitted,
}) {
  const { language } = useLanguage();
  const [config, setConfig] = useState({ fees: {}, payments: {} });
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
          : "Payment information is temporarily unavailable. Please try again."
      );
    } finally {
      setConfigLoading(false);
    }
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
      formData.append("ad_type", "Tenant Contact Access");
      formData.append("amount", config.fees?.tenant_contact || "200");
      formData.append("payment_method", selectedPaymentKey);
      formData.append("transaction_ref", transactionRef.trim());
      if (receiptFile) formData.append("receipt", receiptFile);

      await axios.post("/api/payments/submit", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccessMsg(
        language === "am"
          ? "የክፍያ ማረጋገጫ ጥያቄዎ በተሳካ ሁኔታ ተልኳል። አድሚኑ ከተመለከተው በኋላ አገልግሎቱ ይበራል።"
          : "Payment submitted successfully! Admin will verify and activate your contact & rental request access.",
      );
      setTimeout(() => {
        if (onPaymentSubmitted) onPaymentSubmitted();
        onClose();
        setSuccessMsg("");
        setTransactionRef("");
        setReceiptFile(null);
      }, 2500);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error ||
          (language === "am"
            ? "ክፍያው መላክ አልተቻለም፡ እባክዎን እንደገና ይሞክሩ"
            : "Failed to submit payment request."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-start justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto pt-16 sm:pt-24 pb-12">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-4 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
        >
          <X size={20} />
        </button>

        <AdminFeeEditor
          configKey="ad_fee_tenant_contact"
          currentFee={config.fees?.tenant_contact || "200"}
          onUpdate={(val) =>
            setConfig((prev) => ({
              ...prev,
              fees: { ...prev.fees, tenant_contact: val },
            }))
          }
        />

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold flex-shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900">
              {language === "am"
                ? "የቤት ፈላጊዎች የአገልግሎት ክፍያ"
                : "Tenant Access Payment"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === "am"
                ? "ባለቤቱን ለማውራት እና ኪራይ ለመጠየቅ መጀመሪያ ክፍያ መፈጸም ያስፈልጋል"
                : "Mandatory access fee to contact owners & request rent"}
            </p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 text-xs font-semibold space-y-2 mb-6">
          <p className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              {language === "am"
                ? `አስተያየት፡ በእንጅባራ የቤት ኪራይ መድረክ ላይ ባለቤቶችን በቀጥታ በቻት ለማግኘት እና የቤት ኪራይ ጥያቄ ለመላክ መጀመሪያ የአንድ ጊዜ ${config.ad_fee_tenant_contact || "200"} ብር የአገልግሎት ክፍያ መክፈል ግዴታ ነው።`
                : `Note: To directly chat with landlords and submit rental requests, you must first pay a one-time service fee of ${config.ad_fee_tenant_contact || "200"} ETB.`}
            </span>
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-3 border border-red-200 animate-shake">
            <AlertCircle size={16} className="shrink-0" />
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
          <div className="mb-4 p-4 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-3 border border-emerald-200">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {configLoading ? (
            <div className="bg-slate-950 text-white p-8 rounded-2xl text-center">
              <div className="text-amber-400 text-sm font-bold animate-pulse">
                {language === "am" ? "በመጫን ላይ..." : "Loading payment information..."}
              </div>
            </div>
          ) : (
            <>
              {/* Fee Information Block */}
              <div className="bg-slate-950 text-white rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 pointer-events-none">
              <CreditCard size={120} />
            </div>
            <div className="relative z-10">
              <p className="text-slate-400 text-xs uppercase tracking-wider font-bold">
                {language === "am" ? "የሚከፈል መጠን" : "Amount to Pay"}
              </p>
               <h4 className="text-3xl font-black mt-1 text-amber-400">
                 {config.fees?.tenant_contact || "200"}{" "}
                 <span className="text-sm font-bold text-white">ETB</span>
               </h4>
              <p className="text-[11px] text-slate-400 mt-2">
                {language === "am"
                  ? "የአንድ ጊዜ ክፍያ • ቀጥታ ግንኙነት • ፈጣን የቤት ኪራይ ውል"
                  : "One-time fee • Direct chat with all landlords • instant agreement access"}
              </p>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
              {language === "am" ? "የክፍያ አማራጭ ይምረጡ" : "Select Payment Method"}
            </label>
            {paymentMethods.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-3">
                {language === "am"
                  ? "በአሁኑ ሰዓት የክፍያ መረጃ የለም። እባክዎን ከድጋፍ ጥረት ጋር ይገናኙ።"
                  : "No payment methods configured. Please contact support."}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map((key) => {
                  const label = PAYMENT_LABELS[key] || key;
                  const isSelected = selectedPaymentKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedPaymentKey(key)}
                      className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                        isSelected
                          ? "border-amber-500 bg-amber-500/10 text-amber-950 font-black"
                          : "border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>{PAYMENT_ICONS[key] || "💳"}</span>
                      <span className="truncate">{label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Payment Details Card based on method */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <h5 className="text-xs font-black text-slate-900 uppercase">
              {language === "am"
                ? "የመክፈያ ዝርዝር መረጃ"
                : "Bank Account Transfer Details"}
            </h5>

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
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                      <span className="text-slate-500">
                        {language === "am" ? "ስም (Name)" : "Account Name"}
                      </span>
                      <span className="font-bold text-slate-950 text-right">
                        {accountName || "-"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-slate-500">
                        {language === "am" ? valueLabel : valueLabel}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-900">
                          {accountValue}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(accountValue, selectedPaymentKey)
                          }
                          className="p-1 hover:bg-slate-200 rounded text-slate-500"
                        >
                          {copiedField === selectedPaymentKey ? (
                            <Check size={14} className="text-green-600" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="text-xs text-slate-400 text-center py-2">
                {language === "am"
                  ? "እባክዎን የክፍያ ዘዴ ይምረጡ"
                  : "Please select a payment method above"}
              </div>
            )}
          </div>

          {/* Verification Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                {language === "am"
                  ? "የትራንዛክሽን ማረጋገጫ ቁጥር (ግዴታ)"
                  : "Transaction Reference Number (Required)"}
              </label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="e.g. TXN12345678 or 100012345"
                className="w-full text-sm px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                {language === "am"
                  ? "የደረሰኝ ፎቶ/ፒዲኤፍ (አማራጭ)"
                  : "Receipt Photo / PDF (Optional)"}
              </label>
              <div className="flex items-center gap-3">
                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-slate-300 hover:border-amber-500 rounded-xl cursor-pointer text-xs font-bold text-slate-700 bg-slate-50 hover:bg-amber-50/20 transition">
                  <Upload size={16} className="text-slate-500" />
                  <span>
                    {receiptFile
                      ? receiptFile.name
                      : language === "am"
                        ? "ፎቶ አስገባ"
                        : "Upload Receipt"}
                  </span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => setReceiptFile(e.target.files[0])}
                  />
                </label>
                {receiptFile && (
                  <button
                    type="button"
                    onClick={() => setReceiptFile(null)}
                    className="px-3 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition"
                  >
                    {language === "am" ? "ሰርዝ" : "Remove"}
                  </button>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-slate-950 hover:bg-black text-amber-400 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
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
                    : "Submit Payment Verification"}
                </span>
              </>
            )}
          </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
