import React from 'react';
import { useKlarityStore } from '../store';
import { MODALITIES, INTENSITY_LEVELS, CATEGORIES } from '../constants';
import { LogOut, Trash2, Download, ArrowLeft, BookOpen, Mail, Chrome } from 'lucide-react';

interface SettingsViewProps {
  store: ReturnType<typeof useKlarityStore>;
  onClose: () => void;
  onOpenPhilosophy?: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ store, onClose, onOpenPhilosophy }) => {
  const { user, userProfile, updateProfile, resetData } = store;
  
  if (!userProfile) return null;
  const { preferences } = userProfile;

  const toggleModality = (id: string) => {
    const newModalities = preferences.modalities.includes(id)
      ? preferences.modalities.filter(m => m !== id)
      : [...preferences.modalities, id];
    updateProfile({ ...userProfile, preferences: { ...preferences, modalities: newModalities } });
  };

  const setIntensity = (level: number) => {
    updateProfile({ ...userProfile, preferences: { ...preferences, intensityLevel: level as any } });
  };

  const updatePref = (key: keyof typeof preferences, value: any) => {
    updateProfile({ ...userProfile, preferences: { ...preferences, [key]: value } });
  };

  const exportData = () => {
    const data = JSON.stringify(localStorage);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'klarity_backup.json';
    a.click();
  };

  return (
    <div className="animate-fade-in space-y-10 pb-20 pt-2">

      {/* ── User Profile Card ── */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-900/30 px-1">Account</h3>
        <div className="bg-[#1A1A1A] rounded-[2rem] p-6 shadow-2xl">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#5CF2BB]/30 flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-[#5CF2BB]/10 flex items-center justify-center flex-shrink-0 ring-2 ring-[#5CF2BB]/20">
                <span className="text-[#5CF2BB] text-2xl font-black">
                  {(user?.displayName || user?.email || 'K').charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            {/* Name & Email */}
            <div className="flex-1 min-w-0">
              <p className="text-white font-extrabold text-base truncate">
                {user?.displayName || 'Anonymous'}
              </p>
              <p className="text-stone-400 text-xs font-medium truncate mt-0.5">
                {user?.email || '—'}
              </p>
              {/* Provider Badge */}
              <div className="mt-2 inline-flex items-center gap-1.5 bg-white/5 rounded-lg px-2.5 py-1">
                {user?.providerData?.[0]?.providerId === 'google.com' ? (
                  <>
                    <svg className="w-3 h-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Google</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-3 h-3 text-stone-400" />
                    <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Email</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Sign Out */}
          <button
            onClick={() => resetData()}
            className="mt-5 w-full flex items-center justify-center gap-2 py-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-all active:scale-[0.98] group"
          >
            <LogOut className="w-4 h-4 text-rose-400 group-hover:text-rose-300" />
            <span className="text-sm font-bold text-rose-400 group-hover:text-rose-300">Sign Out</span>
          </button>
        </div>
      </section>

      <section className="space-y-5">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-900/30 px-1">Foundations</h3>
        <button 
          onClick={onOpenPhilosophy}
          className="w-full bg-[#1A1A1A] p-7 rounded-[2.5rem] flex items-center justify-between shadow-2xl active:scale-[0.98] transition-all group"
        >
          <div className="flex items-center gap-5">
            <div className="p-3 bg-white/10 rounded-2xl">
              <BookOpen className="w-5 h-5 text-[#5CF2BB]" />
            </div>
            <div className="text-left">
              <span className="block font-extrabold text-[#5CF2BB] text-sm uppercase tracking-widest">Philosophy</span>
              <span className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">Principles of Resonance</span>
            </div>
          </div>
          <ArrowLeft className="w-4 h-4 text-stone-700 rotate-180" />
        </button>
      </section>

      <section className="space-y-5">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-900/30 px-1">Rhythm & Cadence</h3>
        <div className="bg-white/60 backdrop-blur-md rounded-2xl overflow-hidden shadow-sm border border-white/50">
          <div className="px-6 py-5 border-b border-emerald-900/5">
            <div className="font-semibold text-emerald-950 text-sm">Daily Check-in</div>
            <div className="text-[11px] text-emerald-900/40 font-medium mt-1">Structured moments for internal alignment</div>
          </div>
          
          {[
            { label: 'Morning', enabled: preferences.morningCheckIn, time: preferences.morningCheckInTime, toggleKey: 'morningCheckIn' as const, timeKey: 'morningCheckInTime' as const },
            { label: 'Afternoon', enabled: preferences.afternoonCheckIn, time: preferences.afternoonCheckInTime, toggleKey: 'afternoonCheckIn' as const, timeKey: 'afternoonCheckInTime' as const },
            { label: 'Evening', enabled: preferences.eveningCheckIn, time: preferences.eveningCheckInTime, toggleKey: 'eveningCheckIn' as const, timeKey: 'eveningCheckInTime' as const },
          ].map((item, idx) => (
            <div key={item.label} className={`px-6 py-4 flex items-center justify-between ${idx !== 2 ? 'border-b border-emerald-900/5' : ''}`}>
              <div className="font-semibold text-emerald-900/80 text-[13px] w-20">{item.label}</div>
              
              <div className="flex items-center gap-4">
                <input 
                  type="time" 
                  className={`bg-white/80 px-3 py-1.5 rounded-lg text-[11px] font-bold text-emerald-900/60 focus:outline-none border border-emerald-900/5 shadow-sm transition-opacity ${!item.enabled ? 'opacity-30' : 'opacity-100'}`}
                  value={item.time}
                  disabled={!item.enabled}
                  onChange={(e) => updatePref(item.timeKey, e.target.value)}
                />
                
                <button 
                  onClick={() => updatePref(item.toggleKey, !item.enabled)}
                  className={`w-10 h-6 rounded-full relative transition-all duration-300 flex-shrink-0 ${item.enabled ? 'bg-emerald-800' : 'bg-emerald-900/10'}`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ease-in-out ${item.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-900/30 px-1">Healing Modalities</h3>
        <div className="grid grid-cols-2 gap-4">
          {MODALITIES.map(m => (
            <button 
              key={m.id}
              onClick={() => toggleModality(m.id)}
              className={`p-5 rounded-2xl border text-left transition-all ${
                preferences.modalities.includes(m.id) 
                  ? 'bg-emerald-900 border-emerald-900 text-emerald-50 shadow-lg shadow-emerald-900/10' 
                  : 'bg-white/60 border-white/50 text-emerald-900/60 hover:border-emerald-200 shadow-sm'
              }`}
            >
              <div className="text-[8px] font-bold uppercase tracking-[0.2em] opacity-40 mb-1">{m.category}</div>
              <div className="font-semibold text-[13px]">{m.label}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-900/30 px-1">Intensity</h3>
        <div className="bg-white/60 rounded-2xl p-8 shadow-sm border border-white/50 space-y-7">
          <div className="flex justify-between relative px-2">
            <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-emerald-900/10 -translate-y-1/2 rounded-full" />
            <div className="absolute top-1/2 left-0 h-[2px] bg-emerald-900 -translate-y-1/2 rounded-full transition-all duration-700" style={{ width: `${(preferences.intensityLevel - 1) * 25}%` }} />
            {[1, 2, 3, 4, 5].map(lvl => (
              <button 
                key={lvl}
                onClick={() => setIntensity(lvl)}
                className={`w-3 h-3 rounded-full z-10 transition-all duration-500 relative ${preferences.intensityLevel >= lvl ? 'bg-emerald-900 scale-[1.3] ring-4 ring-emerald-900/10' : 'bg-white border-[2px] border-emerald-900/20'}`}
              >
                {preferences.intensityLevel === lvl && (
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold text-emerald-900 uppercase tracking-widest">
                    {INTENSITY_LEVELS.find(i => i.value === lvl)?.label}
                  </div>
                )}
              </button>
            ))}
          </div>
          <div className="pt-2 text-center">
            <p className="text-[11px] text-emerald-900/40 italic font-medium">
              {INTENSITY_LEVELS.find(i => i.value === preferences.intensityLevel)?.desc}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-900/30 px-1">Integrity</h3>
        <div className="space-y-4">
          <button 
            onClick={exportData}
            className="w-full bg-white/60 p-6 rounded-2xl flex items-center justify-between border border-white/50 shadow-sm active:scale-[0.98] transition-all group hover:bg-white"
          >
            <div className="flex items-center gap-4">
              <Download className="w-5 h-5 text-emerald-900/20 group-hover:text-emerald-900/40" />
              <span className="font-semibold text-emerald-950 text-sm">Export Data</span>
            </div>
          </button>
          <button 
            onClick={() => {
              if (window.confirm("Are you sure? This will delete all your local history and preferences.")) {
                resetData();
              }
            }}
            className="w-full bg-rose-50/50 p-6 rounded-2xl flex items-center justify-between border border-rose-100/50 shadow-sm active:scale-[0.98] transition-all group"
          >
            <div className="flex items-center gap-4">
              <Trash2 className="w-5 h-5 text-rose-300 group-hover:text-rose-400" />
              <span className="font-semibold text-rose-800/60 text-sm">Purge History</span>
            </div>
          </button>
        </div>
      </section>

      <div className="pt-10 text-center pb-10">
        <button onClick={onClose} className="text-emerald-900/30 text-[10px] font-bold uppercase tracking-[0.3em] hover:text-emerald-950 transition-colors">
          Return to self
        </button>
        <div className="mt-6 text-[8px] text-emerald-900/10 uppercase tracking-[0.5em] font-bold">Klarity Artifact v1.0.0</div>
      </div>
    </div>
  );
};

export default SettingsView;
