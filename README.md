# 📈 FinBoard (Finance Dashboard)

A powerful, customizable, and responsive financial data dashboard built with **Next.js 14**, **Tailwind CSS**, and **Zustand**. Track real-time stock prices, analyze trends with interactive charts, and manage your personalized watchlist.

## ✨ Features

- **🎨 Fully Customizable Layout**: Drag, drop, and resize widgets to create your perfect workspace.
- **📱 Mobile Responsive**: Optimized layouts that automatically stack for mobile devices to prevent overlaps.
- **📊 Multiple Widget Types**:
  - **Stock Cards**: Quick glance at price and daily change.
  - **Time Series Charts**: Interactive historical price charts for any stock.
  - **Tables**: Comprehensive data views (e.g., Top Gainers & Losers).
  - **Watchlist**: Multi-stock monitoring table to track your favorites.
- **🔦 Dark/Light Mode**: Built-in theme support (currently configured in code).
- **💾 Auto-Save**: Your dashboard layout and widget settings are automatically saved to local storage.
- **🔑 Secure API Handling**: Manage your Alpha Vantage / Finnhub API keys securely in the browser.
- **🚀 Demo Mode**: One-click "Load Demo" to instantly populate your dashboard with sample data.

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (React)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) (with persistence)
- **Grid System**: [React Grid Layout](https://github.com/react-grid-layout/react-grid-layout)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Data Provider**: [Alpha Vantage API](https://www.alphavantage.co/) (Primary)

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- An API Key from [Alpha Vantage](https://www.alphavantage.co/support/#api-key) (Free tier available)

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/finboard.git
    cd finboard
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Run the development server**:
    ```bash
    npm run dev
    ```

4.  **Open the app**:
    Visit [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage Guide

### 1. Setting up API Keys
On your first visit, or by clicking the **Settings** icon on any widget, enter your **Alpha Vantage API Key**.
*   *Note: The "Demo" key has rate limits and only supports specific symbols (like IBM). For the best experience, use your own free key.*

### 2. Adding Widgets
- Click the **"Add Widget"** button ("+") at the top right.
- Choose a widget type (Card, Table, Chart).
- Enter the **Title** and **API Endpoint** (or use the built-in "Test" feature to auto-configure).
- **Pro Tip**: Use the **"Load Demo"** dropdown to instantly add pre-configured widgets like "Top Gainers" or "Stock Watchlist".

### 3. Creating a Watchlist
- Load the **Stock Watchlist** from the demo menu.
- Type a ticker symbol (e.g., `NFLX`, `AMZN`) in the input bar.
- Click the `+` button to add it to your list.

### 4. Customizing Layout
- **Move**: proper grab the widget by its header and drag it anywhere.
- **Resize**: Drag the icon in the bottom-right corner of any widget to resize it.
- **Mobile**: On mobile devices, widgets naturally stack vertically to ensure readability.

## 📂 Project Structure

```
app/
├── components/
│   ├── widgets/          # Individual widget components (Chart, Table, etc.)
│   ├── Dashboard.tsx     # Main grid layout logic
│   ├── AddWidgetModal.tsx# Modal for creating/editing widgets
│   └── WidgetWrapper.tsx # Container handling drag/resize/header handles
├── hooks/
│   └── useWidgetData.ts  # Custom hook for data fetching & caching
├── store/
│   └── store.ts          # Zustand store for global state & layout
└── lib/
    └── api.ts            # API utility functions
```