-- Update empty GEBC image fields for seeded rows to usable Twemoji URLs
DO $$
DECLARE
  sc RECORD;
  r RECORD;
  arr TEXT[];
  i INT;
  idx INT;
  base TEXT := 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/';
  emotions TEXT[] := ARRAY['1f60a','1f602','1f622','1f609','1f60d','1f914','1f60c','1f973','1f60e','2764'];
  thoughts TEXT[] := ARRAY['1f4ad','1f4ac','1f4a1','1f50d','1f4dd','1f4ca','1f4c4','1f9e0','1f50e','1f9fd'];
  actions TEXT[] := ARRAY['1f44a','1f44b','1f3c3','1f3c4','1f4aa','270a','270b','1f3c5','1f3c6','1f525'];
  objects TEXT[] := ARRAY['1f4b0','1f4a1','1f6cd','1f4bb','1f3e0','1f381','1f4e6','1f4f1','1f4da','1f50b'];
BEGIN
  FOR sc IN SELECT id, name FROM gebc_sub_category WHERE id IN (SELECT DISTINCT sub_category FROM gebc WHERE image = '' OR image IS NULL AND description LIKE 'Sample %') LOOP
    IF lower(sc.name) LIKE 'emotions%' THEN
      arr := emotions;
    ELSIF lower(sc.name) LIKE 'thought%' THEN
      arr := thoughts;
    ELSIF lower(sc.name) LIKE 'action%' THEN
      arr := actions;
    ELSIF lower(sc.name) LIKE 'object%' THEN
      arr := objects;
    ELSE
      arr := emotions; -- fallback
    END IF;

    i := 0;
    FOR r IN SELECT id FROM gebc WHERE sub_category = sc.id AND (image = '' OR image IS NULL) AND description LIKE 'Sample %' ORDER BY id LOOP
      i := i + 1;
      idx := ((i - 1) % array_length(arr,1)) + 1;
      UPDATE gebc SET image = base || arr[idx] || '.png', updated_at = NOW() WHERE id = r.id;
    END LOOP;
  END LOOP;
END$$;
