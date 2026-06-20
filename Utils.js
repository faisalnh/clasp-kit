function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function nowIso_() {
  return new Date().toISOString();
}

function formatDateCompact_(date) {
  return Utilities.formatDate(date || new Date(), Session.getScriptTimeZone() || 'Asia/Jakarta', 'yyyyMMdd-HHmmss');
}

function round2_(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function getWebAppBaseUrl_() {
  var configured = safeString_(CONFIG.WEB_APP_BASE_URL);
  if (configured && configured !== 'PASTE_WEB_APP_DEPLOYMENT_URL_HERE') return configured;
  return ScriptApp.getService().getUrl() || '';
}

function buildResultUrl_(assessmentId) {
  var base = getWebAppBaseUrl_();
  return base + '?view=result&id=' + encodeURIComponent(assessmentId);
}

function buildRouteUrl_(view, params) {
  var base = getWebAppBaseUrl_();
  var query = ['view=' + encodeURIComponent(view || 'home')];
  Object.keys(params || {}).forEach(function (key) {
    query.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
  });
  return base + '?' + query.join('&');
}

function getActiveUserEmail_() {
  try {
    return Session.getActiveUser().getEmail() || 'unknown';
  } catch (err) {
    return 'unknown';
  }
}

function safeString_(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function boolValue_(value) {
  return value === true || value === 'true' || value === 1 || value === '1' || value === 'yes';
}

function generateAssessmentId_() {
  return 'ASM-' + formatDateCompact_(new Date()) + '-' + Utilities.getUuid().slice(0, 8).toUpperCase();
}

function generateInsertId_() {
  return 'INS-' + formatDateCompact_(new Date()) + '-' + Utilities.getUuid().slice(0, 8).toUpperCase();
}

function cloneForClient_(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function asMapByHeader_(headers, row) {
  var map = {};
  headers.forEach(function (header, index) {
    map[header] = row[index];
  });
  return map;
}

function parseMaybeJson_(value, fallback) {
  if (!value) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch (err) {
    return fallback;
  }
}
