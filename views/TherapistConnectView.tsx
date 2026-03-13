
import React, { useState } from 'react';
import { ArrowLeft, Send, CheckCircle2, Info } from 'lucide-react';

interface TherapistConnectViewProps {
  onClose: () => void;
}

const TherapistConnectView: React.FC<TherapistConnectViewProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    focusArea: '',
    intensityPreference: 'gentle'
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate pairing logic
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 2000);
  };

  if (isSubmitted) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-10 text-center space-y-10 animate-fade-in">
        <div className="w-24 h-24 bg-[#5CF2BB]/20 rounded-[2.5rem] flex items-center justify-center animate-scale-in">
          <CheckCircle2 className="w-12 h-12 text-[#038C7F]" strokeWidth={1.5} />
        </div>
        <div className="space-y-4">
          <h2 className="manrope text-3xl text-stone-900 font-extrabold">Pairing Initiated</h2>
          <p className="text-stone-400 text-sm font-medium leading-relaxed max-w-[280px] mx-auto">
            Your journey toward clinical resonance has begun. A human guide will contact you within 24 hours to begin tuning your digital presence.
          </p>
        </div>
        <button 
          onClick={onClose}
          className="bg-[#1A1A1A] text-white px-12 py-5 rounded-2xl font-bold text-[10px] uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all"
        >
          Return to Insights
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col animate-fade-in pt-8">
      <header className="flex items-center gap-6 mb-12">
        <button 
          onClick={onClose}
          className="p-3 bg-white/40 backdrop-blur-md rounded-xl border border-white/50 shadow-sm transition-all hover:bg-white active:scale-90"
        >
          <ArrowLeft className="w-5 h-5 text-stone-800" />
        </button>
        <h2 className="manrope text-2xl text-stone-900 font-extrabold">Clinical Alignment</h2>
      </header>

      <div className="flex-1 space-y-10">
        <section className="bg-white/40 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/50 space-y-6">
          <div className="flex items-center gap-3 text-[#1F6373]">
            <Info className="w-5 h-5" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.4em]">Hybrid Continuity</h3>
          </div>
          <p className="text-[14px] text-stone-600 leading-relaxed font-medium italic">
            "Your human guide actively trains the Klarity digital engine to mirror their specific clinical approach, ensuring your support is seamless whether you are in a session or reflecting 24/7."
          </p>
        </section>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-stone-400 px-1">Full Name</label>
            <input 
              required
              className="w-full bg-white/80 border border-stone-100 rounded-2xl px-6 py-4 text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#5CF2BB]/50"
              placeholder="How should we address you?"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-stone-400 px-1">Focus Area</label>
            <select 
              className="w-full bg-white/80 border border-stone-100 rounded-2xl px-6 py-4 text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#5CF2BB]/50 appearance-none"
              value={formData.focusArea}
              onChange={e => setFormData({...formData, focusArea: e.target.value})}
            >
              <option value="">Select Primary Focus</option>
              <option value="anxiety">Anxiety & Regulation</option>
              <option value="growth">Existential Growth</option>
              <option value="trauma">Somatic Processing</option>
              <option value="relationships">Relational Dynamics</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-stone-400 px-1">Email Alignment</label>
            <input 
              required
              type="email"
              className="w-full bg-white/80 border border-stone-100 rounded-2xl px-6 py-4 text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#5CF2BB]/50"
              placeholder="Email for pairing details"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="pt-8 pb-12">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#1A1A1A] py-6 rounded-2xl flex items-center justify-center gap-4 text-[11px] font-bold uppercase tracking-[0.4em] text-[#5CF2BB] hover:opacity-90 transition-all active:scale-95 shadow-2xl disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-[#5CF2BB]/20 border-t-[#5CF2BB] rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Request Guide Pairing
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TherapistConnectView;
