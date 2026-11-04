import moment from "moment-timezone";

const TIMEZONE = "Asia/Kolkata";

/**
 * Formats a date value to dd/mm/yyyy in Asia/Kolkata timezone.
 * If value is date-only string "YYYY-MM-DD", formats directly without timezone shift.
 */
export const formatDate = (value) => {
  if (value === null || value === undefined) return "-";
  const str = String(value).trim();
  if (!str || str === "-" || str === "null" || str === "undefined") return "-";

  // If date-only string "YYYY-MM-DD", do not shift timezone
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [year, month, day] = str.split("-");
    return `${day}/${month}/${year}`;
  }

  // Check if string can be parsed as a valid date
  const timestamp = Date.parse(str);
  if (isNaN(timestamp)) return "-";

  const m = moment(str);
  if (!m.isValid()) return "-";

  return m.tz(TIMEZONE).format("DD/MM/YYYY");
};

/**
 * Formats a date-time value to dd/mm/yyyy, hh:mm AM/PM in Asia/Kolkata timezone.
 * If value is date-only string "YYYY-MM-DD", formats directly as dd/mm/yyyy.
 */
export const formatDateTime = (value) => {
  if (value === null || value === undefined) return "-";
  const str = String(value).trim();
  if (!str || str === "-" || str === "null" || str === "undefined") return "-";

  // If date-only string
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [year, month, day] = str.split("-");
    return `${day}/${month}/${year}`;
  }

  const timestamp = Date.parse(str);
  if (isNaN(timestamp)) return "-";

  const m = moment(str);
  if (!m.isValid()) return "-";

  return m.tz(TIMEZONE).format("DD/MM/YYYY, hh:mm A");
};

/**
 * Formats a value to YYYY-MM-DD (IST) for HTML <input type="date" />.
 */
export const formatDateForInput = (value) => {
  if (value === null || value === undefined) return "";
  const str = String(value).trim();
  if (!str || str === "-" || str === "null" || str === "undefined") return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  const timestamp = Date.parse(str);
  if (isNaN(timestamp)) return "";

  const m = moment(str);
  if (!m.isValid()) return "";

  return m.tz(TIMEZONE).format("YYYY-MM-DD");
};

/**
 * Formats a value to YYYY-MM-DDTHH:mm (IST) for HTML <input type="datetime-local" />.
 */
export const formatDateTimeForInput = (value) => {
  if (value === null || value === undefined) return "";
  const str = String(value).trim();
  if (!str || str === "-" || str === "null" || str === "undefined") return "";

  const timestamp = Date.parse(str);
  if (isNaN(timestamp)) return "";

  const m = moment(str);
  if (!m.isValid()) return "";

  return m.tz(TIMEZONE).format("YYYY-MM-DDTHH:mm");
};

/**
 * Returns current timestamp in Asia/Kolkata timezone: YYYY-MM-DD HH:mm:ss
 */
export const getCurrentDateTimeIST = () => {
  return moment().tz(TIMEZONE).format("YYYY-MM-DD HH:mm:ss");
};

/**
 * Formats Created Date/Time to YYYY-MM-DD HH:mm:ss in Asia/Kolkata timezone.
 */
export const formatCreatedDateTime = (value) => {
  if (value === null || value === undefined) return "-";
  const str = String(value).trim();
  if (!str || str === "-" || str === "null" || str === "undefined") return "-";

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(str)) {
    return str;
  }

  const m = moment(str);
  if (!m.isValid()) return str;

  return m.tz(TIMEZONE).format("YYYY-MM-DD HH:mm:ss");
};

const dateUtils = {
  formatDate,
  formatDateTime,
  formatDateForInput,
  formatDateTimeForInput,
  getCurrentDateTimeIST,
  formatCreatedDateTime,
};

export default dateUtils;
