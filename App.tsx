
import React, { useState, useEffect, useRef } from 'react';
import GuitarString from './components/GuitarString';
import Controls from './components/Controls';
import { audioEngine } from './services/audioEngine';
import { ToneSettings, AITip, InstrumentProfile } from './types';
import { getToneAdvice } from './services/geminiService';
import { downloadSourceCode } from './services/exportService';

const INSTRUMENTS: InstrumentProfile[] = [
  {
    id: 'electric_guitar',
    name: 'Chitarra Lead',
    icon: 'fa-guitar',
    oscType: 'sawtooth',
    attack: 0.005,
    release: 0.1,
    filterFreq: 4000,
    color: '#f59e0b',
    notes: [
      { note: 'E', freq: 82.41 }, { note: 'A', freq: 110.00 }, { note: 'D', freq: 146.83 },
      { note: 'G', freq: 196.00 }, { note: 'B', freq: 246.94 }, { note: 'E', freq: 329.63 }
    ]
  },
  {
    id: 'saxophone',
    name: 'Sax Tenore',
    icon: 'fa-sax-hot',
    oscType: 'square',
    attack: 0.08,
    release: 0.15,
    filterFreq: 1200,
    color: '#fbbf24',
    notes: [
      { note: 'Bb', freq: 116.54 }, { note: 'D', freq: 146.83 }, { note: 'F', freq: 174.61 },
      { note: 'A', freq: 220.00 }, { note: 'C', freq: 261.63 }, { note: 'Eb', freq: 311.13 }
    ]
  },
  {
    id: 'flute',
    name: 'Flauto Traverso',
    icon: 'fa-wind',
    oscType: 'sine',
    attack: 0.12,
    release: 0.2,
    filterFreq: 6000,
    color: '#22d3ee',
    notes: [
      { note: 'G', freq: 392.00 }, { note: 'A', freq: 440.00 }, { note: 'B', freq: 493.88 },
      { note: 'C', freq: 523.25 }, { note: 'D', freq: 587.33 }, { note: 'E', freq: 659.25 }
    ]
  },
  {
    id: 'bass',
    name: 'Basso Elettrico',
    icon: 'fa-drum',
    oscType: 'triangle',
    attack: 0.01,
    release: 0.05,
    filterFreq: 600,
    color: '#ef4444',
    notes: [
      { note: 'E', freq: 41.20 }, { note: 'A', freq: 55.00 }, { note: 'D', freq: 73.42 }, { note: 'G', freq: 98.00 }
    ]
  }
];

const App: React.FC = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const [currentInst, setCurrentInst] = useState<InstrumentProfile>(INSTRUMENTS[0]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<ToneSettings>({
    gain: 0.6,
    distortion: 0.3,
    tone: 0.5,
    reverb: 0.2
  });
  const [aiTip, setAiTip] = useState<AITip | null>(null);
  const [isLoadingTip, setIsLoadingTip] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const startApp = async () => {
    await audioEngine.init();
    audioEngine.setProfile(currentInst);
    setHasStarted(true);
  };

  useEffect(() => {
    if (hasStarted) {
      audioEngine.setProfile(currentInst);
      audioEngine.updateSettings(settings);
    }
  }, [currentInst, hasStarted, settings]);

  const fetchAdvice = async () => {
    setIsLoadingTip(true);
    const advice = await getToneAdvice(settings);
    setAiTip(advice);
    setIsLoadingTip(false);
  };

  const handleExport = async () => {
    setIsExporting(true);
    await downloadSourceCode();
    setIsExporting(false);
  };

  if (!hasStarted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <div className="text-center p-8 max-w-md animate-slide-in">
          <div className="mb-8 flex justify-center">
            <div className="w-24 h-24 bg-amber-500 rounded-full flex items-center justify-center animate-pulse shadow-[0_0_60px_rgba(245,158,11,0.4)]">
              <i className="fa-solid fa-music text-5xl text-black"></i>
            </div>
          </div>
          <h1 className="text-5xl font-black mb-4 tracking-tighter text-white uppercase">MultiStudio Pro</h1>
          <p className="text-zinc-500 mb-8 font-light text-lg">Suona qualsiasi strumento con un tocco.</p>
          <button 
            onClick={startApp}
            className="w-full py-5 bg-white text-black font-black text-xl rounded-2xl hover:bg-amber-500 hover:text-white transition-all transform active:scale-95 shadow-2xl shadow-amber-500/20"
          >
            INIZIA ORA
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center p-4 md:p-8 safe-area-inset selection:bg-amber-500 selection:text-black">
      {/* Header con Selettore Strumento e Download */}
      <header className="w-full max-w-6xl flex flex-wrap justify-between items-center gap-4 mb-8 relative z-50">
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-4 px-5 py-3 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl hover:bg-zinc-800 transition-all active:scale-95 shadow-lg"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <i className={`fa-solid ${currentInst.icon} text-black text-lg`}></i>
            </div>
            <div className="text-left">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Strumento</p>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                {currentInst.name} 
                <i className={`fa-solid fa-chevron-down text-[10px] transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`}></i>
              </h2>
            </div>
          </button>

          {isMenuOpen && (
            <div className="absolute top-full left-0 mt-3 w-64 bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-slide-in">
              <div className="p-2 space-y-1">
                {INSTRUMENTS.map((inst) => (
                  <button
                    key={inst.id}
                    onClick={() => { setCurrentInst(inst); setIsMenuOpen(false); }}
                    className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all text-left ${currentInst.id === inst.id ? 'bg-amber-500 text-black' : 'hover:bg-white/5 text-zinc-400'}`}
                  >
                    <i className={`fa-solid ${inst.icon} w-6 text-center text-lg`}></i>
                    <span className="font-bold text-sm">{inst.name}</span>
                    {currentInst.id === inst.id && <i className="fa-solid fa-check ml-auto text-xs"></i>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="px-5 py-3 bg-zinc-900/50 border border-white/5 rounded-2xl text-xs font-black hover:bg-zinc-800 transition-all flex items-center gap-3 active:scale-95 text-zinc-400 hover:text-white"
            title="Download Sorgente ZIP"
          >
            <i className={`fa-solid fa-file-zipper ${isExporting ? 'animate-bounce' : ''}`}></i>
            <span className="hidden sm:inline tracking-widest">ZIP CODE</span>
          </button>
          
          <button 
            onClick={fetchAdvice}
            disabled={isLoadingTip}
            className="group px-6 py-3 bg-zinc-900 border border-white/10 rounded-2xl text-xs font-black hover:bg-zinc-800 transition-all flex items-center gap-3 active:scale-95 shadow-lg"
          >
            <i className={`fa-solid fa-wand-magic-sparkles ${isLoadingTip ? 'animate-spin' : 'text-amber-500 group-hover:scale-125 transition-transform'}`}></i>
            <span className="hidden sm:inline tracking-widest">CONSIGLIO AI</span>
          </button>
        </div>
      </header>

      {/* Area di Esecuzione */}
      <main className="w-full max-w-6xl flex flex-col lg:flex-row gap-8 items-stretch flex-1 mb-8 overflow-hidden">
        
        {/* String Area */}
        <div className="flex-1 bg-gradient-to-b from-zinc-900/50 to-black/50 rounded-[50px] border border-white/5 p-4 md:p-12 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col justify-center">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, white 0.5px, transparent 0.5px)', backgroundSize: '60px 60px' }}></div>
          
          <div className="flex flex-col h-full justify-around py-6 gap-2">
            {currentInst.notes.map((s, idx) => (
              <GuitarString 
                key={`${currentInst.id}-${idx}`} 
                frequency={s.freq} 
                label={s.note} 
                color={currentInst.color}
              />
            ))}
          </div>
        </div>

        {/* Pannello Controlli */}
        <div className="w-full lg:w-80 flex flex-col gap-6">
          <Controls settings={settings} onChange={setSettings} />
          
          {aiTip && (
            <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-[30px] animate-slide-in">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                  <i className="fa-solid fa-bolt text-black text-[10px]"></i>
                </div>
                <h3 className="text-[11px] font-black text-amber-500 uppercase tracking-widest">{aiTip.title}</h3>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed font-medium">"{aiTip.content}"</p>
            </div>
          )}
          
          <div className="mt-auto p-6 rounded-[30px] bg-zinc-900/30 border border-white/5 hidden lg:block">
            <h4 className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em] mb-4">Statistiche Sessione</h4>
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-zinc-500">QUALITÀ AUDIO</span>
                <span className="text-emerald-500">ECCELLENTE</span>
              </div>
              <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div className="w-full h-full bg-emerald-500"></div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full max-w-6xl flex justify-between items-center text-zinc-700 text-[10px] uppercase tracking-[0.3em] font-black pb-4">
        <div className="flex items-center gap-4">
          <span>HIFI SYNTH ENGINE V2.0</span>
          <span className="w-1 h-1 bg-zinc-800 rounded-full"></span>
          <span>LATENCY: 4MS</span>
        </div>
        <div>
          PRO STUDIO MODE • {currentInst.name.toUpperCase()}
        </div>
      </footer>
    </div>
  );
};

export default App;
