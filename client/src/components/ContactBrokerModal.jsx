import React, { useState } from 'react';
import { Mail, MessageCircle, X, Phone, Send, Video, Calendar, ShieldCheck, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import appConfig from '../config/appConfig';

export default function ContactBrokerModal({ isOpen, onClose, house, onOpenScheduleViewing }) {
  const { t } = useLanguage();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  if (!isOpen || !house) return null;

  const phone = house.owner_phone || appConfig.supportPhone;
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const defaultMessage = `Hello, I am interested in your property "${house.title}" listed for ${Number(house.price).toLocaleString()} ETB/month in ${house.city}. Please let me know if it's available.`;

  const handleCall = () => {
    window.open(`tel:${phone}`, '_self');
  };

  const handleTelegram = () => {
    const text = encodeURIComponent(message || defaultMessage);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${text}`, '_blank');
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(message || defaultMessage);
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  const handleSendMessage = () => {
    if (!message.trim() && !defaultMessage) return;
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setIsSent(true);
      setTimeout(() => {
        setIsSent(false);
        setMessage('');
        onClose();
      }, 2000);
    }, 1500);
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Inquiry about ${house.title}`);
    const body = encodeURIComponent(message || defaultMessage);
    const email = house.owner_email || 'broker@ethiopiansmarthomes.com';
    window.open(`mailto:${email}?subject=${subject}&body=${body}`);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 pt-20 sm:pt-28 pb-12 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col relative border border-slate-100 my-4">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-600 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="bg-slate-900 text-white p-6 pb-5 relative">
          <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-400 font-bold text-[11px] uppercase tracking-wider px-3 py-1 rounded-full mb-2 border border-amber-500/30">
            <ShieldCheck size={14} /> Verified Broker & Landlord Direct
          </div>
          <h3 className="text-2xl font-black text-white">{house.title}</h3>
          <p className="text-xs text-slate-300 mt-1">
            {house.city}, {house.sub_city ? `${house.sub_city} • ` : ''} <span className="text-amber-400 font-bold">{Number(house.price).toLocaleString()} ETB/mo</span>
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Quick Contact Buttons Grid */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              {t('directInstantConnect')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleCall}
                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-2xl transition shadow-md text-sm"
              >
                <Phone className="w-4 h-4" />
                {t('callNow')} ({phone})
              </button>

              <button 
                onClick={handleWhatsApp}
                className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3.5 px-4 rounded-2xl transition shadow-md text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </button>

              <button 
                onClick={handleTelegram}
                className="flex items-center justify-center gap-2 bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold py-3.5 px-4 rounded-2xl transition shadow-md text-sm"
              >
                <Send className="w-4 h-4" />
                Telegram
              </button>

              <button 
                onClick={handleEmail}
                className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 px-4 rounded-2xl transition shadow-md text-sm"
              >
                <Mail className="w-4 h-4" />
                Email
              </button>
            </div>
          </div>

          {/* Virtual Tour Video Link if present */}
          {house.video_url && (
            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-900 text-xs font-bold">
                <Video className="w-4 h-4 text-amber-600" />
                <span>360° / Virtual House Tour Video Available!</span>
              </div>
              <a
                href={house.video_url}
                target="_blank"
                rel="noreferrer"
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-3 py-1.5 rounded-xl transition shadow-sm"
              >
                Watch Video
              </a>
            </div>
          )}

          {/* Optional Message Field */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              መልዕክት አስቀምጥ (Message)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={defaultMessage}
              rows={3}
              className="w-full border border-slate-200 rounded-2xl p-3 text-sm text-black font-semibold bg-slate-50 placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:bg-white outline-none transition mb-3"
            />
            {isSent ? (
              <div className="w-full py-3 bg-emerald-100 text-emerald-700 font-bold rounded-xl text-sm flex items-center justify-center gap-2">
                <Check className="w-5 h-5" />
                መልዕክትዎ ተልኳል (Message Sent)
              </div>
            ) : (
              <button
                onClick={handleSendMessage}
                disabled={isSending}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-70 text-slate-900 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition"
              >
                <Send className="w-4 h-4" />
                {isSending ? 'በመላክ ላይ... (Sending...)' : 'መልዕክት ላክ (Send Message)'}
              </button>
            )}
          </div>

          {/* Schedule Appointment Option */}
          {onOpenScheduleViewing && (
            <button
              onClick={() => {
                onClose();
                onOpenScheduleViewing();
              }}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-slate-800 shadow-md transition"
            >
              <Calendar className="w-4 h-4" />
              በአካል ሳትሄዱ የጉብኝት ቀጠሮ ይያዙ (Schedule Viewing Date)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

