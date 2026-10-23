insert into public.suppliers (id, business_name, slug, short_bio, status, verified_at) values
  ('10000000-0000-4000-8000-000000000001', '[SAMPLE] Singh Cloth House', 'singh-cloth-house', 'Heavy cottons and dependable campus layers.', 'approved', now()),
  ('10000000-0000-4000-8000-000000000002', '[SAMPLE] Bhatia Studio', 'bhatia-studio', 'Small-run shirts and thoughtful finishing.', 'approved', now()),
  ('10000000-0000-4000-8000-000000000003', '[SAMPLE] Gupta Garments', 'gupta-garments', 'Workwear bottoms and everyday utility pieces.', 'approved', now()),
  ('10000000-0000-4000-8000-000000000004', '[SAMPLE] North Loom', 'north-loom', 'Knits, jersey and canvas essentials.', 'approved', now());

insert into public.categories (id, name, slug, description, sort_order) values
  ('20000000-0000-4000-8000-000000000001', 'Layers', 'layers', 'Outer pieces for early classes, late walks and the rooms between.', 1),
  ('20000000-0000-4000-8000-000000000002', 'Shirts', 'shirts', 'Relaxed structure, useful pockets and cloth that gets better with wear.', 2),
  ('20000000-0000-4000-8000-000000000003', 'Bottoms', 'bottoms', 'Room to move, honest fabric and silhouettes made for long campus days.', 3),
  ('20000000-0000-4000-8000-000000000004', 'Essentials', 'essentials', 'The dependable pieces that earn the front of the wardrobe.', 4);

insert into public.products
  (id, supplier_id, category_id, name, slug, description, fabric, care, price_paise, compare_at_paise, status, is_featured, palette, popularity, released_at)
values
  ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Gate Seven Hoodie', 'gate-seven-hoodie', 'Dense loopback hoodie with a generous hood.', '420 GSM cotton-rich loopback fleece', 'Cold wash inside out. Dry flat.', 129900, 149900, 'live', true, 'charcoal', 96, '2026-10-18'),
  ('30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'Lecture Hall Overshirt', 'lecture-hall-overshirt', 'Straight-cut overshirt with two working pockets.', 'Mid-weight cotton twill', 'Machine wash cold.', 99900, null, 'live', true, 'clay', 91, '2026-10-12'),
  ('30000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000003', '2AM Cargo', 'two-am-cargo', 'Relaxed cargo trousers with deep pockets.', 'Cotton ripstop', 'Cold wash. Line dry.', 149900, null, 'live', true, 'moss', 98, '2026-10-15'),
  ('30000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000004', 'Everyday Heavy Tee', 'everyday-heavy-tee', 'Compact cotton tee with a firm collar.', '240 GSM cotton jersey', 'Cold wash inside out.', 59900, null, 'live', true, 'paper', 89, '2026-10-09'),
  ('30000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'Studio Knit Polo', 'studio-knit-polo', 'Open-collar knit polo with a soft hand.', 'Cotton-viscose knit', 'Hand wash cool.', 119900, 134900, 'live', false, 'blue', 82, '2026-10-05'),
  ('30000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Platform Chore Jacket', 'platform-chore-jacket', 'Three-pocket chore layer in sturdy twill.', 'Cotton canvas twill', 'Machine wash cold.', 169900, null, 'live', false, 'indigo', 86, '2026-09-28'),
  ('30000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000003', 'North Gate Denim', 'north-gate-denim', 'Straight five-pocket jean with a gentle taper.', '12 oz cotton denim', 'Wash sparingly.', 139900, null, 'live', false, 'denim', 93, '2026-09-22'),
  ('30000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000002', 'Corridor Rugby Shirt', 'corridor-rugby-shirt', 'Substantial striped jersey with a woven collar.', '300 GSM cotton jersey', 'Cold wash.', 109900, null, 'live', false, 'wine', 79, '2026-09-18'),
  ('30000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Library Quarter Zip', 'library-quarter-zip', 'High-neck quarter zip with brushed interior.', '360 GSM brushed fleece', 'Cold gentle wash.', 139900, null, 'live', false, 'stone', 88, '2026-10-20'),
  ('30000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000003', 'Common Room Jogger', 'common-room-jogger', 'Clean jogger with a relaxed thigh.', '330 GSM cotton-poly interlock', 'Machine wash cold.', 89900, null, 'live', false, 'graphite', 84, '2026-09-14'),
  ('30000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000004', 'Workshop Tote', 'workshop-tote', 'Reinforced carry-all sized for a laptop.', '14 oz cotton canvas', 'Spot clean.', 49900, null, 'live', false, 'ochre', 76, '2026-09-08'),
  ('30000000-0000-4000-8000-000000000012', '10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000004', 'Canteen Cap', 'canteen-cap', 'Low-profile six-panel cap.', 'Washed cotton twill', 'Spot clean.', 39900, null, 'live', false, 'signal', 73, '2026-09-01');

insert into public.product_variants (id, product_id, size, colour, colour_hex, sku, stock_qty) values
  ('40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'M', 'Coal', '#292a27', 'PBU-HOOD-COAL-M', 5),
  ('40000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', 'L', 'Brick', '#8f4634', 'PBU-HOOD-BRICK-L', 1),
  ('40000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000002', 'M', 'Clay', '#a65f45', 'PBU-OVER-CLAY-M', 5),
  ('40000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000002', 'XL', 'Ink', '#283137', 'PBU-OVER-INK-XL', 0),
  ('40000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000003', '32', 'Moss', '#566451', 'PBU-CARGO-MOSS-32', 5),
  ('40000000-0000-4000-8000-000000000006', '30000000-0000-4000-8000-000000000003', '28', 'Black', '#1c1d1b', 'PBU-CARGO-BLACK-28', 0),
  ('40000000-0000-4000-8000-000000000007', '30000000-0000-4000-8000-000000000004', 'M', 'Bone', '#e6dfd1', 'PBU-TEE-BONE-M', 8),
  ('40000000-0000-4000-8000-000000000008', '30000000-0000-4000-8000-000000000004', 'L', 'Night', '#232421', 'PBU-TEE-NIGHT-L', 3),
  ('40000000-0000-4000-8000-000000000009', '30000000-0000-4000-8000-000000000005', 'M', 'Petrol', '#31525b', 'PBU-POLO-PETROL-M', 4),
  ('40000000-0000-4000-8000-000000000010', '30000000-0000-4000-8000-000000000005', 'XL', 'Sand', '#bda98a', 'PBU-POLO-SAND-XL', 0),
  ('40000000-0000-4000-8000-000000000011', '30000000-0000-4000-8000-000000000006', 'M', 'Indigo', '#34424c', 'PBU-CHORE-INDIGO-M', 3),
  ('40000000-0000-4000-8000-000000000012', '30000000-0000-4000-8000-000000000006', 'S', 'Tobacco', '#8b5a3d', 'PBU-CHORE-TOBACCO-S', 0),
  ('40000000-0000-4000-8000-000000000013', '30000000-0000-4000-8000-000000000007', '32', 'Rinse', '#263d56', 'PBU-DENIM-RINSE-32', 5),
  ('40000000-0000-4000-8000-000000000014', '30000000-0000-4000-8000-000000000007', '28', 'Washed', '#61768a', 'PBU-DENIM-WASHED-28', 0),
  ('40000000-0000-4000-8000-000000000015', '30000000-0000-4000-8000-000000000008', 'M', 'Wine', '#6d3439', 'PBU-RUGBY-WINE-M', 3),
  ('40000000-0000-4000-8000-000000000016', '30000000-0000-4000-8000-000000000008', 'XL', 'Forest', '#33483a', 'PBU-RUGBY-FOREST-XL', 0),
  ('40000000-0000-4000-8000-000000000017', '30000000-0000-4000-8000-000000000009', 'M', 'Stone', '#9b9589', 'PBU-ZIP-STONE-M', 5),
  ('40000000-0000-4000-8000-000000000018', '30000000-0000-4000-8000-000000000009', 'XS', 'Coal', '#292a27', 'PBU-ZIP-COAL-XS', 0),
  ('40000000-0000-4000-8000-000000000019', '30000000-0000-4000-8000-000000000010', 'M', 'Graphite', '#4a4b48', 'PBU-JOG-GRAPHITE-M', 6),
  ('40000000-0000-4000-8000-000000000020', '30000000-0000-4000-8000-000000000010', 'XL', 'Navy', '#293343', 'PBU-JOG-NAVY-XL', 0),
  ('40000000-0000-4000-8000-000000000021', '30000000-0000-4000-8000-000000000011', 'One size', 'Ochre', '#b47a32', 'PBU-TOTE-OCHRE', 8),
  ('40000000-0000-4000-8000-000000000022', '30000000-0000-4000-8000-000000000011', 'One size', 'Ink', '#283137', 'PBU-TOTE-INK', 6),
  ('40000000-0000-4000-8000-000000000023', '30000000-0000-4000-8000-000000000012', 'One size', 'Signal', '#c8431e', 'PBU-CAP-SIGNAL', 0),
  ('40000000-0000-4000-8000-000000000024', '30000000-0000-4000-8000-000000000012', 'One size', 'Black', '#1c1d1b', 'PBU-CAP-BLACK', 0);

insert into public.product_images (product_id, url, alt_text, sort_order)
select id, '/sample-assets/' || slug || '-01.webp', 'Sample front view of ' || name, 1 from public.products;

insert into public.reviews (product_id, reviewer_name, rating, body, verified_purchase, status) values
  ('30000000-0000-4000-8000-000000000001', 'Aarav K.', 5, 'Heavy without feeling stiff. The hood sits properly.', true, 'published'),
  ('30000000-0000-4000-8000-000000000003', 'Mehak S.', 5, 'The waist adjuster and pocket depth are genuinely useful.', true, 'published');
