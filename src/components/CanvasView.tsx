'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ProjectScenario } from '../lib/scenarios';
import { ValidationReport } from '../lib/validator';

interface CanvasViewProps {
  scenario: ProjectScenario;
  status: 'idle' | 'running' | 'success';
  validationReport: ValidationReport;
  onUpdateScenario: (updates: Partial<ProjectScenario>) => void;
}

type TabType = 'schematic' | 'pcb' | '3d';

export default function CanvasView({ 
  scenario, 
  status, 
  validationReport, 
  onUpdateScenario 
}: CanvasViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('schematic');
  const [activeLayer, setActiveLayer] = useState<'F.Cu' | 'B.Cu' | 'All'>('All');
  const [showDiff, setShowDiff] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation3d, setRotation3d] = useState({ x: 60, y: 0, z: -30 });
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [hoveredPin, setHoveredPin] = useState<{ compId: string; pinNum: string } | null>(null);
  const [draggedCompId, setDraggedCompId] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 900, height: 600 });
  
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      setContainerSize({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight
      });
    }
    const handleResize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Pre-calculate scales for DND
  const { pcbFitScale, pcbOffsetX, pcbOffsetY } = useMemo(() => {
    const containerW = containerSize.width;
    const containerH = containerSize.height;
    const pcbPadding = 80;
    const pcbScaleX = (containerW - pcbPadding * 2) / scenario.boardWidth;
    const pcbScaleY = (containerH - pcbPadding * 2) / scenario.boardHeight;
    const fitScale = Math.min(pcbScaleX, pcbScaleY);
    const offsetX = (containerW - scenario.boardWidth * fitScale) / 2;
    const offsetY = (containerH - scenario.boardHeight * fitScale) / 2;
    return { pcbFitScale: fitScale, pcbOffsetX: offsetX, pcbOffsetY: offsetY };
  }, [containerSize, scenario.boardWidth, scenario.boardHeight]);

  const handleMouseDown = (e: React.MouseEvent, compId?: string) => {
    isDragging.current = true;
    if (compId && activeTab === 'pcb') {
      setDraggedCompId(compId);
      const comp = scenario.pcbComponents.find(c => c.id === compId);
      if (comp) {
        dragStart.current = { x: e.clientX, y: e.clientY };
      }
    } else {
      if (activeTab === '3d') {
        dragStart.current = { x: e.clientX - rotation3d.z, y: e.clientY - rotation3d.x };
      } else {
        dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    
    if (draggedCompId && activeTab === 'pcb') {
      const dx = (e.clientX - dragStart.current.x) / (pcbFitScale * zoom);
      const dy = (e.clientY - dragStart.current.y) / (pcbFitScale * zoom);
      
      const newPcbComponents = scenario.pcbComponents.map(c => {
        if (c.id === draggedCompId) {
          return { ...c, x: c.x + dx, y: c.y + dy };
        }
        return c;
      });
      
      onUpdateScenario({ pcbComponents: newPcbComponents });
      dragStart.current = { x: e.clientX, y: e.clientY };
    } else if (activeTab === '3d') {
      const deltaX = e.clientX - dragStart.current.x;
      const deltaY = e.clientY - dragStart.current.y;
      setRotation3d({
        x: Math.max(10, Math.min(85, deltaY)),
        y: 0,
        z: deltaX,
      });
    } else {
      setPan({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    setDraggedCompId(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    const newZoom = e.deltaY < 0 ? zoom * zoomFactor : zoom / zoomFactor;
    setZoom(Math.max(0.2, Math.min(newZoom, 10)));
  };

  const resetView = () => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
    setRotation3d({ x: 60, y: 0, z: -30 });
  };

  const getNetName = (compId: string, pinNum: string): string => {
    const net = scenario.nets.find(n =>
      n.connections.some(c => c.componentId === compId && c.pinNum === pinNum)
    );
    return net ? net.name : 'NC (No Connect)';
  };

  const getDRCError = (type: 'component' | 'net', id: string) => {
    return validationReport.errors.find(err => 
      (type === 'component' && err.componentId === id) || 
      (type === 'net' && err.netName === id)
    );
  };

  // --- Pre-compute 3D board dimensions ---
  const boardAspect = scenario.boardWidth / scenario.boardHeight;
  const maxBoardW = 560;
  const maxBoardH = 360;
  let board3dW = maxBoardW;
  let board3dH = board3dW / boardAspect;
  if (board3dH > maxBoardH) { board3dH = maxBoardH; board3dW = board3dH * boardAspect; }

  return (
    <div className="flex-1 flex flex-col bg-[#050505] min-w-0 h-full relative" key={`${scenario.id}-${activeTab}`}>
      {/* Sub Header / Tab Bar */}
      <div className="flex items-center justify-between border-b border-[#1c1c1c] bg-[#080808] px-6 py-2">
        <div className="flex gap-1.5">
          {(['schematic', 'pcb', '3d'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded text-xs font-sans transition-all ${
                activeTab === tab
                  ? 'bg-[#141414] text-white border border-[#2d2d2d]'
                  : 'text-gray-500 hover:text-white border border-transparent'
              }`}
            >
              {tab === 'pcb' ? 'PCB Layout' : tab === '3d' ? '3D View' : 'Schematic'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {activeTab === 'pcb' && (
            <>
              {/* Git Diff Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 font-mono">DIFF VIEW:</span>
                <button
                  onClick={() => setShowDiff(!showDiff)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${
                    showDiff
                      ? 'bg-neutral-800 border-neutral-700 text-white'
                      : 'bg-[#0c0c0c] border-[#1c1c1c] text-gray-500 hover:text-white'
                  }`}
                >
                  {showDiff ? 'On' : 'Off'}
                </button>
              </div>

              {/* Layer Controls */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-gray-500 font-mono">LAYER:</span>
                <div className="flex bg-[#0c0c0c] border border-[#1c1c1c] rounded p-0.5">
                  {(['All', 'F.Cu', 'B.Cu'] as const).map((layer) => (
                    <button
                      key={layer}
                      onClick={() => setActiveLayer(layer)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
                        activeLayer === layer
                          ? 'bg-[#1c1c1c] text-white font-semibold'
                          : 'text-gray-500 hover:text-white'
                      }`}
                    >
                      {layer}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <button
            onClick={resetView}
            className="text-[10px] text-gray-400 hover:text-white font-mono bg-[#0c0c0c] border border-[#1c1c1c] px-2 py-0.5 rounded transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div
        ref={containerRef}
        onMouseDown={(e) => handleMouseDown(e)}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className="flex-1 relative overflow-hidden select-none cursor-grab active:cursor-grabbing flex items-center justify-center"
      >
        {status === 'running' && (
          <div className="absolute inset-0 bg-[#050505]/75 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-2 border-neutral-800 border-t-neutral-100 rounded-full animate-spin mb-3" />
            <div className="text-[10px] font-mono text-gray-400">COMPILING...</div>
          </div>
        )}

        {status === 'idle' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-8 bg-[#050505]">
            <div className="w-12 h-12 rounded border border-[#1c1c1c] bg-[#0c0c0c] flex items-center justify-center text-xl mb-4">
              ⌨️
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">Vibe PCB Editor</h3>
            <p className="text-[11px] text-gray-500 max-w-xs">
              Enter a specification to compile circuit traces and layout boards.
            </p>
          </div>
        )}

        {status === 'success' && activeTab === '3d' && (
          // --- 3D VIEW ---
          <div
            style={{ width: board3dW, height: board3dH, perspective: '1200px' }}
            className="relative transition-transform duration-100 ease-out"
          >
            <div
              className="w-full h-full bg-[#1c2c22] border border-[#2d2d2d] rounded relative shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)]"
              style={{
                transform: `rotateX(${rotation3d.x}deg) rotateY(${rotation3d.y}deg) rotateZ(${rotation3d.z}deg) scale(${zoom})`,
                transformStyle: 'preserve-3d',
                transformOrigin: 'center center',
              }}
            >
              {/* traces overlay */}
              <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ transform: 'translateZ(1px)' }}>
                <svg className="w-full h-full" viewBox={`0 0 ${scenario.boardWidth} ${scenario.boardHeight}`} preserveAspectRatio="none">
                  {scenario.traces.map((trace, idx) => (
                    <path
                      key={idx}
                      d={trace.points.map((p, pIdx) => `${pIdx === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ')}
                      fill="none"
                      stroke={trace.layer === 'F.Cu' ? '#fff' : '#444'}
                      strokeWidth={trace.width * 1.5}
                    />
                  ))}
                </svg>
              </div>

              {/* 3D component shapes */}
              {scenario.pcbComponents.map((comp) => {
                const posX = (comp.x / scenario.boardWidth) * 100;
                const posY = (comp.y / scenario.boardHeight) * 100;
                const compW = (comp.width / scenario.boardWidth) * board3dW;
                const compH = (comp.height / scenario.boardHeight) * board3dH;
                const heightZ = comp.id.startsWith('U') ? '6px' : '2px';
                const compColor = comp.id.startsWith('U') ? '#121212' : '#222222';

                return (
                  <div
                    key={comp.id}
                    className="absolute flex items-center justify-center select-none border border-neutral-900 rounded-sm overflow-hidden"
                    style={{
                      left: `${posX}%`,
                      top: `${posY}%`,
                      width: `${Math.max(compW, 10)}px`,
                      height: `${Math.max(compH, 6)}px`,
                      backgroundColor: compColor,
                      transform: `translate(-50%, -50%) translateZ(2px) rotate(${comp.rotation}deg)`,
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{
                        transform: `translateZ(${heightZ})`,
                        backgroundColor: '#171717',
                        border: '1px solid #2d2d2d',
                        fontSize: `${Math.max(Math.min(compW / 3, 9), 5)}px`,
                        color: '#fff',
                        fontFamily: 'monospace',
                      }}
                    >
                      {comp.id}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {status === 'success' && activeTab === 'schematic' && (
          // --- SCHEMATIC VIEW ---
          <svg
            className="w-full h-full"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center',
            }}
          >
            <g transform="translate(100, 80)">
              {scenario.nets.map((net, netIdx) => {
                const netErr = getDRCError('net', net.name);
                return net.connections.map((conn, connIdx) => {
                  const comp = scenario.components.find(c => c.id === conn.componentId);
                  if (!comp) return null;
                  
                  const pinIndex = comp.pins.findIndex(p => p.num === conn.pinNum);
                  if (pinIndex === -1) return null;

                  const halfPins = Math.ceil(comp.pins.length / 2);
                  const isLeft = pinIndex < comp.pins.length / 2;
                  const pinX = isLeft ? comp.x - 12 : comp.x + comp.width + 12;
                  const pinY = comp.y + 35 + (pinIndex % halfPins) * 24;

                  const nextConn = net.connections[(connIdx + 1) % net.connections.length];
                  const nextComp = scenario.components.find(c => c.id === nextConn.componentId);
                  if (!nextComp) return null;
                  const nextPinIndex = nextComp.pins.findIndex(p => p.num === nextConn.pinNum);
                  const nextHalfPins = Math.ceil(nextComp.pins.length / 2);
                  const nextIsLeft = nextPinIndex < nextComp.pins.length / 2;
                  const nextPinX = nextIsLeft ? nextComp.x - 12 : nextComp.x + nextComp.width + 12;
                  const nextPinY = nextComp.y + 35 + (nextPinIndex % nextHalfPins) * 24;

                  return (
                    <g key={`${netIdx}-${connIdx}`}>
                      <path
                        d={`M ${pinX} ${pinY} H ${(pinX + nextPinX) / 2} V ${nextPinY} H ${nextPinX}`}
                        fill="none"
                        stroke={netErr ? (netErr.type === 'error' ? '#ef4444' : '#f59e0b') : '#262626'}
                        strokeWidth={netErr ? 2 : 1}
                        className={`transition-all cursor-pointer ${netErr ? 'animate-pulse' : 'opacity-80 hover:stroke-white'}`}
                      />
                      <circle cx={pinX} cy={pinY} r={2} fill={netErr ? (netErr.type === 'error' ? '#ef4444' : '#f59e0b') : '#525252'} />
                    </g>
                  );
                });
              })}

              {scenario.components.map((comp) => {
                const isHovered = hoveredElement === comp.id;
                const compErr = getDRCError('component', comp.id);
                const halfPins = Math.ceil(comp.pins.length / 2);
                const boxHeight = Math.max(comp.height, 45 + halfPins * 24);

                let strokeColor = '#1c1c1c';
                if (isHovered) strokeColor = '#fafafa';
                if (compErr) strokeColor = compErr.type === 'error' ? '#ef4444' : '#f59e0b';

                return (
                  <g
                    key={comp.id}
                    onMouseEnter={() => setHoveredElement(comp.id)}
                    onMouseLeave={() => setHoveredElement(null)}
                    className="cursor-pointer"
                  >
                    <rect
                      x={comp.x}
                      y={comp.y}
                      width={comp.width}
                      height={boxHeight}
                      fill="#080808"
                      stroke={strokeColor}
                      strokeWidth={compErr ? 2 : 1}
                      rx={2}
                      className={compErr ? 'animate-pulse' : ''}
                    />
                    <text x={comp.x + 8} y={comp.y - 8} fill="#fff" className="text-[10px] font-mono font-bold">
                      {comp.id}
                    </text>
                    <text x={comp.x + 8} y={comp.y + 18} fill="#a3a3a3" className="text-[10px] font-sans font-semibold">
                      {comp.name}
                    </text>
                    <text x={comp.x + 8} y={comp.y + 30} fill="#525252" className="text-[8px] font-mono">
                      {comp.value}
                    </text>

                    {comp.pins.map((pin, pinIdx) => {
                      const isLeft = pinIdx < comp.pins.length / 2;
                      const pinX = isLeft ? comp.x : comp.x + comp.width;
                      const pinY = comp.y + 35 + (pinIdx % halfPins) * 24;
                      const textX = isLeft ? pinX + 10 : pinX - 10;
                      const textAnchor = isLeft ? 'start' : 'end';

                      return (
                        <g
                          key={pin.num}
                          onMouseEnter={() => setHoveredPin({ compId: comp.id, pinNum: pin.num })}
                          onMouseLeave={() => setHoveredPin(null)}
                        >
                          <line
                            x1={isLeft ? pinX - 12 : pinX}
                            y1={pinY}
                            x2={isLeft ? pinX : pinX + 12}
                            y2={pinY}
                            stroke="#1c1c1c"
                            strokeWidth={1}
                          />
                          <text x={textX} y={pinY + 3} textAnchor={textAnchor} fill="#525252" className="text-[8px] font-mono">
                            {pin.name}
                          </text>
                          <text
                            x={isLeft ? pinX - 6 : pinX + 6}
                            y={pinY - 4}
                            textAnchor={isLeft ? 'end' : 'start'}
                            fill="#525252"
                            className="text-[7px] font-mono"
                          >
                            {pin.num}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                );
              })}
            </g>
          </svg>
        )}

        {status === 'success' && activeTab === 'pcb' && (
          // --- PCB LAYOUT VIEW ---
          <svg
            className="w-full h-full"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center',
            }}
          >
            <g transform={`translate(${pcbOffsetX}, ${pcbOffsetY}) scale(${pcbFitScale})`}>
              {/* Board outline */}
              <rect
                x={0}
                y={0}
                width={scenario.boardWidth}
                height={scenario.boardHeight}
                fill="#0a0a0a"
                stroke="#262626"
                strokeWidth={0.5}
                rx={1}
              />

              {/* Traces */}
              {scenario.traces
                .filter((trace) => {
                  if (activeLayer === 'All') return true;
                  return trace.layer === activeLayer;
                })
                .map((trace, idx) => {
                  const netErr = getDRCError('net', trace.net);
                  let strokeColor = trace.layer === 'F.Cu' ? '#444' : '#222';

                  if (netErr) strokeColor = netErr.type === 'error' ? '#ef4444' : '#f59e0b';
                  else if (showDiff && idx % 3 === 0) strokeColor = '#fff';

                  return (
                    <path
                      key={idx}
                      d={trace.points.map((p, pIdx) => `${pIdx === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ')}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={netErr ? trace.width * 2 : trace.width}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`transition-all cursor-pointer ${netErr ? 'animate-pulse' : 'hover:stroke-white'}`}
                    />
                  );
                })}

              {/* Footprints */}
              {scenario.pcbComponents.map((comp) => {
                const isHovered = hoveredElement === comp.id;
                const isDragged = draggedCompId === comp.id;
                const compErr = getDRCError('component', comp.id);
                
                let outlineColor = '#262626';
                if (isHovered || isDragged) outlineColor = '#fff';
                if (compErr) outlineColor = compErr.type === 'error' ? '#ef4444' : '#f59e0b';

                return (
                  <g
                    key={comp.id}
                    transform={`translate(${comp.x}, ${comp.y}) rotate(${comp.rotation})`}
                    onMouseEnter={() => setHoveredElement(comp.id)}
                    onMouseLeave={() => setHoveredElement(null)}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleMouseDown(e, comp.id);
                    }}
                    className="cursor-pointer"
                  >
                    <rect
                      x={-comp.width / 2}
                      y={-comp.height / 2}
                      width={comp.width}
                      height={comp.height}
                      fill={compErr ? (compErr.type === 'error' ? '#ef444411' : '#f59e0b11') : 'none'}
                      stroke={outlineColor}
                      strokeWidth={compErr ? 0.4 : 0.2}
                      className={compErr ? 'animate-pulse' : ''}
                    />

                    <text
                      x={0}
                      y={0}
                      transform="scale(0.15)"
                      textAnchor="middle"
                      fill={compErr ? (compErr.type === 'error' ? '#ef4444' : '#f59e0b') : '#525252'}
                      className="font-mono select-none pointer-events-none"
                    >
                      {comp.id}
                    </text>

                    {comp.pads.map((pad) => {
                      return (
                        <rect
                          key={pad.num}
                          x={pad.x - pad.w / 2}
                          y={pad.y - pad.h / 2}
                          width={pad.w}
                          height={pad.h}
                          rx={pad.shape === 'circle' ? pad.w / 2 : 0.05}
                          fill="#404040"
                          stroke="#171717"
                          strokeWidth={0.05}
                          onMouseEnter={(e) => {
                            e.stopPropagation();
                            setHoveredPin({ compId: comp.id, pinNum: pad.num });
                          }}
                          onMouseLeave={() => setHoveredPin(null)}
                        />
                      );
                    })}
                  </g>
                );
              })}
            </g>
          </svg>
        )}

        {/* Tooltip */}
        {status === 'success' && (hoveredElement || hoveredPin) && (
          <div className="absolute bottom-6 left-6 p-3.5 bg-[#0c0c0c] border border-[#1c1c1c] rounded shadow-2xl backdrop-blur z-30 font-mono text-[10px] text-gray-400 pointer-events-none space-y-0.5">
            {hoveredPin ? (
              <>
                <div className="text-white font-bold mb-1">PIN SPEC</div>
                <div>Component: {hoveredPin.compId}</div>
                <div>Pin: {hoveredPin.pinNum}</div>
                <div>Net: <span className="text-white">{getNetName(hoveredPin.compId, hoveredPin.pinNum)}</span></div>
              </>
            ) : (
              <>
                <div className="text-white font-bold mb-1">COMPONENT SPEC</div>
                <div>Designator: {hoveredElement}</div>
                <div>Name: {scenario.components.find(c => c.id === hoveredElement)?.name || 'Generic'}</div>
                {getDRCError('component', hoveredElement!) && (
                  <div className="mt-2 text-rose-400 border-t border-[#1c1c1c] pt-2">
                    {getDRCError('component', hoveredElement!)?.message}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
