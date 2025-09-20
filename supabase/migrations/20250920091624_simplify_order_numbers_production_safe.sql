-- Migration: Simplify Order Numbers to YYMMDD-NNN format (Production Safe)
-- This migration adds the new functionality without breaking existing data

-- Step 1: Create table to track sequential numbers per drop date
CREATE TABLE IF NOT EXISTS order_sequences (
  drop_date DATE PRIMARY KEY,
  next_sequence INTEGER DEFAULT 1
);

-- Step 2: Replace the generate_order_number function
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

-- Step 3: Add comments for documentation
COMMENT ON FUNCTION generate_order_number(UUID) IS 'Generates sequential order numbers in YYMMDD-NNN format based on drop date';
COMMENT ON TABLE order_sequences IS 'Tracks sequential order numbering per drop date';

-- Note: Keeping order_number as VARCHAR(20) to support existing orders
-- New orders will use the shorter format, existing orders remain unchanged
