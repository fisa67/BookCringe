-- 20260710_rls_hardening.sql
--
-- Substitui as policies "allow all" (sem restrição de papel) criadas em
-- 20260708_rls.sql por um modelo explícito de leitura pública + escrita
-- exclusiva via service_role, nas 8 tabelas do CMS:
--   books, book_readings, contents, bookclub_years, bookclub_months,
--   bookclub_month_books, statistics, settings.
--
-- Estratégia:
--   1. SELECT liberado para "anon" e "authenticated" (leitura pública).
--   2. INSERT/UPDATE/DELETE liberados apenas para "service_role".
--   3. Nenhuma policy de escrita é criada para "anon"/"authenticated" — com
--      RLS habilitado, a ausência de policy correspondente já NEGA a
--      operação por padrão para esses papéis.
--
-- Nota: no Supabase, requisições autenticadas com a service role key
-- ignoram RLS completamente (a policy "Service role write access to *"
-- abaixo é redundante em termos de efeito prático, mas documenta a
-- intenção explicitamente e protege contra qualquer mudança futura desse
-- comportamento). O painel admin usa exclusivamente `supabaseAdminClient`
-- (service role) em todos os services — nenhum comportamento do admin é
-- alterado por esta migration.

-- books
drop policy if exists "Allow all access to books" on public.books;
create policy "Public read access to books" on public.books
  for select to anon, authenticated using (true);
create policy "Service role write access to books" on public.books
  for all to service_role using (true) with check (true);

-- book_readings
drop policy if exists "Allow all access to book_readings" on public.book_readings;
create policy "Public read access to book_readings" on public.book_readings
  for select to anon, authenticated using (true);
create policy "Service role write access to book_readings" on public.book_readings
  for all to service_role using (true) with check (true);

-- contents
drop policy if exists "Allow all access to contents" on public.contents;
create policy "Public read access to contents" on public.contents
  for select to anon, authenticated using (true);
create policy "Service role write access to contents" on public.contents
  for all to service_role using (true) with check (true);

-- bookclub_years
drop policy if exists "Allow all access to bookclub_years" on public.bookclub_years;
create policy "Public read access to bookclub_years" on public.bookclub_years
  for select to anon, authenticated using (true);
create policy "Service role write access to bookclub_years" on public.bookclub_years
  for all to service_role using (true) with check (true);

-- bookclub_months
drop policy if exists "Allow all access to bookclub_months" on public.bookclub_months;
create policy "Public read access to bookclub_months" on public.bookclub_months
  for select to anon, authenticated using (true);
create policy "Service role write access to bookclub_months" on public.bookclub_months
  for all to service_role using (true) with check (true);

-- bookclub_month_books
drop policy if exists "Allow all access to bookclub_month_books" on public.bookclub_month_books;
create policy "Public read access to bookclub_month_books" on public.bookclub_month_books
  for select to anon, authenticated using (true);
create policy "Service role write access to bookclub_month_books" on public.bookclub_month_books
  for all to service_role using (true) with check (true);

-- statistics
drop policy if exists "Allow all access to statistics" on public.statistics;
create policy "Public read access to statistics" on public.statistics
  for select to anon, authenticated using (true);
create policy "Service role write access to statistics" on public.statistics
  for all to service_role using (true) with check (true);

-- settings
drop policy if exists "Allow all access to settings" on public.settings;
create policy "Public read access to settings" on public.settings
  for select to anon, authenticated using (true);
create policy "Service role write access to settings" on public.settings
  for all to service_role using (true) with check (true);
