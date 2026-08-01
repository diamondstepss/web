-- Seeds the catalog with the 14 verified products that lived in data/products.ts.
-- Idempotent: re-running updates rather than duplicating.

insert into public.categories (slug, name, image, position) values
  ('sneakers',      'Sneakers',      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&h=700&fit=crop&auto=format', 1),
  ('running-shoes', 'Running Shoes', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=700&fit=crop&auto=format', 2),
  ('sports-shoes',  'Sports Shoes',  'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&h=700&fit=crop&auto=format', 3),
  ('chelsea-boot',  'Chelsea Boots', 'https://images.unsplash.com/photo-1582897085656-c636d006a246?w=600&h=700&fit=crop&auto=format', 4),
  ('accessories',   'Accessories',   'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=600&h=700&fit=crop&auto=format', 5),
  ('loafers',       'Loafers',       null, 6),
  ('leather-shoes', 'Leather Shoes', null, 7),
  ('slippers',      'Slippers',      null, 8)
on conflict (slug) do update
  set name = excluded.name, image = excluded.image, position = excluded.position;

with seed(slug, brand, title, price, mrp, image, badge, is_featured, cat, sizes) as (values
  ('free-rn-flyknit-crimson',      'Nike',           'Free RN Flyknit Crimson',        2499, 3499, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop&auto=format', 'NEW',      true,  'running-shoes', array['6','7','8','9','10','11']),
  ('smash-leather-white',          'Puma',           'Smash Leather White',            1499, 2799, 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&h=600&fit=crop&auto=format', null,       true,  'sneakers',      array['6','7','8','9','10','11']),
  ('superrep-go-training-volt',    'Nike',           'SuperRep Go Training Volt',      2899, 3499, 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&h=600&fit=crop&auto=format', 'NEW',      true,  'sports-shoes',  array['7','8','9','10','11']),
  ('chuck-taylor-all-star-hi',     'Converse',       'Chuck Taylor All Star Hi Green', 1299, 2199, 'https://images.unsplash.com/photo-1463100099107-aa0980c362e6?w=600&h=600&fit=crop&auto=format', null,       true,  'sneakers',      array['6','7','8','9','10']),
  ('air-max-90-white-pink',        'Nike',           'Air Max 90 White Pink',          3199, 3499, 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=600&h=600&fit=crop&auto=format', null,       false, 'sneakers',      array['6','7','8','9']),
  ('574-core-olive',               'New Balance',    '574 Core Olive',                 2799, 3499, 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&h=600&fit=crop&auto=format', null,       false, 'sneakers',      array['7','8','9','10','11']),
  ('air-max-1-sunset',             'Nike',           'Air Max 1 Sunset',               2999, 3499, 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=600&h=600&fit=crop&auto=format', null,       true,  'sneakers',      array['6','7','8','9','10','11']),
  ('air-force-1-shadow-pastel',    'Nike',           'Air Force 1 Shadow Pastel',      3299, 3500, 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&h=600&fit=crop&auto=format', 'NEW',      true,  'sneakers',      array['6','7','8','9']),
  ('air-max-zero-ultramarine',     'Nike',           'Air Max Zero Ultramarine',       2199, 3299, 'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=600&h=600&fit=crop&auto=format', null,       false, 'sneakers',      array['7','8','9','10']),
  ('precision-mid-basketball',     'Nike',           'Precision Mid Basketball Grey',  2699, 3499, 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600&h=600&fit=crop&auto=format', null,       false, 'sports-shoes',  array['8','9','10','11']),
  ('air-force-1-07-wheat',         'Nike',           'Air Force 1 ''07 Wheat',         3299, 3500, 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&h=600&fit=crop&auto=format', null,       false, 'sneakers',      array['6','7','8','9','10','11']),
  ('air-max-colour-block-pack',    'Nike',           'Air Max Colour Block Pack',      3099, 3499, 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&h=600&fit=crop&auto=format', 'SOLD OUT', false, 'sneakers',      array['8','9']),
  ('chronograph-watch-black',      'Diamond Stepss', 'Chronograph Watch Black Leather',1899, 3199, 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=600&h=600&fit=crop&auto=format', null,       true,  'accessories',   array[]::text[]),
  ('steel-dress-watch-silver',     'Diamond Stepss', 'Steel Dress Watch Silver',       2299, 3499, 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&h=600&fit=crop&auto=format', 'NEW',      true,  'accessories',   array[]::text[])
)
insert into public.products (slug, brand, title, price, mrp, image, badge, is_featured, sizes, stock, position)
select s.slug, s.brand, s.title, s.price, s.mrp, s.image, s.badge, s.is_featured, s.sizes,
       case when s.badge = 'SOLD OUT' then 0 else 12 end,
       row_number() over ()
from seed s
on conflict (slug) do update set
  brand = excluded.brand, title = excluded.title, price = excluded.price, mrp = excluded.mrp,
  image = excluded.image, badge = excluded.badge, is_featured = excluded.is_featured,
  sizes = excluded.sizes, stock = excluded.stock;

-- Link each product to its category.
insert into public.product_categories (product_id, category_id)
select p.id, c.id
from (values
  ('free-rn-flyknit-crimson','running-shoes'), ('smash-leather-white','sneakers'),
  ('superrep-go-training-volt','sports-shoes'), ('chuck-taylor-all-star-hi','sneakers'),
  ('air-max-90-white-pink','sneakers'), ('574-core-olive','sneakers'),
  ('air-max-1-sunset','sneakers'), ('air-force-1-shadow-pastel','sneakers'),
  ('air-max-zero-ultramarine','sneakers'), ('precision-mid-basketball','sports-shoes'),
  ('air-force-1-07-wheat','sneakers'), ('air-max-colour-block-pack','sneakers'),
  ('chronograph-watch-black','accessories'), ('steel-dress-watch-silver','accessories')
) as m(pslug, cslug)
join public.products p on p.slug = m.pslug
join public.categories c on c.slug = m.cslug
on conflict do nothing;

-- Primary image as the first gallery slide.
insert into public.product_media (product_id, type, url, alt, position)
select p.id, 'IMAGE', p.image, p.brand || ' ' || p.title, 0
from public.products p
where p.image is not null
  and not exists (select 1 from public.product_media m where m.product_id = p.id);
