import { createServerFn } from "@tanstack/react-start";

export type Creds = { username: string; password: string };

export type ProgramRow = {
  id: string;
  name: string;
  description: string | null;
  passcode: string;
  allowed_extensions: string[];
  created_at: string;
};

export type FileRow = {
  id: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  storage_path: string;
  created_at: string;
};

export type SubmissionRow = FileRow & {
  chest_no: string;
  program_id: string;
  program_name: string;
};

type UploadInput = {
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  storage_path: string;
};

const ADMIN_USERNAME = "ADMIN-THAMASSUK";
const ADMIN_PASSWORD = "1234";

function assertAdmin(creds: Creds) {
  if (creds?.username !== ADMIN_USERNAME || creds?.password !== ADMIN_PASSWORD) {
    throw new Error("Unauthorized");
  }
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function normalizeExtensions(list: string[]): string[] {
  return Array.from(
    new Set(
      list
        .map((e) => e.trim().toLowerCase().replace(/^\.*/, ""))
        .filter(Boolean)
        .map((e) => `.${e}`),
    ),
  );
}

function extensionOf(name: string) {
  const idx = name.lastIndexOf(".");
  return idx === -1 ? "" : name.slice(idx).toLowerCase();
}

/* ---------------- Admin ---------------- */

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((d: Creds) => d)
  .handler(async ({ data }) => {
    assertAdmin(data);
    return { ok: true };
  });

export const adminListPrograms = createServerFn({ method: "POST" })
  .inputValidator((d: Creds) => d)
  .handler(async ({ data }) => {
    assertAdmin(data);
    const db = await admin();
    const { data: rows, error } = await db
      .from("programs")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []) as ProgramRow[];
  });

export const adminSaveProgram = createServerFn({ method: "POST" })
  .inputValidator(
    (d: Creds & {
      id?: string;
      name: string;
      description: string;
      passcode: string;
      allowed_extensions: string[];
    }) => d,
  )
  .handler(async ({ data }) => {
    assertAdmin(data);
    const db = await admin();
    const payload = {
      name: data.name.trim(),
      description: data.description.trim() || null,
      passcode: data.passcode.trim(),
      allowed_extensions: normalizeExtensions(data.allowed_extensions),
    };
    if (!payload.name) throw new Error("Program name is required");
    if (!payload.passcode) throw new Error("Passcode is required");

    if (data.id) {
      const { error } = await db.from("programs").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await db.from("programs").insert(payload).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

export const adminDeleteProgram = createServerFn({ method: "POST" })
  .inputValidator((d: Creds & { id: string }) => d)
  .handler(async ({ data }) => {
    assertAdmin(data);
    const db = await admin();
    const { error } = await db.from("programs").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListMaterials = createServerFn({ method: "POST" })
  .inputValidator((d: Creds & { program_id: string }) => d)
  .handler(async ({ data }) => {
    assertAdmin(data);
    const db = await admin();
    const { data: rows, error } = await db
      .from("materials")
      .select("*")
      .eq("program_id", data.program_id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []) as FileRow[];
  });

export const adminAddMaterials = createServerFn({ method: "POST" })
  .inputValidator((d: Creds & { program_id: string; files: UploadInput[] }) => d)
  .handler(async ({ data }) => {
    assertAdmin(data);
    const db = await admin();
    const { error } = await db
      .from("materials")
      .insert(data.files.map((f) => ({ ...f, program_id: data.program_id })));
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteMaterial = createServerFn({ method: "POST" })
  .inputValidator((d: Creds & { id: string; storage_path: string }) => d)
  .handler(async ({ data }) => {
    assertAdmin(data);
    const db = await admin();
    await db.storage.from("program-materials").remove([data.storage_path]);
    const { error } = await db.from("materials").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListSubmissions = createServerFn({ method: "POST" })
  .inputValidator((d: Creds) => d)
  .handler(async ({ data }) => {
    assertAdmin(data);
    const db = await admin();
    const { data: rows, error } = await db
      .from("submissions")
      .select("*, programs(name)")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r) => {
      const { programs, ...rest } = r as typeof r & { programs: { name: string } | null };
      return { ...rest, program_name: programs?.name ?? "—" };
    }) as SubmissionRow[];
  });

export const adminDeleteSubmission = createServerFn({ method: "POST" })
  .inputValidator((d: Creds & { id: string; storage_path: string }) => d)
  .handler(async ({ data }) => {
    assertAdmin(data);
    const db = await admin();
    await db.storage.from("program-submissions").remove([data.storage_path]);
    const { error } = await db.from("submissions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminFileUrl = createServerFn({ method: "POST" })
  .inputValidator((d: Creds & { bucket: string; path: string }) => d)
  .handler(async ({ data }) => {
    assertAdmin(data);
    if (data.bucket !== "program-materials" && data.bucket !== "program-submissions") {
      throw new Error("Unknown bucket");
    }
    const db = await admin();
    const { data: signed, error } = await db.storage
      .from(data.bucket)
      .createSignedUrl(data.path, 60 * 10, { download: true });
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });

/* ---------------- Public ---------------- */

export const listProgramOptions = createServerFn({ method: "GET" }).handler(async () => {
  const db = await admin();
  const { data, error } = await db
    .from("programs")
    .select("id, name, allowed_extensions")
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as { id: string; name: string; allowed_extensions: string[] }[];
});

export const accessProgram = createServerFn({ method: "POST" })
  .inputValidator((d: { passcode: string }) => d)
  .handler(async ({ data }) => {
    const code = data.passcode.trim();
    if (!code) return { ok: false as const };
    const db = await admin();
    const { data: program } = await db
      .from("programs")
      .select("id, name, description")
      .eq("passcode", code)
      .maybeSingle();
    if (!program) return { ok: false as const };

    const { data: materials } = await db
      .from("materials")
      .select("*")
      .eq("program_id", program.id)
      .order("created_at", { ascending: false });

    const withUrls = await Promise.all(
      (materials ?? []).map(async (m) => {
        const { data: signed } = await db.storage
          .from("program-materials")
          .createSignedUrl(m.storage_path, 60 * 60);
        return {
          id: m.id as string,
          file_name: m.file_name as string,
          file_type: m.file_type as string | null,
          file_size: m.file_size as number | null,
          url: signed?.signedUrl ?? null,
        };
      }),
    );

    return { ok: true as const, program, materials: withUrls };
  });

export const submitProgramFiles = createServerFn({ method: "POST" })
  .inputValidator((d: { chest_no: string; program_id: string; files: UploadInput[] }) => d)
  .handler(async ({ data }) => {
    const chest = data.chest_no.trim().toUpperCase();
    if (!chest) throw new Error("Chest No. is required");
    if (!data.program_id) throw new Error("Please select a program");
    if (!data.files.length) throw new Error("Please upload at least one file");

    const db = await admin();
    const { data: program, error: pErr } = await db
      .from("programs")
      .select("id, allowed_extensions")
      .eq("id", data.program_id)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!program) throw new Error("Program not found");

    const allowed = (program.allowed_extensions ?? []) as string[];
    if (allowed.length) {
      for (const f of data.files) {
        if (!allowed.includes(extensionOf(f.file_name))) {
          throw new Error(`File type not allowed: ${f.file_name}`);
        }
      }
    }

    const { error } = await db
      .from("submissions")
      .insert(data.files.map((f) => ({ ...f, chest_no: chest, program_id: data.program_id })));
    if (error) throw new Error(error.message);
    return { ok: true };
  });
