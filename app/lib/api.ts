interface CacheEntry {
    data: any;
    timestamp: number;
}

const cache: Record<string, CacheEntry> = {};
const CACHE_DURATION = 60 * 1000; // 1 minute default

export interface FetchOptions {
    duration?: number;
    forceRefresh?: boolean;
    headers?: Record<string, string>;
}

export async function fetchWithCache(url: string, options: FetchOptions = {}) {
    const { duration = CACHE_DURATION, forceRefresh = false, headers = {} } = options;
    const now = Date.now();

    if (!forceRefresh && cache[url] && now - cache[url].timestamp < duration) {
        console.log('Serving from cache:', url);
        return cache[url].data;
    }

    try {
        const res = await fetch(url, { headers });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`API Error ${res.status}: ${text.slice(0, 100)}`);
        }

        // Try to parse JSON, if fails return text
        const text = await res.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch {
            throw new Error('Invalid JSON response');
        }

        cache[url] = {
            data,
            timestamp: now,
        };
        return data;
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

export function flattenObject(obj: any, prefix = '', res: any = {}) {
    for (const key in obj) {
        const value = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            flattenObject(value, newKey, res);
        } else {
            res[newKey] = value;
        }
    }
    return res;
}

// Helper to get value from dot notation path
export function getValueByPath(obj: any, path: string) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

// Detect API provider from URL
export function detectApiProvider(url: string): 'alphavantage' | 'finnhub' | 'unknown' {
    if (url.includes('alphavantage.co')) return 'alphavantage';
    if (url.includes('finnhub.io')) return 'finnhub';
    return 'unknown';
}

// Get API key parameter name based on provider
export function getApiKeyParamName(provider: 'alphavantage' | 'finnhub' | 'unknown'): string {
    switch (provider) {
        case 'alphavantage':
            return 'apikey';
        case 'finnhub':
            return 'token';
        default:
            return 'apikey';
    }
}

// Parse Finnhub quote response
export function parseFinnhubQuote(data: any): Record<string, any> {
    if (!data) return {};
    return {
        'current': data.c,
        'change': data.d,
        'percent_change': data.dp,
        'high': data.h,
        'low': data.l,
        'open': data.o,
        'previous_close': data.pc,
        'timestamp': data.t,
    };
}

// Parse Finnhub company profile
export function parseFinnhubProfile(data: any): Record<string, any> {
    if (!data) return {};
    return {
        'country': data.country,
        'currency': data.currency,
        'exchange': data.exchange,
        'name': data.name,
        'ticker': data.ticker,
        'ipo': data.ipo,
        'market_cap': data.marketCapitalization,
        'shares_outstanding': data.shareOutstanding,
        'logo': data.logo,
        'phone': data.phone,
        'weburl': data.weburl,
        'industry': data.finnhubIndustry,
    };
}

