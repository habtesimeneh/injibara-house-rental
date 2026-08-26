import { EthDateTime } from 'ethiopian-calendar-date-converter';

export const ETHIOPIAN_MONTHS = [
  { id: 1, english: 'Meskerem', amharic: 'መስከረም' },
  { id: 2, english: 'Tikimt', amharic: 'ጥቅምት' },
  { id: 3, english: 'Hidar', amharic: 'ሕዳር' },
  { id: 4, english: 'Tahsas', amharic: 'ታኅሣሥ' },
  { id: 5, english: 'Ter', amharic: 'ጥር' },
  { id: 6, english: 'Yekatit', amharic: 'የካቲት' },
  { id: 7, english: 'Megabit', amharic: 'መጋቢት' },
  { id: 8, english: 'Miazia', amharic: 'ሚያዝያ' },
  { id: 9, english: 'Ginbot', amharic: 'ግንቦት' },
  { id: 10, english: 'Sene', amharic: 'ሰኔ' },
  { id: 11, english: 'Hamle', amharic: 'ሐምሌ' },
  { id: 12, english: 'Nehase', amharic: 'ነሐሴ' },
  { id: 13, english: 'Pagume', amharic: 'ጳጉሜ' },
];

/**
 * Check if Ethiopian Year is a leap year (Pagume has 6 days)
 */
export const isEthiopianLeapYear = (ethYear) => {
  return (ethYear + 1) % 4 === 0;
};

/**
 * Get EAT (Africa/Addis_Ababa, UTC+3) Date details from ISO/Date input
 */
export const getEATDateDetails = (isoString) => {
  if (!isoString) return null;

  let dateObj;
  if (typeof isoString === 'string') {
    let str = isoString;
    if (str.includes('T') && !str.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(str)) {
      str += 'Z';
    }
    dateObj = new Date(str);
  } else if (isoString instanceof Date) {
    dateObj = isoString;
  } else {
    dateObj = new Date(isoString);
  }

  if (isNaN(dateObj.getTime())) return null;

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Addis_Ababa',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(dateObj);
  const values = {};
  parts.forEach((part) => {
    if (part.type !== 'literal') {
      values[part.type] = part.value;
    }
  });

  const year = Number(values.year);
  const month = Number(values.month) - 1;
  const day = Number(values.day);
  const hours = Number(values.hour);
  const minutes = Number(values.minute);
  const seconds = Number(values.second);

  return {
    year,
    month,
    day,
    hours,
    minutes,
    seconds,
    rawDate: new Date(Date.UTC(year, month, day, 12, 0, 0)),
  };
};

/**
 * Convert Gregorian Date to Ethiopian Date Object (using EAT timezone)
 */
export const gregorianToEthiopian = (gregorianDate) => {
  const eat = getEATDateDetails(gregorianDate);
  if (!eat) return null;

  try {
    const eth = EthDateTime.fromEuropeanDate(eat.rawDate);
    const monthInfo = ETHIOPIAN_MONTHS.find(m => m.id === eth.month) || ETHIOPIAN_MONTHS[0];
    
    return {
      year: eth.year,
      month: eth.month,
      day: eth.date,
      monthEnglish: monthInfo.english,
      monthAmharic: monthInfo.amharic,
      formattedEnglish: `${monthInfo.english} ${eth.date}, ${eth.year}`,
      formattedAmharic: `${monthInfo.amharic} ${eth.date}፣ ${eth.year} ዓ.ም.`
    };
  } catch (err) {
    console.error('Error converting Gregorian to Ethiopian:', err);
    return null;
  }
};

/**
 * Convert Ethiopian Date (Year, Month, Day) to Gregorian Date Object
 */
export const ethiopianToGregorian = (ethYear, ethMonth, ethDay) => {
  try {
    const year = Number(ethYear);
    const month = Number(ethMonth);
    const day = Number(ethDay);

    if (!year || !month || !day) return null;

    const eth = new EthDateTime(year, month, day, 0, 0, 0);
    return eth.toEuropeanDate();
  } catch (err) {
    console.error('Error converting Ethiopian to Gregorian:', err);
    return null;
  }
};

/**
 * Format ISO Date string to readable Ethiopian Date string
 */
export const formatEthiopianDate = (isoString, useAmharic = false) => {
  if (!isoString) return '';
  const eth = gregorianToEthiopian(isoString);
  if (!eth) return new Date(isoString).toLocaleDateString();
  return useAmharic ? eth.formattedAmharic : eth.formattedEnglish;
};

/**
 * Format ISO Date string to readable Ethiopian Date and Time string
 */
export const formatEthiopianDateTime = (isoString, showSeconds = true) => {
  if (!isoString) return '';
  try {
    const eat = getEATDateDetails(isoString);
    if (!eat) return new Date(isoString).toLocaleString('am-ET');

    const eth = EthDateTime.fromEuropeanDate(eat.rawDate);
    const monthInfo = ETHIOPIAN_MONTHS.find(m => m.id === eth.month) || ETHIOPIAN_MONTHS[0];

    const ethHour24 = eat.hours;
    let periodAmharic = '';

    if (ethHour24 >= 0 && ethHour24 < 6) {
      periodAmharic = 'ከጥዋቱ';
    } else if (ethHour24 >= 6 && ethHour24 < 12) {
      periodAmharic = 'ከቀኑ';
    } else if (ethHour24 >= 12 && ethHour24 < 18) {
      periodAmharic = 'ከምሽቱ';
    } else {
      periodAmharic = 'ከሌሊቱ';
    }

    const ethHour12 = ethHour24 % 12 || 12;
    const minutes = eat.minutes.toString().padStart(2, '0');
    const seconds = eat.seconds.toString().padStart(2, '0');
    const timeStr = showSeconds
      ? `${periodAmharic} ${ethHour12}:${minutes}:${seconds}`
      : `${periodAmharic} ${ethHour12}:${minutes}`;

    return `${monthInfo.amharic} ${eth.date} ቀን ${eth.year} ዓ.ም. - ${timeStr}`;
  } catch (err) {
    try {
      return new Date(isoString).toLocaleString('am-ET');
    } catch (e) {
      return new Date(isoString).toString();
    }
  }
};

/**
 * Format ISO Date string to Ethiopian 12-hour Time string only
 */
export const formatEthiopianTimeOnly = (isoString, showSeconds = true) => {
  if (!isoString) return '';
  try {
    const eat = getEATDateDetails(isoString);
    if (!eat) return '';

    const ethHour24 = eat.hours;
    let periodAmharic = '';

    if (ethHour24 >= 0 && ethHour24 < 6) {
      periodAmharic = 'ከጥዋቱ';
    } else if (ethHour24 >= 6 && ethHour24 < 12) {
      periodAmharic = 'ከቀኑ';
    } else if (ethHour24 >= 12 && ethHour24 < 18) {
      periodAmharic = 'ከምሽቱ';
    } else {
      periodAmharic = 'ከሌሊቱ';
    }

    const ethHour12 = ethHour24 % 12 || 12;
    const minutes = eat.minutes.toString().padStart(2, '0');
    const seconds = eat.seconds.toString().padStart(2, '0');
    return showSeconds
      ? `${periodAmharic} ${ethHour12}:${minutes}:${seconds}`
      : `${periodAmharic} ${ethHour12}:${minutes}`;
  } catch (err) {
    return '';
  }
};
