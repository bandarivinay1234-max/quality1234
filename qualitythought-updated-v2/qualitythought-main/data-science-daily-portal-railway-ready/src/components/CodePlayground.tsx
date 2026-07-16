import React, { useState } from "react";
import { Play, Loader2, Terminal, XCircle, Code2, RotateCcw } from "lucide-react";

const PISTON_URL = "https://emkc.org/api/v2/piston/execute";

const DEFAULT_CODE = `# Write your Python code here and hit Run ▶
print("Hello, Quality Thought!")

for i in range(1, 6):
    print(f"Line {i}")
`;

export default function CodePlayground() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [stdin, setStdin] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [errored, setErrored] = useState(false);
  const [running, setRunning] = useState(false);

  const runCode = async () => {
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
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      const run = data.run || {};
      const combined = [run.stdout, run.stderr].filter(Boolean).join("\n");
      setOutput(combined.trim() || "(Program ran with no output)");
      setErrored(!!run.stderr && run.stderr.trim().length > 0);
    } catch {
      setErrored(true);
      setOutput("Could not reach the online compiler. Check your connection and try again.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-indigo-600" />
          <div>
            <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">
              Online Python Compiler
            </h4>
            <p className="text-[10px] text-slate-400">
              Write, run, and test Python code instantly — no setup required.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setCode(DEFAULT_CODE);
            setOutput(null);
            setStdin("");
          }}
          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-400 hover:text-slate-700 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-0">
        <div className="p-4 border-b md:border-b-0 md:border-r border-slate-100 space-y-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Code Editor (Python)
          </span>
          <textarea
            spellCheck={false}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={16}
            className="w-full bg-slate-950 text-emerald-400 font-mono text-xs p-4 rounded-lg border-none outline-none focus:ring-2 focus:ring-indigo-400 leading-relaxed"
          />
          <input
            type="text"
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder="Optional stdin / input() values"
            className="w-full text-[11px] font-mono bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-indigo-400"
          />
          <button
            type="button"
            onClick={runCode}
            disabled={running}
            className={`w-full flex items-center justify-center gap-2 font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-lg shadow-sm transition ${
              running
                ? "bg-slate-400 cursor-not-allowed text-white"
                : "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
            }`}
          >
            {running ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" /> Run Code
              </>
            )}
          </button>
        </div>

        <div className="p-4 space-y-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5" />
            Output Console
          </span>
          <div
            className={`h-[calc(100%-1.75rem)] min-h-[280px] rounded-lg border p-4 font-mono text-xs whitespace-pre-wrap leading-relaxed overflow-auto ${
              errored
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-slate-950 border-slate-800 text-emerald-400"
            }`}
          >
            {output === null ? (
              <span className="text-slate-500 italic">
                Output will appear here after you run your code...
              </span>
            ) : errored ? (
              <span className="flex items-start gap-1.5">
                <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                {output}
              </span>
            ) : (
              output
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
