import { supabase } from "@/lib/supabase";

export const WELFARE_TECH_IMAGE_BUCKET = "welfare-tech-images";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function extensionFor(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && ["jpg", "jpeg", "png", "webp", "gif"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  switch (file.type) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}

export function validateWelfareTechImage(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) {
    return "Kun JPEG, PNG, WebP og GIF er tillatt.";
  }
  if (file.size > MAX_BYTES) {
    return "Bildet er for stort (maks 5 MB).";
  }
  return null;
}

export async function uploadWelfareTechImage(file: File): Promise<string> {
  const validationError = validateWelfareTechImage(file);
  if (validationError) throw new Error(validationError);

  const path = `${crypto.randomUUID()}.${extensionFor(file)}`;
  const { error } = await supabase.storage.from(WELFARE_TECH_IMAGE_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(WELFARE_TECH_IMAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
