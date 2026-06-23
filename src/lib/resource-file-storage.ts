import { supabase } from "@/lib/supabase";

export const RESOURCE_FILES_BUCKET = "resource-files";

const MAX_BYTES = 25 * 1024 * 1024;

const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "ppt", "pptx"];

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.ms-powerpoint", // .ppt
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
]);

// Value for an <input type="file"> accept attribute.
export const RESOURCE_FILE_ACCEPT = [
  ".pdf",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ...ALLOWED_TYPES,
].join(",");

function extensionFor(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && ALLOWED_EXTENSIONS.includes(fromName)) return fromName;
  switch (file.type) {
    case "application/pdf":
      return "pdf";
    case "application/msword":
      return "doc";
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return "docx";
    case "application/vnd.ms-powerpoint":
      return "ppt";
    case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      return "pptx";
    default:
      return "bin";
  }
}

export function validateResourceFile(file: File): string | null {
  // Browsers sometimes report an empty MIME type, so accept by extension too.
  const ext = file.name.split(".").pop()?.toLowerCase();
  const allowed = ALLOWED_TYPES.has(file.type) || (ext != null && ALLOWED_EXTENSIONS.includes(ext));
  if (!allowed) {
    return "Kun PDF, Word (.doc/.docx) og PowerPoint (.ppt/.pptx) er tillatt.";
  }
  if (file.size > MAX_BYTES) {
    return "Filen er for stor (maks 25 MB).";
  }
  return null;
}

export async function uploadResourceFile(file: File): Promise<string> {
  const validationError = validateResourceFile(file);
  if (validationError) throw new Error(validationError);

  const path = `${crypto.randomUUID()}.${extensionFor(file)}`;
  const { error } = await supabase.storage.from(RESOURCE_FILES_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "application/octet-stream",
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(RESOURCE_FILES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
