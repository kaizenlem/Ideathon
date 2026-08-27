import { ReflectionMode, MoodType, ChatTurn } from '../types';

export interface GenerateReflectionParams {
  title: string;
  entryText: string;
  mode: ReflectionMode;
  mood: MoodType;
  conversationHistory?: ChatTurn[];
}

export interface ReflectionResponse {
  success: boolean;
  aiResponse: string;
  modelUsed: string;
  timestamp: number;
}

export async function requestGeminiReflection(params: GenerateReflectionParams): Promise<ReflectionResponse> {
  const response = await fetch('/api/gemini/reflect', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to generate Gemini reflection.');
  }

  return data;
}

export async function sendGeminiChatMessage(
  originalEntry: string,
  userMessage: string,
  history: ChatTurn[]
): Promise<{ reply: string; modelUsed: string }> {
  const response = await fetch('/api/gemini/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      originalEntry,
      userMessage,
      history,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to send message to Gemini.');
  }

  return {
    reply: data.reply,
    modelUsed: data.modelUsed,
  };
}

export async function requestMoodSummary(
  moodStats: any,
  recentEntries: any[]
): Promise<{ analysis: string; modelUsed: string }> {
  const response = await fetch('/api/gemini/mood-summary', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      moodStats,
      recentEntries,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to generate mood synthesis.');
  }

  return {
    analysis: data.analysis,
    modelUsed: data.modelUsed,
  };
}

export async function fetchDailyReflectionPrompt(): Promise<{
  data: import('../types').DailyPromptData;
  modelUsed: string;
  date: string;
}> {
  const response = await fetch('/api/gemini/daily-prompt');
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch daily reflection prompt.');
  }
  return data;
}

export async function requestMonthlyGrowthReport(
  monthName: string,
  entries: any[],
  stats: any
): Promise<{
  report: string;
  modelUsed: string;
  monthName: string;
  totalEntries: number;
}> {
  const response = await fetch('/api/gemini/monthly-report', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      monthName,
      entries,
      stats,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to generate monthly growth report.');
  }

  return data;
}
