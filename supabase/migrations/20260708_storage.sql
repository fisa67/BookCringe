-- 20260708_storage.sql
select storage.create_bucket('covers', {
  public: false,
  file_size_limit: 10485760
});

select storage.create_bucket('thumbnails', {
  public: false,
  file_size_limit: 10485760
});

select storage.create_bucket('assets', {
  public: false,
  file_size_limit: 10485760
});

select storage.create_bucket('logos', {
  public: false,
  file_size_limit: 10485760
});
