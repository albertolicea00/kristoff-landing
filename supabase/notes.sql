-- Supabase SQL: Create tables for floating notes + editable bio
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard

-- Notes table (for floating comments on hero)
CREATE TABLE IF NOT EXISTS notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL CHECK (char_length(text) <= 80 AND char_length(text) >= 2),
  username TEXT DEFAULT NULL CHECK (username IS NULL OR char_length(username) <= 20),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read notes" ON notes
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert notes" ON notes
  FOR INSERT WITH CHECK (true);

CREATE INDEX idx_notes_created_at ON notes(created_at DESC);

-- Bio table (editable "Sobre Kristoff" section)
CREATE TABLE IF NOT EXISTS bio (
  id INT DEFAULT 1 PRIMARY KEY CHECK (id = 1),
  content TEXT NOT NULL DEFAULT 'Kristoff Kriollo (Christopher Gómez para los trámites) es el Alto Comisionado de los Problemas Cubanos™: especialista en convertir traumas nacionales en chistes y chistes en traumas nuevos.',
  last_edited_at TIMESTAMPTZ DEFAULT now(),
  last_editor_ip TEXT DEFAULT NULL
);

ALTER TABLE bio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read bio" ON bio
  FOR SELECT USING (true);

CREATE POLICY "Anyone can update bio" ON bio
  FOR UPDATE USING (true)
  WITH CHECK (true);

-- Insert default bio row
INSERT INTO bio (id, content) VALUES (1, 'Kristoff Kriollo (Christopher Gómez para los trámites) es el Alto Comisionado de los Problemas Cubanos™: especialista en convertir traumas nacionales en chistes y chistes en traumas nuevos.')
ON CONFLICT (id) DO NOTHING;
