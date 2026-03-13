import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, googleProvider, db } from '../firebase';
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { CheckCircle2, ArrowRight, ArrowLeft, ShieldCheck, HeartPulse, Target, Activity, Eye, EyeOff } from 'lucide-react';
import { UserProfile, OnboardingData } from '../types';
import { DEFAULT_PREFERENCES } from '../constants';

interface OnboardingViewProps {
  onComplete: (profile: UserProfile) => void;
}

const OnboardingView: React.FC<OnboardingViewProps> = ({ onComplete }) => {
  const [step, setStep] = useState<'auth' | 'disclaimer' | 'questions' | 'goals'>('auth');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Auth State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Onboarding State
  const [disclaimers, setDisclaimers] = useState({
    notTherapy: false,
    dataPrivacy: false,
    emergencyProtocol: false
  });

  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    primaryFocus: '',
    historyOfTherapy: '',
    currentStressLevel: 5,
    goals: [],
    termsAccepted: false
  });

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        setStep('disclaimer');
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in was cancelled. Please try again.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMsg('Password reset email sent! Check your inbox.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      setStep('disclaimer');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    
    const profile: UserProfile = {
      uid: auth.currentUser.uid,
      email: auth.currentUser.email || '',
      displayName: auth.currentUser.displayName || 'Seeker',
      photoURL: auth.currentUser.photoURL || '',
      onboardingComplete: true,
      onboardingData: { ...onboardingData, termsAccepted: true },
      preferences: DEFAULT_PREFERENCES,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid), profile);
      onComplete(profile);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderAuth = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-7 w-full max-w-sm"
    >
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-14 h-14 bg-[#1A1A1A] rounded-[1.2rem] flex items-center justify-center mx-auto shadow-xl">
          <span className="text-[#5CF2BB] text-2xl font-black manrope">K</span>
        </div>
        <h2 className="text-4xl font-extrabold text-stone-900 manrope">Welcome to Klarity</h2>
        <p className="text-stone-400 font-medium text-sm">Begin your journey toward alignment.</p>
      </div>

      {/* Google SSO */}
      <button 
        onClick={handleGoogleAuth}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 py-4 bg-white border-2 border-stone-100 rounded-2xl font-bold text-stone-700 shadow-sm hover:border-stone-300 hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-60"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-stone-100"></span></div>
        <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold text-stone-300"><span className="bg-white px-4">Or continue with email</span></div>
      </div>

      {/* Email/Password Form */}
      <form onSubmit={handleEmailAuth} className="space-y-3">
        <input 
          type="email" 
          placeholder="Email address" 
          className="w-full px-5 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#5CF2BB]/50 focus:border-transparent transition-all"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(null); setSuccessMsg(null); }}
          required
        />
        <div className="relative">
          <input 
            type={showPassword ? 'text' : 'password'}
            placeholder="Password (min. 6 characters)" 
            className="w-full px-5 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#5CF2BB]/50 focus:border-transparent transition-all pr-14"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(null); }}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500 transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        
        <button 
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-[#1A1A1A] text-[#5CF2BB] rounded-2xl font-bold uppercase tracking-widest shadow-xl active:scale-[0.98] transition-all disabled:opacity-60"
        >
          {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
        </button>
      </form>

      {/* Footer Links */}
      <div className="flex flex-col items-center gap-3">
        <button 
          onClick={() => { setIsLogin(!isLogin); setError(null); setSuccessMsg(null); }}
          className="text-sm font-bold text-stone-400 hover:text-stone-700 transition-colors"
        >
          {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
        </button>
        {isLogin && (
          <button 
            type="button"
            onClick={handleForgotPassword}
            disabled={loading}
            className="text-xs font-bold text-[#038C7F] hover:text-[#1F6373] transition-colors"
          >
            Forgot password?
          </button>
        )}
      </div>

      {/* Feedback Messages */}
      {error && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-rose-500 text-xs text-center font-semibold bg-rose-50 rounded-xl px-4 py-3">
          {error}
        </motion.p>
      )}
      {successMsg && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-emerald-700 text-xs text-center font-semibold bg-emerald-50 rounded-xl px-4 py-3">
          {successMsg}
        </motion.p>
      )}
    </motion.div>
  );

  const renderDisclaimer = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8 w-full max-w-sm"
    >
      <div className="space-y-4">
        <ShieldCheck className="w-12 h-12 text-[#038C7F]" />
        <h2 className="text-3xl font-extrabold text-stone-900 manrope">Safety & Privacy</h2>
        <p className="text-stone-500 font-medium">Before we begin, please review these essential points.</p>
      </div>

      <div className="space-y-6">
        {[
          { id: 'notTherapy', label: 'I understand Klarity is an AI support tool, not a replacement for clinical therapy.', icon: <HeartPulse className="w-5 h-5" /> },
          { id: 'dataPrivacy', label: 'I agree to the secure processing of my reflections to provide personalized insights.', icon: <ShieldCheck className="w-5 h-5" /> },
          { id: 'emergencyProtocol', label: 'I know Klarity cannot provide emergency medical or crisis intervention.', icon: <Activity className="w-5 h-5" /> }
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => setDisclaimers(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof disclaimers] }))}
            className={`w-full flex items-start gap-4 p-5 rounded-2xl border transition-all text-left ${
              disclaimers[item.id as keyof typeof disclaimers] ? 'bg-[#5CF2BB]/10 border-[#5CF2BB] text-stone-900' : 'bg-white border-stone-100 text-stone-500'
            }`}
          >
            <div className={`mt-0.5 ${disclaimers[item.id as keyof typeof disclaimers] ? 'text-[#038C7F]' : 'text-stone-300'}`}>
              {item.icon}
            </div>
            <span className="text-sm font-bold leading-tight">{item.label}</span>
            <div className="ml-auto">
              {disclaimers[item.id as keyof typeof disclaimers] && <CheckCircle2 className="w-5 h-5 text-[#038C7F]" />}
            </div>
          </button>
        ))}
      </div>

      <button 
        disabled={!Object.values(disclaimers).every(Boolean)}
        onClick={() => setStep('questions')}
        className="w-full py-5 bg-[#1A1A1A] text-[#5CF2BB] rounded-2xl font-bold uppercase tracking-widest shadow-xl disabled:opacity-30 transition-all flex items-center justify-center gap-3"
      >
        Continue <ArrowRight className="w-4 h-4" />
      </button>
    </motion.div>
  );

  const renderQuestions = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8 w-full max-w-sm"
    >
      <div className="space-y-4">
        <h2 className="text-3xl font-extrabold text-stone-900 manrope">Tell us about you</h2>
        <p className="text-stone-500 font-medium">This helps us (and your future therapist) understand your path.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Primary Focus</label>
          <select 
            className="w-full px-5 py-4 bg-stone-50 border border-stone-100 rounded-2xl font-bold text-stone-700 focus:outline-none"
            value={onboardingData.primaryFocus}
            onChange={(e) => setOnboardingData({ ...onboardingData, primaryFocus: e.target.value })}
          >
            <option value="">Select a focus...</option>
            <option value="anxiety">Managing Anxiety</option>
            <option value="depression">Lifting Depression</option>
            <option value="relationships">Relationship Growth</option>
            <option value="career">Career & Purpose</option>
            <option value="trauma">Healing Trauma</option>
            <option value="growth">General Self-Growth</option>
          </select>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Therapy History</label>
          <select 
            className="w-full px-5 py-4 bg-stone-50 border border-stone-100 rounded-2xl font-bold text-stone-700 focus:outline-none"
            value={onboardingData.historyOfTherapy}
            onChange={(e) => setOnboardingData({ ...onboardingData, historyOfTherapy: e.target.value })}
          >
            <option value="">Select experience...</option>
            <option value="none">New to therapy</option>
            <option value="past">Have seen a therapist before</option>
            <option value="current">Currently in therapy</option>
          </select>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Current Stress Level</label>
            <span className="text-sm font-bold text-[#038C7F]">{onboardingData.currentStressLevel}/10</span>
          </div>
          <input 
            type="range" min="1" max="10" 
            className="w-full accent-[#038C7F]"
            value={onboardingData.currentStressLevel}
            onChange={(e) => setOnboardingData({ ...onboardingData, currentStressLevel: parseInt(e.target.value) })}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button onClick={() => setStep('disclaimer')} className="flex-1 py-5 bg-stone-100 text-stone-400 rounded-2xl font-bold uppercase tracking-widest">Back</button>
        <button 
          disabled={!onboardingData.primaryFocus || !onboardingData.historyOfTherapy}
          onClick={() => setStep('goals')} 
          className="flex-[2] py-5 bg-[#1A1A1A] text-[#5CF2BB] rounded-2xl font-bold uppercase tracking-widest shadow-xl disabled:opacity-30 transition-all"
        >
          Next
        </button>
      </div>
    </motion.div>
  );

  const renderGoals = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8 w-full max-w-sm"
    >
      <div className="space-y-4">
        <h2 className="text-3xl font-extrabold text-stone-900 manrope">Define your goals</h2>
        <p className="text-stone-500 font-medium">What would you like to achieve with Klarity?</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {[
          'Better sleep quality', 'Emotional regulation', 'Healthier boundaries', 
          'Self-compassion', 'Mindfulness practice', 'Clarity of purpose'
        ].map((goal) => (
          <button 
            key={goal}
            onClick={() => {
              const goals = onboardingData.goals.includes(goal)
                ? onboardingData.goals.filter(g => g !== goal)
                : [...onboardingData.goals, goal];
              setOnboardingData({ ...onboardingData, goals });
            }}
            className={`w-full p-5 rounded-2xl border transition-all text-left flex items-center gap-4 ${
              onboardingData.goals.includes(goal) ? 'bg-[#1F6373] border-[#1F6373] text-white' : 'bg-white border-stone-100 text-stone-600'
            }`}
          >
            <Target className={`w-5 h-5 ${onboardingData.goals.includes(goal) ? 'text-[#5CF2BB]' : 'text-stone-300'}`} />
            <span className="text-sm font-bold">{goal}</span>
            {onboardingData.goals.includes(goal) && <CheckCircle2 className="ml-auto w-5 h-5 text-[#5CF2BB]" />}
          </button>
        ))}
      </div>

      <div className="flex gap-4">
        <button onClick={() => setStep('questions')} className="flex-1 py-5 bg-stone-100 text-stone-400 rounded-2xl font-bold uppercase tracking-widest">Back</button>
        <button 
          disabled={onboardingData.goals.length === 0 || loading}
          onClick={completeOnboarding} 
          className="flex-[2] py-5 bg-[#1A1A1A] text-[#5CF2BB] rounded-2xl font-bold uppercase tracking-widest shadow-xl disabled:opacity-30 transition-all"
        >
          {loading ? 'Finalizing...' : 'Enter Oasis'}
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center p-8 overflow-y-auto">
      <AnimatePresence mode="wait">
        {step === 'auth' && renderAuth()}
        {step === 'disclaimer' && renderDisclaimer()}
        {step === 'questions' && renderQuestions()}
        {step === 'goals' && renderGoals()}
      </AnimatePresence>
    </div>
  );
};

export default OnboardingView;
