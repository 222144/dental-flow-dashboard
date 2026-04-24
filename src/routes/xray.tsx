import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useRef, useState } from "react";
import { Upload, ScanLine, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/xray")({
  head: () => ({
    meta: [
      { title: "AI X-Ray Analysis — DentalCare" },
      { name: "description", content: "Upload dental X-ray images for AI-assisted analysis." },
    ],
  }),
  component: XrayPage,
});

type Finding = {
  label: string;
  confidence: number;
  severity: "low" | "medium" | "high";
};

const sampleFindings: Finding[] = [
  { label: "Possible caries on tooth #14", confidence: 0.92, severity: "high" },
  { label: "Mild bone loss in lower left quadrant", confidence: 0.74, severity: "medium" },
  { label: "Healthy root structure on tooth #21", confidence: 0.98, severity: "low" },
];

function XrayPage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [findings, setFindings] = useState<Finding[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    setImageUrl(URL.createObjectURL(file));
    setFindings(null);
  };

  const runAnalysis = () => {
    if (!imageUrl) return;
    setAnalyzing(true);
    setFindings(null);
    setTimeout(() => {
      setFindings(sampleFindings);
      setAnalyzing(false);
    }, 1600);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Beta Feature
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">AI X-Ray Analysis</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload a panoramic or periapical X-ray and get AI-assisted findings in seconds.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
            {!imageUrl ? (
              <button
                onClick={() => inputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-secondary/40 px-6 py-20 text-center transition hover:border-primary hover:bg-primary/5"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[image:var(--gradient-primary)] text-primary-foreground">
                  <Upload className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-base font-semibold">Drop or click to upload X-ray</p>
                  <p className="text-sm text-muted-foreground">PNG, JPG up to 20MB</p>
                </div>
              </button>
            ) : (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-xl border border-border bg-black">
                  <img src={imageUrl} alt="Uploaded X-ray" className="mx-auto max-h-[420px] object-contain" />
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={runAnalysis}
                    disabled={analyzing}
                    className="inline-flex items-center gap-2 rounded-lg bg-[image:var(--gradient-action)] px-5 py-3 text-sm font-semibold text-action-foreground shadow-md transition hover:brightness-105 disabled:opacity-60"
                  >
                    <ScanLine className="h-4 w-4" />
                    {analyzing ? "Analyzing…" : "Run AI Analysis"}
                  </button>
                  <button
                    onClick={() => {
                      setImageUrl(null);
                      setFindings(null);
                    }}
                    className="rounded-lg border border-border px-5 py-3 text-sm font-semibold hover:bg-muted"
                  >
                    Upload Different Image
                  </button>
                </div>
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>

          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
            <h2 className="text-lg font-semibold">AI Findings</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Suggestions are AI-assisted. Always confirm with clinical judgement.
            </p>

            <div className="mt-5 space-y-3">
              {!imageUrl && (
                <p className="rounded-lg bg-secondary/50 p-4 text-sm text-muted-foreground">
                  Upload an X-ray to begin analysis.
                </p>
              )}
              {imageUrl && !findings && !analyzing && (
                <p className="rounded-lg bg-secondary/50 p-4 text-sm text-muted-foreground">
                  Click <strong>Run AI Analysis</strong> to detect findings.
                </p>
              )}
              {analyzing && (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 animate-pulse rounded-lg bg-secondary/60" />
                  ))}
                </div>
              )}
              {findings?.map((f, i) => {
                const sevColor =
                  f.severity === "high"
                    ? "text-action bg-action/10"
                    : f.severity === "medium"
                      ? "text-action bg-action/5"
                      : "text-success bg-success/10";
                const Icon = f.severity === "low" ? CheckCircle2 : AlertCircle;
                return (
                  <div key={i} className="rounded-lg border border-border p-4">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-md ${sevColor}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{f.label}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                            <div
                              className="h-full rounded-full bg-[image:var(--gradient-primary)]"
                              style={{ width: `${f.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-muted-foreground">
                            {Math.round(f.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
