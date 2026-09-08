import { supabase } from "@/integrations/supabase/client";

export type UploadedFile = {
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  storage_path: string;
};

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
}

export async function uploadFiles(
  bucket: "program-materials" | "program-submissions",
  folder: string,
  files: File[],
): Promise<UploadedFile[]> {
  const out: UploadedFile[] = [];
  for (const file of files) {
    const path = `${folder}/${crypto.randomUUID()}-${safeName(file.name)}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw new Error(`Upload failed for ${file.name}: ${error.message}`);
    out.push({
      file_name: file.name,
      file_type: file.type || null,
      file_size: file.size,
      storage_path: path,
    });
  }
  return out;
}

export function formatSize(bytes: number | null) {
  if (!bytes && bytes !== 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function extensionOf(name: string) {
  const idx = name.lastIndexOf(".");
  return idx === -1 ? "" : name.slice(idx).toLowerCase();
}
