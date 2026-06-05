import { AppLayout } from "@/components/AppLayout";
import { SEO } from "@/components/SEO";
import { usePageTitle } from "@/hooks/usePageTitle";
import { StockNewsFeed } from "@/components/StockNewsFeed";
import { useLanguage } from "@/contexts/LanguageContext";

const NewsPage = () => {
  usePageTitle("News Feed | PortAI");
  const { t } = useLanguage();

  return (
    <AppLayout>
      <SEO
        title="News Feed — PortAI"
        description="Curated financial news with AI trust scores and bias detection for retail investors."
        path="/news"
      />
      <div className="mb-8">
        <h1 className="editorial-h1 text-4xl sm:text-5xl font-bold">{t("marketNewsFeed")}</h1>
        <p className="mt-2 text-muted-foreground">{t("aiCuratedAnalysis")}</p>
      </div>
      <StockNewsFeed />
    </AppLayout>
  );
};

export default NewsPage;
