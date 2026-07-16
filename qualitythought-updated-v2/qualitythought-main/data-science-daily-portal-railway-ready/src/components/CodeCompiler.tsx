import React, { useState } from "react";
import { Play, Loader2, Terminal, XCircle } from "lucide-react";

// Free, public, keyless code-execution API (https://github.com/engineer-man/piston)
// Used by many "try it online" style tools. Runs untrusted code in sandboxes on their end.
const PISTON_URL = "https://emkc.org/api/v2/piston/execute";

interface CodeCompilerProps {
  code: string;
  /** Optional: called when the run finishes, e.g. to auto-append output to an answer */
  compact?: boolean;
}

export const CodeCompiler: React.FC<CodeCompilerProps> = ({ code, compact }) => {
  const [running, setRunning] = useState(false);
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
      const res = await fetch(PISTON_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: "python",
          version: "3.10.0",
          files: [{ name: "main.py", content: code }],
          stdin: stdin || ""
        })
      });

      if (!res.ok) throw new Error(`Compiler service returned ${res.status}`);
      const data = await res.json();

      const runResult = data.run || {};
      const combined = [runResult.stdout, runResult.stderr]
        .filter((part: string) => part && part.length > 0)
        .join("\n");

      setOutput(combined.trim().length > 0 ? combined : "(Program ran with no output)");
      setErrored(!!runResult.stderr && runResult.stderr.trim().length > 0);
    } catch (err) {
      setErrored(true);
      setOutput(
        "Could not reach the online compiler. Check your internet connection and try again."
      );
    } finally {
      setRunning(false);
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
              Running...
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
            {errored ? (
              <XCircle className="w-3 h-3" />
            ) : (
              <Terminal className="w-3 h-3" />
            )}
            Output
          </div>
          {output}
        </div>
      )}
    </div>
  );
};

export default CodeCompiler;
