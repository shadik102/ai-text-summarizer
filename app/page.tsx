"use client";

import { useState } from "react";

export default function Home() {
  const [text, setText] = useState("");
  const [length, setLength] = useState("medium");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSummarize() {
    if (!text.trim()) {
      setError("Please enter some text first.");
      return;
    }

    if (text.length > 20000) {
      setError("Please keep your text under 20,000 characters.");
      return;
    }

    setLoading(true);
    setError("");
    setSummary("");

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, length }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Something went wrong.");
      }

      if (!response.body) {
        throw new Error("No response received from the server.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        setSummary((previous) => previous + chunk);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to generate summary."
      );
    } finally {
      setLoading(false);
    }
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summary);
    } catch {
      setError("Unable to copy summary. Please select and copy it manually.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-white">
      <div className="mx-auto max-w-4xl">
        <header className="mb-10 text-center">
          <div className="mb-4 inline-block rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300">
            Powered by Google Gemini AI
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            AI Text <span className="text-cyan-400">Summarizer</span>
          </h1>

          <p className="mt-4 text-slate-400">
            Turn long text into clear, meaningful summaries in seconds.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8">
          <div className="mb-3 flex items-center justify-between">
            <label htmlFor="input-text" className="font-semibold">
              Enter your text
            </label>
            <span className="text-sm text-slate-400">
              {text.length}/20,000
            </span>
          </div>

          <textarea
            id="input-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={20000}
            placeholder="Paste your article, notes, or any long text here..."
            className="min-h-64 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 p-4 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
          />

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="summary-length"
                className="mb-2 block text-sm font-semibold"
              >
                Summary length
              </label>
              <select
                id="summary-length"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white outline-none focus:border-cyan-400"
              >
                <option value="short">Short — 2 to 3 sentences</option>
                <option value="medium">Medium — One paragraph</option>
                <option value="detailed">Detailed — Important points</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleSummarize}
                disabled={loading || !text.trim()}
                className="w-full rounded-xl bg-cyan-500 p-3 font-bold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Generating summary..." : "✨ Generate Summary"}
              </button>
            </div>
          </div>

          {loading && (
            <p className="mt-5 animate-pulse text-center text-cyan-300">
              Gemini AI is summarizing your text...
            </p>
          )}

          {error && (
            <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
              {error}
            </div>
          )}

          {summary && (
            <div className="mt-8 rounded-xl border border-cyan-400/30 bg-slate-950 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-cyan-300">
                  Your Summary
                </h2>
                <button
                  onClick={copySummary}
                  className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
                >
                  Copy summary
                </button>
              </div>

              <p className="whitespace-pre-wrap leading-8 text-slate-200">
                {summary}
              </p>
            </div>
          )}
        </section>

        <footer className="mt-8 text-center text-sm text-slate-500">
          Built with Next.js, TypeScript, Tailwind CSS and Google Gemini API.
        </footer>
      </div>
    </main>
  );
}