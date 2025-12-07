# API Keys Setup

Your API keys have been provided. Here's how to set them up:

## Option 1: Automatic Setup (Recommended)

1. Open your browser to `http://localhost:3000`
2. Open the browser console (F12 or Right-click → Inspect → Console)
3. Paste this code and press Enter:

```javascript
localStorage.setItem('finboard-storage', JSON.stringify({
  state: {
    widgets: [],
    isEditMode: false,
    apiKeys: {
      alphavantage: '78UA55ZSKYNQWUCA',
      finnhub: 'd4qmsehr01quli1dlpm0d4qmsehr01quli1dlpmg'
    }
  },
  version: 0
}));
location.reload();
```

## Option 2: Manual Setup via UI (Future Enhancement)

Currently, there's no UI to set API keys. The keys are stored in the Zustand store and will auto-populate when you:

1. Paste an AlphaVantage URL (e.g., `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=IBM`)
2. Paste a Finnhub URL (e.g., `https://finnhub.io/api/v1/quote?symbol=AAPL`)

The system will automatically detect the provider and use the stored key.

## Your API Keys

- **AlphaVantage**: `78UA55ZSKYNQWUCA`
- **Finnhub**: `d4qmsehr01quli1dlpm0d4qmsehr01quli1dlpmg`

## Testing the Setup

After setting up the keys, try adding a widget:

1. Click "Add Widget"
2. Paste this URL: `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=IBM`
3. The API key should auto-populate
4. Click "Test" to verify the connection
5. Select fields and create the widget

## Security Note

⚠️ **Important**: These API keys are stored in browser localStorage. For production use, consider:
- Using environment variables
- Implementing server-side API proxy
- Using secure key management services
