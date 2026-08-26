import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useLocation } from 'react-router-dom';
import { 
  X, LayoutDashboard, LogOut, MessageSquare, ShieldCheck, Globe, Clock, User 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import Logo from './Logo';
import OptimizedImage from './OptimizedImage';

import { formatEthiopianTimeOnly, formatEthiopianDate } from '../utils/date';

export default function MobileSidebar({ isOpen, onClose, user, navLinks, onLogout, notifications, unreadCount, unreadNotifCount, currentTime, formatEthiopianDateTime }) {
  const location = useLocation();
  const { language, toggleLanguage, t } = useLanguage();

  // Prevent body scroll when sidebar is open and handle Escape key
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-[150] lg:hidden"
          />

          {/* Sidebar Drawer (Sliding from Right) */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 bottom-0 h-screen max-h-screen w-[85%] max-w-[320px] bg-slate-900 border-l border-slate-800 shadow-2xl z-[160] lg:hidden flex flex-col overflow-hidden text-white"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 shrink-0">
              <Logo size="sm" showText={true} />
              
              <button 
                onClick={onClose} 
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-800 transition cursor-pointer active:scale-95 ml-2"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* User Profile Info */}
            {user && (
              <div className="p-4 border-b border-slate-800 bg-slate-900/80 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    {user.avatar ? (
                      <OptimizedImage src={user.avatar} alt="User" className="w-12 h-12 rounded-xl object-cover border-2 border-amber-500/50 shadow-md" width={48} height={48} />
                    ) : (
                      <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-slate-950 font-black text-base shadow-md">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-white truncate">{user.name}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    <span className="inline-block mt-1 text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Scrollable Navigation Area */}
            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700">
              {user && (
                <>
                  <p className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Navigation</p>
                  {navLinks.map((link) => {
                    const isActive = location.pathname === link.path;
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.key}
                        to={link.path}
                        onClick={onClose}
                        className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                          isActive 
                            ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' 
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <Icon size={20} className={isActive ? 'text-slate-950' : 'text-amber-500 shrink-0'} />
                        <span className="truncate">{link.name}</span>
                      </Link>
                    );
                  })}
                </>
              )}

              <div className="pt-4 border-t border-slate-800/80 mt-4 space-y-1.5">
                {user && (
                  <>
                    <p className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Quick Access</p>
                    <Link
                      to="/messages"
                      onClick={onClose}
                      className="flex items-center justify-between px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white font-bold text-sm transition"
                    >
                      <div className="flex items-center gap-3.5">
                        <MessageSquare size={20} className="text-amber-500 shrink-0" />
                        <span>{t('messages')}</span>
                      </div>
                      {unreadCount > 0 && (
                        <span className="bg-amber-500 text-slate-950 font-black text-xs px-2 py-0.5 rounded-full shadow">
                          {unreadCount}
                        </span>
                      )}
                    </Link>

                    <Link
                      to={user.role === 'Admin' ? '/admin' : '/dashboard'}
                      onClick={onClose}
                      className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white font-bold text-sm transition"
                    >
                      <LayoutDashboard size={20} className="text-amber-500 shrink-0" />
                      <span className="truncate">{user.role === 'Admin' ? t('adminPortal') : t('dashboard')}</span>
                    </Link>
                  </>
                )}

                <button
                  onClick={toggleLanguage}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white font-bold text-sm transition cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <Globe size={20} className="text-amber-500 shrink-0" />
                    <span>ቋንቋ / Language</span>
                  </div>
                  <span className="text-xs bg-slate-800 border border-slate-700 px-2 py-1 rounded-lg text-amber-400 font-black">
                    {language === 'en' ? 'አማርኛ' : 'English'}
                  </span>
                </button>
              </div>
            </div>

            {/* Footer / Logout / Sign In */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 shrink-0">
              <div className="mb-3 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 mb-1.5">
                  <Clock size={14} className="text-amber-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('currentTime')}</span>
                </div>
                <div className="font-mono">
                  <div className="text-xs font-bold text-amber-400">
                    {formatEthiopianTimeOnly(currentTime) || formatEthiopianDateTime(currentTime)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium mt-1">
                    {formatEthiopianDate(currentTime, true)}
                  </div>
                </div>
              </div>

              {user ? (
                <button
                  onClick={() => { onLogout(); onClose(); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors border border-red-500/20 font-bold text-sm cursor-pointer"
                >
                  <LogOut size={18} className="shrink-0" />
                  <span>{t('signOut')}</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                   <Link
                      to="/login"
                      onClick={onClose}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                    >
                      <User size={16} className="shrink-0" />
                      <span>{t('signIn')}</span>
                    </Link>
                    <Link
                      to="/register"
                      onClick={onClose}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 uppercase tracking-wider"
                    >
                      <span>{t('register')}</span>
                    </Link>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

