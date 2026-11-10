-- Create the newsletter_subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (subscribe)
CREATE POLICY "Anyone can subscribe to the newsletter." 
    ON newsletter_subscribers FOR INSERT 
    WITH CHECK (true);

-- Policy: Only authenticated admins can view (assuming we might add an admin role later, for now just restrict read access)
-- If you want to read this via the dashboard, you can always bypass RLS as a super admin.
CREATE POLICY "Nobody can read subscribers via API." 
    ON newsletter_subscribers FOR SELECT 
    USING (false);
