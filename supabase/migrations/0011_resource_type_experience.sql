-- Add the "experience" (Erfaring) resource type used in the app code
-- (ResourceType in src/lib/types.ts) but missing from the database enum.

ALTER TYPE public.resource_type ADD VALUE IF NOT EXISTS 'experience';
