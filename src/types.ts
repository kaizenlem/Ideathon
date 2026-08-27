export type ReflectionMode = 'reflection' | 'summary' | 'brainstorm' | 'action_plan' | 'chat';

export type MoodType = 'peaceful' | 'energetic' | 'thoughtful' | 'anxious' | 'motivated' | 'grateful' | 'creative';

export interface ChatTurn {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface JournalInteraction {
  id?: string;
  userId: string;
  title: string;
  entryText: string;
  mode: ReflectionMode;
  mood: MoodType;
  moodIntensity?: number; // 1 to 5
  aiResponse: string;
  modelUsed?: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  turns: ChatTurn[];
  isDraft?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export type ExportFormat = 'markdown' | 'json' | 'txt';

export type DateFilterOption = 'all' | 'today' | 'week' | 'month';
export type SortOption = 'newest' | 'oldest' | 'longest' | 'shortest';

export interface MoodStat {
  mood: MoodType;
  label: string;
  emoji: string;
  color: string;
  count: number;
  percentage: number;
}

export interface MoodAnalyticsData {
  totalEntries: number;
  totalWords: number;
  streakDays: number;
  topMood: MoodStat | null;
  distribution: MoodStat[];
  recentTrajectory: {
    date: string;
    timestamp: number;
    mood: MoodType;
    moodIntensity: number;
    title: string;
  }[];
}

export interface DailyPromptData {
  category: string;
  quote: string;
  question: string;
  surpriseTrigger: string;
  date?: string;
}

export interface MonthlyGrowthReportData {
  monthName: string;
  totalEntries: number;
  report: string;
  modelUsed: string;
  timestamp: number;
}
