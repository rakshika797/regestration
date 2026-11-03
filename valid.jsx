// Accepts only real web addresses. Rejects javascript:, data:, ftp:, etc.
// This matters because portfolio links are rendered as clickable <a href> on other users' screens.
const isValidHttpUrl = (value) => {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value.trim());
    return ['http:', 'https:'].includes(url.protocol) && url.hostname.includes('.');
  } catch {
    return false;
  }
};

// Escapes user input before it is used inside a regex (prevents regex injection / ReDoS)
const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = { isValidHttpUrl, escapeRegex };