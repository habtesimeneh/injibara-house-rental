import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Check, Copy, Upload, AlertCircle, Building, CreditCard } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import AdminFeeEditor from './AdminFeeEditor';

export default function HousePaymentModal({ isOpen, onClose, onConfirm }) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [config, setConfig] = useState({});
  const [paymentAccounts, setPaymentAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [loading, setLoading] = useState(false);
  const [configError, setConfigError] = useState('');

  const isAdmin = user?.role === 'Admin';

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setConfigError('');
      if (isAdmin) {
        Promise.all([
          axios.get('/api/admin/settings').catch(() => axios.get('/api/payments/config')),
          axios.get('/api/payments/accounts')
        ]).then(([settingsRes, accountsRes]) => {
          setConfig(settingsRes.data);
          const accounts = Array.isArray(accountsRes.data) ? accountsRes.data : [];
          setPaymentAccounts(accounts);
          if (accounts.length > 0) {
            setSelectedAccount(accounts[0]);
            setPaymentMethod(accounts[0].bank_name);
          }
        }).catch(err => {
          console.error(err);
          setConfigError(language === 'am' ? 'መረጃ ማግኘት አልተቻለም።' : 'Failed to load payment information.');
        }).finally(() => setLoading(false));
      } else {
        axios.get('/api/payments/config')
          .then(res => {
            const data = res.data?.data || res.data || {};
            setConfig(data);
            const payments = data.payments || {};
            const accounts = Object.entries(payments).map(([key, val]) => ({
              id: key,
              bank_name: key.charAt(0).toUpperCase() + key.slice(1),
              account_number: val.account || val.phone || '',
              account_name: val.name || ''
            }));
            setPaymentAccounts(accounts);
            if (accounts.length > 0) {
              setSelectedAccount(accounts[0]);
              setPaymentMethod(accounts[0].bank_name);
            }
          })
          .catch(err => {
            console.error(err);
            setConfigError(language === 'am' ? 'የክፍያ መረጃ ማግኘት አልተቻለም። እባክዎን እንደገና ይሞክሩ።' : 'Payment information is temporarily unavailable. Please try again.');
          })
          .finally(() => setLoading(false));
      }
    }
  }, [isOpen, isAdmin, language]);

  if (!isOpen) return null;

  const currentFee = config.ad_fee_landlord_post || config.fees?.landlord_post || "250";

  const handleAccountSelect = (acc) => {
    setSelectedAccount(acc);
    setPaymentMethod(acc.bank_name);
  };

  const handleAdminAction = (action, acc = null) => {
    if (action === 'delete' && acc) {
      if (window.confirm('Are you sure you want to delete this payment account?')) {
        axios.delete(`/api/admin/payment-accounts/${acc.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }).then(() => {
          setPaymentAccounts(prev => prev.filter(a => a.id !== acc.id));
          if (selectedAccount?.id === acc.id) setSelectedAccount(null);
        }).catch(err => alert(err.response?.data?.error || 'Failed to delete'));
      }
    } else {
      const bankName = prompt("Enter Bank Name:", acc ? acc.bank_name : "");
      if (bankName === null) return;
      const accName = prompt("Enter Account Name:", acc ? acc.account_name : "");
      if (accName === null) return;
      const accNum = prompt("Enter Account Number:", acc ? acc.account_number : "");

      const payload = {
        bank_name: bankName,
        account_name: accName,
        account_number: accNum,
        is_active: 1
      };

      if (acc) {
        axios.put(`/api/admin/payment-accounts/${acc.id}`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }).then(() => window.location.reload())
        .catch(err => alert(err.response?.data?.error || 'Update failed'));
      } else {
        axios.post(`/api/admin/payment-accounts`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }).then(() => window.location.reload())
        .catch(err => alert(err.response?.data?.error || 'Create failed'));
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(paymentMethod, transactionRef, receiptFile);
  };

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition z-50"
        >
          <X size={20} />
        </button>

        {isAdmin && (
          <AdminFeeEditor
            configKey="ad_fee_landlord_post"
            currentFee={currentFee}
            onUpdate={(val) => setConfig(prev => ({ ...prev, ad_fee_landlord_post: val }))}
          />
        )}

        <div className="bg-slate-900 p-6 md:p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
          <div className="w-16 h-16 bg-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
            <Building size={32} />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">
            {language === 'am' ? 'የቤት መመዝገቢያ ክፍያ' : 'Property Listing Fee'}
          </h2>
          <p className="text-slate-300 text-sm max-w-md mx-auto">
            {language === 'am'
              ? `ማስታወቂያዎ እንዲለጠፍ እባክዎን የአገልግሎት ክፍያ ${currentFee} ብር ከታች ባሉት የባንክ ሂሳቦች ያስገቡ።`
              : `To post your property, please pay the listing fee of ${currentFee} ETB.`}
          </p>
        </div>

        {configError && (
          <div className="px-6 md:px-8 pt-6">
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2">
              <AlertCircle size={18} className="shrink-0" />
              <span className="flex-1">{configError}</span>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="text-xs font-bold underline"
              >
                {language === 'am' ? 'እንደገና ሞክር' : 'Retry'}
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-slate-800">
                {language === 'am' ? 'ክፍያ የሚፈጽሙበትን ባንክ ይምረጡ' : 'Select Payment Method'}
              </label>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleAdminAction('add')}
                  className="text-[10px] bg-emerald-600 text-white px-2 py-1 rounded-lg font-bold hover:bg-emerald-500 transition uppercase"
                >
                  + Add Account
                </button>
              )}
            </div>
            {loading ? (
              <div className="text-xs text-slate-500 animate-pulse">
                {language === 'am' ? 'በመጫን ላይ...' : 'Loading...'}
              </div>
            ) : paymentAccounts.length === 0 ? (
              <div className="text-xs text-slate-500 text-center py-3">
                {language === 'am' ? 'ዝርዝር አልተገኘም።' : 'No payment accounts available.'}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {paymentAccounts.map(acc => (
                  <div key={acc.id} className="relative group">
                    <button
                      type="button"
                      onClick={() => handleAccountSelect(acc)}
                      className={`w-full p-2.5 rounded-xl border-2 text-[11px] font-bold transition-all truncate ${
                        selectedAccount?.id === acc.id
                          ? 'border-amber-500 bg-amber-50 text-amber-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-amber-200 hover:bg-slate-50'
                      }`}
                    >
                      {acc.bank_name}
                    </button>
                    {isAdmin && (
                      <div className="absolute -top-1 -right-1 hidden group-hover:flex gap-1">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleAdminAction('edit', acc); }}
                          className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-500 shadow-lg"
                        >
                          <Check size={10} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleAdminAction('delete', acc); }}
                          className="w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-500 shadow-lg"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-900 rounded-2xl p-1 shadow-inner">
            {selectedAccount ? (
              <div className="bg-slate-800/80 p-3.5 rounded-xl flex items-center justify-between border border-slate-700">
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{selectedAccount.bank_name}:</div>
                  <div className="text-base font-black text-white truncate">{selectedAccount.account_number}</div>
                  <div className="text-xs text-amber-400 font-medium truncate">{selectedAccount.account_name}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(selectedAccount.account_number, selectedAccount.id)}
                  className="shrink-0 bg-amber-500/20 hover:bg-amber-500 hover:text-slate-950 text-amber-400 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                >
                  {copiedField === selectedAccount.id ? <Check size={14} /> : <Copy size={14} />}
                  {copiedField === selectedAccount.id ? 'Copied' : 'Copy'}
                </button>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 text-sm italic font-medium">
                {language === 'am' ? 'እባክዎን መጀመሪያ ባንክ ይምረጡ' : 'Please select a bank account above'}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1">
              {language === 'am' ? 'የትራንዛክሽን ቁጥር (Transaction Ref No)' : 'Transaction Reference / SMS Code'} <span className="text-red-500">*</span>
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

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1">
              {language === 'am' ? 'የደረሰኝ ፎቶ/ስክሪንሾት (Receipt Upload)' : 'Upload Receipt / Payment Screenshot'}
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-amber-500 transition bg-slate-50">
              <input
                type="file"
                id="receiptUpload"
                accept="image/*,.pdf"
                onChange={(e) => setReceiptFile(e.target.files[0])}
                className="hidden"
              />
              <label htmlFor="receiptUpload" className="cursor-pointer flex flex-col items-center justify-center gap-1 text-slate-600">
                <Upload size={20} className="text-amber-500" />
                <span className="text-xs font-bold">
                  {receiptFile ? receiptFile.name : (language === 'am' ? 'ደረሰኝ ለመጫን እዚህ ይጫኑ' : 'Click to attach payment receipt')}
                </span>
                <span className="text-[10px] text-slate-400">JPG, PNG, PDF max 10MB</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={() => {
                if(window.confirm(language === 'am' ? 'እርግጠኛ ነዎት መሰረዝ ይፈልጋሉ?' : 'Are you sure you want to cancel?')) {
                  onClose();
                }
              }}
              className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
            >
              {language === 'am' ? 'ሰርዝ (Cancel)' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="flex-1 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-base rounded-xl transition shadow-lg flex items-center justify-center gap-2"
            >
              <CreditCard size={20} />
              <span>{language === 'am' ? 'ክፍያውን አረጋግጥ' : 'Confirm Payment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
