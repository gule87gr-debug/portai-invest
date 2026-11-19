// Data-sources disclosure shown on the Privacy Policy, Terms of Service and
// Data & Compliance pages. Fully localized in every supported language and
// rendered alongside the existing legal documents (which keep their own
// language fallback policy).
import type { Language } from "@/contexts/LanguageContext";
import type { LegalNode } from "@/lib/legalPagesI18n";

type Copy = {
  heading: string;
  intro: string;
  tradingView: string;
  news: string;
  analysis: string;
  noPrices: string;
  privacyThirdParty: string;
};

const COPY: Record<Language, Copy> = {
  en: {
    heading: "Data sources",
    intro: "PortAI uses the following sources for market and news content:",
    tradingView: "**Market data and charts:** provided by TradingView through its official, free embeddable widgets. PortAI does not fetch, store or redistribute price data itself; prices and charts are shown inside the TradingView widgets.",
    news: "**News:** headlines published in the official public RSS feeds of the publishers themselves. For each item we show only the headline, the publisher's name, the publication date, a short snippet of up to 150 characters taken from the feed, and a link to the original article on the publisher's site. We do not copy article bodies or images, and news items are deleted after 30 days.",
    analysis: "**Article analysis:** only performed where the publisher permits it. Before reading an article we check the publisher's robots.txt and text-and-data-mining reservations (TDM Reservation Protocol) and we do not analyse articles that are reserved, disallowed or behind a paywall. We store only our scores, categories, reasoning and short quotes of the claims we assess (each up to about 200 characters), never the full article text.",
    noPrices: "**Price alerts** are temporarily unavailable while we move to a new data provider. Existing alerts remain saved.",
    privacyThirdParty: "**TradingView widgets are third-party content:** they load directly from TradingView's servers, so TradingView receives technical data such as your IP address and browser information and may set its own cookies, under TradingView's own privacy policy (tradingview.com/privacy-policy).",
  },
  es: {
    heading: "Fuentes de datos",
    intro: "PortAI utiliza las siguientes fuentes para los contenidos de mercado y noticias:",
    tradingView: "**Datos de mercado y gráficos:** proporcionados por TradingView mediante sus widgets oficiales y gratuitos para insertar. PortAI no obtiene, almacena ni redistribuye datos de precios; los precios y gráficos se muestran dentro de los widgets de TradingView.",
    news: "**Noticias:** titulares publicados en los feeds RSS públicos oficiales de los propios medios. Para cada noticia mostramos solo el titular, el nombre del medio, la fecha de publicación, un breve extracto de hasta 150 caracteres tomado del feed y un enlace al artículo original en la web del medio. No copiamos el cuerpo de los artículos ni sus imágenes, y las noticias se eliminan a los 30 días.",
    analysis: "**Análisis de artículos:** solo se realiza cuando el medio lo permite. Antes de leer un artículo comprobamos el robots.txt del medio y sus reservas de minería de textos y datos (TDM Reservation Protocol), y no analizamos artículos reservados, no permitidos o tras un muro de pago. Solo guardamos nuestras puntuaciones, categorías, razonamiento y citas breves de las afirmaciones evaluadas (cada una de unos 200 caracteres como máximo), nunca el texto completo del artículo.",
    noPrices: "**Las alertas de precio** no están disponibles temporalmente mientras cambiamos a un nuevo proveedor de datos. Las alertas existentes siguen guardadas.",
    privacyThirdParty: "**Los widgets de TradingView son contenido de terceros:** se cargan directamente desde los servidores de TradingView, por lo que TradingView recibe datos técnicos como tu dirección IP e información del navegador y puede instalar sus propias cookies, conforme a su propia política de privacidad (tradingview.com/privacy-policy).",
  },
  fr: {
    heading: "Sources de données",
    intro: "PortAI utilise les sources suivantes pour les contenus de marché et d'actualité :",
    tradingView: "**Données de marché et graphiques :** fournis par TradingView via ses widgets officiels et gratuits à intégrer. PortAI ne récupère, ne stocke ni ne redistribue lui-même de données de prix ; les prix et graphiques s'affichent dans les widgets TradingView.",
    news: "**Actualités :** titres publiés dans les flux RSS publics officiels des éditeurs eux-mêmes. Pour chaque article, nous affichons uniquement le titre, le nom de l'éditeur, la date de publication, un court extrait de 150 caractères maximum issu du flux et un lien vers l'article original sur le site de l'éditeur. Nous ne copions ni le corps des articles ni les images, et les actualités sont supprimées après 30 jours.",
    analysis: "**Analyse d'articles :** effectuée uniquement lorsque l'éditeur l'autorise. Avant de lire un article, nous vérifions le robots.txt de l'éditeur et ses réserves de fouille de textes et de données (TDM Reservation Protocol), et nous n'analysons pas les articles réservés, interdits ou derrière un paywall. Nous ne conservons que nos scores, catégories, raisonnements et de courtes citations des affirmations évaluées (environ 200 caractères maximum chacune), jamais le texte intégral de l'article.",
    noPrices: "**Les alertes de prix** sont temporairement indisponibles pendant notre passage à un nouveau fournisseur de données. Les alertes existantes restent enregistrées.",
    privacyThirdParty: "**Les widgets TradingView sont des contenus tiers :** ils se chargent directement depuis les serveurs de TradingView, qui reçoit donc des données techniques comme votre adresse IP et les informations de votre navigateur et peut déposer ses propres cookies, conformément à sa propre politique de confidentialité (tradingview.com/privacy-policy).",
  },
  pt: {
    heading: "Fontes de dados",
    intro: "A PortAI utiliza as seguintes fontes para conteúdos de mercado e notícias:",
    tradingView: "**Dados de mercado e gráficos:** fornecidos pela TradingView através dos seus widgets oficiais e gratuitos para incorporar. A PortAI não obtém, armazena nem redistribui dados de preços; os preços e gráficos são apresentados dentro dos widgets da TradingView.",
    news: "**Notícias:** títulos publicados nos feeds RSS públicos oficiais dos próprios editores. Para cada notícia mostramos apenas o título, o nome do editor, a data de publicação, um pequeno excerto de até 150 caracteres retirado do feed e uma ligação para o artigo original no site do editor. Não copiamos o corpo dos artigos nem imagens, e as notícias são eliminadas ao fim de 30 dias.",
    analysis: "**Análise de artigos:** realizada apenas quando o editor o permite. Antes de ler um artigo verificamos o robots.txt do editor e as suas reservas de mineração de texto e dados (TDM Reservation Protocol), e não analisamos artigos reservados, não permitidos ou atrás de um paywall. Guardamos apenas as nossas pontuações, categorias, raciocínio e citações curtas das afirmações avaliadas (cada uma com cerca de 200 caracteres no máximo), nunca o texto completo do artigo.",
    noPrices: "**Os alertas de preço** estão temporariamente indisponíveis enquanto mudamos para um novo fornecedor de dados. Os alertas existentes continuam guardados.",
    privacyThirdParty: "**Os widgets da TradingView são conteúdo de terceiros:** são carregados diretamente dos servidores da TradingView, que recebe por isso dados técnicos como o seu endereço IP e informações do navegador e pode definir os seus próprios cookies, nos termos da sua própria política de privacidade (tradingview.com/privacy-policy).",
  },
  de: {
    heading: "Datenquellen",
    intro: "PortAI nutzt die folgenden Quellen für Markt- und Nachrichteninhalte:",
    tradingView: "**Marktdaten und Charts:** bereitgestellt von TradingView über dessen offizielle, kostenlose Einbettungs-Widgets. PortAI ruft selbst keine Kursdaten ab, speichert oder verbreitet sie nicht; Kurse und Charts werden innerhalb der TradingView-Widgets angezeigt.",
    news: "**Nachrichten:** Schlagzeilen aus den offiziellen öffentlichen RSS-Feeds der Verlage selbst. Pro Meldung zeigen wir nur die Schlagzeile, den Namen des Verlags, das Veröffentlichungsdatum, einen kurzen Auszug von höchstens 150 Zeichen aus dem Feed und einen Link zum Originalartikel auf der Website des Verlags. Wir kopieren weder Artikeltexte noch Bilder, und Meldungen werden nach 30 Tagen gelöscht.",
    analysis: "**Artikelanalyse:** erfolgt nur, wenn der Verlag sie erlaubt. Bevor wir einen Artikel lesen, prüfen wir die robots.txt des Verlags und seine Text-und-Data-Mining-Vorbehalte (TDM Reservation Protocol); vorbehaltene, nicht erlaubte oder hinter einer Paywall liegende Artikel analysieren wir nicht. Wir speichern nur unsere Bewertungen, Kategorien, Begründungen und kurze Zitate der geprüften Aussagen (jeweils höchstens etwa 200 Zeichen), niemals den vollständigen Artikeltext.",
    noPrices: "**Kursalarme** sind vorübergehend nicht verfügbar, während wir zu einem neuen Datenanbieter wechseln. Bestehende Alarme bleiben gespeichert.",
    privacyThirdParty: "**TradingView-Widgets sind Inhalte Dritter:** Sie werden direkt von den Servern von TradingView geladen, daher erhält TradingView technische Daten wie deine IP-Adresse und Browserinformationen und kann eigene Cookies setzen – gemäß der eigenen Datenschutzerklärung von TradingView (tradingview.com/privacy-policy).",
  },
  it: {
    heading: "Fonti dei dati",
    intro: "PortAI utilizza le seguenti fonti per i contenuti di mercato e le notizie:",
    tradingView: "**Dati di mercato e grafici:** forniti da TradingView tramite i suoi widget ufficiali e gratuiti da incorporare. PortAI non recupera, memorizza né ridistribuisce dati sui prezzi; prezzi e grafici sono mostrati all'interno dei widget di TradingView.",
    news: "**Notizie:** titoli pubblicati nei feed RSS pubblici ufficiali degli editori stessi. Per ogni notizia mostriamo solo il titolo, il nome dell'editore, la data di pubblicazione, un breve estratto di massimo 150 caratteri tratto dal feed e un link all'articolo originale sul sito dell'editore. Non copiamo il testo degli articoli né le immagini, e le notizie vengono eliminate dopo 30 giorni.",
    analysis: "**Analisi degli articoli:** eseguita solo quando l'editore lo consente. Prima di leggere un articolo verifichiamo il robots.txt dell'editore e le sue riserve di estrazione di testo e dati (TDM Reservation Protocol), e non analizziamo articoli riservati, non consentiti o dietro paywall. Conserviamo solo i nostri punteggi, categorie, motivazioni e brevi citazioni delle affermazioni valutate (ciascuna di circa 200 caratteri al massimo), mai il testo completo dell'articolo.",
    noPrices: "**Gli avvisi di prezzo** sono temporaneamente non disponibili mentre passiamo a un nuovo fornitore di dati. Gli avvisi esistenti restano salvati.",
    privacyThirdParty: "**I widget di TradingView sono contenuti di terzi:** vengono caricati direttamente dai server di TradingView, che riceve quindi dati tecnici come il tuo indirizzo IP e le informazioni del browser e può impostare propri cookie, secondo la propria informativa sulla privacy (tradingview.com/privacy-policy).",
  },
};

export type DataSourcesPage = "privacy" | "terms" | "dataCompliance";

export function getDataSourcesNodes(lang: Language, page: DataSourcesPage): LegalNode[] {
  const c = COPY[lang] ?? COPY.en;
  const items = [c.tradingView, c.news, c.analysis, c.noPrices];
  if (page === "privacy") items.push(c.privacyThirdParty);
  return [
    { type: "h2", text: c.heading },
    { type: "p", text: c.intro },
    { type: "ul", items },
  ];
}
