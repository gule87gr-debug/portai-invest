import { TradingViewEmbed, themeBackground, useTradingViewLocale } from "./TradingViewEmbed";

export { TradingViewEmbed } from "./TradingViewEmbed";
export { TradingViewAttribution } from "./TradingViewAttribution";

/** Full interactive chart (candles, volume, timeframes) — replaces our custom chart. */
export const TVAdvancedChart = ({ symbol, height = 520 }: { symbol: string; height?: number }) => {
  const locale = useTradingViewLocale();
  return (
    <TradingViewEmbed
      widget="advanced-chart"
      height={height}
      config={{
        autosize: true,
        symbol,
        interval: "D",
        range: "12M",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale,
        backgroundColor: themeBackground(),
        hide_side_toolbar: true,
        allow_symbol_change: false,
        save_image: false,
        calendar: false,
        support_host: "https://www.tradingview.com",
      }}
    />
  );
};

/** Price, daily change and key stats header for one symbol. */
export const TVSymbolInfo = ({ symbol }: { symbol: string }) => {
  const locale = useTradingViewLocale();
  return (
    <TradingViewEmbed
      widget="symbol-info"
      height={210}
      config={{ symbol, width: "100%", locale, colorTheme: "dark", isTransparent: true }}
    />
  );
};

/** One widget listing every symbol of a watchlist (lighter than one mini chart per row). */
export const TVMarketOverview = ({
  title,
  symbols,
  height = 460,
}: {
  title: string;
  symbols: { s: string; d: string }[];
  height?: number;
}) => {
  const locale = useTradingViewLocale();
  return (
    <TradingViewEmbed
      widget="market-overview"
      height={height}
      config={{
        colorTheme: "dark",
        dateRange: "1D",
        showChart: true,
        locale,
        width: "100%",
        height: "100%",
        isTransparent: true,
        showSymbolLogo: true,
        showFloatingTooltip: false,
        tabs: [{ title, symbols, originalTitle: title }],
      }}
    />
  );
};

/** TradingView technical-analysis gauge. */
export const TVTechnicalAnalysis = ({ symbol }: { symbol: string }) => {
  const locale = useTradingViewLocale();
  return (
    <TradingViewEmbed
      widget="technical-analysis"
      height={450}
      config={{
        interval: "1D",
        width: "100%",
        height: "100%",
        isTransparent: true,
        symbol,
        showIntervalTabs: true,
        displayMode: "single",
        locale,
        colorTheme: "dark",
      }}
    />
  );
};

/** Sector heatmap (S&P 500 by default). */
export const TVStockHeatmap = ({ height = 550, dataSource = "SPX500" }: { height?: number; dataSource?: string }) => {
  const locale = useTradingViewLocale();
  return (
    <TradingViewEmbed
      widget="stock-heatmap"
      height={height}
      config={{
        exchanges: [],
        dataSource,
        grouping: "sector",
        blockSize: "market_cap_basic",
        blockColor: "change",
        locale,
        symbolUrl: "",
        colorTheme: "dark",
        hasTopBar: true,
        isDataSetEnabled: true,
        isZoomEnabled: true,
        hasSymbolTooltip: true,
        isMonoSize: false,
        width: "100%",
        height: "100%",
      }}
    />
  );
};
