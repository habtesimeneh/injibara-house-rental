import React, { useState } from "react";
import { Home, Building2, ShieldCheck, Sparkles } from "lucide-react";
import logoImg from "../assets/images/logo1.png";
import { useLanguage } from "../context/LanguageContext";

const Logo = ({ size = "md", showText = true, className = "" }) => {
  const [imgError, setImgError] = useState(false);
  let language = "am";
  try {
    const langContext = useLanguage();
    if (langContext && langContext.language) {
      language = langContext.language;
    }
  } catch (e) {
    // Fallback if rendered outside LanguageProvider
  }

  const sizeClasses = {
    sm: {
      box: "w-7 h-7 rounded-lg",
      text: "text-xs font-black",
      subText: "text-[7px]",
      icon: "w-4 h-4",
    },
    md: {
      box: "w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl",
      text: "text-[11px] xs:text-xs sm:text-base xl:text-lg font-black",
      subText: "text-[6.5px] xs:text-[7.5px] sm:text-[8.5px] xl:text-[9.5px]",
      icon: "w-4 h-4 sm:w-6 sm:h-6",
    },
    lg: {
      box: "w-12 h-12 sm:w-14 sm:h-14 rounded-2xl",
      text: "text-xl sm:text-2xl font-black",
      subText: "text-[10px] sm:text-xs",
      icon: "w-7 h-7 sm:w-8 sm:h-8",
    },
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`flex items-center gap-2 xl:gap-3 group ${className}`}>
      {/* Logo Icon Box */}
      <div
        className={`${currentSize.box} relative overflow-hidden bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 p-0.5 shadow-lg shadow-amber-500/20 transform group-hover:scale-105 transition duration-300 flex items-center justify-center shrink-0`}
      >
        {!imgError ? (
          <img
            src={logoImg}
            alt="Injibara House Broker Logo"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover rounded-[inherit]"
          />
        ) : (
          /* High quality custom SVG / Badge fallback */
          <div className="w-full h-full bg-slate-950 rounded-[inherit] flex items-center justify-center relative overflow-hidden border border-amber-400/40">
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 via-emerald-500/10 to-amber-400/20 animate-pulse" />
            <div className="relative z-10 flex items-center justify-center">
              <Home
                className={`${currentSize.icon} text-amber-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}
              />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 p-0.5 rounded-full">
              <Sparkles className="w-2.5 h-2.5" />
            </div>
          </div>
        )}
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col">
          <span
            className={`${currentSize.text} tracking-wide text-white group-hover:text-amber-400 transition-colors uppercase leading-none whitespace-nowrap`}
          >
            {language === "am" ? (
              <>
                እንጅባራ <span className="text-amber-400">የቤት አከራይ</span>
              </>
            ) : (
              <>
                INJIBARA <span className="text-amber-400">HOUSE BROKER</span>
              </>
            )}
          </span>
          <span
            className={`${currentSize.subText} tracking-wider uppercase font-bold text-amber-400/90 mt-0.5 whitespace-nowrap`}
          >
            {language === "am"
              ? "እና ተከራይ website"
              : "INJIBARA CITY RENTAL & BROKERAGE"}
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
