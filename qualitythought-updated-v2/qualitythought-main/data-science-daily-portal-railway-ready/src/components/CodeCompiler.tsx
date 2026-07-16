import React, { useState, useRef, useEffect } from "react";
import { Play, Loader2, Terminal, XCircle } from "lucide-react";

declare global {
  interface Window {
    loadPyodide?: (opts?: any) => Promise<any>;
    __qtPyodidePromise?: Promise<any>;
  }
}

const PYODIDE_VERSION = "0.26.2";
const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

function loadPyodideOnce(): Promise<any> {
  if (window.__qtPyodidePromise) return window.__qtPyodidePromise;

  window.__qtPyodidePromise = new Promise((resolve, reject) => {
    const existing = document.getElementById("pyodide-script") as HTMLScriptElement | null;
    const onLoaded = async () => {
      try {
        const pyodide = await window.loadPyodide!({ indexURL: PYODIDE_CDN });
        resolve(pyodide);
      } catch (err) {
        reject(err);
      }
    };
    if (existing) {
      if (window.loadPyodide) onLoaded();
      else existing.addEventListener("load", onLoaded);
      return;
    }
    const script = document.createElement("script");
    script.id = "pyodide-script";
    script.src = `${PYODIDE_CDN}pyodide.js`;
    script.onload = onLoaded;
    script.onerror = () => reject(new Error("Failed to load Python runtime"));
    document.head.appendChild(script);
  });

  return window.__qtPyodidePromise;
}

interface CodeCompilerProps {
  code: string;
  compact?: boolean;
}

export const CodeCompiler: React.FC<CodeCompilerProps> = ({ code, compact }) => {
  const [running, setRunning] = useState(false);
  const [loadingRuntime, setLoadingRuntime] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [errored, setErrored] = useState(false);
  const [stdin, setStdin] = useState("");

  const runCode = async () => {
    if (!code || !code.trim()) {
      setOutput("Write some Python code above first, then hit Run.");
      setErrored(true);
      return;
    }
    setRunning(true);
    setErrored(false);
    setOutput(null);
    try {
      const firstLoad = !window.__qtPyodidePromise;
      if (firstLoad) setLoadingRuntime(true);
      const pyodide = await loadPyodideOnce();
      setLoadingRuntime(false);

      const stdinLines = stdin.split(/\r?\n|,/).map((s) => s.trim());
      let stdinIdx = 0;
      pyodide.setStdin({
        stdin: () => {
          if (stdinIdx < stdinLines.length) return stdinLines[stdinIdx++];
          return "";
        }
      });

      let capturedOut = "";
      let capturedErr = "";
      pyodide.setStdout({ batched: (s: string) => (capturedOut += s + "\n") });
      pyodide.setStderr({ batched: (s: string) => (capturedErr += s + "\n") });

      try {
        await pyodide.runPythonAsync(code);
      } catch (pyErr: any) {
        capturedErr += String(pyErr?.message || pyErr);
      }

      const combined = [capturedOut, capturedErr].filter((p) => p && p.trim().length > 0).join("\n");
      setOutput(combined.trim().length > 0 ? combined : "(Program ran with no output)");
      setErrored(capturedErr.trim().length > 0);
    } catch (err) {
      setErrored(true);
      setOutput("Could not start the Python runtime. Check your internet connection and try again.");
    } finally {
      setRunning(false);
      setLoadingRuntime(false);
    }
  };

  return (
    <div className={`space-y-2 ${compact ? "" : "mt-2"}`}>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={runCode}
          disabled={running}
          className={`flex items-center gap-1.5 font-black text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-sm transition ${
            running
              ? "bg-slate-400 cursor-not-allowed text-white"
              : "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
          }`}
        >
          {running ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {loadingRuntime ? "Loading Python (first run only)..." : "Running..."}
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-white" />
              Run Code Online
            </>
          )}
        </button>
        <input
          type="text"
          value={stdin}
          onChange={(e) => setStdin(e.target.value)}
          placeholder="Optional input() values, comma/newline separated"
          className="flex-1 min-w-[160px] text-[10px] font-mono bg-slate-100 border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-emerald-400"
        />
      </div>

      {output !== null && (
        <div
          className={`rounded-lg border p-3 font-mono text-[11px] whitespace-pre-wrap leading-relaxed ${
            errored
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-slate-950 border-slate-800 text-emerald-400"
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1.5 opacity-70 uppercase tracking-wider text-[9px] font-black">
            {errored ? <XCircle className="w-3 h-3" /> : <Terminal className="w-3 h-3" />}
            Output
          </div>
          {output}
        </div>
      )}
    </div>
  );
};

export default CodeCompiler;

