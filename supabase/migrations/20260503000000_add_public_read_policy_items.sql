/*
  # Add Public Read Access for Items

  ## Overview
  Allow anonymous (public) users to read item data without authentication.
  This enables the public catalog dashboard at / to display available items.

  ## Changes
  - Add SELECT policy for anon role on items table
*/

-- Allow public (anonymous) users to read items
CREATE POLICY "Public can view all items"
  ON items FOR SELECT
  TO anon
  USING (true);
