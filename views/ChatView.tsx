
import React, { useState, useEffect, useRef } from 'react';
import { useKlarityStore } from '../store';
import { ChatThread, Message } from '../types';
import { generateAIResponse, inferMoodScore, generateThreadTitle } from '../aiService';
import { Send, ArrowLeft, Sun, MessageCircle, Edit2, X, Check, Trash2, GitMerge, Mic } from 'lucide-react';
import { VoiceChatView } from './VoiceChatView';

interface ChatViewProps {
  store: ReturnType<typeof useKlarityStore>;
}

const ChatView: React.FC<ChatViewProps> = ({ store }) => {
  const { 
    threads, addThread, updateThread, deleteThread, mergeThreads, 
    addAffirmation, userProfile, updateProfile, 
    isVoiceActive, setIsVoiceActive, setIsSettingsOpen 
  } = store;

  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [mergingSourceId, setMergingSourceId] = useState<string | null>(null);
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const checkInBannerVisible = () => {
    if (!userProfile || !userProfile.preferences.morningCheckIn) return false;
    const now = new Date();
    const [h, m] = userProfile.preferences.morningCheckInTime.split(':').map(Number);
    const checkInTime = new Date();
    checkInTime.setHours(h, m, 0, 0);
    const todayStr = now.toISOString().split('T')[0];
    return now > checkInTime && userProfile.lastCheckInDate !== todayStr;
  };

  const startCheckIn = () => {
    if (!userProfile) return;
    const todayStr = new Date().toISOString().split('T')[0];
    updateProfile({ ...userProfile, lastCheckInDate: todayStr });
    startNewThread('Morning Alignment');
  };

  const startNewThread = (title = 'New Conversation') => {
    const newThread: ChatThread = {
      id: crypto.randomUUID(),
      title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      themeLabel: title,
      messages: [
        {
          id: crypto.randomUUID(),
          threadId: '',
          role: 'ai',
          content: "What's on your mind today?",
          timestamp: Date.now()
        }
      ]
    };
    newThread.messages[0].threadId = newThread.id;
    addThread(newThread);
    setSelectedThread(newThread);
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedThread) return;
    const currentInput = input;
    const userMessage: Message = {
      id: crypto.randomUUID(),
      threadId: selectedThread.id,
      role: 'user',
      content: currentInput,
      timestamp: Date.now(),
      inferredMoodScore: inferMoodScore(currentInput)
    };
    
    let updatedThread = { ...selectedThread, messages: [...selectedThread.messages, userMessage], updatedAt: Date.now() };
    setSelectedThread(updatedThread);
    updateThread(updatedThread);
    setInput('');
    setIsTyping(true);

    try {
      if (!userProfile) return;
      const responseResult = await generateAIResponse(updatedThread.messages, userProfile.preferences);
      
      if (responseResult.functionCalls) {
        for (const call of responseResult.functionCalls) {
          if (call.name === 'addMantraToOasis') {
            addAffirmation({
              id: crypto.randomUUID(),
              text: call.args.mantraText,
              categoryTags: ['Insights'],
              isFavorite: true,
              source: 'recommended'
            });
          }
        }
      }

      const aiMessage: Message = { 
        id: crypto.randomUUID(), 
        threadId: selectedThread.id, 
        role: 'ai', 
        content: responseResult.text, 
        timestamp: Date.now() 
      };
      
      let finalThread = { ...updatedThread, messages: [...updatedThread.messages, aiMessage], updatedAt: Date.now() };

      if (finalThread.messages.length === 3 || finalThread.messages.length === 5) {
        const newTitle = await generateThreadTitle(finalThread.messages);
        finalThread.title = newTitle;
        finalThread.themeLabel = newTitle;
      }

      setSelectedThread(finalThread);
      updateThread(finalThread);
    } catch (error) { 
      console.error(error); 
    } finally { 
      setIsTyping(false); 
    }
  };

  const saveManualRename = () => {
    if (!editingTitleId || !tempTitle.trim()) return;
    const thread = threads.find(t => t.id === editingTitleId);
    if (thread) {
      const updated = { ...thread, title: tempTitle, themeLabel: tempTitle };
      updateThread(updated);
      if (selectedThread?.id === editingTitleId) setSelectedThread(updated);
    }
    setEditingTitleId(null);
  };

  const handleMerge = (targetId: string) => {
    if (!mergingSourceId) return;
    mergeThreads(mergingSourceId, targetId);
    setMergingSourceId(null);
  };

  const confirmDelete = () => {
    if (deletingThreadId) {
      deleteThread(deletingThreadId);
      if (selectedThread?.id === deletingThreadId) setSelectedThread(null);
      setDeletingThreadId(null);
    }
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [selectedThread, isTyping]);

  if (isVoiceActive) return (
    <VoiceChatView 
      onClose={() => setIsVoiceActive(false)} 
      onOpenSettings={() => setIsSettingsOpen(true)}
    />
  );

  const themesInMotion = Array.from(new Set<string>(threads.map(t => t.themeLabel))).filter(l => l !== 'New Conversation').slice(0, 4);

  return (
    <div className="h-full relative">
      {/* Shared Modals */}
      {editingTitleId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xs bg-white rounded-[2rem] p-8 shadow-2xl border border-stone-100 animate-scale-in">
            <h4 className="manrope text-[11px] font-bold uppercase tracking-[0.3em] text-stone-400 mb-6">Rename Alignment</h4>
            <input 
              autoFocus
              className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#5CF2BB]/50 mb-8"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveManualRename()}
            />
            <div className="flex flex-col gap-3">
              <button onClick={saveManualRename} className="w-full py-4 bg-[#1A1A1A] rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] text-[#5CF2BB] hover:opacity-90 transition-opacity">Confirm</button>
              <button onClick={() => setEditingTitleId(null)} className="w-full py-4 bg-stone-50 rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400 hover:bg-stone-100 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {deletingThreadId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xs bg-white rounded-[2.5rem] p-8 shadow-2xl border border-stone-100 animate-scale-in text-center">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-8 h-8 text-rose-400" />
            </div>
            <h4 className="manrope text-xl font-extrabold text-stone-900 mb-2">Purge Alignment?</h4>
            <p className="text-stone-400 text-sm font-medium mb-8 leading-relaxed">This conversation will be safely tucked away... permanently.</p>
            <div className="flex flex-col gap-3">
              <button onClick={confirmDelete} className="w-full py-4 bg-[#1A1A1A] rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] text-[#5CF2BB] hover:opacity-90 transition-opacity">Yes, Purge</button>
              <button onClick={() => setDeletingThreadId(null)} className="w-full py-4 bg-stone-50 rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] text-stone-400 hover:bg-stone-100 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {mergingSourceId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xs bg-white rounded-3xl p-6 shadow-2xl border border-stone-100 animate-scale-in max-h-[70vh] flex flex-col">
            <h4 className="manrope text-sm font-bold uppercase tracking-widest text-stone-400 mb-4">Merge With...</h4>
            <div className="flex-1 overflow-y-auto space-y-2 mb-6 pr-2">
              {threads.filter(t => t.id !== mergingSourceId).map(t => (
                <button 
                  key={t.id}
                  onClick={() => handleMerge(t.id)}
                  className="w-full px-4 py-4 bg-stone-50 rounded-xl text-xs font-bold text-stone-600 hover:bg-[#5CF2BB]/10 hover:text-stone-900 transition-all text-left border border-transparent hover:border-[#5CF2BB]/20"
                >
                  {t.title}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setMergingSourceId(null)} 
              className="w-full py-3 bg-stone-100 rounded-xl text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:bg-stone-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {selectedThread ? (
        <div className="flex flex-col h-full -mx-8 -mt-12 -mb-32 relative animate-fade-in">
          <div className="px-6 pt-16 pb-5 flex items-center pr-16">
            <button onClick={() => setSelectedThread(null)} className="p-2 mr-4 bg-white/40 backdrop-blur-md rounded-xl shadow-sm hover:scale-105 transition-transform border border-white/50">
              <ArrowLeft className="w-4 h-4 text-stone-900" />
            </button>
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <h2 className="manrope text-xl text-stone-900 truncate font-extrabold">{selectedThread.title}</h2>
              <button 
                onClick={() => { setEditingTitleId(selectedThread.id); setTempTitle(selectedThread.title); }}
                className="p-1.5 hover:bg-black/5 rounded-lg transition-colors group"
              >
                <Edit2 className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-600" />
              </button>
            </div>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-8 space-y-8">
            {selectedThread.messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-5 py-4 rounded-xl text-[14px] leading-relaxed font-medium shadow-sm ${
                  m.role === 'user' ? 'bg-[#1F6373] text-white rounded-tr-none' : 'bg-white text-stone-900 rounded-tl-none border border-stone-100/50'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-[#5CF2BB]/20 px-5 py-3 rounded-xl animate-pulse text-[10px] font-bold uppercase tracking-widest text-[#038C7F]">
                  Konverging thoughts...
                </div>
              </div>
            )}
          </div>
          {/* Chat input footer - Minimized layers and moved to the absolute bottom */}
          <div className="px-6 pb-2 pt-4 bg-transparent">
            <div className="flex items-center gap-3 bg-white/90 rounded-2xl px-4 py-1 border border-stone-200/50 shadow-sm">
              <button 
                onClick={() => setIsVoiceActive(true)}
                className="p-3 text-stone-400 hover:text-[#038C7F] transition-colors active:scale-90"
                title="Voice Session"
              >
                <Mic className="w-5 h-5" />
              </button>
              <div className="w-px h-6 bg-stone-100 mx-1" />
              <input 
                className="flex-1 bg-transparent py-4 focus:outline-none text-[14px] text-stone-900 placeholder-stone-300 font-medium" 
                placeholder="What is your current focus?" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="p-3 bg-[#1A1A1A] text-[#5CF2BB] rounded-xl disabled:opacity-30 transition-all active:scale-90"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-12 pb-4 animate-fade-in pt-8">
          {checkInBannerVisible() && (
            <button 
              onClick={startCheckIn}
              className="w-full bg-[#038C7F] p-6 rounded-2xl flex items-center gap-6 transition-transform active:scale-[0.98] text-left shadow-lg shadow-[#038C7F]/20"
            >
              <div className="p-4 bg-white/20 rounded-xl border border-white/20">
                <Sun className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="manrope text-xl text-white">Morning Insight?</h3>
                <p className="text-sm text-white/70 font-medium">Take a moment to align your focus.</p>
              </div>
            </button>
          )}

          {threads.length === 0 ? (
            <div className="text-center py-20 space-y-10">
              <div className="w-24 h-24 bg-white rounded-3xl mx-auto flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white">
                <MessageCircle className="w-10 h-10 text-[#1F6373]" strokeWidth={1} />
              </div>
              <div className="space-y-4">
                <h2 className="manrope text-4xl text-stone-900">Konvergence begins</h2>
                <p className="text-stone-500 leading-relaxed max-w-[220px] mx-auto text-sm font-medium">
                  Structure your inner chaos through dialogue.
                </p>
              </div>
              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => startNewThread()}
                  className="bg-[#1A1A1A] text-white px-12 py-5 rounded-2xl font-bold shadow-2xl active:scale-95 transition-all text-[10px] uppercase tracking-[0.3em]"
                >
                  Start Reflection
                </button>
                <button 
                  onClick={() => setIsVoiceActive(true)}
                  className="bg-white text-[#1A1A1A] border border-stone-200 px-12 py-5 rounded-2xl font-bold shadow-sm active:scale-95 transition-all text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3"
                >
                  <Mic className="w-4 h-4" /> Voice Session
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-400">Themes in Motion</h3>
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={() => startNewThread()}
                    className="px-6 py-3 bg-white rounded-xl border border-stone-200/60 shadow-sm text-xs font-bold text-stone-600 hover:border-[#1F6373] transition-all"
                  >
                    New Conversation
                  </button>
                  {themesInMotion.map((label: string) => (
                    <button 
                      key={label}
                      onClick={() => startNewThread(label)}
                      className="px-6 py-3 bg-white rounded-xl border border-stone-200/60 shadow-sm text-xs font-bold text-stone-600 hover:border-[#5CF2BB] transition-all"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-400">Recent Alignment</h3>
                  <button 
                    onClick={() => setIsVoiceActive(true)}
                    className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-[#038C7F] bg-[#5CF2BB]/10 px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
                  >
                    <Mic className="w-3 h-3" /> Voice
                  </button>
                </div>
                <div className="space-y-6">
                  {threads.map(thread => (
                    <div key={thread.id} className="relative group">
                      <button 
                        onClick={() => setSelectedThread(thread)}
                        className="w-full bg-white px-7 py-7 rounded-[2.5rem] text-left border border-stone-100/60 transition-all flex flex-col gap-1.5 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.08)] hover:-translate-y-1"
                      >
                        <div className="flex justify-between items-start w-full">
                          <h4 className="manrope text-[15px] font-extrabold text-stone-900 truncate max-w-[70%] leading-tight">
                            {thread.title}
                          </h4>
                          <div className="text-[10px] font-bold text-stone-300 uppercase tracking-widest pt-1">
                            {new Date(thread.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }).toUpperCase()}
                          </div>
                        </div>
                        <p className="text-[12px] text-stone-400 truncate font-medium max-w-[90%] tracking-tight">
                          {thread.messages[thread.messages.length - 1]?.content}
                        </p>
                      </button>
                      
                      <div className="absolute right-6 bottom-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setMergingSourceId(thread.id); }}
                          className="p-2 bg-stone-50 rounded-lg text-stone-300 hover:bg-[#5CF2BB]/10 hover:text-[#038C7F] transition-all"
                          title="Merge with theme"
                        >
                          <GitMerge className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setEditingTitleId(thread.id); setTempTitle(thread.title); }}
                          className="p-2 bg-stone-50 rounded-lg text-stone-300 hover:bg-stone-100 hover:text-stone-600 transition-all"
                          title="Rename"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setDeletingThreadId(thread.id); }}
                          className="p-2 bg-rose-50 rounded-lg text-rose-200 hover:bg-rose-100 hover:text-rose-500 transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatView;
