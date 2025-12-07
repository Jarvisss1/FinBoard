'use client';

import { useEffect } from 'react';
import { useDashboardStore } from '../store/store';

// Initialize API keys on first load
export default function ApiKeyInitializer() {
  const { apiKeys, setApiKey } = useDashboardStore();

  useEffect(() => {
    // Only set if not already configured
    if (!apiKeys.alphavantage) {
      setApiKey('alphavantage', '78UA55ZSKYNQWUCA');
    }
    if (!apiKeys.finnhub) {
      setApiKey('finnhub', 'd4qmsehr01quli1dlpm0d4qmsehr01quli1dlpmg');
    }
  }, []);

  return null; // This component doesn't render anything
}
