import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, CheckCircle2, UploadCloud, X } from "lucide-react";

import { listProgramOptions, submitProgramFiles } from "@/lib/app.functions";
import { extensionOf, formatSize, uploadFiles } from "@/lib/upload";

export const Route = createFileRoute("/submit")({
  head: () => ({
    meta: [
      { title: "Submit Program File — Thamassuk Program Portal" },
      {
        name: "description",
        content: "Submit your program files using your chest number. Only allowed file types.",
      },
      { property: "og:title", content: "Submit Program File" },
      {
        property: "og:description",
        content: "Submit your program files using your chest number.",
      },
    ],
  }),
  component: SubmitPage,
});

type ProgramOption = { id: string; name: string; allowed_extensions: string[] };

function SubmitPage() {
  const listPrograms = useServerFn(listProgramOptions);
  const submit = useServerFn(submitProgramFiles);

  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [chestNo, setChestNo] = useState("");
  const [programId, setProgramId] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    listPrograms()
      .then((rows) => setPrograms(rows))
      .catch(() => setError("Could not load programs."));
  }, [listPrograms]);

  const selected = programs.find((p) => p.id === programId);
  const allowed = selected?.allowed_extensions ?? [];

  function addFiles(list: FileList | null) {
    if (!list) return;
    const incoming = Array.from(list);
    const bad = allowed.length
      ? incoming.filter((f) => !allowed.includes(extensionOf(f.name)))
      : [];
    if (bad.length) {
      setError(`Not allowed: ${bad.map((f) => f.name).join(", ")}`);
    } else {
      setError("");
    }
    const good = incoming.filter((f) => !bad.includes(f));
    setFiles((prev) => [...prev, ...good]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!chestNo.trim()) return setError("Chest No. is required.");
    if (!programId) return setError("Please select a program.");
    if (!files.length) return setError("Please upload at least one file.");

    setBusy(true);
    try {
      const uploaded = await uploadFiles("program-submissions", programId, files);
      await submit({ data: { chest_no: chestNo, program_id: programId, files: uploaded } });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="surface-card max-w-md p-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
          <h1 className="mt-4 text-2xl font-bold">Submission Successful</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {files.length} file{files.length > 1 ? "s" : ""} received for chest no.{" "}
            <strong className="text-foreground">{chestNo.toUpperCase()}</strong>.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => {
                setDone(false);
                setFiles([]);
              }}
              className="h-10 rounded-lg border border-input px-4 text-sm font-medium hover:bg-secondary"
            >
              Submit another
            </button>
            <Link
              to="/"
              className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <h1 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">Submit Program File</h1>

        <form onSubmit={onSubmit} className="surface-card mt-6 space-y-5 p-6">
          <div>
            <label className="text-sm font-medium">Chest No.</label>
            <input
              value={chestNo}
              onChange={(e) => setChestNo(e.target.value)}
              placeholder="e.g. THM001"
              maxLength={30}
              className="mt-1.5 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm uppercase outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Select Program</label>
            <select
              value={programId}
              onChange={(e) => {
                setProgramId(e.target.value);
                setFiles([]);
                setError("");
              }}
              className="mt-1.5 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">— Choose a program —</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Upload File(s)</label>
            <p className="mt-1 text-xs text-muted-foreground">
              {selected
                ? allowed.length
                  ? `Allowed types: ${allowed.join(", ")}`
                  : "All file types allowed for this program."
                : "Select a program to see allowed file types."}
            </p>
            <label className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input bg-secondary/40 px-4 py-8 text-center hover:bg-secondary">
              <UploadCloud className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Click to choose files</span>
              <span className="text-xs text-muted-foreground">You can select multiple files</span>
              <input
                type="file"
                multiple
                disabled={!programId}
                accept={allowed.length ? allowed.join(",") : undefined}
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
                className="hidden"
              />
            </label>

            {files.length > 0 && (
              <ul className="mt-3 space-y-2">
                {files.map((f, i) => (
                  <li
                    key={`${f.name}-${i}`}
                    className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{f.name}</p>
                      <p className="text-xs text-muted-foreground">{formatSize(f.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Remove ${f.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="h-11 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "Submitting…" : "Submit"}
          </button>
        </form>
      </div>
    </main>
  );
}
