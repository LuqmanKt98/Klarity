
import React, { useState, useMemo, useEffect } from 'react';
import { useKlarityStore } from '../store';
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis, Tooltip } from 'recharts';
import { Sparkles, Calendar, BookOpen, UserCircle, ExternalLink, ChevronDown, UserPlus, RefreshCw } from 'lucide-react';
import { generateRecommendedResources } from '../aiService';

interface InsightsViewProps { 
  store: ReturnType<typeof useKlarityStore>; 
  onConnectTherapist?: () => void;
}

type TimeRange = '7day' | 'monthly' | 'yearly' | 'all';

const InsightsView: React.FC<InsightsViewProps> = ({ store, onConnectTherapist }) => {
  const { threads, therapistNotes, recommendedResources, updateRecommendedResources } = store;
  const [timeRange, setTimeRange] = useState<TimeRange>('7day');
  const [showRangePicker, setShowRangePicker] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const messagesWithMood = useMemo(() => 
    threads.flatMap(t => t.messages).filter(m => m.inferredMoodScore !== undefined),
    [threads]
  );
  
  const refreshResources = async () => {
    if (threads.length === 0) return;
    setIsRefreshing(true);
    const allMessages = threads.flatMap(t => t.messages).sort((a,b) => b.timestamp - a.timestamp);
    const newResources = await generateRecommendedResources(allMessages);
    if (newResources.length > 0) {
      updateRecommendedResources(newResources);
    }
    setIsRefreshing(false);
  };

  // Initial population if default
  useEffect(() => {
    if (recommendedResources.length <= 3 && threads.length > 0 && recommendedResources[0]?.id === 'r1') {
      refreshResources();
    }
  }, []);

  const chartData = useMemo(() => {
    let daysToShow = 7;
    if (timeRange === 'monthly') daysToShow = 30;
    if (timeRange === 'yearly') daysToShow = 365;
    if (timeRange === 'all') {
      const firstMsg = messagesWithMood.reduce((prev, curr) => prev.timestamp < curr.timestamp ? prev : curr, { timestamp: Date.now() } as any);
      daysToShow = Math.max(7, Math.ceil((Date.now() - firstMsg.timestamp) / (1000 * 60 * 60 * 24)));
    }

    const isLargeRange = daysToShow > 60;

    return Array.from({ length: isLargeRange ? 12 : daysToShow }).map((_, i) => {
      const d = new Date();
      if (isLargeRange) {
        d.setMonth(d.getMonth() - (11 - i));
        const monthScore = messagesWithMood
          .filter(m => {
            const mDate = new Date(m.timestamp);
            return mDate.getMonth() === d.getMonth() && mDate.getFullYear() === d.getFullYear();
          })
          .reduce((acc, curr) => acc + (curr.inferredMoodScore || 0), 0) / 
          Math.max(1, messagesWithMood.filter(m => {
            const mDate = new Date(m.timestamp);
            return mDate.getMonth() === d.getMonth() && mDate.getFullYear() === d.getFullYear();
          }).length);
        
        return { name: d.toLocaleDateString([], { month: 'short' }), score: monthScore || 0 };
      } else {
        d.setDate(d.getDate() - (daysToShow - 1 - i));
        const dayScore = messagesWithMood
          .filter(m => new Date(m.timestamp).toDateString() === d.toDateString())
          .reduce((acc, curr) => acc + (curr.inferredMoodScore || 0), 0) / 
          Math.max(1, messagesWithMood.filter(m => new Date(m.timestamp).toDateString() === d.toDateString()).length);
        
        return { name: d.toLocaleDateString([], { weekday: 'short' }), score: dayScore || 0 };
      }
    });
  }, [messagesWithMood, timeRange]);

  const themes = useMemo(() => 
    Array.from(new Set<string>(threads.map(t => t.themeLabel))).filter(l => l !== 'New Conversation').slice(0, 5),
    [threads]
  );

  const rangeLabels: Record<TimeRange, string> = {
    '7day': '7 DAY SIGNAL',
    'monthly': 'MONTHLY FLOW',
    'yearly': 'ANNUAL ARC',
    'all': 'ETERNAL'
  };

  return (
    <div className="space-y-4 pb-12 animate-fade-in pt-4">
      {/* Mood Section - Minimized layers */}
      <section className="bg-white/40 rounded-[2.5rem] p-8 space-y-8 border border-white/50 shadow-sm">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-400">Emotional</h3>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-400">Resonance</h3>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowRangePicker(!showRangePicker)}
              className="text-[9px] text-[#038C7F] font-extrabold bg-[#5CF2BB]/10 px-5 py-2.5 rounded-full uppercase tracking-widest flex items-center gap-2 hover:bg-[#5CF2BB]/20 transition-all"
            >
              {rangeLabels[timeRange]}
              <ChevronDown className={`w-3 h-3 transition-transform ${showRangePicker ? 'rotate-180' : ''}`} />
            </button>

            {showRangePicker && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-2xl shadow-2xl border border-stone-100 p-2 z-50 animate-scale-in">
                {(['7day', 'monthly', 'yearly', 'all'] as TimeRange[]).map(r => (
                  <button 
                    key={r}
                    onClick={() => { setTimeRange(r); setShowRangePicker(false); }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-colors ${timeRange === r ? 'bg-stone-50 text-[#038C7F]' : 'text-stone-400 hover:bg-stone-50'}`}
                  >
                    {rangeLabels[r]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="h-40 w-full px-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#1F6373" 
                strokeWidth={3} 
                dot={{ fill: '#1F6373', r: 4, strokeWidth: 0 }} 
                activeDot={{ r: 6, fill: '#038C7F', strokeWidth: 0 }} 
              />
              <YAxis hide domain={[-1, 1]} />
              <XAxis dataKey="name" hide />
              <Tooltip 
                content={({ active, payload }) => active && payload ? (
                  <div className="bg-[#1A1A1A] text-white text-[10px] font-bold px-4 py-2 rounded-full shadow-2xl">
                    {payload[0].value?.toLocaleString()}
                  </div>
                ) : null} 
                cursor={{ stroke: '#f1f1f1', strokeWidth: 1 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4">
        <section className="bg-white/40 rounded-[2rem] p-6 border border-white/50 space-y-4 min-h-[140px] flex flex-col justify-between">
          <div className="flex items-center gap-2 text-stone-400">
            <Sparkles className="w-3.5 h-3.5" />
            <h3 className="text-[9px] font-bold uppercase tracking-[0.4em]">Themes</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {themes.length > 0 ? themes.map(t => (
              <span key={t} className="text-[9px] px-3 py-1.5 bg-white/60 text-stone-500 rounded-lg font-bold border border-white truncate max-w-full">
                {t}
              </span>
            )) : <span className="text-[9px] text-stone-300 italic">No themes mapped</span>}
          </div>
        </section>

        <section className="bg-[#1A1A1A] rounded-[2rem] p-6 shadow-2xl space-y-4 min-h-[140px] flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center gap-2 text-stone-500 z-10">
            <Calendar className="w-3.5 h-3.5" />
            <h3 className="text-[9px] font-bold uppercase tracking-[0.4em]">Flow</h3>
          </div>
          <div className="manrope text-4xl text-[#5CF2BB] italic font-extrabold tracking-tight z-10">3 Days</div>
          <p className="text-[9px] text-stone-500 font-bold uppercase tracking-[0.25em] z-10">Alignment Secured</p>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-[#5CF2BB]/10 rounded-full blur-2xl" />
        </section>
      </div>

      {/* Dynamic Knowledge Resources - Populated for each user */}
      <section className="bg-white/40 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/50 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-stone-400">
            <BookOpen className="w-4 h-4" />
            <h3 className="text-[9px] font-bold uppercase tracking-[0.4em]">Knowledge Resources</h3>
          </div>
          <button 
            onClick={refreshResources}
            disabled={isRefreshing || threads.length === 0}
            className={`p-2 rounded-lg transition-all ${isRefreshing ? 'animate-spin' : 'hover:bg-black/5 active:scale-90'} text-stone-400 disabled:opacity-20`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
        
        <div className="space-y-8">
          {recommendedResources.map(r => (
            <div key={r.id} className="animate-fade-in">
              <a 
                href={r.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="group block space-y-2 hover:opacity-80 transition-opacity"
              >
                <h4 className="manrope text-xl text-[#1F6373] flex items-center gap-2 leading-tight font-extrabold group-hover:underline decoration-1 underline-offset-4">
                  {r.title}
                  <ExternalLink className="w-3.5 h-3.5 opacity-30 group-hover:opacity-100 transition-opacity" />
                </h4>
                <p className="text-[12px] text-stone-500 leading-relaxed font-medium">
                  {r.note}
                </p>
                <div className="text-[8px] font-bold text-stone-300 uppercase tracking-[0.2em]">{r.type}</div>
              </a>
            </div>
          ))}
          {recommendedResources.length === 0 && (
            <p className="text-xs text-stone-400 italic text-center py-4">Reflect more to unlock curated knowledge.</p>
          )}
        </div>
      </section>

      {/* Clinical Resonance - Minimal and clear */}
      <section className="bg-[#1A1A1A]/5 rounded-[2.5rem] p-8 border border-black/5 space-y-6">
        <div className="flex items-center gap-3 text-stone-400">
          <UserCircle className="w-4 h-4" />
          <h3 className="text-[9px] font-bold uppercase tracking-[0.4em]">Clinical Resonance</h3>
        </div>
        
        {therapistNotes.length > 0 ? (
          <div className="space-y-6">
            {therapistNotes.map(note => (
              <div key={note.id} className="space-y-2.5">
                <h4 className="manrope text-lg italic font-extrabold text-stone-700">{note.title}</h4>
                <p className="text-xs text-stone-500 leading-relaxed font-medium">{note.note}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-3">
              <h4 className="manrope text-2xl text-stone-900 leading-tight font-extrabold">Bridge to Human Insight</h4>
              <p className="text-[13px] text-stone-400 leading-relaxed font-medium">
                Deepen your alignment. Connect with a professional therapist who trains your digital resonance for seamless 24/7 continuity.
              </p>
            </div>
            <button 
              onClick={onConnectTherapist}
              className="w-full bg-[#1A1A1A] py-5 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-[#5CF2BB] hover:opacity-90 transition-all active:scale-95 shadow-xl shadow-stone-900/10"
            >
              <UserPlus className="w-4 h-4" />
              Request Pairing
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default InsightsView;
