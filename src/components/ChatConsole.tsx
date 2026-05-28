'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ProjectScenario, AgentStep } from '../lib/scenarios';

interface ChatConsoleProps {
  activeScenario: ProjectScenario;
  onStartGeneration: (prompt: string, apiKey?: string) => void;
  status: 'idle' | 'running' | 'success';
  logs: AgentStep[];
}

export default function ChatConsole({
  activeScenario,
  onStartGeneration,
  status,
  logs,
}: ChatConsoleProps) {
  const [promptInput, setPromptInput] = useState(activeScenario.prompt);
  const [apiKey, setApiKey] = useState('');
  const [showApiSettings, setShowApiSettings] = useState(false);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;
    onStartGeneration(promptInput, apiKey);
  };

  return (
    <div className="flex flex-col h-full bg-[#080808] border-r border-[#1c1c1c] w-[360px] min-w-[360px]" key={activeScenario.id}>
      {/* Vibe Prompt Section */}
      <div className="p-4 border-b border-[#1c1c1c] bg-[#0c0c0c]/40">
        <h2 className="text-[10px] font-semibold text-gray-500 font-mono mb-2.5 uppercase tracking-wider">
          Prompt Specification
        </h2>
        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            disabled={status === 'running'}
            placeholder="Specify your hardware requirements..."
            className="w-full h-24 bg-[#050505] text-xs text-gray-300 border border-[#1c1c1c] rounded p-2.5 focus:outline-none focus:border-neutral-500 disabled:opacity-40 resize-none font-sans leading-normal transition-colors"
          />
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => setShowApiSettings(!showApiSettings)}
              className="text-[10px] text-gray-500 hover:text-gray-300 font-mono transition-colors"
            >
              {showApiSettings ? 'Settings' : 'API Settings'}
            </button>
            <button
              type="submit"
              disabled={status === 'running'}
              className="px-3 py-1.5 bg-white hover:bg-neutral-200 disabled:bg-[#141414] disabled:text-gray-600 text-black font-semibold text-[10px] rounded transition-all cursor-pointer"
            >
              {status === 'running' ? 'Compiling...' : 'Compile Design'}
            </button>
          </div>
        </form>

        {showApiSettings && (
          <div className="mt-3 p-3 bg-[#0a0a0f] rounded border border-[#1c1c1c] space-y-2">
            <label className="block text-[9px] font-mono text-gray-400">Gemini API Key</label>
            <input
              type="password"
              placeholder="Paste API Key..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-[#050505] border border-[#1c1c1c] rounded p-1.5 text-[10px] text-gray-300 focus:outline-none focus:border-neutral-600"
            />
          </div>
        )}
      </div>

      {/* Agent Thinking Steps Console */}
      <div className="flex-1 flex flex-col min-h-0 bg-[#080808]">
        <div className="px-4 py-2 border-b border-[#1c1c1c] bg-[#0c0c0c]/40 flex justify-between items-center">
          <span className="text-[10px] font-mono font-bold text-gray-500 tracking-wider">COMPILER LOGS</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 font-mono text-[10px] space-y-2.5 leading-relaxed scrollbar-thin">
          {logs.length === 0 ? (
            <div className="text-gray-600 italic">Console idle. Click compile to begin layout synthesis.</div>
          ) : (
            logs.map((log, index) => {
              let colorClass = 'text-gray-400';
              let icon = '•';
              if (log.type === 'success') {
                colorClass = 'text-white font-bold';
                icon = '✓';
              }

              return (
                <div key={index} className={`border-l border-[#1c1c1c] pl-3 py-0.5 ${colorClass}`}>
                  <span className="mr-2 text-gray-600">{icon}</span>
                  <span className="whitespace-pre-line">{log.message}</span>
                </div>
              );
            })
          )}
          <div ref={consoleEndRef} />
        </div>
      </div>
    </div>
  );
}
