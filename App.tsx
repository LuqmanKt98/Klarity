
import React from 'react';
import { useKlarityStore } from './store';
import ChatView from './views/ChatView';
import OasisView from './views/OasisView';
import InsightsView from './views/InsightsView';
import SettingsView from './views/SettingsView';
import TherapistConnectView from './views/TherapistConnectView';
import PhilosophyView from './views/PhilosophyView';
import OnboardingView from './views/OnboardingView';
import { MessageCircle, Droplets, BarChart3, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const store = useKlarityStore();
  const { 
    user, loading, userProfile, updateProfile, 
    isSettingsOpen, setIsSettingsOpen, isVoiceActive 
  } = store;
  
  const [activeTab, setActiveTab] = React.useState<'chat' | 'oasis' | 'insights'>('chat');
  const [isConnectingTherapist, setIsConnectingTherapist] = React.useState(false);
  const [isPhilosophyOpen, setIsPhilosophyOpen] = React.useState(false);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 text-[#038C7F] animate-spin" />
      </div>
    );
  }

  if (!user || !userProfile || !userProfile.onboardingComplete) {
    return <OnboardingView onComplete={(profile) => updateProfile(profile)} />;
  }

  const renderContent = () => {
    if (isPhilosophyOpen) return <PhilosophyView onClose={() => setIsPhilosophyOpen(false)} />;
    if (isSettingsOpen) return <SettingsView store={store} onClose={() => setIsSettingsOpen(false)} onOpenPhilosophy={() => setIsPhilosophyOpen(true)} />;
    if (isConnectingTherapist) return <TherapistConnectView onClose={() => setIsConnectingTherapist(false)} />;
    
    switch (activeTab) {
      case 'chat': return <ChatView store={store} />;
      case 'oasis': return <OasisView store={store} />;
      case 'insights': return <InsightsView store={store} onConnectTherapist={() => setIsConnectingTherapist(true)} />;
      default: return <ChatView store={store} />;
    }
  };

  const isOasis = activeTab === 'oasis' && !isSettingsOpen;
  const isConnecting = isConnectingTherapist || isPhilosophyOpen;
  // Only show the global "dark" settings button if not in Oasis and NOT in a Voice Session
  const showGlobalSettingsToggle = !isOasis && !isSettingsOpen && !isVoiceActive && !isConnecting;

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto brand-bg relative overflow-hidden">
      <div className="grain-orb orb-1"></div>
      <div className="grain-orb orb-2"></div>

      {/* User Avatar Chip (Top Right) — opens Settings */}
      {showGlobalSettingsToggle && (
        <div className="absolute top-10 right-6 z-50">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 pl-1 pr-3 py-1 bg-white/60 backdrop-blur-md rounded-2xl border border-white/70 shadow-md hover:bg-white active:scale-95 transition-all"
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-7 h-7 rounded-xl object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-7 h-7 rounded-xl bg-[#1A1A1A] flex items-center justify-center flex-shrink-0">
                <span className="text-[#5CF2BB] text-[10px] font-black">
                  {(user?.displayName || user?.email || 'K').charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-[11px] font-bold text-stone-700 max-w-[72px] truncate">
              {user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'Profile'}
            </span>
          </button>
        </div>
      )}

      {/* Simplified Header - Only visible when in Settings */}
      {isSettingsOpen && !isPhilosophyOpen && (
        <header className="px-8 pt-12 pb-2 z-30">
          <h1 className="text-5xl text-stone-900 leading-tight manrope font-extrabold tracking-tight">
            Identity
          </h1>
        </header>
      )}

      {/* Content Area - Adjusted padding for closer feel */}
      <main className={`flex-1 overflow-y-auto px-8 pb-24 ${!isSettingsOpen && !isConnecting ? 'pt-12' : 'pt-4'}`}>
        {renderContent()}
      </main>

      {/* Bottom Navigation - Simplified and pulled lower */}
      {!isSettingsOpen && !isConnecting && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#1A1A1A]/95 backdrop-blur-xl flex justify-around items-center pt-4 pb-5 px-4 z-40 rounded-t-[2rem] shadow-2xl">
          <NavButton 
            active={activeTab === 'chat'} 
            onClick={() => setActiveTab('chat')} 
            icon={<MessageCircle className="w-5 h-5" strokeWidth={1.5} />} 
            label="Chat" 
          />
          <NavButton 
            active={activeTab === 'oasis'} 
            onClick={() => setActiveTab('oasis')} 
            icon={<Droplets className="w-5 h-5" strokeWidth={1.5} />} 
            label="Oasis" 
          />
          <NavButton 
            active={activeTab === 'insights'} 
            onClick={() => setActiveTab('insights')} 
            icon={<BarChart3 className="w-5 h-5" strokeWidth={1.5} />} 
            label="Insights" 
          />
        </nav>
      )}
    </div>
  );
};

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${active ? 'text-[#5CF2BB] scale-105' : 'text-stone-500 hover:text-stone-300'}`}
  >
    {icon}
    <span className="text-[7px] font-bold uppercase tracking-[0.25em]">{label}</span>
  </button>
);

export default App;
