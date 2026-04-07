import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 5000;

  // Proxy for CoinDCX Symbols
  app.get("/api/coindcx/symbols", async (req, res) => {
    try {
      const response = await fetch('https://api.coindcx.com/exchange/v1/markets_details');
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('CoinDCX Symbols Proxy Error:', error);
      res.status(500).json({ error: 'Failed to fetch CoinDCX symbols' });
    }
  });

  // Proxy for CoinDCX Klines
  app.get("/api/coindcx/klines", async (req, res) => {
    const { pair, interval, limit } = req.query;
    try {
      const url = `https://public.coindcx.com/market_data/candles?pair=${pair}&interval=${interval}&limit=${limit}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('CoinDCX Klines Proxy Error:', error);
      res.status(500).json({ error: 'Failed to fetch CoinDCX klines' });
    }
  });

  // Proxy for CoinDCX Ticker
  app.get("/api/coindcx/ticker", async (req, res) => {
    try {
      const response = await fetch('https://api.coindcx.com/exchange/ticker');
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('CoinDCX Ticker Proxy Error:', error);
      res.status(500).json({ error: 'Failed to fetch CoinDCX ticker' });
    }
  });

  // Proxy for Binance Klines
  app.get("/api/binance/klines", async (req, res) => {
    const { symbol, interval, limit } = req.query;
    try {
      const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return res.status(response.status).json(errorData);
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Binance Klines Proxy Error:', error);
      res.status(500).json({ error: 'Failed to fetch Binance klines' });
    }
  });

  // Proxy for Binance Ticker
  app.get("/api/binance/ticker", async (req, res) => {
    const { symbol } = req.query;
    try {
      const url = `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return res.status(response.status).json(errorData);
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Binance Ticker Proxy Error:', error);
      res.status(500).json({ error: 'Failed to fetch Binance ticker' });
    }
  });

  // Proxy for Binance Exchange Info
  app.get("/api/binance/exchangeInfo", async (req, res) => {
    try {
      const response = await fetch('https://api.binance.com/api/v3/exchangeInfo');
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Binance ExchangeInfo Proxy Error:', error);
      res.status(500).json({ error: 'Failed to fetch Binance exchange info' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
