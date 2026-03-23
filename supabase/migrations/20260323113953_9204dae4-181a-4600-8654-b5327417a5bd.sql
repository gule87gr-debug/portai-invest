-- Allow all authenticated users to read watchlist_stocks for trending feature
CREATE POLICY "Authenticated users can read all watchlist stocks for trending"
ON public.watchlist_stocks
FOR SELECT
TO authenticated
USING (true);