'use strict';

// 号段归属表（基于工信部号码分配，三位前缀）
const PREFIX_MAP = {};

const MOBILE_PREFIXES = [
  134,135,136,137,138,139,
  147,148,
  150,151,152,157,158,159,
  165,
  172,178,
  182,183,184,187,188,
  195,197,198,
];

const UNICOM_PREFIXES = [
  130,131,132,
  145,146,
  155,156,
  166,167,
  171,175,176,
  185,186,
  196,
];

const TELECOM_PREFIXES = [
  133,
  149,
  153,
  173,174,177,
  180,181,189,
  190,191,193,199,
];

for (const p of MOBILE_PREFIXES) PREFIX_MAP[String(p)] = 'mobile';
for (const p of UNICOM_PREFIXES) PREFIX_MAP[String(p)] = 'unicom';
for (const p of TELECOM_PREFIXES) PREFIX_MAP[String(p)] = 'telecom';

/**
 * 根据号码前三位识别运营商
 * @param {string} phone 11位手机号
 * @returns {'mobile'|'unicom'|'telecom'|null}
 */
function detectCarrier(phone) {
  if (!phone || phone.length < 3) return null;
  return PREFIX_MAP[phone.slice(0, 3)] || null;
}

module.exports = { detectCarrier };
