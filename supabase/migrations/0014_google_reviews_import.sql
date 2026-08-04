-- The shop's real Google reviews, transcribed from the live listing.
--
-- These are genuine reviews of Diamond Stepss and are verifiable on Google:
-- https://maps.app.goo.gl/5ZbHCdtKLU937L2o7
--
-- Two things worth knowing about this import:
--
-- 1. Dates. Google shows most of these as "N weeks ago", so the timestamps here
--    are derived (48 weeks before 4 Aug 2026 = 2 Sep 2025) and are accurate to
--    about a week. The two with explicit dates are exact.
--
-- 2. source_id. A real Places API sync uses Google's own review resource names.
--    These hand-imported rows use an `import:` prefix instead, so the sync can
--    recognise and replace them rather than showing the same review twice —
--    see removeSupersededImports() in lib/server/google-reviews.ts.
--
-- Reviews left blank by their author are stored with an empty body: they are
-- real ratings and must count towards the average, but there is no quote to
-- display, so the UI skips them as cards.

insert into public.reviews
  (source, source_id, author, location, rating, body, published_at, source_url, position)
values
  ('GOOGLE', 'import:surinder-kaur',        'Surinder Kaur',            null, 5,
   'Best shoes shop ever',
   '2026-03-24', 'https://maps.app.goo.gl/5ZbHCdtKLU937L2o7', 0),

  ('GOOGLE', 'import:janjuaa-13',           'JANJUAA 13',               null, 5,
   'Shoe quality is close to premium with a reasonable price. Definitely recommend it',
   '2025-09-02', 'https://maps.app.goo.gl/5ZbHCdtKLU937L2o7', 0),

  ('GOOGLE', 'import:rahul-nangal',         'Rahul Nangal',             null, 5,
   'Very best quality & price',
   '2025-09-02', 'https://maps.app.goo.gl/5ZbHCdtKLU937L2o7', 0),

  ('GOOGLE', 'import:svy',                  'SVY',                      null, 5,
   'Amazing shoes Collection in jalandhar',
   '2025-09-02', 'https://maps.app.goo.gl/5ZbHCdtKLU937L2o7', 0),

  ('GOOGLE', 'import:mirza-nangal',         'Mirza Nangal',             null, 5,
   'Good quality stuff must visit genuine rates trending articals',
   '2025-09-02', 'https://maps.app.goo.gl/5ZbHCdtKLU937L2o7', 0),

  ('GOOGLE', 'import:guri-hazara',          'Guri Hazara',              null, 5,
   'Nice shoes👌',
   '2025-09-02', 'https://maps.app.goo.gl/5ZbHCdtKLU937L2o7', 0),

  ('GOOGLE', 'import:kulbir-singh',         'Kulbir Singh',             null, 5,
   'Will good shoes 💯 original',
   '2025-09-02', 'https://maps.app.goo.gl/5ZbHCdtKLU937L2o7', 0),

  ('GOOGLE', 'import:rajinder-singh',       'Rajinder Singh',           null, 5,
   'They have really good collection',
   '2025-05-11', 'https://maps.app.goo.gl/5ZbHCdtKLU937L2o7', 0),

  -- Rating-only: no text was left. Counted in the average, not shown as a card.
  ('GOOGLE', 'import:sukha-sandhu',         'Sukha Sandhu',             null, 5,
   '😇🔥',
   '2025-09-02', 'https://maps.app.goo.gl/5ZbHCdtKLU937L2o7', 0),

  ('GOOGLE', 'import:prabh-jot',            'Prabh Jot',                null, 5,
   '', '2025-09-02', 'https://maps.app.goo.gl/5ZbHCdtKLU937L2o7', 0),

  ('GOOGLE', 'import:arsh-deep',            'Arsh Deep',                null, 5,
   '', '2025-09-02', 'https://maps.app.goo.gl/5ZbHCdtKLU937L2o7', 0),

  ('GOOGLE', 'import:jagroop-yt-vlogs',     'Jagroop YT Vlogs',         null, 5,
   '', '2025-04-08', 'https://maps.app.goo.gl/5ZbHCdtKLU937L2o7', 0)

on conflict (source, source_id) where source_id is not null do update
  set author       = excluded.author,
      rating       = excluded.rating,
      body         = excluded.body,
      published_at = excluded.published_at,
      source_url   = excluded.source_url;

-- The three hand-written testimonials that predate this import are now
-- outranked by twelve real reviews. They remain in the table and are still
-- displayed, labelled as testimonials rather than verified reviews.
