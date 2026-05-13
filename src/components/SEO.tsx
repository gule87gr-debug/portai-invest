import { Helmet } from "react-helmet-async";

const SITE_URL = "https://portai-invest.com";

interface SEOProps {
  title: string;
  description: string;
  path: string;
  ogType?: "website" | "article";
}

export const SEO = ({ title, description, path, ogType = "website" }: SEOProps) => {
  const url = `${SITE_URL}${path}`;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={ogType} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
};
