import React, { useState, useRef } from 'react';
import { FileText, Download, Printer, X, ShieldCheck, CheckCircle2, User, Building, Calendar, DollarSign, Award } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import EthiopianDatePicker from './EthiopianDatePicker';
import { formatEthiopianDate } from '../utils/date';
import CITY_CONFIG from '../config/cityConfig';
import { useLanguage } from '../context/LanguageContext';

const RentalContractModal = ({ house, isOpen, onClose, onContractCreated }) => {
  const contractRef = useRef(null);
  const { language } = useLanguage();

  const [formData, setFormData] = useState({
    house_id: house ? house.house_id : '',
    landlord_name: house ? house.owner_name || '' : '',
    landlord_id_no: '',
    landlord_phone: house ? house.owner_phone || '' : '',
    tenant_name: '',
    tenant_id_no: '',
    tenant_phone: '',
    monthly_rent: house ? house.price || '' : '',
    deposit_amount: house ? house.price || '' : '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
    terms_conditions: '1. ተከራይ ወርሃዊ ኪራዩን በየወሩ የመጀመሪያ ሳምንት ውስጥ ለአከራይ ገቢ ማድረግ አለበት።\n2. ተከራይ የቤቱን ንፅህና እና ደህንነት መጠበቅ አለበት።\n3. ማንኛውንም የቤት እድሳት ወይም ለውጥ ከአከራይ ፈቃድ ውጪ ማድረግ አይቻልም።\n4. ውሉ ከመጠናቀቁ 1 ወር በፊት ሁለቱም ወገኖች ውሉን ስለማደስ ወይም ማቋረጥ ማሳወቅ አለባቸው።'
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [contractCreated, setContractCreated] = useState(false);
  const [createdContractId, setCreatedContractId] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'landlord_id_no' || name === 'tenant_id_no') {
      // Filter out any letters or special symbols except numbers, dash (-), slash (/)
      const filteredValue = value.replace(/[^0-9\-\/]/g, '');
      setFormData(prev => ({ ...prev, [name]: filteredValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = () => {
    if (!formData.landlord_name?.trim()) return 'እባክዎን የአከራይ ሙሉ ስም ይሙሉ (Landlord Name is required)';
    if (!formData.landlord_id_no?.trim()) return 'እባክዎን የአከራይ መታወቂያ ቁጥር ይሙሉ (Landlord ID Number is required)';
    if (!formData.landlord_phone?.trim()) return 'እባክዎን የአከራይ ስልክ ቁጥር ይሙሉ (Landlord Phone is required)';
    if (!formData.tenant_name?.trim()) return 'እባክዎን የተከራይ ሙሉ ስም ይሙሉ (Tenant Name is required)';
    if (!formData.tenant_id_no?.trim()) return 'እባክዎን የተከራይ መታወቂያ ቁጥር ይሙሉ (Tenant ID Number is required)';
    if (!formData.tenant_phone?.trim()) return 'እባክዎን የተከራይ ስልክ ቁጥር ይሙሉ (Tenant Phone is required)';
    if (!formData.monthly_rent) return 'እባክዎን ወርሃዊ የኪራይ ክፍያ ዋጋ ይሙሉ (Monthly Rent is required)';
    if (!formData.start_date) return 'እባክዎን የውል መጀመሪያ ቀን ይሙሉ (Start Date is required)';
    if (!formData.end_date) return 'እባክዎን የውል ማብቂያ ቀን ይሙሉ (End Date is required)';
    return null;
  };

  const handleSaveContract = async () => {
    const errorMsg = validateForm();
    if (errorMsg) {
      setMessage({ type: 'error', text: errorMsg });
      return;
    }

    try {
      setIsGenerating(true);
      setMessage({ type: '', text: '' });

      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...formData,
          house_id: house ? house.house_id : formData.house_id
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save contract');

      setContractCreated(true);
      setCreatedContractId(data.contract_id);
      setMessage({ type: 'success', text: 'የቤት ኪራይ ውል ስምምነቱ በስኬት ተመዝግቧል!' });
      if (onContractCreated) onContractCreated();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    const errorMsg = validateForm();
    if (errorMsg) {
      setMessage({ type: 'error', text: `የውል PDF ለማውረድ መጀመሪያ መረጃዎችን ያሟሉ፡ ${errorMsg}` });
      return;
    }

    if (!contractRef.current) return;
    try {
      setIsGenerating(true);
      const element = contractRef.current;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Injibara_House_Rental_Contract_${formData.tenant_name || 'Document'}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('PDF በማውረድ ላይ ችግር አጋጥሟል፤ እባክዎን ህትመት (Print) አማራጭን ይጠቀሙ።');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    const errorMsg = validateForm();
    if (errorMsg) {
      setMessage({ type: 'error', text: `ለማተም መጀመሪያ መረጃዎችን ያሟሉ፡ ${errorMsg}` });
      return;
    }
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-start justify-center p-4 pt-20 sm:pt-28 pb-12">
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl max-w-4xl w-full max-h-[80vh] flex flex-col shadow-2xl overflow-hidden text-white my-4">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">ዲጂታል የቤት ኪራይ ውል ስምምነት</h2>
              <p className="text-xs text-amber-400 font-medium">Digital Residential Rental Contract PDF Generator</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content - Two Column (Form & Preview) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {message.text && (
            <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-2 ${
              message.type === 'error' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              <CheckCircle2 className="w-5 h-5" />
              {message.text}
            </div>
          )}

          {!contractCreated ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Landlord Info */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-700 space-y-3">
                <h3 className="text-sm font-black text-amber-400 flex items-center gap-2">
                  <User className="w-4 h-4" /> የአከራይ መረጃ (Landlord Details)
                </h3>
                <div>
                  <label className="block text-xs font-bold text-slate-100 mb-1">የአከራይ ሙሉ ስም *</label>
                  <input
                    type="text"
                    name="landlord_name"
                    value={formData.landlord_name}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-sm font-semibold text-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                    placeholder="ለምሳሌ፡ አበበ ከበደ"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-100 mb-1">የመታወቂያ ቁጥር (Kebele ID / Passport) *</label>
                  <input
                    type="text"
                    name="landlord_id_no"
                    value={formData.landlord_id_no}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-sm font-bold text-amber-300 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                    placeholder="ለምሳሌ፡ 02/10984"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">ቁጥር፣ - እና / ብቻ ይቀበላል</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-100 mb-1">ስልክ ቁጥር *</label>
                  <input
                    type="text"
                    name="landlord_phone"
                    value={formData.landlord_phone}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-sm font-semibold text-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                    placeholder="+251 9..."
                  />
                </div>
              </div>

              {/* Tenant Info */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-700 space-y-3">
                <h3 className="text-sm font-black text-amber-400 flex items-center gap-2">
                  <User className="w-4 h-4" /> የተከራይ መረጃ (Tenant Details)
                </h3>
                <div>
                  <label className="block text-xs font-bold text-slate-100 mb-1">የተከራይ ሙሉ ስም *</label>
                  <input
                    type="text"
                    name="tenant_name"
                    value={formData.tenant_name}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-sm font-semibold text-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                    placeholder="ለምሳሌ፡ ትዕግስት አሰፋ"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-100 mb-1">የመታወቂያ ቁጥር (Kebele ID / Passport) *</label>
                  <input
                    type="text"
                    name="tenant_id_no"
                    value={formData.tenant_id_no}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-sm font-bold text-amber-300 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                    placeholder="ለምሳሌ፡ 11/84720"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">ቁጥር፣ - እና / ብቻ ይቀበላል</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-100 mb-1">ስልክ ቁጥር *</label>
                  <input
                    type="text"
                    name="tenant_phone"
                    value={formData.tenant_phone}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-sm font-semibold text-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                    placeholder="+251 9..."
                  />
                </div>
              </div>

              {/* Rent & Financial Terms */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-700 space-y-3 md:col-span-2">
                <h3 className="text-sm font-black text-amber-400 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> የኪራይ ዋጋ እና የጊዜ ገደብ (Terms & Payments)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-100 mb-1">ወርሃዊ ኪራይ (ETB) *</label>
                    <input
                      type="number"
                      name="monthly_rent"
                      value={formData.monthly_rent}
                      onChange={handleChange}
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-sm font-extrabold text-amber-400 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-100 mb-1">የቅድመ ክፍያ/ዲፖዚት (ETB)</label>
                    <input
                      type="number"
                      name="deposit_amount"
                      value={formData.deposit_amount}
                      onChange={handleChange}
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-sm font-semibold text-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <EthiopianDatePicker
                      label="የውል መጀመሪያ ቀን (Ethiopian Start Date)"
                      value={formData.start_date}
                      onChange={(dateStr) => setFormData(prev => ({ ...prev, start_date: dateStr }))}
                      required={true}
                    />
                  </div>
                  <div>
                    <EthiopianDatePicker
                      label="የውል ማብቂያ ቀን (Ethiopian End Date)"
                      value={formData.end_date}
                      onChange={(dateStr) => setFormData(prev => ({ ...prev, end_date: dateStr }))}
                      required={true}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-100 mb-1">የውል ውሎችና ግዴታዎች (Contract Rules)</label>
                  <textarea
                    rows={4}
                    name="terms_conditions"
                    value={formData.terms_conditions}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-xs md:text-sm font-medium text-slate-100 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>

            </div>
          ) : null}

          {/* Printable Official Ethiopian Contract Layout */}
          <div className="bg-white text-slate-950 p-8 rounded-xl shadow-2xl space-y-6 font-serif border-2 border-slate-900" ref={contractRef}>
            
            {/* Header */}
            <div className="text-center border-b-2 border-slate-950 pb-4">
              <p className="text-xs font-black uppercase tracking-widest text-slate-800">የኢትዮጵያ ፌደራላዊ ዴሞክራሲያዊ ሪፐብሊክ</p>
              <p className="text-base font-black text-slate-950 uppercase mt-1">የእንጅባራ ከተማ የቤት ኪራይ ውል ስምምነት ሰነድ</p>
              <div className="mt-2 inline-block bg-amber-100 border border-amber-600 px-3 py-1 rounded text-xs font-black text-amber-950">
                መለያ ቁጥር: INJ-RENT-2026-00{createdContractId || Math.floor(Math.random()*900 + 100)}
              </div>
            </div>

            {/* Contract Body */}
            <div className="text-sm leading-relaxed space-y-4 text-slate-900">
              <p className="text-sm text-slate-900">
                ይህ የቤት ኪራይ ውል ስምምነት ዛሬ <b>{formatEthiopianDate(formData.start_date, true) || formData.start_date}</b> በቀን በአከራይ <b className="text-slate-950">{formData.landlord_name || '______________'}</b> (መታወቂያ ቁጥር: <span className="font-bold">{formData.landlord_id_no || '______'}</span>፤ ስልክ: <span className="font-bold">{formData.landlord_phone || '______'}</span>) እና በተከራይ <b className="text-slate-950">{formData.tenant_name || '______________'}</b> (መታወቂያ ቁጥር: <span className="font-bold">{formData.tenant_id_no || '______'}</span>፤ ስልክ: <span className="font-bold">{formData.tenant_phone || '______'}</span>) መካከል ተደረገ።
              </p>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-300">
                <h4 className="font-black text-slate-950 mb-1.5 text-sm">1. የቤቱ መረጃ እና አድራሻ (Property Location)</h4>
                <p><b>የቤት ስም/ርዕስ:</b> {house ? house.title : 'የመኖሪያ ቤት'}</p>
                <p><b>ከተማ/ቀበሌ:</b> {house ? `${house.city}፣ ${house.sub_city || house.address || ''}` : `${language === 'am' ? CITY_CONFIG.cityNameAm : CITY_CONFIG.cityNameEn} ከተማ`}</p>
                <p><b>የቤት ዓይነት:</b> {house ? house.type : 'መኖሪያ ቤት'} ({house ? house.rooms : 1} ክፍል)</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-300">
                <h4 className="font-black text-slate-950 mb-1.5 text-sm">2. የኪራይ ክፍያ እና የጊዜ ገደብ (Rent & Term)</h4>
                <p><b>ወርሃዊ ኪራይ:</b> <span className="font-black text-slate-950 text-base">{Number(formData.monthly_rent || 0).toLocaleString()} ብር (ETB)</span></p>
                <p><b>የቅድመ ክፍያ/ዲፖዚት:</b> <span className="font-bold">{Number(formData.deposit_amount || 0).toLocaleString()} ብር</span></p>
                <p><b>የውል ፀሎት (ጊዜ ገደብ):</b> ከ <b className="text-slate-950">{formatEthiopianDate(formData.start_date, true) || formData.start_date}</b> እስከ <b className="text-slate-950">{formatEthiopianDate(formData.end_date, true) || formData.end_date}</b> ድረስ።</p>
              </div>

              <div>
                <h4 className="font-black text-slate-950 mb-1 text-sm">3. የውል ግዴታዎች (Terms & Conditions)</h4>
                <p className="whitespace-pre-line text-slate-900 font-normal leading-relaxed">{formData.terms_conditions}</p>
              </div>

              {/* Signatures */}
              <div className="pt-6 grid grid-cols-2 gap-8 border-t-2 border-slate-950 mt-6">
                <div>
                  <p className="font-black text-slate-950">የአከራይ ፊርማ (Landlord Signature):</p>
                  <p className="mt-6 text-slate-900 font-medium">ስም: {formData.landlord_name}</p>
                  <p className="text-slate-900 font-medium">ፊርማ: ___________________</p>
                  <p className="text-slate-900 font-medium">ቀን: {formatEthiopianDate(formData.start_date, true) || formData.start_date}</p>
                </div>
                <div>
                  <p className="font-black text-slate-950">የተከራይ ፊርማ (Tenant Signature):</p>
                  <p className="mt-6 text-slate-900 font-medium">ስም: {formData.tenant_name}</p>
                  <p className="text-slate-900 font-medium">ፊርማ: ___________________</p>
                  <p className="text-slate-900 font-medium">ቀን: {formatEthiopianDate(formData.start_date, true) || formData.start_date}</p>
                </div>
              </div>

              <div className="text-center pt-4 text-[10px] text-slate-500 italic border-t border-dashed border-slate-300">
                በእንጅባራ ቤት ደላላ ዲጂታል መድረክ በህጋዊ መልኩ የተዘጋጀ የውል ሰነድ - Injibara House Broker Official Contract
              </div>

            </div>

          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
          {!contractCreated ? (
            <button
              onClick={handleSaveContract}
              disabled={isGenerating}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm flex items-center gap-2 transition cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              {isGenerating ? 'ውል በማዘጋጀት ላይ...' : 'ውሉን መዝግብና አፅድቅ'}
            </button>
          ) : (
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" /> ውሉ በስኬት ተፈጥሯል!
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-400" /> Print / አትም
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs flex items-center gap-2 transition cursor-pointer shadow-lg shadow-amber-500/20"
            >
              <Download className="w-4 h-4" /> PDF አውርድ (Download PDF)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RentalContractModal;
