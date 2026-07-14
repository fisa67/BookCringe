-- 20260713_book_readings_reading_time.sql
--
-- Tempo total de leitura informado manualmente (Fase 1 da migração de
-- Estatísticas). Entrada humana em HH:MM:SS — convertida para segundos
-- antes de persistir; esta migration só adiciona a coluna, sem backfill.
-- bigint (não integer) para não limitar somas agregadas de longo prazo.
alter table public.book_readings
  add column if not exists reading_time_seconds bigint
    check (reading_time_seconds is null or reading_time_seconds >= 0);

comment on column public.book_readings.reading_time_seconds is
  'Tempo total de leitura informado manualmente, em segundos. NULL = não informado.';
