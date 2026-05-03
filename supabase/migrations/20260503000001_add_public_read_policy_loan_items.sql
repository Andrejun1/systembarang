/*
  # Add Public Read Access for Loan Items

  ## Overview
  Allow anonymous (public) users to read loan_items data without authentication.
  This is necessary for the public catalog to display loan details with all related items.

  ## Changes
  - Add SELECT policy for anon role on loan_items table
*/

-- Allow public (anonymous) users to read loan_items
CREATE POLICY "Public can view all loan_items"
  ON loan_items FOR SELECT
  TO anon
  USING (true);
