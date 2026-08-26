import React from 'react';
import { X, Video, MessageSquare, MapPin, DollarSign, ExternalLink, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import CITY_CONFIG from '../config/cityConfig';

const SAMPLE_FALLBACK_VIDEO = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

export default function VideoModal({ house, isOpen, onClose, onChat, onRequestRental }) {
  const { language } = useLanguage();

  if (!isOpen || !house) return null;

  const videoSrc = house.video_url || SAMPLE_FALLBACK_VIDEO;
  const isYouTube = videoSrc.includes('youtube.com') || videoSrc.includes('youtu.be');
  const embedUrl = isYouTube 
    ? videoSrc.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/') 
    : videoSrc;

  const formattedPrice = house.price ? Number(house.price).toLocaleString() + ' ETB' : 'N/A';

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 pt-20 sm:pt-28 pb-12 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[80vh] my-4">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white line-clamp-1">{house.title}</h3>
                {!house.video_url && (
                  <span className="bg-amber-500/20 text-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {language === 'am' ? 'የናሙና ጉብኝት' : 'Sample Tour'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{house.sub_city || house.city || (language === 'am' ? CITY_CONFIG.cityNameAm : CITY_CONFIG.cityNameEn)}, {house.region || 'Amhara'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player Area */}
        <div className="relative bg-black flex-1 min-h-[280px] sm:min-h-[380px] flex items-center justify-center overflow-hidden">
          {isYouTube ? (
            <iframe
              src={embedUrl}
              title={house.title}
              className="w-full h-full min-h-[320px] sm:min-h-[400px] border-none"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              src={embedUrl}
              controls
              autoPlay
              playsInline
              poster={house.image_url}
              className="w-full max-h-[60vh] object-contain bg-black"
            >
              {language === 'am' ? 'ቪዲዮውን ማጫወት አልተቻለም' : 'Your browser does not support video playback.'}
            </video>
          )}
        </div>

        {/* Info & Action Bar */}
        <div className="p-5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3.5 py-1.5 rounded-xl">
              <span className="text-xs text-slate-400 block font-semibold">{language === 'am' ? 'ወርሃዊ ኪራይ' : 'Monthly Rent'}</span>
              <span className="text-lg font-black text-white">{formattedPrice}</span>
            </div>
            <div className="text-xs text-slate-400">
              <p className="font-bold text-slate-200">{house.type || 'የመኖሪያ ቤት'}</p>
              <p>{house.rooms || 1} {language === 'am' ? 'ክፍሎች' : 'Bedrooms'} • {house.bathrooms || 1} {language === 'am' ? 'መታጠቢያ' : 'Baths'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {onChat && (
              <button
                onClick={() => {
                  onClose();
                  onChat(house);
                }}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <span>{language === 'am' ? 'ደላላው ጋር ያውሩ' : 'Chat Owner'}</span>
              </button>
            )}

            {onRequestRental && (
              <button
                onClick={() => {
                  onClose();
                  onRequestRental(house);
                }}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{language === 'am' ? 'ቤት ተከራይ' : 'Rent Now'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
