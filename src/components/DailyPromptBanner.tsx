import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Zap, Compass, Quote, ArrowUpRight, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { DailyPromptData } from '../types';
import { fetchDailyReflectionPrompt } from '../services/geminiService';

interface DailyPromptBannerProps {
  onUsePrompt: (promptText: string, suggestedTitle?: string) => void;
}

export const DailyPromptBanner: React.FC<DailyPromptBannerProps> = ({ onUsePrompt }) => {
  const [dailyPrompt, setDailyPrompt] = useState<DailyPromptData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const loadPrompt = async (forceRefresh = false) => {
    const today = new Date().toISOString().split('T')[0];
    const cachedKey = `daily_prompt_${today}`;

    if (!forceRefresh) {
      const cached = localStorage.getItem(cachedKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setDailyPrompt(parsed);
          return;
        } catch {
          // ignore cache parse error
        }
      }
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchDailyReflectionPrompt();
      setDailyPrompt(res.data);
      localStorage.setItem(cachedKey, JSON.stringify(res.data));
    } catch (err: any) {
      console.error('Failed to load daily prompt:', err);
      setError(err.message || 'Unable to fetch prompt.');
      // Fallback
      if (!dailyPrompt) {
        setDailyPrompt({
          category: 'First Principles & Clarity',
          quote: 'The unexamined life is not worth living. — Socrates',
          question: 'What is the single most asymmetric decision or belief you are holding right now, and what if your primary assumption is completely inverted?',
          surpriseTrigger: 'What was the most unexpected observation, conversation, or realization you encountered today, and what underlying assumption did it overturn?',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPrompt();
  }, []);

  const handleApplyQuestion = () => {
    if (!dailyPrompt) return;
    const fullText = `### Daily Reflection Question: ${dailyPrompt.question}\n\n> *${dailyPrompt.quote}*\n\nMy Thoughts:\n`;
    onUsePrompt(fullText, `Reflection: ${dailyPrompt.category}`);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleApplySurprise = () => {
    if (!dailyPrompt) return;
    const surpriseText = `### What surprised me today?\n${dailyPrompt.surpriseTrigger || 'What unexpected observation or realization challenged my assumptions today?'}\n\nMy Observations:\n`;
    onUsePrompt(surpriseText, 'Epiphany: What Surprised Me Today');
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-[#3d362a] bg-[#14120e] shadow-lg shadow-[#000]/40 transition-all">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-[#2e271d] bg-[#1a1713]/80 px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#2e261a] text-[#c5b396]">
            <Compass className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#c5b396]">
            Daily Philosophical Calibration
          </span>
          {dailyPrompt?.category && (
            <span className="hidden sm:inline-flex rounded-md border border-[#3d362a] bg-[#12100d] px-2 py-0.5 text-[11px] font-medium text-[#a39782]">
              {dailyPrompt.category}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadPrompt(true)}
            disabled={isLoading}
            title="Generate a new philosophical prompt"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#3d362a] bg-[#14120e] px-2.5 py-1 text-xs text-[#c5b396] transition-colors hover:border-[#c5b396] hover:bg-[#24201a] disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isLoading ? 'Calibrating...' : 'New Angle'}</span>
          </button>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="rounded-lg p-1 text-[#8a8a8a] transition-colors hover:bg-[#24201a] hover:text-[#f5f5f5]"
          >
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Body Content */}
      {!isCollapsed && (
        <div className="p-4 sm:p-6">
          {isLoading && !dailyPrompt ? (
            <div className="flex items-center gap-3 py-4 text-sm text-[#8a8a8a]">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#c5b396]/30 border-t-[#c5b396]" />
              <span>Consulting Gemini for today&apos;s philosophical inquiry...</span>
            </div>
          ) : dailyPrompt ? (
            <div className="space-y-4">
              {/* Quote Premise */}
              {dailyPrompt.quote && (
                <div className="flex items-start gap-2.5 text-xs italic text-[#a39782]">
                  <Quote className="h-3.5 w-3.5 shrink-0 text-[#c5b396]/60 mt-0.5" />
                  <span>{dailyPrompt.quote}</span>
                </div>
              )}

              {/* Central Question */}
              <div className="rounded-xl border border-[#2e271d] bg-[#0d0b09] p-4">
                <p className="font-serif text-base sm:text-lg leading-relaxed text-[#f5f5f5]">
                  &ldquo;{dailyPrompt.question}&rdquo;
                </p>
              </div>

              {/* Actions & Trigger Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                {/* What Surprised You Today Trigger */}
                <button
                  id="btn-surprise-trigger"
                  onClick={handleApplySurprise}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#ffb703]/30 bg-[#2b2207] px-3.5 py-2 text-xs font-semibold text-[#ffd166] transition-all hover:border-[#ffb703] hover:bg-[#382b09] shadow-xs"
                >
                  <Zap className="h-3.5 w-3.5 text-[#ffd166]" />
                  <span>What surprised you today? ⚡</span>
                </button>

                {/* Primary Action Button */}
                <div className="flex items-center gap-2">
                  <button
                    id="btn-use-daily-prompt"
                    onClick={handleApplyQuestion}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#c5b396] px-4 py-2 text-xs font-semibold text-[#0a0a0a] transition-all hover:bg-[#d6c7ae] shadow-md shadow-[#c5b396]/10"
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-950" />
                        <span>Loaded Into Editor</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 text-[#0a0a0a]" />
                        <span>Write on this Prompt</span>
                        <ArrowUpRight className="h-3.5 w-3.5 text-[#0a0a0a]" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
