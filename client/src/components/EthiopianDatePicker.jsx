import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Globe, Check, RotateCcw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { 
  ETHIOPIAN_MONTHS, 
  gregorianToEthiopian, 
  ethiopianToGregorian, 
  isEthiopianLeapYear 
} from '../utils/date';

export default function EthiopianDatePicker({ 
  value, 
  onChange, 
  label = "Select Date", 
  placeholder = "Choose date in EC or GC...", 
  required = false,
  minDate = null,
  className = "" 
}) {
  const { t } = useLanguage();
  const [calendarType, setCalendarType] = useState('ETHIOPIAN'); // 'ETHIOPIAN' | 'GREGORIAN'
  const [isOpen, setIsOpen] = useState(false);

  // Ethiopian state selection
  const [ethYear, setEthYear] = useState(2018);
  const [ethMonth, setEthMonth] = useState(1);
  const [ethDay, setEthDay] = useState(1);

  // Initialize selected values when `value` prop changes
  useEffect(() => {
    if (value) {
      const eth = gregorianToEthiopian(value);
      if (eth) {
        setEthYear(eth.year);
        setEthMonth(eth.month);
        setEthDay(eth.day);
      }
    } else {
      const todayEth = gregorianToEthiopian(new Date());
      if (todayEth) {
        setEthYear(todayEth.year);
        setEthMonth(todayEth.month);
        setEthDay(todayEth.day);
      }
    }
  }, [value]);

  // Selected date as Ethiopian object
  const currentEthDate = value ? gregorianToEthiopian(value) : null;

  // Max days in current selected Ethiopian month
  const getMaxDaysInEthMonth = (month, year) => {
    if (month === 13) {
      return isEthiopianLeapYear(year) ? 6 : 5;
    }
    return 30;
  };

  const maxDays = getMaxDaysInEthMonth(ethMonth, ethYear);

  // Handle selecting an Ethiopian Day
  const handleSelectEthDay = (dayNumber) => {
    setEthDay(dayNumber);
    const gregDate = ethiopianToGregorian(ethYear, ethMonth, dayNumber);
    if (gregDate) {
      const isoString = gregDate.toISOString().split('T')[0];
      onChange(isoString);
      setIsOpen(false);
    }
  };

  // Direct Gregorian Date Input change handler
  const handleGregorianChange = (e) => {
    const val = e.target.value;
    onChange(val);
  };

  const handleQuickToday = () => {
    const todayIso = new Date().toISOString().split('T')[0];
    onChange(todayIso);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center justify-between">
          <span>{label} {required && <span className="text-red-500">*</span>}</span>
          <span className="text-xs font-semibold px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full flex items-center gap-1">
            <Globe className="w-3 h-3" />
            {calendarType === 'ETHIOPIAN' ? `${t('ethiopianCalendar')} (EC)` : 'Gregorian (GC)'}
          </span>
        </label>
      )}

      {/* Input Display Box */}
      <div className="relative">
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-white border border-gray-300 rounded-lg shadow-sm px-3 py-2.5 flex items-center justify-between cursor-pointer hover:border-yellow-500 transition-colors"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <Calendar className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            {currentEthDate ? (
              <div className="text-sm">
                <span className="font-bold text-gray-900 block sm:inline mr-2">
                  {currentEthDate.formattedAmharic}
                </span>
                <span className="text-xs text-gray-500">
                  ({new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} GC)
                </span>
              </div>
            ) : (
              <span className="text-sm text-gray-400">{placeholder}</span>
            )}
          </div>

          <span className="text-xs text-yellow-600 font-medium underline flex-shrink-0 ml-2">
            Change
          </span>
        </div>
      </div>

      {/* Interactive Ethiopian Calendar Modal / Popover */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-2xl p-4 right-0 sm:left-0">
          {/* Header Controls & Calendar Mode Switcher */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setCalendarType('ETHIOPIAN')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  calendarType === 'ETHIOPIAN' ? 'bg-yellow-500 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Ethiopian (EC)
              </button>
              <button
                type="button"
                onClick={() => setCalendarType('GREGORIAN')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  calendarType === 'GREGORIAN' ? 'bg-yellow-500 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Gregorian (GC)
              </button>
            </div>

            <button
              type="button"
              onClick={handleQuickToday}
              className="text-xs font-semibold text-yellow-700 hover:text-yellow-800 bg-yellow-50 hover:bg-yellow-100 px-2.5 py-1 rounded-md flex items-center gap-1 transition"
            >
              <RotateCcw className="w-3 h-3" /> Today (ዛሬ)
            </button>
          </div>

          {calendarType === 'ETHIOPIAN' ? (
            /* Ethiopian Custom Grid Picker */
            <div>
              {/* Month & Year Selection Header */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">ወር (Month)</label>
                  <select
                    value={ethMonth}
                    onChange={(e) => setEthMonth(Number(e.target.value))}
                    className="w-full text-sm font-semibold border-gray-300 border rounded-lg p-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white text-slate-900 shadow-sm"
                  >
                    {ETHIOPIAN_MONTHS.map(m => (
                      <option key={m.id} value={m.id} className="text-slate-900 bg-white font-medium py-1">
                        {m.id}. {m.amharic} ({m.english})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">ዓመት (Year EC)</label>
                  <select
                    value={ethYear}
                    onChange={(e) => setEthYear(Number(e.target.value))}
                    className="w-full text-sm font-semibold border-gray-300 border rounded-lg p-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white text-slate-900 shadow-sm"
                  >
                    {Array.from({ length: 15 }, (_, i) => 2015 + i).map(y => (
                      <option key={y} value={y} className="text-slate-900 bg-white font-medium py-1">{y} ዓ.ም.</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Day Grid Picker */}
              <div className="mb-2">
                <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-2">
                  <span>ቀናት (Days in {ETHIOPIAN_MONTHS.find(m => m.id === ethMonth)?.amharic})</span>
                  <span className="text-gray-400 font-normal">{maxDays} Days total</span>
                </div>

                <div className="grid grid-cols-6 gap-1.5 max-h-48 overflow-y-auto p-1 bg-gray-50 rounded-lg border border-gray-100">
                  {Array.from({ length: maxDays }, (_, i) => i + 1).map((dayNum) => {
                    const isSelected = currentEthDate && 
                      currentEthDate.year === ethYear && 
                      currentEthDate.month === ethMonth && 
                      currentEthDate.day === dayNum;

                    return (
                      <button
                        key={dayNum}
                        type="button"
                        onClick={() => handleSelectEthDay(dayNum)}
                        className={`h-9 w-full rounded-lg text-sm font-bold flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-yellow-600 text-white shadow-md ring-2 ring-yellow-400'
                            : 'bg-white hover:bg-yellow-100 text-gray-800 border border-gray-200'
                        }`}
                      >
                        {dayNum}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Conversion Preview Card */}
              {ethYear && ethMonth && (
                <div className="mt-3 bg-yellow-50/60 p-2.5 rounded-lg border border-yellow-200/60 text-xs text-yellow-900 flex justify-between items-center">
                  <div>
                    <span className="font-bold">Selected EC: </span>
                    {ETHIOPIAN_MONTHS.find(m => m.id === ethMonth)?.amharic} {ethDay}, {ethYear} ዓ.ም.
                  </div>
                  {ethiopianToGregorian(ethYear, ethMonth, ethDay) && (
                    <div className="text-gray-600 font-mono">
                      {ethiopianToGregorian(ethYear, ethMonth, ethDay).toLocaleDateString()} GC
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Standard Gregorian Native Picker */
            <div className="py-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Standard Gregorian Date</label>
              <input
                type="date"
                value={value || ''}
                onChange={handleGregorianChange}
                min={minDate}
                className="w-full border-gray-300 border rounded-lg p-2.5 text-sm text-slate-900 bg-white focus:ring-yellow-500 focus:border-yellow-500"
              />
              {value && gregorianToEthiopian(value) && (
                <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700">
                  <span className="font-bold">Converts to Ethiopian Calendar:</span>
                  <div className="text-yellow-700 font-bold text-sm mt-0.5">
                    {gregorianToEthiopian(value).formattedAmharic}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Modal Footer */}
          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              Done / Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
