-- Create analyzed_articles table for the Media Bias Pulse dashboard
CREATE TABLE public.analyzed_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  bias_score INTEGER NOT NULL DEFAULT 5,
  red_flag TEXT NOT NULL DEFAULT 'Unverified',
  hidden_angle TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  vindicate_count INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  submitted_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_analyzed_articles_created_at ON public.analyzed_articles (created_at DESC);
CREATE INDEX idx_analyzed_articles_url ON public.analyzed_articles (url);

ALTER TABLE public.analyzed_articles ENABLE ROW LEVEL SECURITY;

-- Public read so the Pulse feed is community-wide
CREATE POLICY "Anyone can read analyzed articles"
  ON public.analyzed_articles FOR SELECT
  USING (true);

-- No direct inserts/updates/deletes by users — only the analyze-link edge function (service role) writes
CREATE POLICY "No direct user inserts"
  ON public.analyzed_articles FOR INSERT
  TO authenticated WITH CHECK (false);

CREATE POLICY "No direct user updates"
  ON public.analyzed_articles FOR UPDATE
  TO authenticated USING (false);

CREATE POLICY "No direct user deletes"
  ON public.analyzed_articles FOR DELETE
  TO authenticated USING (false);

-- Vindicate (like) RPC: increments vindicate_count safely without exposing UPDATE
CREATE OR REPLACE FUNCTION public.vindicate_article(_article_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  UPDATE public.analyzed_articles
     SET vindicate_count = vindicate_count + 1
   WHERE id = _article_id;
END;
$$;

-- Seed a few sample articles so the Pulse isn't empty
INSERT INTO public.analyzed_articles (url, source, title, bias_score, red_flag, hidden_angle, summary, vindicate_count, view_count, created_at) VALUES
('https://www.cnbc.com/sample/nvidia-rally','CNBC','NVIDIA Stock Soars to All-Time High on AI Optimism',6,'Promotional Language','The article omits the impact of recent insider selling and the historically high P/E ratio relative to sector peers, focusing instead on bullish analyst quotes funded by partnered firms.','Heavy use of superlatives and forward-looking statements without sufficient counter-evidence.',24,189,now() - interval '12 minutes'),
('https://seekingalpha.com/sample/tesla-earnings','Seeking Alpha','Why Tesla Could Double in 2026 Despite Slowing Demand',8,'One-Sided','The author has previously disclosed long positions and ignores margin compression and the Cybertruck production miss reported in the last 10-Q.','Cherry-picked bullish data points; no bear case considered. Author bias not prominently disclosed.',47,412,now() - interval '47 minutes'),
('https://www.reuters.com/sample/fed-decision','Reuters','Fed Holds Rates Steady, Signals Cautious Path Ahead',2,'Objective Reporting','Balanced sourcing across hawks and doves; primary documents linked. No promotional framing detected.','Standard wire-service reporting with multiple official sources and direct quotes from FOMC statement.',8,67,now() - interval '1 hour 20 minutes'),
('https://www.foxbusiness.com/sample/crypto-comeback','Fox Business','Bitcoin Set for Massive Comeback as Institutions Pile In',7,'Conflict of Interest','Several quoted institutional investors hold sizeable BTC positions; the article does not mention recent ETF outflows or regulatory headwinds in the EU.','Sources have undisclosed financial interest in upward price movement.',31,256,now() - interval '2 hours'),
('https://www.bloomberg.com/sample/oil-volatility','Bloomberg','Oil Prices Whipsaw on Mixed OPEC+ Signals',3,'Objective Reporting','Multiple analyst perspectives included; opposing views on supply outlook clearly attributed.','Even-handed reporting with quantitative data from EIA and counterpoints from market strategists.',12,98,now() - interval '3 hours 10 minutes'),
('https://www.benzinga.com/sample/penny-stock-alert','Benzinga','This $2 Penny Stock Could Be the Next 10x Winner',9,'Pump Pattern','Article aggregates unverified social media chatter and a sponsored research report. No fundamental analysis of the company''s negative cash flow or recent reverse stock split.','Strong promotional language tied to low-float micro-cap; classic pump-and-dump signature.',5,143,now() - interval '5 hours');
