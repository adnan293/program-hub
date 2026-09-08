import { createFileRoute, Link } from "@tanstack/react-router";
import { FolderOpen, Upload, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Thamassuk Program Portal — Materials & Submissions" },
      {
        name: "description",
        content:
          "Enter a program passcode to access materials, or submit your program files with your chest number.",
      },
      { property: "og:title", content: "Thamassuk Program Portal" },
      {
        property: "og:description",
        content: "Access program materials and submit your program files by chest number.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <main className="min-h-screen bg-background">
      <section className="hero-gradient px-4 py-16 text-primary-foreground sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] opacity-80">
            Program Portal
          </p>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">
            Materials & File Submissions
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm opacity-85 sm:text-base">
            Access the material for your program with a passcode, or send in your work using your
            chest number. No account needed.
          </p>
        </div>
      </section>

      <section className="mx-auto -mt-10 grid max-w-4xl gap-5 px-4 pb-16 sm:grid-cols-2">
        <Link
          to="/materials"
          className="surface-card group flex flex-col gap-3 p-6 transition-transform hover:-translate-y-1"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary text-primary">
            <FolderOpen className="h-5 w-5" />
          </span>
          <h2 className="text-lg font-semibold">Access Program Material</h2>
          <p className="text-sm text-muted-foreground">
            Enter your program passcode to view and download all uploaded materials.
          </p>
          <span className="mt-auto pt-3 text-sm font-semibold text-primary">Open →</span>
        </Link>

        <Link
          to="/submit"
          className="surface-card group flex flex-col gap-3 p-6 transition-transform hover:-translate-y-1"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Upload className="h-5 w-5" />
          </span>
          <h2 className="text-lg font-semibold">Submit Program File</h2>
          <p className="text-sm text-muted-foreground">
            Upload your files with your chest number. Only allowed file types are accepted.
          </p>
          <span className="mt-auto pt-3 text-sm font-semibold text-primary">Open →</span>
        </Link>
      </section>

      <footer className="border-t border-border px-4 py-6">
        <div className="mx-auto flex max-w-4xl items-center justify-center">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ShieldCheck className="h-4 w-4" /> Admin login
          </Link>
        </div>
      </footer>
    </main>
  );
}
