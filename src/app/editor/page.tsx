'use client';

import React, { useState } from 'react';
import Header from '../../components/Header';
import ChatConsole from '../../components/ChatConsole';
import CanvasView from '../../components/CanvasView';
import SidebarBOM from '../../components/SidebarBOM';
import { SCENARIOS, ProjectScenario, AgentStep } from '../../lib/scenarios';
import { generateSKiDL, generateBOM, generateKiCadSch, generateKiCadPCB } from '../../lib/generator';
import { validatePCBDesign } from '../../lib/validator';

export default function Workspace() {
  const [activeScenario, setActiveScenario] = useState<ProjectScenario>(SCENARIOS[0]);
  const [status, setStatus] = useState<'idle' | 'running' | 'success'>('idle');
  const [logs, setLogs] = useState<AgentStep[]>([]);

  const validationReport = validatePCBDesign(activeScenario);

  // Local bridge synchronization
  const syncToLocalDaemon = async (scenario: ProjectScenario) => {
    try {
      const schContent = generateKiCadSch(scenario);
      const pcbContent = generateKiCadPCB(scenario);

      // Send schematic sheet
      await fetch('http://localhost:8080', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: `${scenario.id}.kicad_sch`, content: schContent }),
      });

      // Send PCB layout
      await fetch('http://localhost:8080', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: `${scenario.id}.kicad_pcb`, content: pcbContent }),
      });

      console.log('[Boardweaver Sync] Automatically updated local KiCad board files.');
    } catch (e) {
      // Bridge is not running, fail silently
    }
  };

  // Trigger compiler simulation
  const startSimulation = (scenario: ProjectScenario) => {
    setStatus('running');
    setLogs([]);

    let currentLogIndex = 0;
    const targetLogs = scenario.logs;

    const printNextLog = () => {
      if (currentLogIndex < targetLogs.length) {
        const nextLog = targetLogs[currentLogIndex];
        setLogs((prev) => [...prev, nextLog]);
        currentLogIndex++;
        setTimeout(printNextLog, nextLog.delay);
      } else {
        setStatus('success');
        syncToLocalDaemon(scenario);
      }
    };

    setTimeout(printNextLog, 300);
  };

  const handleSelectScenario = (scenario: ProjectScenario) => {
    setActiveScenario(scenario);
    setStatus('idle');
    setLogs([]);
  };

  const handleUpdateScenario = (updates: Partial<ProjectScenario>) => {
    setActiveScenario(prev => {
      const updated = { ...prev, ...updates };
      // Sync changes to local daemon if design is already successful
      if (status === 'success') {
        syncToLocalDaemon(updated);
      }
      return updated;
    });
  };

  const handleStartGeneration = async (promptText: string, apiKey?: string) => {
    if (apiKey) {
      setStatus('running');
      setLogs([{ type: 'info', message: 'Sending request to Gemini AI hardware compiler...', delay: 500 }]);
      try {
        const res = await fetch('/api/compile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: promptText,
            apiKey,
            previousProject: status === 'success' ? activeScenario : undefined
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to compile');
        }

        const compiledScenario = await res.json();
        setActiveScenario(compiledScenario);
        
        let currentLogIndex = 0;
        const targetLogs = compiledScenario.logs || [
          { type: 'success', message: 'Dynamic PCB generation complete!', delay: 500 }
        ];
        
        setLogs([]);
        const printNextLog = () => {
          if (currentLogIndex < targetLogs.length) {
            const nextLog = targetLogs[currentLogIndex];
            setLogs((prev) => [...prev, nextLog]);
            currentLogIndex++;
            setTimeout(printNextLog, nextLog.delay || 500);
          } else {
            setStatus('success');
            syncToLocalDaemon(compiledScenario);
          }
        };
        printNextLog();
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setStatus('idle');
        setLogs([
          { type: 'info', message: `Compilation Failed. Error: ${errorMessage}`, delay: 0 }
        ]);
      }
    } else {
      // Fallback to simulated offline compile
      startSimulation(activeScenario);
    }
  };

  const handleExport = (type: 'kicad_pcb' | 'kicad_sch' | 'skidl' | 'bom') => {
    let content = '';
    let filename = '';
    let mimeType = 'text/plain';

    if (type === 'kicad_sch') {
      content = generateKiCadSch(activeScenario);
      filename = `${activeScenario.id}.kicad_sch`;
    } else if (type === 'kicad_pcb') {
      content = generateKiCadPCB(activeScenario);
      filename = `${activeScenario.id}.kicad_pcb`;
    } else if (type === 'skidl') {
      content = generateSKiDL(activeScenario);
      filename = `${activeScenario.id}_skidl.py`;
    } else if (type === 'bom') {
      content = generateBOM(activeScenario);
      filename = `${activeScenario.id}_bom.csv`;
      mimeType = 'text/csv';
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#050505] text-white">
      {/* Top Header */}
      <Header
        scenarios={SCENARIOS}
        activeScenario={activeScenario}
        onSelectScenario={handleSelectScenario}
        onExport={handleExport}
        status={status}
      />

      {/* Main Workspace Panels */}
      <div className="flex-1 flex min-h-0">
        {/* Left Agent Terminal Console */}
        <ChatConsole
          activeScenario={activeScenario}
          onStartGeneration={handleStartGeneration}
          status={status}
          logs={logs}
        />

        {/* Center Interactive Layout Canvas */}
        <CanvasView 
          scenario={activeScenario} 
          status={status} 
          validationReport={validationReport}
          onUpdateScenario={handleUpdateScenario}
        />

        {/* Right BOM & DRC Panel */}
        <SidebarBOM 
          scenario={activeScenario} 
          status={status} 
          validationReport={validationReport}
        />
      </div>
    </div>
  );
}
