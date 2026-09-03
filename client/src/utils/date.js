import { EthDateTime } from 'ethiopian-calendar-date-converter';


/**
 * Ethiopian Months
 */
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
 * Check if Ethiopian Year is a leap year.
 *
 * Pagume has 6 days during leap year.
 */
export const isEthiopianLeapYear = (ethYear) => {
  return (Number(ethYear) + 1) % 4 === 0;
};


/**
 * Get Ethiopia / Addis Ababa (EAT UTC+3)
 * date and time details.
 *
 * IMPORTANT:
 * This function does NOT manually add timezone offsets.
 * Intl.DateTimeFormat handles Africa/Addis_Ababa timezone.
 */
/**
 * Get current local date and time.
 *
 * Uses the user's computer/browser clock directly.
 */
export const getLocalDateDetails = (dateInput = new Date()) => {
  const dateObj =
    dateInput instanceof Date
      ? new Date(dateInput.getTime())
      : new Date(dateInput);

  if (Number.isNaN(dateObj.getTime())) {
    return null;
  }

  return {
    year: dateObj.getFullYear(),
    month: dateObj.getMonth(),
    day: dateObj.getDate(),
    hours: dateObj.getHours(),
    minutes: dateObj.getMinutes(),
    seconds: dateObj.getSeconds(),

    // Used for Ethiopian calendar date conversion
    rawDate: new Date(
      dateObj.getFullYear(),
      dateObj.getMonth(),
      dateObj.getDate(),
      12,
      0,
      0
    ),
  };
};


/**
 * Convert Gregorian Date
 * to Ethiopian Date Object.
 *
 * Uses Addis Ababa timezone.
 */
export const gregorianToEthiopian = (gregorianDate) => {
  const eat = getEATDateDetails(gregorianDate);

  if (!eat) {
    return null;
  }

  try {
    const eth = EthDateTime.fromEuropeanDate(
      eat.rawDate
    );

    const monthInfo =
      ETHIOPIAN_MONTHS.find(
        (month) => month.id === eth.month
      ) || ETHIOPIAN_MONTHS[0];

    return {
      year: eth.year,
      month: eth.month,
      day: eth.date,

      monthEnglish: monthInfo.english,
      monthAmharic: monthInfo.amharic,

      formattedEnglish:
        `${monthInfo.english} ${eth.date}, ${eth.year}`,

      formattedAmharic:
        `${monthInfo.amharic} ${eth.date} ቀን ${eth.year} ዓ.ም.`,
    };

  } catch (error) {
    console.error(
      'Error converting Gregorian to Ethiopian:',
      error
    );

    return null;
  }
};


/**
 * Convert Ethiopian Date
 * to Gregorian Date Object.
 */
export const ethiopianToGregorian = (
  ethYear,
  ethMonth,
  ethDay
) => {
  try {
    const year = Number(ethYear);
    const month = Number(ethMonth);
    const day = Number(ethDay);

    if (!year || !month || !day) {
      return null;
    }

    const eth = new EthDateTime(
      year,
      month,
      day,
      0,
      0,
      0
    );

    return eth.toEuropeanDate();

  } catch (error) {
    console.error(
      'Error converting Ethiopian to Gregorian:',
      error
    );

    return null;
  }
};


/**
 * Get Amharic time period.
 *
 * 00:00 - 00:59 = ከሌሊቱ
 * 01:00 - 05:59 = ከጠዋቱ
 * 06:00 - 12:59 = ከሰዓት
 * 13:00 - 23:59 = ከሌሊቱ
 */
export const getAmharicTimePeriod = (hour24) => {
  const hour = Number(hour24);

  if (
    Number.isNaN(hour) ||
    hour < 0 ||
    hour > 23
  ) {
    return '';
  }

  if (hour >= 1 && hour < 6) {
    return 'ከጠዋቱ';
  }

  if (hour >= 6 && hour < 13) {
    return 'ከሰዓት';
  }

  return 'ከሌሊቱ';
};


/**
 * Convert 24-hour time
 * to normal 12-hour display.
 *
 * IMPORTANT:
 *
 * NO +6 OR -6 Ethiopian clock conversion here.
 *
 * Examples:
 *
 * 04:52 -> 4:52
 * 10:47 -> 10:47
 * 12:30 -> 12:30
 * 16:52 -> 4:52
 * 20:45 -> 8:45
 */
export const getEthiopianTimeDetails = (
  hour24,
  minute = 0,
  second = 0
) => {
  const hour = Number(hour24);

  if (
    Number.isNaN(hour) ||
    hour < 0 ||
    hour > 23
  ) {
    return null;
  }

  const displayHour =
    hour % 12 || 12;

  const periodAmharic =
    getAmharicTimePeriod(hour);

  return {
    hour24: hour,
    displayHour,
    hour12: displayHour,

    minutes: Number(minute),
    seconds: Number(second),

    periodAmharic,
  };
};


/**
 * Format ISO Date string
 * to readable Ethiopian Date.
 */
export const formatEthiopianDate = (
  isoString,
  useAmharic = false
) => {
  if (!isoString) {
    return '';
  }

  const eth =
    gregorianToEthiopian(isoString);

  if (!eth) {
    try {
      return new Date(
        isoString
      ).toLocaleDateString();
    } catch (error) {
      return '';
    }
  }

  return useAmharic
    ? eth.formattedAmharic
    : eth.formattedEnglish;
};


/**
 * Format Date and Time
 * to Ethiopian Calendar Date
 * with Addis Ababa Time.
 *
 * Example:
 *
 * ነሐሴ 21 ቀን 2018 ዓ.ም.
 * ከሰዓት 4:52 ሰዓት
 */
export const formatEthiopianDateTime = (
  dateInput,
  showSeconds = false
) => {
  if (!dateInput) return '';

  try {
    // IMPORTANT:
    // Use browser/computer local time
    const local = getLocalDateDetails(dateInput);

    if (!local) return '';

    const eth = EthDateTime.fromEuropeanDate(
      local.rawDate
    );

    const monthInfo =
      ETHIOPIAN_MONTHS.find(
        (month) => month.id === eth.month
      ) || ETHIOPIAN_MONTHS[0];

    const hour24 = local.hours;

    const periodAmharic = getAmharicTimePeriod(hour24);

    // Normal 12-hour display
    const displayHour =
      hour24 % 12 || 12;

    const minutes = String(
      local.minutes
    ).padStart(2, '0');

    const seconds = String(
      local.seconds
    ).padStart(2, '0');

    const timeString = showSeconds
      ? `${periodAmharic} ${displayHour}:${minutes}:${seconds} ሰዓት`
      : `${periodAmharic} ${displayHour}:${minutes} ሰዓት`;

    return (
      `${monthInfo.amharic} ` +
      `${eth.date} ቀን ` +
      `${eth.year} ዓ.ም. ` +
      `${timeString}`
    );

  } catch (error) {
    console.error(
      'Error formatting Ethiopian date/time:',
      error
    );

    return '';
  }
};


/**
 * Format Ethiopian Time only.
 *
 * Examples:
 *
 * ከጠዋቱ 10:47 ሰዓት
 *
 * ከሰዓት 4:52 ሰዓት
 */
export const formatEthiopianTimeOnly = (
  dateInput,
  showSeconds = false
) => {
  if (!dateInput) return '';

  try {
    const local =
      getLocalDateDetails(dateInput);

    if (!local) return '';

    const hour24 = local.hours;

    const periodAmharic = getAmharicTimePeriod(hour24);

    const displayHour =
      hour24 % 12 || 12;

    const minutes =
      String(local.minutes).padStart(2, '0');

    const seconds =
      String(local.seconds).padStart(2, '0');

    if (showSeconds) {
      return `${periodAmharic} ${displayHour}:${minutes}:${seconds} ሰዓት`;
    }

    return `${periodAmharic} ${displayHour}:${minutes} ሰዓት`;

  } catch (error) {
    console.error(
      'Error formatting Ethiopian time:',
      error
    );

    return '';
  }
};