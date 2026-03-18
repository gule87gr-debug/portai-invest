import { useEffect, useRef } from "react";

interface TradingViewChartProps {
  symbol: string;
  height?: number;
}

export const TradingViewChart = ({ symbol, height = 500 }: TradingViewChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbol,
      interval: "D",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      backgroundColor: "rgba(14, 17, 23, 1)",
      gridColor: "rgba(30, 35, 45, 0.6)",
      allow_symbol_change: true,
      calendar: false,
      support_host: "https://www.tradingview.com",
    });

    const wrapper = document.createElement("div");
    wrapper.className = "tradingview-widget-container";
    wrapper.style.height = `${height}px`;
    wrapper.style.width = "100%";

    const innerDiv = document.createElement("div");
    innerDiv.className = "tradingview-widget-container__widget";
    innerDiv.style.height = "calc(100% - 32px)";
    innerDiv.style.width = "100%";

    wrapper.appendChild(innerDiv);
    wrapper.appendChild(script);
    containerRef.current.appendChild(wrapper);

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [symbol, height]);

  return <div ref={containerRef} style={{ height: `${height}px` }} className="rounded-xl overflow-hidden" />;
};

export const TradingViewTechnicalAnalysis = ({ symbol }: { symbol: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      interval: "1D",
      width: "100%",
      isTransparent: true,
      height: 450,
      symbol: symbol,
      showIntervalTabs: true,
      displayMode: "single",
      locale: "en",
      colorTheme: "dark",
    });

    const wrapper = document.createElement("div");
    wrapper.className = "tradingview-widget-container";

    const innerDiv = document.createElement("div");
    innerDiv.className = "tradingview-widget-container__widget";

    wrapper.appendChild(innerDiv);
    wrapper.appendChild(script);
    containerRef.current.appendChild(wrapper);

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [symbol]);

  return <div ref={containerRef} className="rounded-xl overflow-hidden" style={{ minHeight: 450 }} />;
};

export const TradingViewMiniChart = ({ symbol, width = 350 }: { symbol: string; width?: number | string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol: symbol,
      width: "100%",
      height: 160,
      locale: "en",
      dateRange: "1M",
      colorTheme: "dark",
      isTransparent: true,
      autosize: false,
      largeChartUrl: "",
      noTimeScale: true,
    });

    const wrapper = document.createElement("div");
    wrapper.className = "tradingview-widget-container";
    const innerDiv = document.createElement("div");
    innerDiv.className = "tradingview-widget-container__widget";
    wrapper.appendChild(innerDiv);
    wrapper.appendChild(script);
    containerRef.current.appendChild(wrapper);

    return () => { if (containerRef.current) containerRef.current.innerHTML = ""; };
  }, [symbol]);

  const styleWidth = typeof width === "number" ? `${width}px` : width;
  return <div ref={containerRef} style={{ width: styleWidth, height: 160 }} className="overflow-hidden" />;
};

export const TradingViewTimeline = ({ symbol, height = 400 }: { symbol: string; height?: number }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-timeline.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      feedMode: "symbol",
      symbol: symbol,
      isTransparent: true,
      displayMode: "regular",
      width: "100%",
      height: height,
      colorTheme: "dark",
      locale: "en",
    });

    const wrapper = document.createElement("div");
    wrapper.className = "tradingview-widget-container";
    wrapper.style.height = `${height}px`;
    wrapper.style.width = "100%";
    const innerDiv = document.createElement("div");
    innerDiv.className = "tradingview-widget-container__widget";
    innerDiv.style.height = "100%";
    innerDiv.style.width = "100%";
    wrapper.appendChild(innerDiv);
    wrapper.appendChild(script);
    containerRef.current.appendChild(wrapper);

    return () => { if (containerRef.current) containerRef.current.innerHTML = ""; };
  }, [symbol, height]);

  return <div ref={containerRef} style={{ height: `${height}px` }} className="rounded-xl overflow-hidden" />;
};

export const TradingViewTickerTape = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [
        { proName: "FOREXCOM:SPXUSD", title: "S&P 500" },
        { proName: "FOREXCOM:NSXUSD", title: "US 100" },
        { proName: "BITSTAMP:BTCUSD", title: "Bitcoin" },
        { proName: "BITSTAMP:ETHUSD", title: "Ethereum" },
        { proName: "FX:EURUSD", title: "EUR/USD" },
      ],
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: "adaptive",
      colorTheme: "dark",
      locale: "en",
    });

    const wrapper = document.createElement("div");
    wrapper.className = "tradingview-widget-container";
    const innerDiv = document.createElement("div");
    innerDiv.className = "tradingview-widget-container__widget";
    wrapper.appendChild(innerDiv);
    wrapper.appendChild(script);
    containerRef.current.appendChild(wrapper);

    return () => { if (containerRef.current) containerRef.current.innerHTML = ""; };
  }, []);

  return <div ref={containerRef} className="overflow-hidden" />;
};

export const TradingViewHeatmap = ({ height = 500 }: { height?: number }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      exchanges: [],
      dataSource: "SPX500",
      grouping: "sector",
      blockSize: "market_cap_basic",
      blockColor: "change",
      locale: "en",
      symbolUrl: "",
      colorTheme: "dark",
      hasTopBar: true,
      isDataSetEnabled: true,
      isZoomEnabled: true,
      hasSymbolTooltip: true,
      isMonoSize: false,
      width: "100%",
      height: height,
    });

    const wrapper = document.createElement("div");
    wrapper.className = "tradingview-widget-container";
    wrapper.style.height = `${height}px`;
    wrapper.style.width = "100%";
    const innerDiv = document.createElement("div");
    innerDiv.className = "tradingview-widget-container__widget";
    innerDiv.style.height = "100%";
    innerDiv.style.width = "100%";
    wrapper.appendChild(innerDiv);
    wrapper.appendChild(script);
    containerRef.current.appendChild(wrapper);

    return () => { if (containerRef.current) containerRef.current.innerHTML = ""; };
  }, [height]);

  return <div ref={containerRef} style={{ height: `${height}px` }} className="rounded-xl overflow-hidden" />;
};
