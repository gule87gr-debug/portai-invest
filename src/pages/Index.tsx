import { useLanguage } from "@/contexts/LanguageContext";

const Index = () => {
  const { t } = useLanguage();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">{t("welcomeBlankApp")}</h1>
        <p className="text-xl text-muted-foreground">{t("startBuilding")}</p>
      </div>
    </div>
  );
};

export default Index;
