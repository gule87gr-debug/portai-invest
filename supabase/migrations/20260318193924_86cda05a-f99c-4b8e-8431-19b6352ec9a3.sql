
-- Watchlists table
CREATE TABLE public.watchlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own watchlists" ON public.watchlists FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own watchlists" ON public.watchlists FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own watchlists" ON public.watchlists FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own watchlists" ON public.watchlists FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Watchlist stocks table
CREATE TABLE public.watchlist_stocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  watchlist_id uuid NOT NULL REFERENCES public.watchlists(id) ON DELETE CASCADE,
  ticker text NOT NULL,
  name text NOT NULL,
  sector text NOT NULL DEFAULT '',
  signal text NOT NULL DEFAULT 'neutral',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(watchlist_id, ticker)
);

ALTER TABLE public.watchlist_stocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own watchlist stocks" ON public.watchlist_stocks FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.watchlists WHERE id = watchlist_stocks.watchlist_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert own watchlist stocks" ON public.watchlist_stocks FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.watchlists WHERE id = watchlist_stocks.watchlist_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete own watchlist stocks" ON public.watchlist_stocks FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.watchlists WHERE id = watchlist_stocks.watchlist_id AND user_id = auth.uid()));
