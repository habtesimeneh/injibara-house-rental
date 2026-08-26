import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapPin, User, Mail, Phone, Lock, Building, ArrowRight, Eye, EyeOff, Home, ShieldCheck } from 'lucide-react';
import { ethiopianLocations, regions } from '../utils/locations';
import AuthCategorySlider from '../components/AuthCategorySlider';
import Logo from '../components/Logo';
import ButtonSpinner from '../components/ButtonSpinner';
import { useLanguage } from '../context/LanguageContext';

export default function Register() {
  const { language, t } = useLanguage();
  const [pageContent, setPageContent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'Tenant',
    region: 'Injibara',
    city: 'Injibara',
    sub_city: '',
    address: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    axios.get('/api/auth-page/settings').then(res => {
      setPageContent(res.data);
    }).catch(err => console.error(err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError(
        language === 'am'
          ? 'የይለፍ ቃሎች አይዛመዱም። እባክዎን የይለፍ ቃልዎን ያረጋግጡ።'
          : 'Passwords do not match. Please verify your password.'
      );
      return;
    }

    if (formData.password.length < 6) {
      setError(
        language === 'am'
          ? 'የይለፍ ቃል ቢያንስ 6 ቁምፊዎች መሆን አለበት።'
          : 'Password must be at least 6 characters long.'
      );
      return;
    }

    setLoading(true);
    try {
      await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
        region: formData.region,
        city: formData.city,
        sub_city: formData.sub_city,
        address: formData.address
      });

      navigate('/login', {
        state: {
          message:
            language === 'am'
              ? 'መለያዎ በተሳካ ሁኔታ ተፈጥሯል! አሁን መግባት ይችላሉ።'
              : 'Account created successfully! You can now log in.'
        }
      });
    } catch (err) {
      setError(
        err.response?.data?.error ||
          (language === 'am'
            ? 'የምዝገባ ጥያቄው አልተሳካም። እባክዎን መረጃዎን ያረጋግጡ።'
            : 'Registration failed. Please check your information.')
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedRegion = formData.region;
  const cities = (selectedRegion && Array.isArray(ethiopianLocations[selectedRegion])) ? ethiopianLocations[selectedRegion] : [];

  return (
    <div className="min-h-[90vh] bg-slate-950 py-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-yellow-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left Column: House Category Auto Slider */}
        <div className="lg:col-span-5 h-full">
          <AuthCategorySlider />
        </div>

        {/* Right Column: Customer Registration Form */}
        <div className="lg:col-span-7 bg-slate-900/90 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl relative space-y-5">
          
          {/* Header */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <Logo size="md" />
              <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-extrabold text-xs px-3 py-1.5 rounded-xl">
                <User size={14} />
                <span>{t('register')}</span>
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {language === 'am' 
                ? (pageContent?.register_title_am || t('createAccount')) 
                : (pageContent?.register_title_en || t('createAccount'))}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              {language === 'am' 
                ? (pageContent?.register_subtitle_am || t('joinNetwork')) 
                : (pageContent?.register_subtitle_en || t('joinNetwork'))}
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3.5 rounded-2xl text-xs font-medium text-center">
              {error}
            </div>
          )}

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            
            {/* Role Selection Tabs */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                {t('iamA')}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'Tenant' })}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    formData.role === 'Tenant'
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <User size={16} />
                  <span>{t('houseSeeker')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'Landlord' })}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    formData.role === 'Landlord'
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <Home size={16} />
                  <span>{t('propertyOwner')}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  {t('fullName')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User size={16} />
                  </div>
                  <input
                    required
                    type="text"
                    placeholder={language === 'am' ? 'አበበ ከበደ' : 'Abebe Kebede'}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  {t('emailAddress')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail size={16} />
                  </div>
                  <input
                    required
                    type="email"
                    placeholder="abebe@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  {t('phoneNumber')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Phone size={16} />
                  </div>
                  <input
                    required
                    type="tel"
                    placeholder="+251 911 234 567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              {/* Region */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  {t('region')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <MapPin size={16} />
                  </div>
                  <select
                    required
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value, city: '' })}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 transition"
                  >
                    {regions.map((r) => (
                      <option key={r} value={r}>
                        {r === 'Injibara' && language === 'am' ? 'እንጅባራ' : r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* City */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  {t('cityTown')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Building size={16} />
                  </div>
                  <input
                    type="text"
                    required
                    list="register-city-options"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder={t('selectCity')}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 transition"
                  />
                  <datalist id="register-city-options">
                    {cities.map((c) => {
                      let displayName = c;
                      if (language === 'am') {
                        if (c === 'Injibara') displayName = 'እንጅባራ';
                        else if (c === 'Injibara City Center (Kebele 01)') displayName = 'እንጅባራ መሃል ከተማ (ቀበሌ 01)';
                        else if (c === 'Kebele 01') displayName = 'ቀበሌ 01';
                        else if (c === 'Kebele 02') displayName = 'ቀበሌ 02';
                        else if (c === 'Kebele 03') displayName = 'ቀበሌ 03';
                        else if (c === 'Injibara University Area') displayName = 'እንጅባራ ዩኒቨርሲቲ አካባቢ';
                        else if (c === 'Bus Station Area (Autobus Tera)') displayName = 'አውቶቡስ ተራ (ትራንስፖርት መነሻ)';
                        else if (c === 'Agni Hospital Area') displayName = 'አግኒ ሆስፒታል አካባቢ';
                        else if (c === 'Teacher Training College Area') displayName = 'የመምህራን ማሰልጠኛ ኮሌጅ አካባቢ';
                      }
                      return (
                        <option key={c} value={c}>
                          {displayName}
                        </option>
                      );
                    })}
                  </datalist>
                </div>
              </div>

              {/* Sub-City */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  {t('kebeleOptional')}
                </label>
                <input
                  type="text"
                  placeholder={language === 'am' ? 'ምሳሌ፡ ቀበሌ 14' : 'e.g. Kebele 14'}
                  value={formData.sub_city}
                  onChange={(e) => setFormData({ ...formData, sub_city: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  {t('password')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock size={16} />
                  </div>
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-9 pr-9 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  {t('confirmPassword')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock size={16} />
                  </div>
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-70 mt-3"
            >
              {loading ? (
                <>
                  <ButtonSpinner size={18} />
                  <span>{t('creatingAccount')}</span>
                </>
              ) : (
                <>
                  <span>{t('completeRegistration')}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Link to Login */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-center text-xs text-slate-400">
            <p>
              {t('alreadyHaveAccount')}{' '}
              <Link to="/login" className="font-bold text-amber-400 hover:text-amber-300 transition-colors">
                {t('loginLink')}
              </Link>
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
