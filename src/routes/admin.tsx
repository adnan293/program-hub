import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  ArrowLeft,
  Download,
  FilePlus2,
  LogOut,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import {
  adminAddMaterials,
  adminDeleteMaterial,
  adminDeleteProgram,
  adminDeleteSubmission,
  adminFileUrl,
  adminListMaterials,
  adminListPrograms,
  adminListSubmissions,
  adminLogin,
  adminSaveProgram,
  type Creds,
  type FileRow,
  type ProgramRow,
  type SubmissionRow,
} from "@/lib/app.functions";
import { formatSize, uploadFiles } from "@/lib/upload";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — Thamassuk Program Portal" },
      { name: "description", content: "Manage programs, materials and submitted files." },
      { property: "og:title", content: "Admin Panel" },
      { property: "og:description", content: "Manage programs, materials and submitted files." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const STORE_KEY = "thm_admin";
const inputCls =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring";

function AdminPage() {
  const [creds, setCreds] = useState<Creds | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(STORE_KEY);
    if (raw) {
      try {
        setCreds(JSON.parse(raw) as Creds);
      } catch {
        sessionStorage.removeItem(STORE_KEY);
      }
    }
  }, []);

  if (!creds)
    return (
      <LoginView
        onSuccess={(c) => {
          sessionStorage.setItem(STORE_KEY, JSON.stringify(c));
          setCreds(c);
        }}
      />
    );

  return (
    <Dashboard
      creds={creds}
      onLogout={() => {
        sessionStorage.removeItem(STORE_KEY);
        setCreds(null);
      }}
    />
  );
}

function LoginView({ onSuccess }: { onSuccess: (c: Creds) => void }) {
  const login = useServerFn(adminLogin);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login({ data: { username, password } });
      onSuccess({ username, password });
    } catch {
      setError("Invalid username or password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <form onSubmit={onSubmit} className="surface-card mt-4 space-y-4 p-6">
          <h1 className="text-xl font-bold">Admin Login</h1>
          <div>
            <label className="text-sm font-medium">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`mt-1.5 ${inputCls}`}
              autoComplete="username"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`mt-1.5 ${inputCls}`}
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-sm font-medium text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="h-11 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}

type Tab = "programs" | "submissions";

function Dashboard({ creds, onLogout }: { creds: Creds; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("programs");

  return (
    <main className="min-h-screen bg-background">
      <header className="hero-gradient px-4 py-6 text-primary-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] opacity-80">Admin Panel</p>
            <h1 className="text-xl font-bold">Program Portal</h1>
          </div>
          <button
            onClick={onLogout}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-primary-foreground/30 px-3 text-sm font-medium hover:bg-primary-foreground/10"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="inline-flex rounded-lg border border-border bg-card p-1">
          {(["programs", "submissions"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-md px-4 py-2 text-sm font-medium capitalize transition-colors ${
                tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {t === "programs" ? "Programs & Materials" : "Submitted Files"}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === "programs" ? (
            <ProgramsTab creds={creds} />
          ) : (
            <SubmissionsTab creds={creds} />
          )}
        </div>
      </div>
    </main>
  );
}

/* ---------------- Programs ---------------- */

const emptyForm = { id: "", name: "", description: "", passcode: "", extensions: "" };

function ProgramsTab({ creds }: { creds: Creds }) {
  const list = useServerFn(adminListPrograms);
  const save = useServerFn(adminSaveProgram);
  const del = useServerFn(adminDeleteProgram);

  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    list({ data: creds })
      .then(setPrograms)
      .catch(() => toast.error("Could not load programs"));
  }, [list, creds]);

  useEffect(refresh, [refresh]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await save({
        data: {
          ...creds,
          ...(form.id ? { id: form.id } : {}),
          name: form.name,
          description: form.description,
          passcode: form.passcode,
          allowed_extensions: form.extensions.split(",").filter((s) => s.trim()),
        },
      });
      toast.success(form.id ? "Program updated" : "Program created");
      setForm(emptyForm);
      setShowForm(false);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save program");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(p: ProgramRow) {
    if (!confirm(`Delete "${p.name}" and all its materials and submissions?`)) return;
    try {
      await del({ data: { ...creds, id: p.id } });
      toast.success("Program deleted");
      refresh();
    } catch {
      toast.error("Could not delete program");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Programs ({programs.length})</h2>
        <button
          onClick={() => {
            setForm(emptyForm);
            setShowForm((s) => !s);
          }}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Close" : "Add Program"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={onSave} className="surface-card grid gap-4 p-6 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Program name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`mt-1.5 ${inputCls}`}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Passcode</label>
            <input
              value={form.passcode}
              onChange={(e) => setForm({ ...form, passcode: e.target.value })}
              className={`mt-1.5 ${inputCls}`}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="mt-1.5 w-full rounded-lg border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Allowed submission file types</label>
            <input
              value={form.extensions}
              onChange={(e) => setForm({ ...form, extensions: e.target.value })}
              placeholder=".pdf, .psd, .docx, .jpg"
              className={`mt-1.5 ${inputCls}`}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Comma separated. Leave empty to allow any file type.
            </p>
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={busy}
              className="h-11 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {busy ? "Saving…" : form.id ? "Update program" : "Create program"}
            </button>
          </div>
        </form>
      )}

      {programs.length === 0 && (
        <p className="surface-card p-6 text-sm text-muted-foreground">No programs yet.</p>
      )}

      {programs.map((p) => (
        <div key={p.id} className="surface-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base font-semibold">{p.name}</h3>
              {p.description && (
                <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="rounded-md bg-secondary px-2 py-1 font-medium">
                  Passcode: {p.passcode}
                </span>
                <span className="rounded-md bg-accent px-2 py-1 font-medium text-accent-foreground">
                  {p.allowed_extensions.length
                    ? p.allowed_extensions.join(", ")
                    : "Any file type"}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setForm({
                    id: p.id,
                    name: p.name,
                    description: p.description ?? "",
                    passcode: p.passcode,
                    extensions: p.allowed_extensions.join(", "),
                  });
                  setShowForm(true);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-input px-3 text-sm hover:bg-secondary"
              >
                <Pencil className="h-4 w-4" /> Edit
              </button>
              <button
                onClick={() => onDelete(p)}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-destructive/40 px-3 text-sm text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          </div>

          <button
            onClick={() => setOpenId(openId === p.id ? null : p.id)}
            className="mt-4 text-sm font-semibold text-primary"
          >
            {openId === p.id ? "Hide materials" : "Manage materials"}
          </button>

          {openId === p.id && <Materials creds={creds} programId={p.id} />}
        </div>
      ))}
    </div>
  );
}

function Materials({ creds, programId }: { creds: Creds; programId: string }) {
  const list = useServerFn(adminListMaterials);
  const add = useServerFn(adminAddMaterials);
  const del = useServerFn(adminDeleteMaterial);
  const fileUrl = useServerFn(adminFileUrl);

  const [rows, setRows] = useState<FileRow[]>([]);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    list({ data: { ...creds, program_id: programId } })
      .then(setRows)
      .catch(() => toast.error("Could not load materials"));
  }, [list, creds, programId]);

  useEffect(refresh, [refresh]);

  async function onUpload(fileList: FileList | null) {
    if (!fileList?.length) return;
    setBusy(true);
    try {
      const uploaded = await uploadFiles("program-materials", programId, Array.from(fileList));
      await add({ data: { ...creds, program_id: programId, files: uploaded } });
      toast.success("Materials uploaded");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function open(path: string) {
    try {
      const { url } = await fileUrl({
        data: { ...creds, bucket: "program-materials", path },
      });
      window.open(url, "_blank");
    } catch {
      toast.error("Could not open file");
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-border bg-secondary/30 p-4">
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-input bg-card px-4 py-2 text-sm font-medium hover:bg-secondary">
        <FilePlus2 className="h-4 w-4" />
        {busy ? "Uploading…" : "Upload materials"}
        <input
          type="file"
          multiple
          disabled={busy}
          className="hidden"
          onChange={(e) => {
            onUpload(e.target.files);
            e.target.value = "";
          }}
        />
      </label>

      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No materials uploaded yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {rows.map((m) => (
            <li key={m.id} className="flex items-center gap-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{m.file_name}</p>
                <p className="text-xs text-muted-foreground">{formatSize(m.file_size)}</p>
              </div>
              <button
                onClick={() => open(m.storage_path)}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-input bg-card px-2.5 text-xs font-medium"
              >
                <Download className="h-3.5 w-3.5" /> Download
              </button>
              <button
                onClick={async () => {
                  if (!confirm(`Delete ${m.file_name}?`)) return;
                  await del({ data: { ...creds, id: m.id, storage_path: m.storage_path } });
                  refresh();
                }}
                className="text-muted-foreground hover:text-destructive"
                aria-label={`Delete ${m.file_name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------------- Submissions ---------------- */

function SubmissionsTab({ creds }: { creds: Creds }) {
  const list = useServerFn(adminListSubmissions);
  const del = useServerFn(adminDeleteSubmission);
  const fileUrl = useServerFn(adminFileUrl);

  const [rows, setRows] = useState<SubmissionRow[]>([]);
  const [chest, setChest] = useState("");
  const [program, setProgram] = useState("");
  const [type, setType] = useState("");
  const [date, setDate] = useState("");

  const refresh = useCallback(() => {
    list({ data: creds })
      .then(setRows)
      .catch(() => toast.error("Could not load submissions"));
  }, [list, creds]);

  useEffect(refresh, [refresh]);

  const programNames = useMemo(
    () => Array.from(new Set(rows.map((r) => r.program_name))).sort(),
    [rows],
  );

  const filtered = rows.filter((r) => {
    const ext = r.file_name.slice(r.file_name.lastIndexOf(".")).toLowerCase();
    if (chest && !r.chest_no.toLowerCase().includes(chest.toLowerCase())) return false;
    if (program && r.program_name !== program) return false;
    if (type && !ext.includes(type.toLowerCase().replace(/^\.*/, "."))) return false;
    if (date && !r.created_at.startsWith(date)) return false;
    return true;
  });

  async function download(path: string) {
    try {
      const { url } = await fileUrl({
        data: { ...creds, bucket: "program-submissions", path },
      });
      window.open(url, "_blank");
    } catch {
      toast.error("Could not download file");
    }
  }

  return (
    <div className="space-y-4">
      <div className="surface-card grid gap-3 p-4 sm:grid-cols-4">
        <input
          value={chest}
          onChange={(e) => setChest(e.target.value)}
          placeholder="Search Chest No."
          className={inputCls}
        />
        <select value={program} onChange={(e) => setProgram(e.target.value)} className={inputCls}>
          <option value="">All programs</option>
          {programNames.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <input
          value={type}
          onChange={(e) => setType(e.target.value)}
          placeholder="File type e.g. .pdf"
          className={inputCls}
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={inputCls}
        />
      </div>

      <div className="surface-card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Chest No.</th>
              <th className="px-4 py-3">Program</th>
              <th className="px-4 py-3">File Name</th>
              <th className="px-4 py-3">File Type</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-semibold">{r.chest_no}</td>
                <td className="px-4 py-3">{r.program_name}</td>
                <td className="max-w-[220px] truncate px-4 py-3">{r.file_name}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {r.file_name.slice(r.file_name.lastIndexOf(".")).toLowerCase()}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => download(r.storage_path)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-input px-2.5 text-xs font-medium hover:bg-secondary"
                    >
                      <Download className="h-3.5 w-3.5" /> Download
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm("Delete this submission?")) return;
                        await del({
                          data: { ...creds, id: r.id, storage_path: r.storage_path },
                        });
                        refresh();
                      }}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Delete submission"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No submissions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
