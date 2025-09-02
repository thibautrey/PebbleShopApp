/*
  PebbleKit JS (pkjs) for Pebble Shopify Sales App

  Milestone 1: Direct from pkjs.
  - Date helpers for today/week/month in ISO-8601 with offset
  - Shopify Admin GraphQL fetch with pagination + summation
  - Parse totals and normalize currency
  - Basic error handling (auth, rate limits, timeouts)

  Message keys are defined in package.json under pebble.pebble.messageKeys:
  - period (number): 0=daily, 1=weekly, 2=monthly
  - total (string): sales total for the requested period
  - currency (string): currency code or symbol
  - status (string): 'ok' or 'error'
  - error (string): error detail (on failure)
*/

/* global Pebble */

const PeriodLabel = ['Daily', 'Weekly', 'Monthly'];

Pebble.addEventListener('ready', () => {
  console.log('[pkjs] Ready.');
});

Pebble.addEventListener('appmessage', (evt) => {
  const payload = evt && evt.payload ? evt.payload : {};
  const period = Number(payload.period || 0);
  const label = PeriodLabel[period] || 'Daily';
  console.log(`[pkjs] Request received for period=${period} (${label})`);

  const settings = loadSettings();
  if (!settings.domain || !settings.token) {
    const msg = 'Missing store domain/token (configure settings)';
    console.warn('[pkjs] ' + msg);
    // Fallback to stub so emulator remains usable until settings page exists
    return fetchSalesStub(period)
      .then(({ total, currency }) => sendResult(period, { total, currency }))
      .catch((error) => sendError(period, error));
  }

  fetchSalesViaShopify(period, settings)
    .then(({ total, currency }) => sendResult(period, { total, currency }))
    .catch((error) => sendError(period, error));
});

// ----- Network scaffold (to be implemented in Milestone 1) -----

async function fetchSalesViaShopify(period, settings) {
  const { domain, token, timezone } = settings;
  const now = new Date();
  const { start, end } = dateRangeISO(period, now, timezone);
  const shopCurrency = await getShopCurrency(domain, token);
  const total = await sumOrdersTotal(domain, token, start, end);
  const currency = currencySymbol(shopCurrency) || shopCurrency || 'USD';
  return { total: Number(total).toFixed(2), currency };
}

// ----- Date range helpers -----

function dateRangeISO(period, now, timezone) {
  const start = new Date(now);
  const end = new Date(now);
  // Set to local midnight for calculations
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  if (period === 1) { // Weekly - Monday start
    const day = start.getDay(); // 0=Sun..6=Sat
    const diffToMonday = (day === 0 ? -6 : 1 - day); // shift back to Monday
    start.setDate(start.getDate() + diffToMonday);
    // end is set to end-of-day today; extend to Sunday end
    const endOfWeek = new Date(start);
    endOfWeek.setDate(start.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    end.setTime(endOfWeek.getTime());
  } else if (period === 2) { // Monthly
    start.setDate(1);
    const endOfMonth = new Date(start);
    endOfMonth.setMonth(start.getMonth() + 1);
    endOfMonth.setDate(0); // last day of prev month
    endOfMonth.setHours(23, 59, 59, 999);
    end.setTime(endOfMonth.getTime());
  }

  const startISO = toIsoWithOffset(start, timezone);
  const endISO = toIsoWithOffset(end, timezone);
  return { start: startISO, end: endISO };
}

function toIsoWithOffset(date, tzOffsetStr) {
  // If a timezone offset like "+02:00" or "-05:30" is provided, use it by adjusting the time
  // Otherwise, use the device local offset
  let offsetMinutes;
  if (typeof tzOffsetStr === 'string' && /^([+-])(\d{2}):(\d{2})$/.test(tzOffsetStr)) {
    const [, sign, hh, mm] = tzOffsetStr.match(/^([+-])(\d{2}):(\d{2})$/);
    offsetMinutes = (Number(hh) * 60 + Number(mm)) * (sign === '-' ? -1 : 1);
  } else {
    offsetMinutes = -date.getTimezoneOffset(); // JS: positive east of UTC
  }

  // Build date parts in the target offset without changing the absolute time
  const local = new Date(date.getTime() + (offsetMinutes - (-date.getTimezoneOffset())) * 60000);

  const Y = local.getFullYear();
  const M = String(local.getMonth() + 1).padStart(2, '0');
  const D = String(local.getDate()).padStart(2, '0');
  const h = String(local.getHours()).padStart(2, '0');
  const m = String(local.getMinutes()).padStart(2, '0');
  const s = String(local.getSeconds()).padStart(2, '0');
  const ms = String(local.getMilliseconds()).padStart(3, '0');

  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  const oh = String(Math.floor(abs / 60)).padStart(2, '0');
  const om = String(abs % 60).padStart(2, '0');
  const off = `${sign}${oh}:${om}`;
  return `${Y}-${M}-${D}T${h}:${m}:${s}.${ms}${off}`;
}

// ----- Shopify GraphQL helpers -----

async function requestShopify(domain, token, query, variables) {
  const url = `https://${domain}/admin/api/2024-07/graphql.json`;
  const headers = {
    'Content-Type': 'application/json',
    'X-Shopify-Access-Token': token,
  };
  const res = await httpPost(url, headers, { query, variables }, 12000);
  if (res.status === 401 || res.status === 403) {
    throw new Error('Unauthorized: check token and scopes');
  }
  if (res.status === 429) {
    throw new Error('Rate limited: slow down');
  }
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`HTTP ${res.status}`);
  }
  const json = res.json;
  if (json && json.errors && json.errors.length) {
    throw new Error(json.errors.map((e) => e.message).join('; '));
  }
  return json.data;
}

async function httpPost(url, headers, bodyObj, timeoutMs) {
  // Prefer fetch if available, fallback to XMLHttpRequest on older pkjs engines
  if (typeof fetch === 'function') {
    const controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    const timeout = controller ? setTimeout(() => controller.abort(), timeoutMs || 12000) : null;
    try {
      const res = await fetch(url, {
        method: 'POST', headers, body: JSON.stringify(bodyObj),
        signal: controller ? controller.signal : undefined,
      });
      const json = await res.json();
      return { status: res.status, json };
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }

  // XMLHttpRequest fallback
  return new Promise((resolve, reject) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      xhr.timeout = timeoutMs || 12000;
      Object.keys(headers || {}).forEach((k) => xhr.setRequestHeader(k, headers[k]));
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          let json = null;
          try { json = JSON.parse(xhr.responseText); } catch (e) { json = null; }
          resolve({ status: xhr.status, json });
        }
      };
      xhr.ontimeout = function () { reject(new Error('Network timeout')); };
      xhr.onerror = function () { reject(new Error('Network error')); };
      xhr.send(JSON.stringify(bodyObj));
    } catch (e) {
      reject(e);
    }
  });
}

async function getShopCurrency(domain, token) {
  const q = `query ShopCurrency { shop { currencyCode } }`;
  const data = await requestShopify(domain, token, q, {});
  return data && data.shop && data.shop.currencyCode ? data.shop.currencyCode : 'USD';
}

async function sumOrdersTotal(domain, token, startISO, endISO) {
  let total = 0.0;
  let after = null;
  let pages = 0;
  const pageLimit = 10; // cap pages to avoid long sessions
  const first = 100; // items per page (max 250, but keep cost lower)
  const queryStr = `created_at:>=${startISO} created_at:<=${endISO} status:any`;

  while (pages < pageLimit) {
    const q = `query OrdersTotal($first:Int!, $after:String, $query:String!) {
      orders(first: $first, after: $after, query: $query) {
        pageInfo { hasNextPage }
        edges {
          cursor
          node {
            totalPriceSet { shopMoney { amount currencyCode } }
          }
        }
      }
    }`;
    const data = await requestShopify(domain, token, q, { first, after, query: queryStr });
    const edges = data && data.orders && data.orders.edges ? data.orders.edges : [];
    for (let i = 0; i < edges.length; i++) {
      const node = edges[i].node;
      const amt = node && node.totalPriceSet && node.totalPriceSet.shopMoney && node.totalPriceSet.shopMoney.amount;
      if (amt != null) total += parseFloat(amt);
    }
    const hasNext = data && data.orders && data.orders.pageInfo && data.orders.pageInfo.hasNextPage;
    if (!hasNext || edges.length === 0) break;
    after = edges[edges.length - 1].cursor;
    pages += 1;
  }

  return total;
}

// ----- Settings and utilities -----

function loadSettings() {
  try {
    const raw = (typeof localStorage !== 'undefined') ? localStorage.getItem('pebble-shop-settings') : null;
    const s = raw ? JSON.parse(raw) : {};
    return {
      domain: s.domain || '',
      token: s.token || '',
      timezone: s.timezone || undefined, // e.g., "+02:00"
    };
  } catch (e) {
    return { domain: '', token: '', timezone: undefined };
  }
}

function currencySymbol(code) {
  const map = {
    USD: '$', EUR: '€', GBP: '£', JPY: '¥', CNY: '¥', AUD: 'A$', CAD: 'C$', CHF: 'CHF', SEK: 'kr', NZD: 'NZ$'
  };
  return map[code] || code;
}

function sendResult(period, { total, currency }) {
  Pebble.sendAppMessage({ period, status: 'ok', total: String(total), currency: String(currency || 'USD') },
    () => console.log('[pkjs] Sent result to watch'),
    (err) => console.warn('[pkjs] Failed sending result', err)
  );
}

function sendError(period, error) {
  const msg = (error && error.message) ? error.message : String(error || 'Unknown error');
  Pebble.sendAppMessage({ period, status: 'error', error: msg },
    () => console.warn('[pkjs] Reported error to watch:', msg),
    (err) => console.warn('[pkjs] Failed sending error', err)
  );
}

// ----- Stub used in Milestone 0 -----

function fetchSalesStub(period) {
  // Provide deterministic but different totals per period for quick visual checks
  const base = 123.45;
  const multiplier = [1, 5, 20][period] || 1;
  const total = (base * multiplier).toFixed(2);
  return new Promise((resolve) => setTimeout(() => resolve({ total, currency: 'USD' }), 150));
}
