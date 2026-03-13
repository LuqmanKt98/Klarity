
import React from 'react';
import { ArrowLeft, Sparkles, Droplets, ShieldCheck, Zap } from 'lucide-react';

interface PhilosophyViewProps {
  onClose: () => void;
}

const PhilosophyView: React.FC<PhilosophyViewProps> = ({ onClose }) => {
  return (
    <div className="h-full flex flex-col animate-fade-in pt-8 pb-20">
      <header className="flex items-center gap-6 mb-12">
        <button 
          onClick={onClose}
          className="p-3 bg-white/40 backdrop-blur-md rounded-xl border border-white/50 shadow-sm transition-all hover:bg-white active:scale-90"
        >
          <ArrowLeft className="w-5 h-5 text-stone-800" />
        </button>
        <h2 className="manrope text-2xl text-stone-900 font-extrabold">Manifesto</h2>
      </header>

      <div className="flex-1 space-y-12">
        {/* Hero Concept */}
        <section className="space-y-4">
          <h1 className="manrope text-5xl text-stone-900 leading-[1.1] font-extrabold tracking-tight">
            The Art of <br />
            <span className="text-[#038C7F]">Convergence.</span>
          </h1>
          <p className="text-lg text-stone-500 font-medium leading-relaxed italic">
            "Chaos is only data waiting for a container."
          </p>
        </section>

        {/* Core Pillars */}
        <div className="space-y-10">
          <section className="bg-white/40 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/50 space-y-6">
            <div className="flex items-center gap-3 text-[#1F6373]">
              <Zap className="w-5 h-5" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.4em]">Resonant Dialogue</h3>
            </div>
            <p className="text-[15px] text-stone-600 leading-relaxed font-medium">
              Klarity doesn't just 'chat.' It uses a hybrid engine of psychological modalities—from CBT to Somatic Experiencing—to act as a mirror. By structuring your reflections into themes, we help you identify the 'Current' of your internal life.
            </p>
          </section>

          <section className="bg-white/40 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/50 space-y-6">
            <div className="flex items-center gap-3 text-[#038C7F]">
              <Droplets className="w-5 h-5" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.4em]">The Oasis Effect</h3>
            </div>
            <p className="text-[15px] text-stone-600 leading-relaxed font-medium">
              Stabilization is the prerequisite for growth. The Oasis is designed as a digital anchor—a high-aesthetic space for affirmations that have been manually 'Integrated' from your own insights or curated for your specific path.
            </p>
          </section>

          <section className="bg-white/40 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/50 space-y-6">
            <div className="flex items-center gap-3 text-[#F2808A]">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.4em]">Radical Integrity</h3>
            </div>
            <p className="text-[15px] text-stone-600 leading-relaxed font-medium">
              Your mind is your own. Klarity operates on a Local-First architecture. Your history, insights, and vulnerabilities stay in your browser's private storage. We believe privacy is the foundation of true psychological safety.
            </p>
          </section>
        </div>

        {/* Closing Quote */}
        <section className="text-center py-10 space-y-6">
          <div className="w-12 h-px bg-stone-200 mx-auto" />
          <p className="manrope text-xl text-stone-400 font-extrabold leading-relaxed px-4">
            Klarity is not a destination. <br />
            It is the lens through which <br />
            you see yourself.
          </p>
          <button 
            onClick={onClose}
            className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#038C7F] hover:opacity-70 transition-opacity"
          >
            Return to self
          </button>
        {/* Fix: Closed section tag correctly */}
        </section>
      </div>
    </div>
  );
};

export default PhilosophyView;
