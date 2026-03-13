
export type Role = 'user' | 'ai';

export interface Message {
  id: string;
  threadId: string;
  role: Role;
  content: string;
  timestamp: number;
  inferredMoodScore?: number;
}

export interface ChatThread {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  themeLabel: string;
  messages: Message[];
}

export interface Affirmation {
  id: string;
  text: string;
  categoryTags: string[];
  isFavorite: boolean;
  source: 'curated' | 'user' | 'recommended';
}

export interface Resource {
  id: string;
  title: string;
  type: 'article' | 'book' | 'audiobook' | 'exercise';
  url?: string;
  note: string;
}

export interface TherapistNote {
  id: string;
  title: string;
  note: string;
  timestamp: number;
}

export interface OnboardingData {
  primaryFocus: string;
  historyOfTherapy: string;
  currentStressLevel: number;
  goals: string[];
  termsAccepted: boolean;
}

export interface UserPreferences {
  morningCheckIn: boolean;
  morningCheckInTime: string;
  afternoonCheckIn: boolean;
  afternoonCheckInTime: string;
  eveningCheckIn: boolean;
  eveningCheckInTime: string;
  modalities: string[];
  autoUpdateOasis: boolean;
  intensityLevel: 1 | 2 | 3 | 4 | 5;
  enabledCategories: string[];
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  onboardingComplete: boolean;
  onboardingData?: OnboardingData;
  preferences: UserPreferences;
  lastCheckInDate?: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}

export interface InsightSnapshot {
  generatedAt: number;
  moodTrend: { date: string; score: number }[];
  keyThemes: string[];
  progressMilestones: string[];
  resources: Resource[];
  therapistNotes: TherapistNote[];
}
