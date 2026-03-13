
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useKlarityStore } from '../store';
// Import Droplets icon from lucide-react
import { Heart, Plus, Minus, X, Trash2, Droplets } from 'lucide-react';

interface OasisViewProps { store: ReturnType<typeof useKlarityStore>; }

type SortOrder = 'newest' | 'oldest' | 'oracle' | 'favorites';

const sortOptions = [
  { label: 'Flow', value: 'oracle' },
  { label: 'Favorites', value: 'favorites' },
  { label: 'Oldest', value: 'oldest' },
  { label: 'Newest', value: 'newest' },
] as const;

const OasisView: React.FC<OasisViewProps> = ({ store }) => {
  const { affirmations, addAffirmation, removeAffirmation, toggleFavoriteAffirmation } = store;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sortOrder, setSortOrder] = useState<SortOrder>('oracle');
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [newText, setNewText] = useState('');
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const progressIntervalRef = useRef<number | null>(null);
  const DURATION = 4000; // 4 seconds

  const sortedAffirmations = useMemo(() => {
    let result = [...affirmations];
    if (sortOrder === 'newest') {
      result.reverse();
    } else if (sortOrder === 'oracle') {
      if (result.length > 1) {
        // The last item in the store is the most recently added
        const newest = result[result.length - 1];
        const others = result.slice(0, -1);
        
        // Fisher-Yates shuffle for the rest
        for (let i = others.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [others[i], others[j]] = [others[j], others[i]];
        }
        result = [newest, ...others];
      }
    } else if (sortOrder === 'favorites') {
      result.sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0));
    }
    return result;
  }, [affirmations, sortOrder]);

  const current = sortedAffirmations[currentIndex] || sortedAffirmations[0];

  const next = () => {
    if (sortedAffirmations.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % sortedAffirmations.length);
    setProgress(0);
  };

  const prev = () => {
    if (sortedAffirmations.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + sortedAffirmations.length) % sortedAffirmations.length);
    setProgress(0);
  };

  // Reset progress and index when sort changes
  useEffect(() => {
    setCurrentIndex(0);
    setProgress(0);
  }, [sortOrder]);

  // Auto-play logic
  useEffect(() => {
    if (isPaused || isAdding || isRemoving || sortedAffirmations.length === 0) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    const startTime = Date.now() - (progress / 100) * DURATION;
    
    progressIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = (elapsed / DURATION) * 100;
      
      if (newProgress >= 100) {
        next();
      } else {
        setProgress(newProgress);
      }
    }, 16); // ~60fps

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [currentIndex, isPaused, isAdding, isRemoving, sortedAffirmations.length]);

  const handleAdd = () => {
    if (!newText.trim()) return;
    addAffirmation({ 
      id: crypto.randomUUID(), 
      text: newText, 
      categoryTags: ['Self'], 
      isFavorite: false, 
      source: 'user' 
    });
    setNewText('');
    setIsAdding(false);
  };

  const handleConfirmRemove = () => {
    if (!current) return;
    const idToRemove = current.id;
    // Move to next slide before removing if possible
    if (sortedAffirmations.length > 1) {
      next();
    }
    removeAffirmation(idToRemove);
    setIsRemoving(false);
    setProgress(0);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setIsPaused(true);
  };

  const handlePointerUp = () => {
    setIsPaused(false);
  };

  const handleScreenClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    
    const x = e.clientX;
    const width = window.innerWidth;
    if (x < width / 3) {
      prev();
    } else {
      next();
    }
  };

  if (sortedAffirmations.length === 0) {
    return (
      <div className="fixed inset-0 z-20 bg-stone-900 flex flex-col items-center justify-center p-10 text-center text-white space-y-6">
        <Droplets className="w-12 h-12 text-stone-700" />
        <h2 className="manrope text-2xl font-bold">The Oasis is quiet.</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-white text-black px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest"
        >
          Add Insight
        </button>
      </div>
    );
  }

  return (
    <div 
      className="absolute inset-0 z-20 flex flex-col animate-fade-in touch-none select-none overflow-hidden"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={handleScreenClick}
      style={{
        backgroundImage: 'url("https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=2070&auto=format&fit=crop")',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />

      {/* Top UI */}
      <div className="relative z-10 px-10 pt-16 flex flex-col gap-6 items-center">
        {/* Progress Bars */}
        <div className="flex gap-1.5 h-[1.5px] w-full max-sm:px-4 w-full max-w-sm">
          {sortedAffirmations.map((_, idx) => (
            <div key={idx} className="flex-1 h-full bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white/70 transition-all duration-[16ms] ease-linear"
                style={{ 
                  width: idx === currentIndex ? `${progress}%` : idx < currentIndex ? '100%' : '0%' 
                }}
              />
            </div>
          ))}
        </div>

        <div className="text-[10px] text-white/40 font-bold uppercase tracking-[0.5em] drop-shadow-sm pt-2">
          {current?.categoryTags[0]}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-10 text-center">
        <h2 className="manrope text-4xl font-extrabold leading-tight text-white drop-shadow-2xl animate-scale-in max-w-sm">
          {current?.text}
        </h2>
      </div>

      {/* Bottom UI - Matching Screenshot Aesthetics */}
      <div className="relative z-10 px-8 pb-32 flex flex-col items-center gap-10">
        <div className="flex items-center justify-center gap-4">
          {/* Remove Current Button */}
          <button 
            onClick={(e) => { e.stopPropagation(); setIsRemoving(true); }}
            className="p-4 bg-white/5 backdrop-blur-2xl rounded-2xl text-white/40 hover:bg-rose-500 hover:text-white transition-all border border-white/5 shadow-xl"
          >
            <Minus className="w-5 h-5" />
          </button>
          
          {/* Integrate Button */}
          <button 
            onClick={(e) => { e.stopPropagation(); toggleFavoriteAffirmation(current.id); }}
            className={`flex items-center gap-3 px-10 py-5 rounded-full transition-all duration-500 backdrop-blur-md border ${
              current.isFavorite 
                ? 'bg-white text-black border-white shadow-2xl scale-105' 
                : 'bg-white/10 text-white/90 border-white/20 hover:bg-white/20'
            }`}
          >
            <Heart className={`w-4 h-4 ${current.isFavorite ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em]">
              {current.isFavorite ? 'Integrated' : 'Integrate'}
            </span>
          </button>

          {/* Add New Button */}
          <button 
            onClick={(e) => { e.stopPropagation(); setIsAdding(true); }}
            className="p-4 bg-white/5 backdrop-blur-2xl rounded-2xl text-white/40 hover:bg-white hover:text-black transition-all border border-white/5 shadow-xl"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Arrangement Picker */}
        <div 
          className="h-8 overflow-hidden relative w-full flex justify-center cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            const currentIndex = sortOptions.findIndex(o => o.value === sortOrder);
            const nextIndex = (currentIndex + 1) % sortOptions.length;
            setSortOrder(sortOptions[nextIndex].value);
          }}
        >
          <div 
            className="flex flex-col items-center transition-transform duration-500 ease-in-out"
            style={{ 
              transform: `translateY(-${sortOptions.findIndex(o => o.value === sortOrder) * 32}px)` 
            }}
          >
            {sortOptions.map((opt) => (
              <div 
                key={opt.value} 
                className="h-8 flex items-center justify-center shrink-0"
              >
                <span className={`text-[9px] uppercase tracking-[0.4em] transition-all duration-500 ${
                  sortOrder === opt.value ? 'text-white font-black opacity-100' : 'text-white/20 font-medium'
                }`}>
                  {opt.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Remove Confirmation Modal */}
      {isRemoving && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-[70] flex items-center justify-center p-8 animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-full max-w-xs bg-white rounded-[2.5rem] p-8 shadow-2xl animate-scale-in text-center">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-8 h-8 text-rose-400" />
            </div>
            <h4 className="manrope text-xl font-extrabold text-stone-900 mb-2">Remove Slide?</h4>
            <p className="text-stone-400 text-sm font-medium mb-8 leading-relaxed">This insight will fade from your Oasis, but its resonance remains.</p>
            <div className="flex flex-col gap-3">
              <button onClick={handleConfirmRemove} className="w-full py-4 bg-[#1A1A1A] rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] text-white hover:opacity-90 transition-opacity">Yes, Remove</button>
              <button onClick={() => setIsRemoving(false)} className="w-full py-4 bg-stone-50 rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] text-stone-400 hover:bg-stone-100 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {isAdding && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-[60] flex items-center justify-center p-8"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-full max-w-sm space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="manrope text-2xl text-white">New Insight</h3>
              <button onClick={() => setIsAdding(false)} className="text-white/40 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <textarea 
              autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-8 min-h-[200px] focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all text-white placeholder-white/20 text-xl leading-relaxed font-medium"
              placeholder="What truth are you observing?"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
            />
            <button 
              onClick={handleAdd}
              className="w-full py-5 bg-white text-black rounded-2xl font-bold text-[11px] uppercase tracking-widest shadow-2xl active:scale-95 transition-transform"
            >
              Preserve
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OasisView;
