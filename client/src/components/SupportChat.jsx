import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles, PhoneCall } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import CITY_CONFIG from '../config/cityConfig';
import appConfig from '../config/appConfig';

export default function SupportChat() {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Set initial greeting based on language
    setMessages([
      { 
        id: 1, 
        sender: 'bot', 
        text: language === 'am' ? CITY_CONFIG.aiGreetingAm : CITY_CONFIG.aiGreetingEn, 
        timestamp: new Date() 
      }
    ]);
  }, [language]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const quickQuestions = language === 'am' ? (CITY_CONFIG.aiQuickQuestionsAm || [
    `በ${CITY_CONFIG.cityNameAm} ከተማ የሚከራይ ቤት አለ?`,
    "በዩኒቨርሲቲው አካባቢ የሚከራይ ክፍል?",
    "የኪራይ ዋጋ ስንት ነው?",
    "ቤት ለማከራየት/ለማስመዝገብ"
  ]) : (CITY_CONFIG.aiQuickQuestionsEn || [
    `Are there rental houses in ${CITY_CONFIG.cityNameEn}?`,
    "Rooms available near the University?",
    "What are the rental prices?",
    "How to list my house?"
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  const handleSend = async (customText = null) => {
    const textToSend = (customText || input).trim();
    if (!textToSend || isTyping) return;

    const userMsg = { id: Date.now(), sender: 'user', text: textToSend, timestamp: new Date() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    if (!customText) setInput('');
    setIsTyping(true);

    try {
      const response = await axios.post('/api/ai/chat', {
        message: textToSend,
        history: updatedMessages.slice(-6), // Send recent context
        userId: user?.user_id || null
      });

      const replyText = response.data?.reply || (language === 'am' ? `ይቅርታ፣ እባክዎን ጥያቄዎን ድጋሚ ይፃፉ ወይም በ ${appConfig.supportPhone} ይደውሉልን።` : `Sorry, please rewrite your question or call us at ${appConfig.supportPhone}.`);
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: replyText, timestamp: new Date() }]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        sender: 'bot', 
        text: language === 'am' ? `ይቅርታ፣ ከሰርቨር ጋር መገናኘት አልተቻለም። እባክዎን በ ${appConfig.supportPhone} ይደውሉልን ወይም በ ${appConfig.supportEmail} ያግኙን።` : `Sorry, could not connect to server. Please call ${appConfig.supportPhone} or contact ${appConfig.supportEmail}.`, 
        timestamp: new Date() 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-2xl z-50 transition-all duration-300 flex items-center justify-center ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100 bg-amber-500 hover:bg-amber-400 text-slate-950'}`}
        title={language === 'am' ? "የቀጥታ ረዳት (Live AI Chat)" : "Live AI Chat"}
      >
        <MessageSquare size={28} />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 w-[350px] sm:w-[420px] h-[540px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border border-slate-200"
          >
            {/* Header */}
            <div className="bg-slate-900 p-4 flex justify-between items-center text-white border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="bg-amber-500 p-2 rounded-full text-slate-950 shadow-md">
                  <Bot size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm sm:text-base">{language === 'am' ? CITY_CONFIG.brandNameAm : CITY_CONFIG.brandNameEn} AI Support</h3>
                    <span className="text-[10px] bg-amber-500/20 text-amber-400 font-semibold px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                      <Sparkles size={10} /> {language === 'am' ? 'አማርኛ/EN' : 'EN/አማርኛ'}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-400 flex items-center gap-1 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> {language === 'am' ? 'የቀጥታ መስመር (Live)' : 'Live Support'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white transition p-1.5 rounded-lg hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            {/* Quick Questions Chips */}
            <div className="bg-slate-100/80 px-3 py-2 border-b border-slate-200 overflow-x-auto flex gap-1.5 no-scrollbar scroll-smooth">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  disabled={isTyping}
                  className="whitespace-nowrap text-xs bg-white text-slate-700 hover:bg-amber-500 hover:text-slate-950 px-2.5 py-1 rounded-full border border-slate-200 transition font-medium shrink-0 disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'user' ? 'bg-slate-900 text-white' : 'bg-amber-100 text-amber-700 font-bold'}`}>
                      {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div className={`p-3.5 rounded-2xl text-xs sm:text-sm shadow-sm leading-relaxed whitespace-pre-line ${msg.sender === 'user' ? 'bg-amber-500 text-slate-950 rounded-tr-none font-medium' : 'bg-white text-slate-800 rounded-tl-none border border-slate-200/80'}`}>
                      {msg.text}
                      <p className={`text-[10px] mt-1.5 ${msg.sender === 'user' ? 'text-slate-900/70 text-right' : 'text-slate-400'}`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex gap-2 items-center bg-white border border-slate-200 px-4 py-2.5 rounded-2xl rounded-tl-none shadow-sm">
                    <Bot size={16} className="text-amber-500 animate-bounce" />
                    <span className="text-xs text-slate-500 font-medium">{language === 'am' ? 'ረዳቱ በመመለስ ላይ ነው...' : 'Assistant is typing...'}</span>
                    <div className="flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse delay-150"></span>
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse delay-300"></span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Direct Phone Support Banner */}
            <div className="bg-slate-900 text-slate-300 text-[11px] px-3 py-1.5 flex justify-between items-center border-t border-slate-800">
              <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                <PhoneCall size={12} /> {appConfig.supportPhone}
              </span>
              <span className="text-slate-400">{appConfig.supportEmail}</span>
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white border-t border-slate-200">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={language === 'am' ? "በአማርኛ ወይም በEnglish ይፃፉ..." : "Type in English or Amharic..."}
                  className="flex-1 bg-slate-100 text-slate-950 font-bold px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition text-xs sm:text-sm placeholder-slate-500 shadow-inner"
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="bg-amber-500 text-slate-950 p-2.5 rounded-xl hover:bg-amber-400 transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0 font-bold"
                  title={language === 'am' ? "ላክ (Send)" : "Send"}
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

