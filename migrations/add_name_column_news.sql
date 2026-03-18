-- Migration to add name column to NEWS and GEBC tables

DO $$
BEGIN
    -- NEWS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='news' AND column_name='name') THEN
        ALTER TABLE NEWS ADD COLUMN name VARCHAR(255);
    END IF;

    -- GEBC
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gebc' AND column_name='name') THEN
        ALTER TABLE GEBC ADD COLUMN name VARCHAR(255);
    END IF;
END $$;
