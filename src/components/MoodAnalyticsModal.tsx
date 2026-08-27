import React, { useState } from 'react';
import { JournalInteraction } from '../types';
import { calculateMoodAnalytics, MOOD_META } from '../utils/moodAnalytics';
import { requestMoodSummary } from '../services/geminiService';
import {
  X,
  TrendingUp,
  Flame,
  BookOpen,
  Sparkles,
  Heart,
  BarChart2,
  Calendar,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import Markdown from 'react-markdown';

interface MoodAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  interactions: JournalInteraction[];
}

export const MoodAnalyticsModal: React.FC<MoodAnalyticsModalProps> = ({
  isOpen,
  onClose,
  interactions,
}) => {
  const [aiSynthesis, setAiSynthesis] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const stats = calculateMoodAnalytics(interactions);

  const handleGenerateSynthesis = async () => {
    if (interactions.length === 0) {
      setError('You need at least 1 reflection entry to generate an emotional synthesis.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await requestMoodSummary(
        stats.distribution.map((d) => ({ mood: d.mood, count: d.count, percent: d.percentage })),
        interactions.slice(0, 15)
      );
      setAiSynthesis(result.analysis);
    } catch (err: any) {
      console.error('Failed to generate mood synthesis:', err);
      setError(err.message || 'Could not generate emotional wellness synthesis.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopySynthesis = () => {
    if (!aiSynthesis) return;
    navigator.clipboard.writeText(aiSynthesis);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-[#262626] bg-[#0f0f0f] shadow-2xl text-[#e5e5e5]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#262626] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#24201a] border border-[#3d362a] text-[#c5b396]">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold text-[#f5f5f5]">
                Mood Tracking & Wellbeing Analytics
              </h2>
              <p className="text-xs text-[#8a8a8a]">
                Emotional patterns, reflection streaks, and AI synthesis
              </p>
            </div>
          </div>

          <button
            id="btn-close-mood-modal"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#a3a3a3] hover:bg-[#1a1a1a] hover:text-[#f5f5f5] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Key Metric Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="rounded-xl border border-[#262626] bg-[#141414] p-4">
              <div className="flex items-center justify-between text-[#8a8a8a]">
                <span className="text-xs font-medium">Total Entries</span>
                <BookOpen className="h-4 w-4 text-[#c5b396]" />
              </div>
              <p className="mt-2 text-2xl font-bold text-[#f5f5f5]">{stats.totalEntries}</p>
              <p className="mt-0.5 text-[11px] text-[#666666]">Recorded thoughts</p>
            </div>

            <div className="rounded-xl border border-[#262626] bg-[#141414] p-4">
              <div className="flex items-center justify-between text-[#8a8a8a]">
                <span className="text-xs font-medium">Reflection Streak</span>
                <Flame className="h-4 w-4 text-[#fcd34d]" />
              </div>
              <p className="mt-2 text-2xl font-bold text-[#f5f5f5]">
                {stats.streakDays} <span className="text-xs font-normal text-[#8a8a8a]">days</span>
              </p>
              <p className="mt-0.5 text-[11px] text-[#666666]">Consecutive practice</p>
            </div>

            <div className="rounded-xl border border-[#262626] bg-[#141414] p-4">
              <div className="flex items-center justify-between text-[#8a8a8a]">
                <span className="text-xs font-medium">Total Words</span>
                <BarChart2 className="h-4 w-4 text-[#6ee7b7]" />
              </div>
              <p className="mt-2 text-2xl font-bold text-[#f5f5f5]">
                {stats.totalWords.toLocaleString()}
              </p>
              <p className="mt-0.5 text-[11px] text-[#666666]">Words written</p>
            </div>

            <div className="rounded-xl border border-[#262626] bg-[#141414] p-4">
              <div className="flex items-center justify-between text-[#8a8a8a]">
                <span className="text-xs font-medium">Dominant Tone</span>
                <Heart className="h-4 w-4 text-[#f472b6]" />
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <span className="text-lg">{stats.topMood?.emoji || '✨'}</span>
                <span className="text-base font-bold text-[#f5f5f5] truncate">
                  {stats.topMood?.label || 'None yet'}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-[#666666]">
                {stats.topMood ? `${stats.topMood.percentage}% of entries` : 'Write an entry'}
              </p>
            </div>
          </div>

          {/* Emotional Breakdown Distribution */}
          <div className="rounded-xl border border-[#262626] bg-[#141414] p-5">
            <h3 className="font-serif text-sm font-semibold text-[#f5f5f5] mb-3 flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-[#c5b396]" />
              <span>Mood Breakdown & Distribution</span>
            </h3>

            {stats.totalEntries === 0 ? (
              <p className="text-xs text-[#666666] py-3 text-center">
                No entries available to analyze yet.
              </p>
            ) : (
              <div className="space-y-3">
                {stats.distribution.map((item) => (
                  <div key={item.mood} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-medium text-[#d4d4d4]">
                        <span>{item.emoji}</span>
                        <span>{item.label}</span>
                      </span>
                      <span className="text-[#8a8a8a]">
                        {item.count} {item.count === 1 ? 'entry' : 'entries'} ({item.percentage}%)
                      </span>
                    </div>
                    {/* Bar */}
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#1e1e1e]">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chronological Emotional Trajectory */}
          {stats.recentTrajectory.length > 0 && (
            <div className="rounded-xl border border-[#262626] bg-[#141414] p-5">
              <h3 className="font-serif text-sm font-semibold text-[#f5f5f5] mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#c5b396]" />
                <span>Recent Emotional Trajectory</span>
              </h3>
              <div className="flex items-end gap-2 overflow-x-auto pb-2 pt-4">
                {stats.recentTrajectory.map((point, idx) => {
                  const meta = MOOD_META[point.mood] || MOOD_META.thoughtful;
                  const heightPercent = Math.max(25, (point.moodIntensity / 5) * 100);
                  return (
                    <div
                      key={idx}
                      className="flex flex-col items-center gap-1.5 min-w-[54px] flex-1 text-center group cursor-pointer"
                      title={`${point.title} (${meta.label}, Intensity: ${point.moodIntensity}/5)`}
                    >
                      <span className="text-xs">{meta.emoji}</span>
                      <div className="w-full flex items-end justify-center h-16 bg-[#1a1a1a] rounded-lg p-1">
                        <div
                          className="w-full rounded-md transition-all group-hover:opacity-80"
                          style={{
                            height: `${heightPercent}%`,
                            backgroundColor: meta.color,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-[#8a8a8a] truncate w-full">{point.date}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Gemini AI Emotional Wellbeing Synthesis Card */}
          <div className="rounded-xl border border-[#3d362a] bg-[#1a1713] p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#24201a] text-[#c5b396]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-serif text-sm font-semibold text-[#f5f5f5]">
                    Gemini AI Emotional Wellness Synthesis
                  </h3>
                  <p className="text-xs text-[#a3a3a3]">
                    Deep AI analysis of recurring emotional triggers, resilience habits, and actionable mindfulness
                  </p>
                </div>
              </div>

              <button
                id="btn-generate-mood-synthesis"
                onClick={handleGenerateSynthesis}
                disabled={isGenerating || interactions.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-[#c5b396] px-4 py-2 text-xs font-semibold text-[#0a0a0a] shadow-xs hover:bg-[#d6c7ae] transition-all disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0a0a0a]/30 border-t-[#0a0a0a]" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Generate AI Synthesis</span>
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#522525] bg-[#211212] p-3 text-xs text-[#fca5a5]">
                <AlertCircle className="h-4 w-4 shrink-0 text-[#f87171]" />
                <span>{error}</span>
              </div>
            )}

            {aiSynthesis && (
              <div className="mt-4 border-t border-[#3d362a] pt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-[#c5b396]">Personalized Synthesis:</span>
                  <button
                    onClick={handleCopySynthesis}
                    className="inline-flex items-center gap-1 text-xs text-[#a3a3a3] hover:text-[#f5f5f5]"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-[#6ee7b7]" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="prose prose-invert max-w-none text-xs leading-relaxed text-[#d4d4d4]">
                  <div className="markdown-body">
                    <Markdown>{aiSynthesis}</Markdown>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#262626] px-6 py-3 flex items-center justify-between text-xs text-[#8a8a8a]">
          <span>All analytics calculated locally and within your private Firestore boundary.</span>
          <button
            onClick={onClose}
            className="rounded-lg border border-[#2e2e2e] bg-[#1a1a1a] px-3.5 py-1.5 text-xs font-medium text-[#d4d4d4] hover:bg-[#262626] hover:text-[#f5f5f5]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
