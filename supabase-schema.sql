-- Supabase Database Schema for Doctor Who Library
-- Run this in your Supabase SQL editor to create the necessary tables

-- Create user_favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    library_item_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, library_item_id)
);

-- Create user_watch_history table
CREATE TABLE IF NOT EXISTS user_watch_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    library_item_id TEXT NOT NULL,
    watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    progress INTEGER DEFAULT 100 CHECK (progress >= 0 AND progress <= 100),
    UNIQUE(user_id, library_item_id)
);

-- Enable Row Level Security
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_watch_history ENABLE ROW LEVEL SECURITY;

-- Create policies for user_favorites
CREATE POLICY "Users can view their own favorites" ON user_favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites" ON user_favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" ON user_favorites
    FOR DELETE USING (auth.uid() = user_id);

-- Create policies for user_watch_history
CREATE POLICY "Users can view their own watch history" ON user_watch_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own watch history" ON user_watch_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own watch history" ON user_watch_history
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watch history" ON user_watch_history
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS user_favorites_user_id_idx ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS user_favorites_library_item_id_idx ON user_favorites(library_item_id);
CREATE INDEX IF NOT EXISTS user_watch_history_user_id_idx ON user_watch_history(user_id);
CREATE INDEX IF NOT EXISTS user_watch_history_library_item_id_idx ON user_watch_history(library_item_id);
CREATE INDEX IF NOT EXISTS user_watch_history_watched_at_idx ON user_watch_history(watched_at);

-- Create a function to handle upsert for watch history
CREATE OR REPLACE FUNCTION upsert_watch_history(
    p_user_id UUID,
    p_library_item_id TEXT,
    p_progress INTEGER DEFAULT 100
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_watch_history (user_id, library_item_id, progress, watched_at)
    VALUES (p_user_id, p_library_item_id, p_progress, NOW())
    ON CONFLICT (user_id, library_item_id)
    DO UPDATE SET 
        progress = EXCLUDED.progress,
        watched_at = EXCLUDED.watched_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;