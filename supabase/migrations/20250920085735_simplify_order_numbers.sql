-- Migration: Simplify Order Numbers to YYMMDD-NNN format
-- This migration changes order numbers from ORD-YYYYMMDD-XXXX to YYMMDD-NNN

-- Step 1: Create table to track sequential numbers per drop date
CREATE TABLE order_sequences (
  drop_date DATE PRIMARY KEY,
  next_sequence INTEGER DEFAULT 1
);

-- Step 2: Update the order_number column size (optional optimization)
-- From VARCHAR(20) to VARCHAR(10) since YYMMDD-NNN = 10 characters max
ALTER TABLE orders ALTER COLUMN order_number TYPE VARCHAR(10);

-- Step 3: Replace the generate_order_number function
-- New function takes drop_id parameter and uses drop date + sequential numbering
CREATE OR REPLACE FUNCTION generate_order_number(p_drop_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_drop_date DATE;
  v_sequence_num INTEGER;
  v_formatted_date TEXT;
BEGIN
  -- Get the drop date from the drops table
  SELECT d.date INTO v_drop_date FROM drops d WHERE d.id = p_drop_id;
  
  -- Handle case where drop_id doesn't exist
  IF v_drop_date IS NULL THEN
    RAISE EXCEPTION 'Drop with id % not found', p_drop_id;
  END IF;
  
  -- Get and increment sequence for this date
  -- Uses INSERT ... ON CONFLICT to handle concurrent access safely
  INSERT INTO order_sequences (drop_date, next_sequence) 
  VALUES (v_drop_date, 2)
  ON CONFLICT (drop_date) 
  DO UPDATE SET next_sequence = order_sequences.next_sequence + 1
  RETURNING (next_sequence - 1) INTO v_sequence_num;
  
  -- Format: YYMMDD-NNN (e.g., 250920-001)
  v_formatted_date := TO_CHAR(v_drop_date, 'YYMMDD');
  RETURN v_formatted_date || '-' || LPAD(v_sequence_num::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Step 4: Add comment for documentation
COMMENT ON FUNCTION generate_order_number(UUID) IS 'Generates sequential order numbers in YYMMDD-NNN format based on drop date';
COMMENT ON TABLE order_sequences IS 'Tracks sequential order numbering per drop date';
