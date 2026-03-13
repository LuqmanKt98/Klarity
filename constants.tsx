
import { Affirmation, Resource, UserPreferences } from './types';

export const MODALITIES = [
  { id: 'cbt', label: 'CBT', category: 'Cognitive' },
  { id: 'act', label: 'ACT', category: 'Cognitive' },
  { id: 'dbt', label: 'DBT', category: 'Cognitive' },
  { id: 'ifs', label: 'Internal Family Systems', category: 'Cognitive' },
  { id: 'somatic', label: 'Somatic Experiencing', category: 'Body-Based' },
  { id: 'polyvagal', label: 'Polyvagal-informed', category: 'Body-Based' },
  { id: 'breath', label: 'Breath awareness', category: 'Body-Based' },
  { id: 'mindfulness', label: 'Mindfulness', category: 'Mindfulness' },
  { id: 'non-dual', label: 'Non-dual inquiry', category: 'Mindfulness' },
  { id: 'attachment', label: 'Attachment awareness', category: 'Emotional' },
  { id: 'stoic', label: 'Stoic reflection', category: 'Philosophical' },
  { id: 'taoist', label: 'Taoist inquiry', category: 'Philosophical' },
  { id: 'journaling', label: 'Journaling prompts', category: 'Creative' },
  { id: 'astrology', label: 'Archetypal Astrology', category: 'Spiritual' },
];

export const INTENSITY_LEVELS = [
  { value: 1, label: 'Gentle', desc: 'Mirroring & Validation' },
  { value: 2, label: 'Neutral', desc: 'Exploration' },
  { value: 3, label: 'Stretch', desc: 'Reframing' },
  { value: 4, label: 'Challenge', desc: 'Assumption Testing' },
  { value: 5, label: 'Peak Training', desc: 'Direct Inquiry' },
];

export const CATEGORIES = ['Health', 'Career', 'Love', 'Self', 'Growth', 'Calm'];

export const INITIAL_AFFIRMATIONS: Affirmation[] = [
  { id: '1', text: 'I am worthy of rest and peace.', categoryTags: ['Self', 'Calm'], isFavorite: false, source: 'curated' },
  { id: '2', text: 'My boundaries are a form of self-respect.', categoryTags: ['Growth', 'Self'], isFavorite: false, source: 'curated' },
  { id: '3', text: 'Every breath I take brings more clarity.', categoryTags: ['Health', 'Calm'], isFavorite: false, source: 'curated' },
  { id: '4', text: 'I release what I cannot control.', categoryTags: ['Growth', 'Calm'], isFavorite: false, source: 'curated' },
  { id: '5', text: 'My potential is infinite.', categoryTags: ['Career', 'Growth'], isFavorite: false, source: 'curated' },
  { id: '6', text: 'I am exactly where I need to be.', categoryTags: ['Self'], isFavorite: false, source: 'curated' },
  { id: '7', text: 'My heart is open to giving and receiving love.', categoryTags: ['Love'], isFavorite: false, source: 'curated' },
];

export const INITIAL_RESOURCES: Resource[] = [
  { id: 'r1', title: 'The Body Keeps the Score', type: 'book', note: 'Essential for somatic understanding.', url: 'https://www.google.com/search?q=The+Body+Keeps+the+Score' },
  { id: 'r2', title: 'Why Mindfulness Matters', type: 'article', note: 'A quick read on current research.', url: 'https://example.com/mindfulness-article' },
  { id: 'r3', title: 'Morning Breathwork', type: 'exercise', note: '5 minutes to center your nervous system.' },
];

export const DEFAULT_PREFERENCES: UserPreferences = {
  morningCheckIn: true,
  morningCheckInTime: '08:00',
  afternoonCheckIn: false,
  afternoonCheckInTime: '13:00',
  eveningCheckIn: false,
  eveningCheckInTime: '20:00',
  modalities: ['mindfulness', 'journaling'],
  autoUpdateOasis: true,
  intensityLevel: 1,
  enabledCategories: ['Health', 'Growth', 'Calm'],
};