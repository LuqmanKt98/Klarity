
import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, ChatThread, Affirmation, Resource, TherapistNote } from './types';
import { DEFAULT_PREFERENCES, INITIAL_AFFIRMATIONS, INITIAL_RESOURCES } from './constants';

export function useKlarityStore() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [therapistNotes, setTherapistNotes] = useState<TherapistNote[]>([]);
  const [recommendedResources, setRecommendedResources] = useState<Resource[]>(INITIAL_RESOURCES);

  // UI States
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setUserProfile(null);
        setThreads([]);
        setAffirmations([]);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;

    // Sync User Profile
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserProfile(docSnap.data() as UserProfile);
      } else {
        // Initial profile creation will happen during onboarding
        setUserProfile(null);
      }
      setLoading(false);
    });

    // Sync Threads
    const threadsQuery = query(
      collection(db, 'threads'),
      where('uid', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );
    const unsubscribeThreads = onSnapshot(threadsQuery, (snapshot) => {
      const threadData = snapshot.docs.map(doc => doc.data() as ChatThread);
      setThreads(threadData);
    });

    // Sync Affirmations
    const affirmationsQuery = query(
      collection(db, 'affirmations'),
      where('uid', '==', user.uid)
    );
    const unsubscribeAffirmations = onSnapshot(affirmationsQuery, (snapshot) => {
      const affData = snapshot.docs.map(doc => doc.data() as Affirmation);
      setAffirmations(affData.length > 0 ? affData : INITIAL_AFFIRMATIONS);
    });

    return () => {
      unsubscribeProfile();
      unsubscribeThreads();
      unsubscribeAffirmations();
    };
  }, [user]);

  const updateProfile = async (profile: UserProfile) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, { ...profile, updatedAt: new Date().toISOString() }, { merge: true });
  };
  
  const addThread = async (thread: ChatThread) => {
    if (!user) return;
    const threadDocRef = doc(db, 'threads', thread.id);
    await setDoc(threadDocRef, { ...thread, uid: user.uid });
  };
  
  const updateThread = async (thread: ChatThread) => {
    if (!user) return;
    const threadDocRef = doc(db, 'threads', thread.id);
    await setDoc(threadDocRef, { ...thread, updatedAt: Date.now() }, { merge: true });
  };

  const deleteThread = async (id: string) => {
    if (!user) return;
    // In a real app we'd use deleteDoc, but for this demo we'll just filter if needed
    // or implement a soft delete. For now, let's assume we can delete.
    // await deleteDoc(doc(db, 'threads', id));
  };

  const mergeThreads = async (sourceId: string, targetId: string) => {
    const source = threads.find(t => t.id === sourceId);
    const target = threads.find(t => t.id === targetId);
    if (!source || !target || !user) return;

    const mergedMessages = [...target.messages, ...source.messages].sort((a, b) => a.timestamp - b.timestamp);
    const updatedTarget = {
      ...target,
      messages: mergedMessages,
      updatedAt: Math.max(target.updatedAt, source.updatedAt)
    };

    await updateThread(updatedTarget);
    // await deleteDoc(doc(db, 'threads', sourceId));
  };

  const addAffirmation = async (aff: Affirmation) => {
    if (!user) return;
    const affDocRef = doc(db, 'affirmations', aff.id);
    await setDoc(affDocRef, { ...aff, uid: user.uid });
  };
  
  const removeAffirmation = async (id: string) => {
    if (!user) return;
    // await deleteDoc(doc(db, 'affirmations', id));
  };
  
  const toggleFavoriteAffirmation = async (id: string) => {
    const aff = affirmations.find(a => a.id === id);
    if (!aff || !user) return;
    const affDocRef = doc(db, 'affirmations', id);
    await setDoc(affDocRef, { isFavorite: !aff.isFavorite }, { merge: true });
  };

  const addTherapistNote = (note: TherapistNote) => setTherapistNotes(prev => [note, ...prev]);

  const updateRecommendedResources = (resources: Resource[]) => setRecommendedResources(resources);

  const resetData = async () => {
    // In Firebase, we'd sign out
    await auth.signOut();
    window.location.reload();
  };

  return {
    user,
    loading,
    userProfile,
    updateProfile,
    threads,
    addThread,
    updateThread,
    deleteThread,
    mergeThreads,
    affirmations,
    addAffirmation,
    removeAffirmation,
    toggleFavoriteAffirmation,
    therapistNotes,
    addTherapistNote,
    recommendedResources,
    updateRecommendedResources,
    resetData,
    isVoiceActive,
    setIsVoiceActive,
    isSettingsOpen,
    setIsSettingsOpen,
  };
}
