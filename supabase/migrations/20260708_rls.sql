-- 20260708_rls.sql
alter table public.books enable row level security;
create policy "Allow all access to books" on public.books for all using (true) with check (true);

alter table public.book_readings enable row level security;
create policy "Allow all access to book_readings" on public.book_readings for all using (true) with check (true);

alter table public.contents enable row level security;
create policy "Allow all access to contents" on public.contents for all using (true) with check (true);

alter table public.bookclub_years enable row level security;
create policy "Allow all access to bookclub_years" on public.bookclub_years for all using (true) with check (true);

alter table public.bookclub_months enable row level security;
create policy "Allow all access to bookclub_months" on public.bookclub_months for all using (true) with check (true);

alter table public.bookclub_month_books enable row level security;
create policy "Allow all access to bookclub_month_books" on public.bookclub_month_books for all using (true) with check (true);

alter table public.statistics enable row level security;
create policy "Allow all access to statistics" on public.statistics for all using (true) with check (true);

alter table public.settings enable row level security;
create policy "Allow all access to settings" on public.settings for all using (true) with check (true);
