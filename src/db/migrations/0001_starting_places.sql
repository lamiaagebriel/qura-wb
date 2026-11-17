-- The place types and the first places (the seeds and the app expect them).
INSERT INTO "place_types" ("id", "name") VALUES
	('00000000-0000-4000-8000-000000000001', '{"en":"City","ar":"مدينة"}'),
	('00000000-0000-4000-8000-000000000002', '{"en":"Markaz","ar":"مركز"}'),
	('00000000-0000-4000-8000-000000000003', '{"en":"Village","ar":"قرية"}'),
	('00000000-0000-4000-8000-000000000004', '{"en":"Neighborhood","ar":"حي"}');--> statement-breakpoint
INSERT INTO "places" ("slug", "parent_id", "type_id", "name", "lat", "lng") VALUES
	('aswan', NULL, '00000000-0000-4000-8000-000000000001', '{"en":"Aswan","ar":"أسوان"}', 24.0889, 32.8998),
	('luxor', NULL, '00000000-0000-4000-8000-000000000001', '{"en":"Luxor","ar":"الأقصر"}', 25.6872, 32.6396),
	('qena', NULL, '00000000-0000-4000-8000-000000000001', '{"en":"Qena","ar":"قنا"}', 26.1551, 32.716);--> statement-breakpoint
INSERT INTO "places" ("slug", "parent_id", "type_id", "name", "lat", "lng")
SELECT v.slug, (SELECT "id" FROM "places" WHERE "slug" = 'aswan'), '00000000-0000-4000-8000-000000000002', v.name::jsonb, v.lat, v.lng
FROM (VALUES
	('kom-ombo', '{"en":"Kom Ombo","ar":"كوم أمبو"}', 24.4769, 32.9468),
	('edfu', '{"en":"Edfu","ar":"إدفو"}', 24.9781, 32.8734),
	('daraw', '{"en":"Daraw","ar":"دراو"}', 24.4003, 32.9306),
	('abu-simbel', '{"en":"Abu Simbel","ar":"أبو سمبل"}', 22.3372, 31.6258)
) AS v(slug, name, lat, lng);
