import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Download, KeyRound, FileText } from "lucide-react";

import { accessProgram } from "@/lib/app.functions";
import { formatSize } from "@/lib/upload";

export const Route = createFileRoute("/materials")({
  head: () => ({
    meta: [
      { title: "Access Program Material — Thamassuk Program Portal" },
      {
        name: "description",
        content: "Enter your program passcode to view and download all program materials.",
      },
      { property: "og:title", content: "Access Program Material" },
      {
        property: "og:description",
        content: "Enter your program passcode to view and download all program materials.",
      },
    ],
  }),
  component: MaterialsPage,
});

type Result = Awaited<ReturnType<typeof accessProgram>>;

function MaterialsPage() {
  const access = useServerFn(accessProgram);
  const [passcode, setPasscode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await access({ data: { passcode } });
      if (!res.ok) setError("Invalid Passcode");
      else setResult(res);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <h1 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">
          Access Program Material
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the passcode given for your program.
        </p>

        <form onSubmit={onSubmit} className="surface-card mt-6 flex flex-col gap-3 p-5 sm:flex-row">
          <div className="relative flex-1">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Program passcode"
              maxLength={64}
              className="h-11 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="h-11 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Checking…" : "Access"}
          </button>
        </form>

        {error && (
          <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            {error}
          </p>
        )}

        {result?.ok && (
          <section className="surface-card mt-6 p-6">
            <h2 className="text-xl font-semibold">{result.program.name}</h2>
            {result.program.description && (
              <p className="mt-1 text-sm text-muted-foreground">{result.program.description}</p>
            )}

            <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Materials ({result.materials.length})
            </h3>
            {result.materials.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                No materials uploaded for this program yet.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {result.materials.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 py-3">
                    <FileText className="h-5 w-5 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{m.file_name}</p>
                      <p className="text-xs text-muted-foreground">{formatSize(m.file_size)}</p>
                    </div>
                    {m.url && (
                      <a
                        href={m.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-input px-3 text-sm font-medium hover:bg-secondary"
                      >
                        <Download className="h-4 w-4" /> Open
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
