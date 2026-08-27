import { JournalInteraction, MoodType, MoodStat, MoodAnalyticsData } from '../types';

export const MOOD_META: Record<MoodType, { label: string; emoji: string; color: string; bgClass: string }> = {
  peaceful: { label: 'Peaceful', emoji: '🌿', color: '#6ee7b7', bgClass: 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50' },
  thoughtful: { label: 'Thoughtful', emoji: '💡', color: '#c5b396', bgClass: 'bg-[#24201a] text-[#c5b396] border-[#3d362a]' },
  energetic: { label: 'Energetic', emoji: '⚡', color: '#fcd34d', bgClass: 'bg-amber-950/40 text-amber-300 border-amber-800/50' },
  motivated: { label: 'Motivated', emoji: '🎯', color: '#38bdf8', bgClass: 'bg-sky-950/40 text-sky-300 border-sky-800/50' },
  grateful: { label: 'Grateful', emoji: '🙏', color: '#f472b6', bgClass: 'bg-pink-950/40 text-pink-300 border-pink-800/50' },
  creative: { label: 'Creative', emoji: '✨', color: '#c084fc', bgClass: 'bg-purple-950/40 text-purple-300 border-purple-800/50' },
  anxious: { label: 'Anxious', emoji: '🌊', color: '#94a3b8', bgClass: 'bg-slate-900 text-slate-300 border-slate-700' },
};

export function calculateMoodAnalytics(interactions: JournalInteraction[]): MoodAnalyticsData {
  if (!interactions || interactions.length === 0) {
    return {
      totalEntries: 0,
      totalWords: 0,
      streakDays: 0,
      topMood: null,
      distribution: (Object.keys(MOOD_META) as MoodType[]).map((mood) => ({
        mood,
        label: MOOD_META[mood].label,
        emoji: MOOD_META[mood].emoji,
        color: MOOD_META[mood].color,
        count: 0,
        percentage: 0,
      })),
      recentTrajectory: [],
    };
  }

  const totalEntries = interactions.length;
  let totalWords = 0;
  const moodCounts: Record<MoodType, number> = {
    peaceful: 0,
    thoughtful: 0,
    energetic: 0,
    motivated: 0,
    grateful: 0,
    creative: 0,
    anxious: 0,
  };

  const datesSet = new Set<string>();

  interactions.forEach((item) => {
    const words = (item.entryText || '').trim().split(/\s+/).filter(Boolean).length;
    totalWords += words;

    if (moodCounts[item.mood] !== undefined) {
      moodCounts[item.mood] += 1;
    } else {
      moodCounts.thoughtful += 1;
    }

    const dStr = new Date(item.createdAt).toISOString().split('T')[0];
    datesSet.add(dStr);
  });

  // Calculate Streak in consecutive days
  const sortedDates = Array.from(datesSet).sort().reverse();
  let streakDays = 0;
  if (sortedDates.length > 0) {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // If latest entry is today or yesterday, count streak
    if (sortedDates[0] === today || sortedDates[0] === yesterday) {
      streakDays = 1;
      for (let i = 0; i < sortedDates.length - 1; i++) {
        const curr = new Date(sortedDates[i]).getTime();
        const prev = new Date(sortedDates[i + 1]).getTime();
        const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          streakDays += 1;
        } else {
          break;
        }
      }
    }
  }

  // Distribution list
  const distribution: MoodStat[] = (Object.keys(MOOD_META) as MoodType[]).map((m) => {
    const count = moodCounts[m] || 0;
    const percentage = totalEntries > 0 ? Math.round((count / totalEntries) * 100) : 0;
    return {
      mood: m,
      label: MOOD_META[m].label,
      emoji: MOOD_META[m].emoji,
      color: MOOD_META[m].color,
      count,
      percentage,
    };
  }).sort((a, b) => b.count - a.count);

  const topMood = distribution[0] && distribution[0].count > 0 ? distribution[0] : null;

  // Chronological Trajectory (up to last 14 entries)
  const trajectoryList = [...interactions]
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(-14)
    .map((item) => ({
      date: new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      timestamp: item.createdAt,
      mood: item.mood,
      moodIntensity: item.moodIntensity || 3,
      title: item.title || 'Untitled Reflection',
    }));

  return {
    totalEntries,
    totalWords,
    streakDays,
    topMood,
    distribution,
    recentTrajectory: trajectoryList,
  };
}
