'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ProjectScenario } from '../lib/scenarios';
import { ValidationReport } from '../lib/validator';

interface SidebarBOMProps {
  scenario: ProjectScenario;
  status: 'idle' | 'running' | 'success';
  validationReport: ValidationReport;
}

type PanelTab = 'bom' | 'drc' | 'checkout';

export default function SidebarBOM({ scenario, status, validationReport }: SidebarBOMProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>('bom');
  const [boardQty, setBoardQty] = useState(5);
  const [layers, setLayers] = useState(2);
  const [smtAssembly, setSmtAssembly] = useState(true);
  const [ordered, setOrdered] = useState(false);
  const [swappedParts, setSwappedParts] = useState<Record<string, string>>({});
  const [selectedPinMux, setSelectedPinMux] = useState('Default');
  const [selectedFab, setSelectedFab] = useState<'jlc' | 'pcbway' | 'osh'>('jlc');
  const oscRef = useRef<HTMLCanvasElement>(null);

  const calculateQuotes = () => {
    const qtyMult = boardQty <= 5 ? 1 : Math.ceil(boardQty / 5) * 1.4;
    const layerMult = layers === 2 ? 1.0 : 4.0;
    const componentCount = scenario.components.length;
    
    const jlcPcb = 2.0 * qtyMult * layerMult;
    const jlcAssembly = smtAssembly ? (8.0 + componentCount * 0.25 * boardQty) : 0;
    const jlcShipping = 16.0;

    const pcbwayPcb = 5.0 * qtyMult * layerMult;
    const pcbwayAssembly = smtAssembly ? (12.0 + componentCount * 0.30 * boardQty) : 0;
    const pcbwayShipping = 19.0;

    const oshPcb = 1.5 * componentCount * qtyMult * layerMult;
    const oshShipping = 5.0;

    return {
      jlc: {
        pcb: jlcPcb.toFixed(2),
        assembly: jlcAssembly.toFixed(2),
        shipping: jlcShipping.toFixed(2),
        total: (jlcPcb + jlcAssembly + jlcShipping).toFixed(2),
        time: '5-7 days'
      },
      pcbway: {
        pcb: pcbwayPcb.toFixed(2),
        assembly: pcbwayAssembly.toFixed(2),
        shipping: pcbwayShipping.toFixed(2),
        total: (pcbwayPcb + pcbwayAssembly + pcbwayShipping).toFixed(2),
        time: '4-6 days'
      },
      osh: {
        pcb: oshPcb.toFixed(2),
        assembly: 'N/A',
        shipping: oshShipping.toFixed(2),
        total: (oshPcb + oshShipping).toFixed(2),
        time: '8-12 days'
      }
    };
  };

  const quotes = calculateQuotes();
  const activeQuote = quotes[selectedFab];

  const getAlternates = (compId: string): { label: string; lcsc: string }[] => {
    if (compId === 'U1' && scenario.id === 'esp32-sensor') {
      return [
        { label: 'ESP32-S3-WROOM-1-N8R8', lcsc: 'C2913148' },
        { label: 'ESP32-S3-WROOM-1U-N8', lcsc: 'C2913149' },
      ];
    }
    if (compId === 'U2') {
      return [
        { label: 'AP2112K-3.3 (Diodes Inc)', lcsc: 'C347228' },
        { label: 'RT9013-33GB (Richtek)', lcsc: 'C84251' },
      ];
    }
    return [];
  };

  useEffect(() => {
    if (activeTab !== 'drc' || !oscRef.current) return;
    const canvas = oscRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let offset = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < canvas.width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 15) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      
      for (let x = 0; x < canvas.width; x++) {
        const rad = (x + offset) * 0.04;
        const y = canvas.height / 2 + Math.sin(rad) * 15 + Math.sin(rad * 2.5) * 4;
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      offset += 1;
      animFrame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animFrame);
  }, [activeTab]);

  return (
    <div className="w-[320px] min-w-[320px] h-full bg-[#080808] border-l border-[#1c1c1c] flex flex-col font-sans">
      {/* Tab Bar */}
      <div className="flex border-b border-[#1c1c1c] bg-[#0c0c0c]/40 text-[10px] font-mono font-bold tracking-tight">
        {(['bom', 'drc', 'checkout'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-center border-b transition-all ${
              activeTab === tab
                ? 'border-white text-white font-bold bg-[#0c0c0c]/20'
                : 'border-transparent text-gray-500 hover:text-white'
            }`}
          >
            {tab === 'bom' ? 'BOM' : tab === 'drc' ? 'SIMULATION' : 'ORDER'}
          </button>
        ))}
      </div>

      {/* Main Panel Content */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        {status !== 'success' ? (
          <div className="text-gray-600 italic text-[10px] font-mono text-center mt-8">
            Awaiting compile results...
          </div>
        ) : (
          <>
            {activeTab === 'bom' && (
              <div className="space-y-4">
                <h3 className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider">
                  Bill of Materials
                </h3>
                <div className="space-y-2">
                  {scenario.components.map((comp) => {
                    const alternates = getAlternates(comp.id);
                    const selectedLcsc = swappedParts[comp.id] || alternates[0]?.lcsc || 'C92379';

                    return (
                      <div
                        key={comp.id}
                        className="p-3 bg-[#0c0c0c]/40 border border-[#1c1c1c] rounded space-y-1.5 hover:border-neutral-700 transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-white font-mono font-bold text-[10px]">
                            {comp.id}
                          </span>
                          {alternates.length > 0 && (
                            <span className="text-[8px] bg-neutral-900 border border-neutral-800 text-gray-400 px-1 py-0.5 rounded font-mono">
                              Swap
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-white font-semibold">{comp.name}</div>
                        
                        {alternates.length > 0 ? (
                          <div className="mt-1">
                            <select
                              value={selectedLcsc}
                              onChange={(e) => setSwappedParts({ ...swappedParts, [comp.id]: e.target.value })}
                              className="w-full bg-[#050505] text-[10px] text-gray-400 border border-[#1c1c1c] rounded p-1 focus:outline-none focus:border-neutral-500"
                            >
                              {alternates.map(alt => (
                                <option key={alt.lcsc} value={alt.lcsc}>{alt.label}</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className="text-[10px] text-gray-400 font-mono">
                            Value: {comp.value}
                          </div>
                        )}
                        <div className="text-[9px] text-gray-500 font-mono">
                          LCSC: {selectedLcsc}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'drc' && (
              <div className="space-y-4">
                {/* Live Scope */}
                <div className="space-y-1.5">
                  <h4 className="text-[9px] font-mono font-bold text-gray-500 uppercase">Live Scope (Pin: U1.IO11)</h4>
                  <div className="bg-[#050505] border border-[#1c1c1c] rounded overflow-hidden flex items-center justify-center p-1">
                    <canvas ref={oscRef} width="280" height="90" className="w-full" />
                  </div>
                </div>

                {/* PDN / Signal Metrics */}
                <div className="p-3 bg-[#0c0c0c]/40 border border-[#1c1c1c] rounded space-y-2 font-mono text-[9px] text-gray-400">
                  <h4 className="font-bold text-white uppercase text-[9px] mb-1">PDN / Signal Metrics</h4>
                  <div className="flex justify-between border-b border-[#151515] pb-1">
                    <span>Current Draw:</span>
                    <span className="text-white">480mA</span>
                  </div>
                  <div className="flex justify-between border-b border-[#151515] pb-1">
                    <span>LDO Junction Temp:</span>
                    <span className="text-white">{validationReport.metrics.maxTemp.toFixed(1)}°C</span>
                  </div>
                  <div className="flex justify-between border-b border-[#151515] pb-1">
                    <span>VCC Ripple:</span>
                    <span className="text-white">{validationReport.metrics.voltageRipple.toFixed(1)}mV</span>
                  </div>
                  <div className="flex justify-between border-b border-[#151515] pb-1">
                    <span>Diff Impedance:</span>
                    <span className="text-white">{validationReport.metrics.usbImpedance.toFixed(1)}Ω</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Trace Length:</span>
                    <span className="text-white">{validationReport.metrics.traceLength}mm</span>
                  </div>
                </div>

                {/* Static checks & error reporting logs */}
                <div className="space-y-2 font-mono text-[9px]">
                  <h4 className="text-[9px] font-bold text-gray-500 uppercase">Static Validation Reports</h4>
                  
                  {/* Show validator results */}
                  {validationReport.errors.length === 0 ? (
                    <div className="p-2 bg-[#0a140f] border border-emerald-950/40 text-emerald-400 rounded">
                      ✓ Boardweaver Static Checks passed. Zero warnings/errors.
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {validationReport.errors.map((err, idx) => {
                        const isError = err.type === 'error';
                        const badgeColor = isError ? 'text-rose-400 bg-rose-950/20 border-rose-900/30' : 'text-amber-400 bg-amber-950/20 border-amber-900/30';
                        return (
                          <div key={idx} className={`p-2 border rounded ${badgeColor} leading-normal`}>
                            <span className="font-bold uppercase text-[8px] mr-1">
                              [L{err.level} {err.type}]
                            </span>
                            {err.message}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Pin-Muxing */}
                <div className="p-3 bg-[#0c0c0c]/40 border border-[#1c1c1c] rounded space-y-2">
                  <h4 className="text-[9px] font-mono font-bold text-gray-500 uppercase">Pin-Mux Optimizer</h4>
                  <div>
                    <select
                      value={selectedPinMux}
                      onChange={(e) => setSelectedPinMux(e.target.value)}
                      className="w-full bg-[#050505] text-[10px] text-gray-400 border border-[#1c1c1c] rounded p-1 focus:outline-none focus:border-neutral-500"
                    >
                      <option value="Default">Default (GPIO 11/12) - 34mm</option>
                      <option value="Optimized">Optimized (GPIO 4/5) - 18mm (-47%)</option>
                    </select>
                  </div>
                  {selectedPinMux === 'Optimized' && (
                    <div className="text-[9px] font-mono text-gray-300 bg-[#0c0c0c] border border-[#1c1c1c] p-1.5 rounded">
                      Routing optimized. Clearance increased by 0.15mm.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'checkout' && (
              <div className="space-y-4">
                <h3 className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider">
                  Instant Manufacturing Quote
                </h3>
                
                {ordered ? (
                  <div className="p-4 bg-[#0c0c0c] border border-[#1c1c1c] rounded text-center space-y-2">
                    <div className="text-xs font-bold text-white">Order Placed</div>
                    <p className="text-[10px] text-gray-500 leading-normal">
                      Gerber outputs compiled and ready. Syncing layout bridge.
                    </p>
                    <button
                      onClick={() => setOrdered(false)}
                      className="mt-2 text-[9px] text-white font-mono underline"
                    >
                      Reconfigure
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-gray-500">QUANTITY</label>
                      <select
                        value={boardQty}
                        onChange={(e) => setBoardQty(Number(e.target.value))}
                        className="w-full bg-[#050505] text-gray-300 border border-[#1c1c1c] rounded p-2 text-xs focus:outline-none"
                      >
                        <option value={5}>5 Units</option>
                        <option value={10}>10 Units</option>
                        <option value={30}>30 Units</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-gray-500">LAYERS</label>
                      <div className="flex gap-2">
                        {[2, 4].map((l) => (
                          <button
                            key={l}
                            onClick={() => setLayers(l)}
                            className={`flex-1 py-1.5 rounded border text-[10px] font-mono transition-all ${
                              layers === l
                                ? 'bg-white border-white text-black font-semibold'
                                : 'border-[#1c1c1c] text-gray-500'
                            }`}
                          >
                            {l} Layers
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-[#0c0c0c]/40 rounded border border-[#1c1c1c]">
                      <span className="text-[10px] font-mono text-gray-500">SMT ASSEMBLY</span>
                      <input
                        type="checkbox"
                        checked={smtAssembly}
                        onChange={(e) => setSmtAssembly(e.target.checked)}
                        className="w-3 h-3 accent-neutral-200 rounded"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono text-gray-500">SELECT FABRICATOR</label>
                      <div className="space-y-1">
                        {[
                          { id: 'jlc', name: 'JLCPCB (Economy)', quote: quotes.jlc },
                          { id: 'pcbway', name: 'PCBWay (Standard)', quote: quotes.pcbway },
                          { id: 'osh', name: 'OSH Park (Purple)', quote: quotes.osh }
                        ].map((fab) => (
                          <button
                            key={fab.id}
                            onClick={() => setSelectedFab(fab.id as 'jlc' | 'pcbway' | 'osh')}
                            className={`w-full p-2 rounded border text-left flex justify-between items-center transition-all ${
                              selectedFab === fab.id
                                ? 'bg-[#141414] border-white text-white font-semibold'
                                : 'bg-[#0a0a0d]/60 border-[#1c1c1c] text-gray-500 hover:text-gray-300'
                            }`}
                          >
                            <div className="flex flex-col text-[9px] font-mono">
                              <span className="font-sans font-semibold text-white">{fab.name}</span>
                              <span>Est: {fab.quote.time}</span>
                            </div>
                            <span className="text-xs font-bold text-white">${fab.quote.total}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="h-[1px] bg-[#1c1c1c] my-3" />

                    <div className="space-y-1.5 font-mono text-[10px] text-gray-500">
                      <div className="flex justify-between">
                        <span>PCB Fab Cost:</span>
                        <span className="text-white">${activeQuote.pcb}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Assembly:</span>
                        <span className="text-white">${activeQuote.assembly}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping:</span>
                        <span className="text-white">${activeQuote.shipping}</span>
                      </div>
                      <div className="flex justify-between text-white font-bold text-xs pt-1 border-t border-[#1c1c1c]">
                        <span>Total Quote:</span>
                        <span className="text-white">${activeQuote.total}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setOrdered(true)}
                      className="w-full mt-2 py-2 bg-white hover:bg-neutral-200 text-black font-bold text-[10px] rounded transition-all cursor-pointer text-center"
                    >
                      Place Order via API
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
