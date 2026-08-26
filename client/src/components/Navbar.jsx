import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LogOut, LayoutDashboard, Menu, X, Clock, MessageSquare, User, ShieldCheck, Home, Info, Phone, Building, Globe, Bell, CheckCheck, ChevronDown } from 'lucide-react';
import { formatEthiopianDateTime } from '../utils/date';
import axios from 'axios';
import Logo from './Logo';
import MobileSidebar from './MobileSidebar';
import OptimizedImage from './OptimizedImage';

const Navbar = () => {
  const { user, token, logout } = useAuth();
  const { language, setLanguage, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [settings, setSettings] = useState({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const unreadNotifCount = notifications.filter(n => !n.is_read).length;

  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);

  const handleLogoClick = (e) => {
    e.preventDefault();
    const now = Date.now();
    
    if (now - lastClickTime > 2000) {
      setClickCount(1);
    } else {
      const newCount = clickCount + 1;
      setClickCount(newCount);
      if (newCount === 5) {
        navigate('/admin/login');
        setClickCount(0);
        return;
      }
    }
    setLastClickTime(now);
    
    if (location.pathname !== '/') {
      navigate('/');
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user && token) {
      const fetchUnread = () => {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        axios.get('/api/messages/unread-count', config)
          .then(res => setUnreadCount(res.data.unread || 0))
          .catch(() => setUnreadCount(0));

        axios.get('/api/notifications', config)
          .then(res => setNotifications(Array.isArray(res.data) ? res.data : []))
          .catch(() => setNotifications([]));
      };

      fetchUnread();
      const interval = setInterval(fetchUnread, 30000);
      return () => clearInterval(interval);
    } else {
      setUnreadCount(0);
      setNotifications([]);
    }
  }, [user, token]);

  const handleMarkAllRead = async () => {
    try {
      await axios.put('/api/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (e) {
      console.error(e);
    }
  };

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  
  useEffect(() => {
    axios.get('/api/settings').then(res => setSettings(res.data)).catch(console.error);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { key: 'home', name: language === 'am' ? (settings.nav_home_am || t('home')) : (settings.nav_home_en || t('home')), path: '/', icon: Home },
    { key: 'houses', name: language === 'am' ? (settings.nav_houses_am || t('houses')) : (settings.nav_houses_en || t('houses')), path: '/houses', icon: Building },
    { key: 'categories', name: language === 'am' ? (settings.nav_categories_am || t('categories')) : (settings.nav_categories_en || t('categories')), path: '/categories', icon: LayoutDashboard },
    { key: 'mapView', name: t('mapView'), path: '/map', icon: Building },
    { key: 'about', name: language === 'am' ? (settings.nav_about_am || t('about')) : (settings.nav_about_en || t('about')), path: '/about', icon: Info },
    { key: 'contact', name: language === 'am' ? (settings.nav_contact_am || t('contact')) : (settings.nav_contact_en || t('contact')), path: '/contact', icon: Phone },
  ];

  return (
    <nav className="sticky top-0 z-[100] bg-slate-950/95 text-white border-b border-amber-500/20 backdrop-blur-md shadow-xl transition-all w-full">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20 relative w-full">
          
          {/* Brand Logo */}
          <div className="flex items-center shrink min-w-0 mr-2 sm:mr-4 overflow-hidden">
            <a href="/" onClick={handleLogoClick} className="flex items-center cursor-pointer shrink min-w-0">
              <Logo size="md" />
            </a>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center justify-center space-x-3 flex-1">
            {user && (
              <>
                {navLinks.find(l => l.key === 'home') && (
                  <Link 
                    to="/" 
                    className={`relative px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 group flex items-center gap-1.5 ${
                      location.pathname === '/' 
                        ? 'text-amber-400 bg-amber-500/10 border border-amber-500/30 shadow-sm' 
                        : 'text-slate-300 hover:text-amber-300 hover:bg-white/5'
                    }`}
                  >
                    <Home size={14} className="text-amber-400" />
                    <span className="whitespace-nowrap">{navLinks.find(l => l.key === 'home')?.name}</span>
                  </Link>
                )}

                {/* "Menu" Dropdown Container */}
                <div className="relative group">
                  <button 
                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all duration-200 flex items-center gap-2 cursor-pointer bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-300 hover:border-amber-500/40 shadow-md ${
                      ['/houses', '/categories', '/map', '/about', '/contact'].includes(location.pathname)
                        ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                        : ''
                    }`}
                  >
                    <Menu size={15} className="text-amber-400" />
                    <span className="whitespace-nowrap">
                      {language === 'am' ? 'ሜኑ (Menu)' : 'Menu'}
                    </span>
                    <ChevronDown size={14} className="transition-transform group-hover:rotate-180 text-amber-400" />
                  </button>

                  {/* The "Menu" Dropdown Card */}
                  <div className="absolute top-full left-0 mt-2 w-64 bg-slate-950/95 border border-amber-500/20 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[110] p-2 space-y-1 backdrop-blur-md">
                    
                    {/* Section Title */}
                    <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {language === 'am' ? 'አገልግሎቶች' : 'Navigation'}
                    </div>

                    {/* Map/Filter through the relevant menu links */}
                    {navLinks.filter(l => l.key !== 'home').map(item => {
                      const isItemActive = location.pathname === item.path;
                      const IconComp = item.icon || Building;
                      return (
                        <Link
                          key={item.key}
                          to={item.path}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            isItemActive
                              ? 'bg-amber-500 text-slate-950 shadow-lg font-black'
                              : 'text-slate-300 hover:bg-slate-900 hover:text-amber-400'
                          }`}
                        >
                          <IconComp size={15} className={isItemActive ? 'text-slate-950' : 'text-amber-400'} />
                          <span className="whitespace-nowrap">{item.name}</span>
                        </Link>
                      );
                    })}

                    {/* Divider */}
                    <div className="border-t border-slate-800/80 my-2" />

                    {/* Language Changer inside Dropdown */}
                    <div className="p-2 space-y-2">
                      <div className="flex items-center gap-2 px-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <Globe size={12} className="text-amber-400" />
                        <span>{language === 'am' ? 'ቋንቋ ቀይር' : 'Change Language'}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLanguage('am');
                          }}
                          className={`py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer text-center ${
                            language === 'am' 
                              ? 'bg-amber-500 text-slate-950 shadow-md' 
                              : 'text-slate-400 hover:text-amber-300'
                          }`}
                        >
                          አማርኛ
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLanguage('en');
                          }}
                          className={`py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer text-center ${
                            language === 'en' 
                              ? 'bg-amber-500 text-slate-950 shadow-md' 
                              : 'text-slate-400 hover:text-amber-300'
                          }`}
                        >
                          English
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Section: Auth State / Actions & Language Switcher */}
          <div className="hidden lg:flex items-center justify-end gap-2 flex-shrink-0">

            {/* Ethiopian Date Ticker Dropdown (Desktop & Tablet) */}
            <div className="hidden md:flex relative group items-center mr-1">
              <div className="flex items-center text-[10px] text-amber-400 bg-slate-900/90 px-2.5 py-1.5 rounded-full border border-amber-500/30 shadow-inner gap-1.5 cursor-pointer transition hover:bg-slate-800">
                <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
                <span className="font-mono font-bold text-amber-400 text-xs whitespace-nowrap">
                  {formatEthiopianDateTime(currentTime)}
                </span>
              </div>
              <div className="absolute top-full right-0 mt-3 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[110] p-4">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-800">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-black text-slate-300 uppercase tracking-wider">{t('currentTime')}</span>
                </div>
                <div className="text-xs text-amber-400 font-mono font-bold leading-relaxed space-y-1">
                  <div>{formatEthiopianDateTime(currentTime)}</div>
                </div>
              </div>
            </div>

            {user ? (
              <div className="flex items-center gap-2">
                
                {/* Notifications Popover */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifMenu(!showNotifMenu)}
                    className="relative flex items-center gap-1 px-2 py-1.5 rounded-xl text-[10px] xl:text-xs font-bold text-slate-300 hover:text-amber-300 hover:bg-slate-900 border border-transparent transition-all cursor-pointer"
                    title={t('notifs')}
                  >
                    <Bell className="h-4 w-4 text-amber-400" />
                    <span className="hidden xl:inline">{t('notifs')}</span>
                    {unreadNotifCount > 0 && (
                      <span className="bg-amber-400 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-full animate-bounce">
                        {unreadNotifCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {showNotifMenu && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl z-[110] overflow-hidden animate-fadeIn">
                      <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-amber-400" />
                          <h4 className="font-extrabold text-xs text-white uppercase tracking-wider">{t('notifs')}</h4>
                        </div>
                        {unreadNotifCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-[10px] font-bold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCheck size={12} /> {t('markAllRead')}
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                        {notifications.length > 0 ? (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              className={`p-3.5 transition hover:bg-slate-800/50 ${!n.is_read ? 'bg-amber-500/10 border-l-4 border-amber-400' : 'bg-slate-900/50'}`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h5 className="font-bold text-xs text-amber-300 leading-snug">{n.title}</h5>
                                <span className="text-[9px] text-slate-400 whitespace-nowrap">{formatEthiopianDateTime(n.created_at)}</span>
                              </div>
                              <p className="text-xs text-slate-300 leading-relaxed font-medium">{n.message}</p>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center text-slate-400 text-xs">
                            {t('noNotifs')}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Messages Link */}
                <Link 
                  to="/messages" 
                  className={`relative flex items-center gap-1.5 px-1.5 xl:px-2.5 py-1.5 rounded-xl text-[10px] xl:text-xs font-bold transition-all ${
                    location.pathname.startsWith('/messages')
                      ? 'text-amber-400 bg-amber-500/10 border border-amber-500/30 shadow-sm'
                      : 'text-slate-300 hover:text-amber-300 hover:bg-slate-900 border border-transparent'
                  }`}
                  title="In-App Direct Chat"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-amber-400" />
                  <span className="hidden xl:inline">{t('messages')}</span>
                  {unreadCount > 0 && (
                    <span className="bg-amber-400 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-full animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </Link>

                {/* User Profile Badge & Dropdown */}
                <div className="relative group">
                  <div className="flex items-center gap-1.5 xl:gap-2 bg-slate-900 border border-slate-800 px-1.5 xl:px-2.5 py-1 rounded-2xl cursor-pointer hover:bg-slate-800 transition-colors">
                    <div className="relative">
                      {user.avatar ? (
                        <OptimizedImage src={user.avatar} alt="Avatar" className="h-6 w-6 xl:h-7 xl:w-7 rounded-xl object-cover shadow-md border border-amber-500/50" width={28} height={28} />
                      ) : (
                        <div className="h-6 w-6 xl:h-7 xl:w-7 bg-amber-500 rounded-xl flex items-center justify-center text-slate-950 font-black text-[10px] xl:text-[11px] shadow-md">
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                      )}
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border border-slate-950 rounded-full ring-1 ring-emerald-400/50" title={t('online')} />
                    </div>
                    <div className="text-left hidden xl:block">
                      <p className="font-bold text-[11px] text-white leading-tight max-w-[80px] truncate flex items-center gap-1">
                        <span>{user.name}</span>
                      </p>
                      <p className="text-[9px] text-amber-400 font-semibold leading-none mt-0.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                        <span>{t('online')}</span>
                      </p>
                    </div>
                  </div>

                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right z-[110]">
                    <div className="p-2 space-y-1">
                      {user.role === 'Admin' ? (
                        <Link 
                          to="/admin" 
                          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          <span>{t('adminPortal')}</span>
                        </Link>
                      ) : (
                        <Link 
                          to="/dashboard" 
                          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          <span>{t('dashboard')}</span>
                        </Link>
                      )}
                      
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>{t('signOut')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* Desktop Language Switcher Buttons for Guest */}
                <div className="flex items-center gap-0.5 bg-slate-900 p-0.5 rounded-xl border border-slate-800 mr-1">
                  <button
                    onClick={() => setLanguage('am')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                      language === 'am' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    AM
                  </button>
                  <button
                    onClick={() => setLanguage('en')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                      language === 'en' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    EN
                  </button>
                </div>

                <Link 
                  to="/login" 
                  className={`px-2 xl:px-3 py-1.5 text-[10px] xl:text-[11px] font-bold transition-all rounded-xl border ${
                    location.pathname === '/login'
                      ? 'text-amber-400 border-amber-500/40 bg-amber-500/10'
                      : 'text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {t('signIn')}
                </Link>

                <Link 
                  to="/register" 
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-2 xl:px-3 py-1.5 rounded-xl font-black text-[10px] xl:text-[11px] shadow-lg shadow-amber-500/20 transition-all uppercase tracking-wider"
                >
                  {t('register')}
                </Link>
              </div>
            )}
          </div>

          <div className="lg:hidden flex items-center gap-1 sm:gap-2 shrink-0 ml-auto">
            {/* Mobile Language Switcher Buttons */}
            <div className="flex items-center gap-0.5 bg-slate-900 p-0.5 rounded-xl border border-slate-800">
              <button
                onClick={() => setLanguage('am')}
                className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all ${
                  language === 'am' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                }`}
              >
                AM
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all ${
                  language === 'en' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                }`}
              >
                EN
              </button>
            </div>

            {user && (
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-1 p-0.5 rounded-lg border border-amber-500/40 shrink-0 active:scale-95 cursor-pointer"
                title="መገለጫ / Profile"
              >
                {user.avatar ? (
                  <OptimizedImage src={user.avatar} alt="Avatar" className="h-7 w-7 sm:h-8 sm:w-8 rounded-md object-cover" width={32} height={32} />
                ) : (
                  <div className="h-7 w-7 sm:h-8 sm:w-8 bg-amber-500 rounded-md flex items-center justify-center text-slate-950 font-black text-xs">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
              </button>
            )}

            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className="text-slate-950 bg-amber-500 hover:bg-amber-400 p-2 sm:p-2.5 rounded-xl border border-amber-400 font-bold transition shrink-0 active:scale-95 shadow-md shadow-amber-500/20 cursor-pointer flex items-center justify-center"
              aria-label="Toggle Navigation Menu"
            >
              {isMenuOpen ? <X size={20} className="stroke-[2.5]" /> : <Menu size={20} className="stroke-[2.5]" />}
            </button>
          </div>

        </div>
      </div>

      <MobileSidebar 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)}
        user={user}
        navLinks={navLinks}
        onLogout={handleLogout}
        notifications={notifications}
        unreadCount={unreadCount}
        unreadNotifCount={unreadNotifCount}
        currentTime={currentTime}
        formatEthiopianDateTime={formatEthiopianDateTime}
      />
    </nav>
  );
};

export default Navbar;
