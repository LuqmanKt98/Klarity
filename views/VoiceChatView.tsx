
import React, { useEffect, useRef, useState } from 'react';
import { X, Mic, MicOff, Volume2, VolumeX, ArrowLeft, Settings } from 'lucide-react';
import { connectToLiveSession, KLARITY_SYSTEM_INSTRUCTION } from '../aiService';
import { useKlarityStore } from '../store';

interface VoiceChatViewProps {
  onClose: () => void;
  onOpenSettings?: () => void;
}

export const VoiceChatView: React.FC<VoiceChatViewProps> = ({ onClose, onOpenSettings }) => {
  const store = useKlarityStore();
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOff, setIsSpeakerOff] = useState(false);
  const [isAiTalking, setIsAiTalking] = useState(false);
  const [isHearingUser, setIsHearingUser] = useState(false);

  // Use refs to avoid stale closures in audio processing loops
  const isMutedRef = useRef(false);
  const isSpeakerOffRef = useRef(false);
  
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { isSpeakerOffRef.current = isSpeakerOff; }, [isSpeakerOff]);

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef(new Set<AudioBufferSourceNode>());

  useEffect(() => {
    // Initialize Audio
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    outputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

    const startSession = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        sessionRef.current = connectToLiveSession({
          systemInstruction: `${KLARITY_SYSTEM_INSTRUCTION}\n\n# Voice Context\nYou are in a voice conversation. Keep responses concise, human, and empathetic. Focus on listening and affirming. Be extremely gentle and brief.`,
          onAudioData: async (base64) => {
            // Read from ref to avoid stale closure
            if (isSpeakerOffRef.current) return;
            
            setIsAiTalking(true);
            const ctx = outputContextRef.current!;
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
            const audioBuffer = await decodeAudioData(decode(base64), ctx, 24000, 1);
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            source.addEventListener('ended', () => {
              sourcesRef.current.delete(source);
              if (sourcesRef.current.size === 0) setIsAiTalking(false);
            });
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += audioBuffer.duration;
            sourcesRef.current.add(source);
          },
          onInterrupted: () => {
            sourcesRef.current.forEach(s => {
              try { s.stop(); } catch(e) {}
            });
            sourcesRef.current.clear();
            nextStartTimeRef.current = 0;
            setIsAiTalking(false);
          },
          onTranscription: (text, isUser) => {
            if (isUser && text.trim()) {
               setIsHearingUser(true);
               setTimeout(() => setIsHearingUser(false), 2000);
            }
          }
        });

        const source = audioContextRef.current.createMediaStreamSource(stream);
        const scriptProcessor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
        scriptProcessor.onaudioprocess = (e) => {
          // Read from ref to avoid stale closure
          if (isMutedRef.current) return;
          
          const inputData = e.inputBuffer.getChannelData(0);
          const pcmBlob = createBlob(inputData);
          sessionRef.current.sendAudio(pcmBlob);
        };
        source.connect(scriptProcessor);
        scriptProcessor.connect(audioContextRef.current.destination);

      } catch (err) {
        console.error("Microphone access failed", err);
      }
    };

    startSession();

    return () => {
      sessionRef.current?.close();
      audioContextRef.current?.close();
      outputContextRef.current?.close();
    };
  }, []);

  // Audio helpers
  function decode(base64: string) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  }

  function encode(bytes: Uint8Array) {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
    return buffer;
  }

  function createBlob(data: Float32Array) {
    const int16 = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;
    return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#1A1A1A] flex flex-col items-center justify-between p-12 overflow-hidden animate-fade-in"
         style={{ background: 'radial-gradient(circle at top center, #1F637333 0%, #1A1A1A 100%)' }}>
      
      {/* Grainy Noise Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

      <header className="w-full flex items-center justify-between z-10 relative">
        <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white/40 transition-all active:scale-90 border border-white/5">
          <ArrowLeft className="w-4 h-4" />
        </button>
        
        <div className="absolute left-1/2 -translate-x-1/2 manrope font-extrabold text-[10px] tracking-[0.6em] text-white/40 uppercase">
          Presence
        </div>
        
        <button 
          onClick={onOpenSettings}
          className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/40 transition-all active:scale-90 border border-white/5"
        >
          <Settings className="w-4 h-4" />
        </button>
      </header>

      {/* Centered Green-Blue Orbs */}
      <div className="relative flex items-center justify-center flex-1 w-full max-w-md mx-auto">
        <svg viewBox="0 0 400 400" className={`w-full h-auto transition-opacity duration-500 ${isMuted ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'} drop-shadow-[0_0_80px_rgba(31,99,115,0.2)]`}>
          <defs>
            <radialGradient id="teal-soft" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#2DFFC6" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#12A884" stopOpacity="0.2" />
            </radialGradient>
            <radialGradient id="blue-soft" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1F6373" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0B2B33" stopOpacity="0.2" />
            </radialGradient>
            <radialGradient id="green-soft" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#5CF2BB" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#1F6373" stopOpacity="0.2" />
            </radialGradient>
            <filter id="blur-filter">
              <feGaussianBlur in="SourceGraphic" stdDeviation="20" />
            </filter>
          </defs>

          <g filter="url(#blur-filter)" className="transition-all duration-1000 ease-in-out">
            <animateTransform attributeName="transform" type="rotate" from="0 200 200" to="360 200 200" dur="40s" repeatCount="indefinite" />
            
            <g className={`transition-all duration-1000 origin-center ${isAiTalking ? 'scale-110' : isHearingUser ? 'scale-105' : 'scale-100'}`}>
              <circle cx="200" cy="200" r="120" fill="url(#blue-soft)">
                <animate attributeName="r" values="120;125;120" dur="8s" repeatCount="indefinite" />
              </circle>
              <circle cx="180" cy="190" r="100" fill="url(#teal-soft)" className="mix-blend-screen">
                <animate attributeName="cx" values="180;190;180" dur="12s" repeatCount="indefinite" />
              </circle>
              <circle cx="220" cy="210" r="110" fill="url(#green-soft)" className="mix-blend-screen">
                <animate attributeName="cy" values="210;200;210" dur="10s" repeatCount="indefinite" />
              </circle>
            </g>
          </g>
        </svg>

        <div className="absolute bottom-16 flex flex-col items-center gap-4">
          <div className={`manrope text-[10px] font-bold tracking-[0.4em] uppercase transition-all duration-500 ${isAiTalking || isHearingUser ? 'text-white' : 'text-white/20'}`}>
             {isAiTalking ? 'Klarity is speaking' : isHearingUser ? 'Listening closely' : isMuted ? 'Microphone Muted' : 'In Presence'}
          </div>
        </div>
      </div>

      <footer className="w-full flex flex-col items-center gap-10 z-10 pb-32">
        <div className="flex justify-center gap-16">
          <div className="flex flex-col items-center gap-4">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className={`p-6 rounded-full border transition-all duration-300 relative ${isMuted ? 'bg-rose-500/20 border-rose-500/40 text-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.15)]' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 active:scale-90'}`}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              {isMuted && <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-[#1A1A1A]" />}
            </button>
            <span className={`text-[9px] font-bold uppercase tracking-[0.2em] transition-colors duration-300 ${isMuted ? 'text-rose-400' : 'text-white/30'}`}>
              {isMuted ? 'Muted' : 'Mute'}
            </span>
          </div>
          
          <div className="flex flex-col items-center gap-4">
            <button 
              onClick={() => setIsSpeakerOff(!isSpeakerOff)}
              className={`p-6 rounded-full border transition-all duration-300 relative ${isSpeakerOff ? 'bg-stone-500/20 border-stone-500/40 text-stone-400 shadow-[0_0_30px_rgba(168,162,158,0.1)]' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 active:scale-90'}`}
            >
              {isSpeakerOff ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              {isSpeakerOff && <span className="absolute -top-1 -right-1 w-3 h-3 bg-stone-500 rounded-full border-2 border-[#1A1A1A]" />}
            </button>
            <span className={`text-[9px] font-bold uppercase tracking-[0.2em] transition-colors duration-300 ${isSpeakerOff ? 'text-stone-400' : 'text-white/30'}`}>
              {isSpeakerOff ? 'Output Off' : 'Output On'}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
