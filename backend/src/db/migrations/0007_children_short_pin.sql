-- Add short_pin column to children for /c/:pin short URL redirect
ALTER TABLE children ADD COLUMN short_pin TEXT;
