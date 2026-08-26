import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Send, CheckCircle2, User } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const HouseReviews = ({ houseId }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);

  // Form State
  const [userRating, setUserRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/houses/${houseId}/reviews`);
      setReviews(res.data.reviews || []);
      setAverageRating(res.data.averageRating || 0);
      setTotalReviews(res.data.totalReviews || 0);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (houseId) {
      fetchReviews();
    }
  }, [houseId]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      setMessage({ type: 'error', text: 'አስተያየት ለመስጠት እባክዎን በመጀመሪያ ይግቡ (Please Login)' });
      return;
    }

    try {
      setSubmitting(true);
      setMessage({ type: '', text: '' });

      await axios.post(
        `/api/houses/${houseId}/reviews`,
        { rating: userRating, comment },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      setMessage({ type: 'success', text: 'አስተያየትዎ እና ደረጃዎ በስኬት ተመዝግቧል!' });
      setComment('');
      fetchReviews();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'አስተያየት መመዝገብ አልተሳካም።' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-6">
      
      {/* Header & Rating Summary */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-400" />
            {t('ratingsAndReviews')}
          </h3>
          <p className="text-xs text-slate-400">{t('ratingsDesc')}</p>
        </div>

        <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-xl border border-amber-500/20">
          <div className="flex items-center gap-1">
            <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
            <span className="text-xl font-black text-white">{averageRating || '5.0'}</span>
          </div>
          <div className="text-left border-l border-slate-800 pl-3">
            <p className="text-xs font-bold text-amber-400">ከ 5 ኮከቦች</p>
            <p className="text-[10px] text-slate-400">{totalReviews} አስተያየቶች (Reviews)</p>
          </div>
        </div>
      </div>

      {/* Write a Review Section */}
      <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-4">
        <h4 className="text-sm font-bold text-amber-400">ደረጃ ይስጡ እና አስተያየትዎን ያጋሩ</h4>

        {message.text && (
          <div className={`p-3 rounded-lg text-xs font-bold flex items-center gap-2 ${
            message.type === 'error' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
          }`}>
            <CheckCircle2 className="w-4 h-4" />
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmitReview} className="space-y-3">
          
          {/* Star Rating Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 font-bold">ኮከብ ይምረጡ:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setUserRating(star)}
                  className="p-1 hover:scale-125 transition cursor-pointer"
                >
                  <Star 
                    className={`w-6 h-6 ${
                      star <= userRating 
                        ? 'fill-amber-400 text-amber-400' 
                        : 'text-slate-600'
                    }`} 
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-bold text-amber-400 ml-2">({userRating} Stars)</span>
          </div>

          <div>
            <textarea
              rows={3}
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="ስለ ቤቱ አካባቢ፣ ፅዳት፣ ውሃና መብራት እንዲሁም ስላለው ሁኔታ አስተያየትዎን ይጻፉ..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-2 transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'በመላክ ላይ...' : 'አስተያየት ላክ (Submit Review)'}
            </button>
          </div>
        </form>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-slate-300">የተጠቃሚዎች አስተያየቶች ({totalReviews})</h4>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-100 animate-shimmer shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded-lg w-1/3 animate-shimmer" />
                    <div className="h-3.5 bg-gray-100 rounded-md w-1/4 animate-shimmer" />
                  </div>
                </div>
                <div className="space-y-2 pl-13">
                  <div className="h-3.5 bg-gray-100 rounded-md w-full animate-shimmer" />
                  <div className="h-3.5 bg-gray-100 rounded-md w-5/6 animate-shimmer" />
                </div>
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8 bg-slate-950/40 rounded-xl border border-dashed border-slate-800 text-slate-500 text-xs">
            እስካሁን ምንም አስተያየት አልተሰጠም። የመጀመሪያው አስተያየት ሰጭ ይሁኑ!
          </div>
        ) : (
          reviews.map((rev) => (
            <div key={rev.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-xs">
                    {rev.reviewer_name ? rev.reviewer_name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{rev.reviewer_name}</p>
                    <p className="text-[10px] text-slate-400">{rev.reviewer_role || 'Tenant'} • {new Date(rev.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star 
                      key={s} 
                      className={`w-3.5 h-3.5 ${
                        s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                      }`} 
                    />
                  ))}
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed pl-10">
                "{rev.comment}"
              </p>
            </div>
          ))
        )}
      </div>

    </div>
  );
};

export default HouseReviews;
