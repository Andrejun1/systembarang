/*
  # Add Public Read Access for Loans

  ## Overview
  Allow anonymous (public) users to read loan data without authentication.
  This enables the public dashboard at / and detail pages at /detail/[kode].

  ## Changes
  - Add SELECT policy for anon role on loans table
*/

-- Allow public (anonymous) users to read loans
CREATE POLICY "Public can view all loans"
  ON loans FOR SELECT
  TO anon
  USING (true);
