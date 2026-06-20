-- Allow anon read on stays table
ALTER TABLE stays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_stays" ON stays FOR SELECT USING (true);
