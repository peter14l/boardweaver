'use client';

import React, { useState, useEffect } from 'react';
import { ProjectScenario } from '../lib/scenarios';

interface HeaderProps {
  scenarios: ProjectScenario[];
  activeScenario: ProjectScenario;
  onSelectScenario: (scenario: ProjectScenario) => void;
  onExport: (type: 'kicad_pcb' | 'kicad_sch' | 'skidl' | 'bom') => void;
  status: 'idle' | 'running' | 'success';
}

export default function Header({
  scenarios,
  activeScenario,
  onSelectScenario,
  onExport,
  status,
}: HeaderProps) {
  const [daemonConnected, setDaemonConnected] = useState(false);

  // Poll local KiCad sync daemon on port 8080
  useEffect(() => {
    const checkDaemon = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 800);
        
        const res = await fetch('http://localhost:8080', {
          method: 'OPTIONS',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        setDaemonConnected(res.status === 200);
      } catch (e) {
        setDaemonConnected(false);
      }
    };

    checkDaemon();
    const interval = setInterval(checkDaemon, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="border-b border-[#1c1c1c] bg-[#080808]/90 backdrop-blur-md px-6 py-3.5 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Boardweaver Logo" className="w-7 h-7 rounded object-cover border border-[#2c2c2c]" />
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-white">Boardweaver</h1>
          </div>
        </div>

        <div className="h-4 w-[1px] bg-[#1c1c1c]" />

        <div className="flex items-center gap-3">
          <label className="text-[11px] text-gray-500 font-mono tracking-tight">SCENARIO</label>
          <select
            value={activeScenario.id}
            onChange={(e) => {
              const selected = scenarios.find(s => s.id === e.target.value);
              if (selected) onSelectScenario(selected);
            }}
            className="bg-[#0c0c0c] text-gray-300 border border-[#1c1c1c] rounded px-2.5 py-1 text-xs focus:outline-none focus:border-white transition-all cursor-pointer font-sans"
          >
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Daemon Connection Pill */}
        <div className={`flex items-center gap-2 px-2.5 py-1 rounded bg-[#0c0c0c] border transition-colors ${
          daemonConnected ? 'border-emerald-950 text-emerald-400' : 'border-[#1c1c1c] text-gray-400'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${daemonConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-neutral-700'}`} />
          <span className="text-[9px] font-mono">
            {daemonConnected ? 'BRIDGE ACTIVE' : 'BRIDGE OFFLINE'}
          </span>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#0c0c0c] border border-[#1c1c1c]">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              status === 'running'
                ? 'bg-neutral-500 animate-pulse'
                : status === 'success'
                ? 'bg-neutral-100'
                : 'bg-neutral-700'
            }`}
          />
          <span className="text-[9px] font-mono text-gray-400">
            {status === 'running' ? 'COMPILING' : status === 'success' ? 'DRC CLEAN' : 'OFFLINE'}
          </span>
        </div>

        <div className="h-4 w-[1px] bg-[#1c1c1c]" />

        {/* Exports Dropdown / Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onExport('kicad_sch')}
            disabled={status !== 'success'}
            className="px-2.5 py-1 bg-[#0c0c0c] hover:bg-[#141414] disabled:opacity-30 border border-[#1c1c1c] text-[10px] font-mono text-gray-400 hover:text-white rounded transition-all"
          >
            .kicad_sch
          </button>
          <button
            onClick={() => onExport('kicad_pcb')}
            disabled={status !== 'success'}
            className="px-2.5 py-1 bg-[#0c0c0c] hover:bg-[#141414] disabled:opacity-30 border border-[#1c1c1c] text-[10px] font-mono text-gray-400 hover:text-white rounded transition-all"
          >
            .kicad_pcb
          </button>
          <button
            onClick={() => onExport('skidl')}
            disabled={status !== 'success'}
            className="px-2.5 py-1 bg-[#0c0c0c] hover:bg-[#141414] disabled:opacity-30 border border-[#1c1c1c] text-[10px] font-mono text-gray-400 hover:text-white rounded transition-all"
          >
            skidl.py
          </button>
          <button
            onClick={() => onExport('bom')}
            disabled={status !== 'success'}
            className="px-3 py-1 bg-white hover:bg-neutral-200 disabled:opacity-30 text-black font-semibold text-[10px] rounded transition-all cursor-pointer"
          >
            Export BOM
          </button>
        </div>
      </div>
    </header>
  );
}
