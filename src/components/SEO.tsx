import { Helmet } from "react-helmet-async";

const SITE_URL = "https://portai-invest.com";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

interface SEOProps {
  title: string;
  description: string;
  path: string;
  ogType?: "website" | "article";
  ogTitle?: string;
  /** Absolute https URL. Defaults to the sitewide social preview. */
  image?: string;
  imageAlt?: string;
  /** Keep private/utility routes out of search results. */
  noindex?: boolean;
}

export const SEO = ({
  title,
  description,
  path,
  ogType = "website",
  ogTitle,
  image = DEFAULT_OG_IMAGE,
  imageAlt = "PortAI — AI financial news bias checker and portfolio tracker",
  noindex = false,
}: SEOProps) => {
  const url = `${SITE_URL}${path}`;
  const socialTitle = ogTitle ?? title;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, follow" />}
      <meta property="og:title" content={socialTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={image} />
      <meta property="og:image:alt" content={imageAlt} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={socialTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={imageAlt} />
    </Helmet>
  );
};
