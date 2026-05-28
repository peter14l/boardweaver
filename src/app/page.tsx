'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [animStep, setAnimStep] = useState(0);

  // Simple animation loop for the Hero board mockup
  useEffect(() => {
    const timer = setInterval(() => {
      setAnimStep((prev) => (prev + 1) % 4);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-[#fafafa] font-sans selection:bg-neutral-800 selection:text-white flex flex-col">
      {/* Top Header */}
      <nav className="max-w-6xl mx-auto w-full px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded border border-[#2c2c2c] bg-[#0c0c0c] flex items-center justify-center font-mono text-[10px] font-bold text-white">
            V
          </div>
          <span className="text-sm font-semibold tracking-tight">Boardweaver</span>
        </div>
        <Link
          href="/editor"
          className="px-3.5 py-1.5 bg-[#0e0e0e] hover:bg-[#141414] border border-[#222] hover:border-neutral-700 text-xs font-medium rounded transition-all"
        >
          Launch Studio
        </Link>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full px-6 py-12 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#1a1a1a] bg-[#0c0c0c]/40 text-[10px] font-mono text-gray-500 uppercase tracking-wider pulsing-indicator">
          <span>✦</span> Compiler engine v1.2 is active
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-white max-w-2xl leading-none">
          Compile PCBs from natural language.
        </h1>

        <p className="text-sm md:text-base text-gray-400 max-w-xl leading-relaxed">
          Describe your hardware requirements in plain text. Boardweaver automatically selects in-stock components, maps nets, validates electrical constraints, and routes multi-layer layouts in real-time.
        </p>

        <div className="flex gap-3">
          <Link
            href="/editor"
            className="px-5 py-2.5 bg-white hover:bg-neutral-200 text-black font-semibold text-xs rounded transition-all shadow-lg"
          >
            Launch Studio
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 bg-[#0c0c0c] hover:bg-[#141414] border border-[#1c1c1c] text-xs font-medium rounded transition-all"
          >
            View Documentation
          </a>
        </div>

        {/* Live Visual Board Mockup Showcase */}
        <div className="w-full max-w-2xl border border-[#1a1a1a] bg-[#080808] rounded-xl overflow-hidden shadow-2xl mt-10">
          {/* Header Bar */}
          <div className="px-4 py-3 border-b border-[#1a1a1a] bg-[#0c0c0c]/40 flex items-center justify-between">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-neutral-800" />
              <div className="w-2 h-2 rounded-full bg-neutral-800" />
              <div className="w-2 h-2 rounded-full bg-neutral-800" />
            </div>
            <span className="text-[10px] font-mono text-gray-500">Boardweaver layout_engine.log</span>
            <div className="w-4" />
          </div>

          <div className="grid md:grid-cols-2 text-left font-mono text-[10px] leading-relaxed">
            {/* Left Mock Prompt */}
            <div className="p-5 border-b md:border-b-0 md:border-r border-[#1a1a1a] space-y-4 bg-[#090909]/50">
              <div className="space-y-1">
                <span className="text-gray-500"># SPECIFICATION INPUT</span>
                <p className="text-xs text-white font-sans leading-normal">
                  &ldquo;A rechargeable USB-C LiPo battery charger board with status LEDs and overcurrent protection.&rdquo;
                </p>
              </div>

              <div className="space-y-1 border-t border-[#1a1a1a] pt-3">
                <span className="text-gray-500"># COMPILER STAGES</span>
                <div className="space-y-1">
                  <div className={animStep >= 0 ? 'text-white' : 'text-gray-600'}>
                    {animStep >= 0 ? '✓' : '○'} Stage 1: Component selection complete.
                  </div>
                  <div className={animStep >= 1 ? 'text-white' : 'text-gray-600'}>
                    {animStep >= 1 ? '✓' : '○'} Stage 2: Schematic nets resolved.
                  </div>
                  <div className={animStep >= 2 ? 'text-white' : 'text-gray-600'}>
                    {animStep >= 2 ? '✓' : '○'} Stage 3: Clearance constraints verified.
                  </div>
                  <div className={animStep >= 3 ? 'text-white' : 'text-gray-600'}>
                    {animStep >= 3 ? '✓' : '○'} Stage 4: Board traces fully routed.
                  </div>
                </div>
              </div>
            </div>

            {/* Right Mock Canvas Animation */}
            <div className="p-5 flex items-center justify-center bg-[#050505]">
              <svg className="w-48 h-32 border border-[#222] bg-[#080808] rounded" viewBox="0 0 60 40">
                {/* Board Edge */}
                <rect x="2" y="2" width="56" height="36" fill="none" stroke="#262626" strokeWidth="0.5" />
                
                {/* Component Placements (Fade-in or Render based on Anim Step) */}
                {animStep >= 0 && (
                  <>
                    {/* USB-C */}
                    <rect x="5" y="15" width="8" height="10" fill="none" stroke="#444" strokeWidth="0.5" />
                    <text x="9" y="21" fill="#444" fontSize="2" textAnchor="middle">J1</text>

                    {/* Charger IC */}
                    <rect x="25" y="12" width="10" height="8" fill="none" stroke="#444" strokeWidth="0.5" />
                    <text x="30" y="17" fill="#444" fontSize="2" textAnchor="middle">U1</text>

                    {/* Protection IC */}
                    <rect x="25" y="24" width="8" height="6" fill="none" stroke="#444" strokeWidth="0.5" />
                    <text x="29" y="28" fill="#444" fontSize="2" textAnchor="middle">U2</text>

                    {/* LED */}
                    <rect x="48" y="18" width="4" height="4" fill="none" stroke="#444" strokeWidth="0.5" />
                    <text x="50" y="21" fill="#444" fontSize="1.5" textAnchor="middle">D1</text>
                  </>
                )}

                {/* Nets & Wires (Step 1+) */}
                {animStep >= 1 && (
                  <>
                    {/* Pins highlights */}
                    <circle cx="13" cy="18" r="0.5" fill="#fafafa" />
                    <circle cx="25" cy="14" r="0.5" fill="#fafafa" />
                    <circle cx="25" cy="26" r="0.5" fill="#fafafa" />
                    <circle cx="48" cy="20" r="0.5" fill="#fafafa" />
                  </>
                )}

                {/* Routing Traces (Step 3+) */}
                {animStep >= 3 && (
                  <>
                    {/* VBUS Trace */}
                    <path d="M 13 18 L 20 18 L 20 14 L 25 14" fill="none" stroke="#fafafa" strokeWidth="0.5" strokeLinecap="round" />
                    {/* Signal Trace */}
                    <path d="M 35 16 L 42 16 L 42 20 L 48 20" fill="none" stroke="#525252" strokeWidth="0.4" strokeLinecap="round" />
                    {/* Protection Trace */}
                    <path d="M 30 20 L 30 24" fill="none" stroke="#222" strokeWidth="0.4" strokeLinecap="round" />
                  </>
                )}
              </svg>
            </div>
          </div>
        </div>
      </main>

      {/* Feature Grid */}
      <section className="border-t border-[#1a1a1a] bg-[#070707] py-16">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-4 gap-6 text-left">
          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold text-white">Schematic Synthesis</h3>
            <p className="text-[11px] text-gray-500 leading-normal">
              Resolves logical connections, maps nets, and creates schematic diagrams directly from descriptions.
            </p>
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold text-white">Reinforcement Routing</h3>
            <p className="text-[11px] text-gray-500 leading-normal">
              Computes multi-layer trace layouts using spatial constraint heuristics for high signal integrity.
            </p>
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold text-white">Validation Simulation</h3>
            <p className="text-[11px] text-gray-500 leading-normal">
              Runs Design Rule Checks (DRC) and basic electric parameter simulations to prevent hardware errors.
            </p>
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold text-white">KiCad Sync Bridge</h3>
            <p className="text-[11px] text-gray-500 leading-normal">
              A local daemon automatically writes compiled schematics and layout traces to your disk in real-time.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1a1a1a] py-8 text-center text-[10px] text-gray-600 font-mono">
        © 2026 Boardweaver AI. Open-source compiler engine.
      </footer>
    </div>
  );
}
