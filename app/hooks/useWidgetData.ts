import { useState, useEffect } from 'react';
import { fetchWithCache } from '../lib/api';

export function useWidgetData(
    url: string,
    refreshInterval: number,
    apiKey?: string,
    apiKeyLocation: 'query' | 'header' = 'query',
    apiKeyParamName: string = 'apikey',
    apiKeyHeaderName: string = 'X-API-Key'
) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const refetch = () => {
        setRefreshKey(prev => prev + 1);
    };

    useEffect(() => {
        if (!url) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                let finalUrl = url;
                let headers: Record<string, string> = {};

                if (apiKey) {
                    if (apiKeyLocation === 'header') {
                        // Add API key to headers
                        if (apiKeyHeaderName === 'Authorization') {
                            headers[apiKeyHeaderName] = `Bearer ${apiKey}`;
                        } else {
                            headers[apiKeyHeaderName] = apiKey;
                        }
                    } else {
                        // Add API key to query params
                        const separator = url.includes('?') ? '&' : '?';
                        finalUrl = `${url}${separator}${apiKeyParamName}=${apiKey}`;
                    }
                }

                // If executing a manual refetch (refreshKey > 0), force refresh the cache
                const options = {
                    duration: refreshInterval * 1000,
                    headers,
                    forceRefresh: refreshKey > 0
                };

                const result = await fetchWithCache(finalUrl, options);
                setData(result);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        const interval = setInterval(fetchData, refreshInterval * 1000);
        return () => clearInterval(interval);
    }, [url, refreshInterval, apiKey, apiKeyLocation, apiKeyParamName, apiKeyHeaderName, refreshKey]);

    return { data, loading, error, refetch };
}
