/*
  # Add Attachment Support to Sequences

  1. Changes
    - Add attachments column to sequences table to store image URLs and file attachments
    
  2. Purpose
    - Allow users to attach images and files to email sequences
    - Store as JSONB array with format: [{"type": "image|file", "url": "...", "name": "..."}]
    
  3. Notes
    - Attachments are optional
    - URLs can be external or uploaded to storage
*/

ALTER TABLE sequences 
  ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN sequences.attachments IS 'Array of attachments: [{"type": "image|file", "url": "...", "name": "..."}]';
