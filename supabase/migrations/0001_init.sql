-- Wallreel schema: subreddits, wallpapers, profiles, favourites.

create table public.subreddits (
  id text primary key,                -- lower-case name
  name text not null,                 -- display name, e.g. "EarthPorn"
  title text,
  description text,
  category text not null default 'General',
  icon_url text,
  banner_url text,
  subscribers integer not null default 0,
  wallpaper_count integer not null default 0,
  active boolean not null default true,
  last_synced_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.wallpapers (
  id text primary key,                -- reddit post id, or "<post id>-<n>" for gallery images
  post_id text not null,
  subreddit text not null references public.subreddits (id) on delete cascade,
  title text not null,
  author text not null,
  permalink text not null,
  image_url text not null,
  thumbs jsonb not null default '[]',
  tiny_url text,
  width integer not null,
  height integer not null,
  orientation text generated always as (
    case when width > height * 1.1 then 'landscape'
         when height > width * 1.1 then 'portrait'
         else 'square' end
  ) stored,
  aspect_ratio real generated always as (width::real / nullif(height, 0)) stored,
  min_side integer generated always as (least(width, height)) stored,
  file_size bigint,
  mime text,
  score integer not null default 0,
  upvote_ratio real not null default 1,
  num_comments integer not null default 0,
  created_utc timestamptz not null,
  hot_score double precision not null default 0,
  views integer not null default 0,
  favourites_count integer not null default 0,
  gallery_index integer,
  hidden boolean not null default false,
  synced_at timestamptz not null default now(),
  search_tsv tsvector generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || subreddit || ' ' || coalesce(author, ''))
  ) stored
);

create index wallpapers_sub_hot on public.wallpapers (subreddit, hot_score desc) where not hidden;
create index wallpapers_sub_new on public.wallpapers (subreddit, created_utc desc) where not hidden;
create index wallpapers_sub_score on public.wallpapers (subreddit, score desc) where not hidden;
create index wallpapers_hot on public.wallpapers (hot_score desc) where not hidden;
create index wallpapers_new on public.wallpapers (created_utc desc) where not hidden;
create index wallpapers_score on public.wallpapers (score desc) where not hidden;
create index wallpapers_orientation on public.wallpapers (orientation, hot_score desc) where not hidden;
create index wallpapers_synced on public.wallpapers (synced_at);
create index wallpapers_search on public.wallpapers using gin (search_tsv);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text,
  avatar_url text,
  provider text,
  created_at timestamptz not null default now()
);

create table public.favourites (
  user_id uuid not null references auth.users (id) on delete cascade,
  wallpaper_id text not null references public.wallpapers (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, wallpaper_id)
);
create index favourites_user_recent on public.favourites (user_id, created_at desc);

-- Keep wallpapers.favourites_count in step with the favourites table.
create function public.sync_favourites_count() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update wallpapers set favourites_count = favourites_count + 1 where id = new.wallpaper_id;
  elsif tg_op = 'DELETE' then
    update wallpapers set favourites_count = greatest(favourites_count - 1, 0) where id = old.wallpaper_id;
  end if;
  return null;
end $$;

create trigger favourites_count after insert or delete on public.favourites
for each row execute function public.sync_favourites_count();

-- Create a profile row for every new auth user.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, username, avatar_url, provider)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', new.raw_user_meta_data ->> 'full_name',
             new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    coalesce(new.raw_user_meta_data ->> 'provider', new.raw_app_meta_data ->> 'provider')
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- View counter callable by anyone; only ever adds one.
create function public.increment_view(wid text) returns void
language sql security definer set search_path = public as $$
  update wallpapers set views = views + 1 where id = wid and not hidden;
$$;
grant execute on function public.increment_view(text) to anon, authenticated;

-- Row level security
alter table public.subreddits enable row level security;
alter table public.wallpapers enable row level security;
alter table public.profiles enable row level security;
alter table public.favourites enable row level security;

create policy "subreddits are public" on public.subreddits for select using (true);
create policy "wallpapers are public" on public.wallpapers for select using (true);
create policy "profiles are public" on public.profiles for select using (true);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);
create policy "own favourites read" on public.favourites for select using (auth.uid() = user_id);
create policy "own favourites insert" on public.favourites for insert with check (auth.uid() = user_id);
create policy "own favourites delete" on public.favourites for delete using (auth.uid() = user_id);
