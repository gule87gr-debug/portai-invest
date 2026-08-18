import { Helmet } from "react-helmet-async";

const SITE_URL = "https://portai-invest.com";

interface SEOProps {
  title: string;
  description: string;
  path: string;
  ogType?: "website" | "article";
  ogTitle?: string;
}

export const SEO = ({ title, description, path, ogType = "website", ogTitle }: SEOProps) => {
  const url = `${SITE_URL}${path}`;
  const socialTitle = ogTitle ?? title;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={socialTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={ogType} />
      <meta name="twitter:title" content={socialTitle} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
};
