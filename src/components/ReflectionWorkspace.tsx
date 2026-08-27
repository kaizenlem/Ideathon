import React, { useState, useEffect, useRef } from 'react';
import { JournalInteraction, MoodType, ReflectionMode, ChatTurn } from '../types';
import { MOOD_META } from '../utils/moodAnalytics';
import { DailyPromptBanner } from './DailyPromptBanner';
import Markdown from 'react-markdown';
import {
  Sparkles,
  Send,
  Save,
  Copy,
  Check,
  RotateCcw,
  Tag,
  MessageSquare,
  AlertCircle,
  Lightbulb,
  FileText,
  ListTodo,
  Smile,
  Compass,
  ShieldCheck,
  ChevronDown,
  Download,
  Sliders,
  Clock,
} from 'lucide-react';

interface ReflectionWorkspaceProps {
  currentInteraction: JournalInteraction | null;
  onSaveAndGenerate: (data: {
    title: string;
    entryText: string;
    mode: ReflectionMode;
    mood: MoodType;
    moodIntensity: number;
    tags: string[];
  }) => Promise<void>;
  onSaveDraft: (data: {
    title: string;
    entryText: string;
    mode: ReflectionMode;
    mood: MoodType;
    moodIntensity: number;
    tags: string[];
    id?: string;
  }) => Promise<string | void>;
  onSendChatTurn: (message: string) => Promise<void>;
  onOpenExportModal: () => void;
  isGenerating: boolean;
  isSendingChat: boolean;
  error: string | null;
  onClearError: () => void;
  onNewReflection: () => void;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastAutosavedAt: number | null;
  userId: string;
}

const promptStarters = [
  'What is the single most asymmetric decision I am currently weighing, and what are the true second-order effects?',
  'What uncomfortable truth about my work or life have I been quietly avoiding?',
  'What bold hypothesis or creative epiphany deserves to be pressure-tested right now?',
  'Where did I experience peak flow today, and how do I intentionally engineer more of it?',
];

const modeOptions: { type: ReflectionMode; label: string; desc: string; icon: any }[] = [
  {
    type: 'reflection',
    label: 'Deep Reflection',
    desc: 'Empathetic insights, pattern identification & philosophical growth questions',
    icon: Compass,
  },
  {
    type: 'summary',
    label: 'Executive Summary',
    desc: 'Core themes, emotional drivers, key decisions & distilled takeaways',
    icon: FileText,
  },
  {
    type: 'brainstorm',
    label: 'Creative Brainstorming',
    desc: '5-7 bold lateral ideas, visionary possibilities & creative angles',
    icon: Lightbulb,
  },
  {
    type: 'action_plan',
    label: '3-Phase Action Plan',
    desc: 'Next 24h momentum, weekly milestones & long-term growth criteria',
    icon: ListTodo,
  },
];

const intensityLabels: Record<number, string> = {
  1: 'Subtle / Mild',
  2: 'Gentle',
  3: 'Moderate',
  4: 'Pronounced',
  5: 'Intense / High Resonance',
};

export const ReflectionWorkspace: React.FC<ReflectionWorkspaceProps> = ({
  currentInteraction,
  onSaveAndGenerate,
  onSaveDraft,
  onSendChatTurn,
  onOpenExportModal,
  isGenerating,
  isSendingChat,
  error,
  onClearError,
  onNewReflection,
  saveStatus,
  lastAutosavedAt,
  userId,
}) => {
  const [title, setTitle] = useState('');
  const [entryText, setEntryText] = useState('');
  const [mode, setMode] = useState<ReflectionMode>('reflection');
  const [mood, setMood] = useState<MoodType>('thoughtful');
  const [moodIntensity, setMoodIntensity] = useState<number>(3);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [isManualSaving, setIsManualSaving] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state when selected interaction changes
  useEffect(() => {
    isInitialMount.current = true;
    if (currentInteraction) {
      setTitle(currentInteraction.title || '');
      setEntryText(currentInteraction.entryText || '');
      setMode(currentInteraction.mode || 'reflection');
      setMood(currentInteraction.mood || 'thoughtful');
      setMoodIntensity(currentInteraction.moodIntensity || 3);
      setTags(currentInteraction.tags || []);
    } else {
      setTitle('');
      setEntryText('');
      setMode('reflection');
      setMood('thoughtful');
      setMoodIntensity(3);
      setTags([]);
    }
  }, [currentInteraction]);

  // Debounced Autosave Trigger when entryText or title changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!entryText.trim()) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      onSaveDraft({
        title: title.trim() || entryText.slice(0, 35).trim() + '...',
        entryText,
        mode,
        mood,
        moodIntensity,
        tags,
        id: currentInteraction?.id,
      });
    }, 1800);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [title, entryText, mode, mood, moodIntensity, tags]);

  // Scroll to bottom of chat when turns update
  useEffect(() => {
    if (currentInteraction?.turns && currentInteraction.turns.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentInteraction?.turns, isSendingChat]);

  const handleAddTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter' && e.key !== ',') return;
    e.preventDefault();
    const cleanTag = tagInput.trim().replace(/^#/, '');
    if (cleanTag && !tags.includes(cleanTag)) {
      setTags([...tags, cleanTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleUseDailyPrompt = (promptText: string, suggestedTitle?: string) => {
    if (suggestedTitle && !title.trim()) {
      setTitle(suggestedTitle);
    }
    setEntryText((prev) => {
      if (!prev.trim()) return promptText;
      return `${prev}\n\n${promptText}`;
    });
  };

  const handleManualDraftSave = async () => {
    if (!entryText.trim()) return;
    setIsManualSaving(true);
    try {
      await onSaveDraft({
        title: title.trim() || entryText.slice(0, 35).trim() + '...',
        entryText,
        mode,
        mood,
        moodIntensity,
        tags,
        id: currentInteraction?.id,
      });
    } finally {
      setIsManualSaving(false);
    }
  };

  const handleSubmitReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryText.trim()) return;

    const finalTitle = title.trim() || entryText.slice(0, 40).trim() + '...';
    await onSaveAndGenerate({
      title: finalTitle,
      entryText,
      mode,
      mood,
      moodIntensity,
      tags,
    });
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isSendingChat) return;
    const msg = chatInput.trim();
    setChatInput('');
    await onSendChatTurn(msg);
  };

  const handleCopyAiResponse = () => {
    if (currentInteraction?.aiResponse) {
      navigator.clipboard.writeText(currentInteraction.aiResponse);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const wordCount = entryText.trim() ? entryText.trim().split(/\s+/).length : 0;
  const charCount = entryText.length;
  const activeMoodMeta = MOOD_META[mood] || MOOD_META.thoughtful;

  const formatAutosaveTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 max-w-5xl mx-auto w-full text-[#e5e5e5]">
      {/* Top Banner Status / Breadcrumbs / Autosave indicator */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#262626] pb-4">
        <div className="flex items-center gap-3">
          <span className="font-serif text-lg font-semibold text-[#f5f5f5]">
            {currentInteraction?.id ? 'Active Reflection' : 'New Journal Reflection'}
          </span>

          {/* Autosave Status Pill */}
          <div className="flex items-center gap-1.5 text-xs">
            {saveStatus === 'saving' || isManualSaving ? (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-[#1f1a14] border border-[#3d3324] px-2.5 py-0.5 text-[#c5b396]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#c5b396]" />
                Autosaving to Firestore...
              </span>
            ) : lastAutosavedAt ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-[#6ee7b7]">
                <Check className="h-3 w-3" />
                <span>Autosaved {formatAutosaveTime(lastAutosavedAt)}</span>
              </span>
            ) : saveStatus === 'saved' ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-[#6ee7b7]">
                <Check className="h-3 w-3" />
                <span>Saved</span>
              </span>
            ) : null}
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2 text-xs">
          {/* Quick Draft Save Button */}
          {entryText.trim().length > 0 && (
            <button
              type="button"
              id="btn-save-draft"
              onClick={handleManualDraftSave}
              disabled={isManualSaving || saveStatus === 'saving'}
              className="inline-flex items-center gap-1 rounded-md border border-[#2e2e2e] bg-[#141414] px-2.5 py-1 text-[#d4d4d4] hover:border-[#c5b396] hover:text-[#f5f5f5] transition-colors disabled:opacity-50"
              title="Save draft immediately to Firestore"
            >
              <Save className="h-3 w-3 text-[#c5b396]" />
              <span>Save Draft</span>
            </button>
          )}

          {/* Export button */}
          <button
            type="button"
            id="btn-export-current"
            onClick={onOpenExportModal}
            className="inline-flex items-center gap-1 rounded-md border border-[#2e2e2e] bg-[#141414] px-2.5 py-1 text-[#d4d4d4] hover:border-[#6ee7b7] hover:text-[#f5f5f5] transition-colors"
            title="Export reflection to Markdown, Plain Text, or JSON"
          >
            <Download className="h-3 w-3 text-[#6ee7b7]" />
            <span>Export</span>
          </button>

          <div className="inline-flex items-center gap-1 rounded-md bg-[#141414] border border-[#262626] px-2 py-1 text-[#a3a3a3]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#c5b396]" />
            <span className="font-mono text-[11px]">/users/{userId.slice(0, 6)}...</span>
          </div>

          {currentInteraction?.id && (
            <button
              onClick={onNewReflection}
              className="inline-flex items-center gap-1 rounded-md border border-[#2e2e2e] bg-[#1a1a1a] px-2.5 py-1 text-[#d4d4d4] hover:bg-[#262626] hover:text-[#f5f5f5] transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              New Entry
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-start justify-between rounded-xl border border-[#522525] bg-[#211212] p-4 text-xs text-[#fca5a5]">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-[#f87171] mt-0.5" />
            <div>
              <p className="font-semibold text-[#f87171]">Operation Error</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={onClearError}
            className="rounded p-1 text-[#f87171] hover:bg-[#331818]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Daily Reflection Prompt & Surprise Trigger Banner */}
      <DailyPromptBanner onUsePrompt={handleUseDailyPrompt} />

      {/* Main Journal Form */}
      <form onSubmit={handleSubmitReflection} className="space-y-6">
        {/* Title & Mood Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label htmlFor="input-reflection-title" className="block text-xs font-medium text-[#a3a3a3] mb-1.5">
              Reflection Title
            </label>
            <input
              type="text"
              id="input-reflection-title"
              placeholder="e.g., Strategic clarity on product milestones..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-[#262626] bg-[#141414] px-3.5 py-2.5 text-sm text-[#f5f5f5] placeholder-[#666666] focus:border-[#c5b396] focus:outline-none focus:ring-1 focus:ring-[#c5b396]/30"
            />
          </div>

          <div>
            <label htmlFor="select-mood" className="block text-xs font-medium text-[#a3a3a3] mb-1.5">
              Emotional State / Mood
            </label>
            <div className="relative">
              <select
                id="select-mood"
                value={mood}
                onChange={(e) => setMood(e.target.value as MoodType)}
                className="w-full appearance-none rounded-xl border border-[#262626] bg-[#141414] px-3.5 py-2.5 pr-8 text-sm text-[#f5f5f5] focus:border-[#c5b396] focus:outline-none focus:ring-1 focus:ring-[#c5b396]/30"
              >
                {Object.entries(MOOD_META).map(([key, meta]) => (
                  <option key={key} value={key} className="bg-[#141414] text-[#f5f5f5]">
                    {meta.emoji} {meta.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-[#666666]" />
            </div>
          </div>
        </div>

        {/* Mood Intensity Slider */}
        <div className="rounded-xl border border-[#262626] bg-[#121212] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-[#c5b396]" />
            <span className="text-xs font-medium text-[#f5f5f5]">
              Mood Intensity & Resonance:
            </span>
            <span className="rounded-md bg-[#1c1c1c] border border-[#2e2e2e] px-2 py-0.5 text-xs text-[#c5b396] font-medium">
              {moodIntensity} / 5 &bull; {intensityLabels[moodIntensity]}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-64">
            <span className="text-[10px] text-[#666666]">Mild</span>
            <input
              type="range"
              id="slider-mood-intensity"
              min={1}
              max={5}
              step={1}
              value={moodIntensity}
              onChange={(e) => setMoodIntensity(Number(e.target.value))}
              className="w-full h-1.5 bg-[#262626] rounded-lg appearance-none cursor-pointer accent-[#c5b396]"
            />
            <span className="text-[10px] text-[#666666]">Intense</span>
          </div>
        </div>

        {/* Mode Selector Cards */}
        <div>
          <label className="block text-xs font-medium text-[#a3a3a3] mb-2">
            Gemini Reflection Objective
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {modeOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = mode === opt.type;
              return (
                <button
                  type="button"
                  key={opt.type}
                  id={`mode-btn-${opt.type}`}
                  onClick={() => setMode(opt.type)}
                  className={`flex flex-col text-left rounded-xl border p-3 transition-all ${
                    isSelected
                      ? 'border-[#c5b396] bg-[#1c1914] shadow-xs ring-1 ring-[#c5b396]/40'
                      : 'border-[#262626] bg-[#121212] hover:border-[#383838] hover:bg-[#161616]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                        isSelected ? 'bg-[#c5b396] text-[#0a0a0a]' : 'bg-[#1c1c1c] text-[#a3a3a3]'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-xs text-[#f5f5f5]">{opt.label}</span>
                  </div>
                  <p className="mt-1.5 text-[11px] text-[#8a8a8a] leading-relaxed">{opt.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Prompt Starters */}
        {!entryText && (
          <div className="rounded-xl border border-[#262626] bg-[#121212] p-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#c5b396] mb-2">
              <Lightbulb className="h-3.5 w-3.5 text-[#c5b396]" />
              <span>Prompt Starters:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {promptStarters.map((starter, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setEntryText(starter + '\n\n')}
                  className="rounded-lg border border-[#2e2e2e] bg-[#1a1a1a] px-2.5 py-1 text-left text-xs text-[#a3a3a3] hover:border-[#c5b396] hover:text-[#f5f5f5] transition-colors"
                >
                  &ldquo;{starter}&rdquo;
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Textarea */}
        <div className="relative">
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="textarea-entry" className="block text-xs font-medium text-[#a3a3a3]">
              Journal Entry / Raw Stream of Thought
            </label>
            <span className="text-[11px] text-[#666666] flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Autosaves in background
            </span>
          </div>

          <textarea
            id="textarea-entry"
            rows={8}
            placeholder="Write freely here. Share what happened, what you are feeling, what decisions you are contemplating, or ideas you wish to unpack..."
            value={entryText}
            onChange={(e) => setEntryText(e.target.value)}
            className="w-full rounded-2xl border border-[#262626] bg-[#141414] p-4 font-serif text-sm leading-relaxed text-[#f5f5f5] placeholder:font-sans placeholder-[#666666] focus:border-[#c5b396] focus:outline-none focus:ring-1 focus:ring-[#c5b396]/30 shadow-xs"
          />

          <div className="mt-2 flex items-center justify-between text-xs text-[#666666]">
            <span>
              {wordCount} words &bull; {charCount} characters
            </span>
            <span>Supports rich multi-turn Gemini analysis & follow-ups</span>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="input-tags" className="block text-xs font-medium text-[#a3a3a3] mb-1.5">
            Tags & Categories
          </label>
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#262626] bg-[#141414] p-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-md bg-[#1c1c1c] border border-[#2e2e2e] px-2 py-1 text-xs font-medium text-[#c5b396]"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-[#666666] hover:text-[#e5e5e5]"
                >
                  &times;
                </button>
              </span>
            ))}
            <div className="flex items-center gap-1">
              <Tag className="h-3.5 w-3.5 text-[#666666]" />
              <input
                type="text"
                id="input-tags"
                placeholder="Add tag (Press Enter)..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="border-none bg-transparent p-0 text-xs text-[#e5e5e5] focus:outline-none placeholder-[#666666]"
              />
            </div>
          </div>
        </div>

        {/* Submit & Generate Action */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="text-xs text-[#8a8a8a]">
            <span className="font-medium text-[#c5b396]">Resilient AI Engine: </span>
            Gemini 3.6 Flash with automated fallback ladder
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleManualDraftSave}
              disabled={isManualSaving || !entryText.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#2e2e2e] bg-[#141414] px-4 py-3 text-xs font-medium text-[#d4d4d4] hover:border-[#c5b396] hover:text-[#f5f5f5] transition-all disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Draft</span>
            </button>

            <button
              type="submit"
              id="btn-generate-reflection"
              disabled={isGenerating || !entryText.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#c5b396] px-6 py-3 text-sm font-semibold text-[#0a0a0a] shadow-lg shadow-[#c5b396]/10 transition-all hover:bg-[#d6c7ae] hover:shadow-xl hover:shadow-[#c5b396]/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0a0a0a]/30 border-t-[#0a0a0a]" />
                  <span>Reflecting with Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-[#0a0a0a]" />
                  <span>Generate {modeOptions.find((m) => m.type === mode)?.label}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* AI Response Section */}
      {currentInteraction?.aiResponse && (
        <section id="gemini-response-panel" className="mt-10 rounded-2xl border border-[#262626] bg-[#121212] p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#262626] pb-4 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#24201a] border border-[#3d362a] text-[#c5b396]">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-serif text-base font-semibold text-[#f5f5f5]">
                  Gemini AI Reflection & Guidance
                </h3>
                <p className="text-[11px] text-[#8a8a8a]">
                  Model: <span className="font-mono text-[#c5b396]">{currentInteraction.modelUsed || 'gemini-3.6-flash'}</span> &bull; Isolated to this user
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenExportModal}
                className="inline-flex items-center gap-1 rounded-lg border border-[#2e2e2e] bg-[#1a1a1a] px-2.5 py-1 text-xs font-medium text-[#d4d4d4] hover:bg-[#262626] hover:text-[#f5f5f5] transition-colors"
                title="Export this reflection"
              >
                <Download className="h-3.5 w-3.5 text-[#6ee7b7]" />
                <span>Export</span>
              </button>

              <button
                onClick={handleCopyAiResponse}
                className="inline-flex items-center gap-1 rounded-lg border border-[#2e2e2e] bg-[#1a1a1a] px-2.5 py-1 text-xs font-medium text-[#d4d4d4] hover:bg-[#262626] hover:text-[#f5f5f5] transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[#6ee7b7]" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Markdown Content */}
          <div className="prose prose-invert max-w-none text-sm leading-relaxed text-[#d4d4d4]">
            <div className="markdown-body">
              <Markdown>{currentInteraction.aiResponse}</Markdown>
            </div>
          </div>

          {/* Follow-up Multi-Turn Conversation Stream */}
          <div className="mt-10 border-t border-[#262626] pt-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-4 w-4 text-[#c5b396]" />
              <h4 className="font-serif text-sm font-semibold text-[#f5f5f5]">
                Continue the Conversation
              </h4>
              <span className="text-xs text-[#8a8a8a]">
                (Ask clarifying questions, dig deeper into insights, or explore action points)
              </span>
            </div>

            {/* Conversation Turns History */}
            {currentInteraction.turns && currentInteraction.turns.length > 0 && (
              <div className="mb-6 space-y-4 rounded-xl bg-[#0d0d0d] p-4 border border-[#262626]">
                {currentInteraction.turns.map((turn, index) => {
                  const isUser = turn.role === 'user';
                  return (
                    <div
                      key={index}
                      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isUser && (
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#24201a] border border-[#3d362a] text-[#c5b396] text-xs">
                          <Sparkles className="h-3.5 w-3.5" />
                        </div>
                      )}

                      <div
                        className={`max-w-2xl rounded-2xl p-3.5 text-xs leading-relaxed ${
                          isUser
                            ? 'bg-[#24201a] border border-[#3d362a] text-[#f5f5f5] rounded-br-xs'
                            : 'bg-[#141414] border border-[#262626] text-[#d4d4d4] shadow-2xs rounded-bl-xs'
                        }`}
                      >
                        <div className="markdown-body">
                          <Markdown>{turn.content}</Markdown>
                        </div>
                      </div>

                      {isUser && (
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1c1c1c] border border-[#2e2e2e] text-[#c5b396] text-xs font-semibold">
                          You
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
            )}

            {/* Chat Input */}
            <form onSubmit={handleSendChat} className="flex gap-2">
              <input
                type="text"
                id="input-followup-chat"
                placeholder="Ask Gemini a follow-up question or request an elaboration..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isSendingChat}
                className="flex-1 rounded-xl border border-[#262626] bg-[#141414] px-3.5 py-2.5 text-xs text-[#f5f5f5] placeholder-[#666666] focus:border-[#c5b396] focus:outline-none focus:ring-1 focus:ring-[#c5b396]/30"
              />
              <button
                type="submit"
                id="btn-send-followup"
                disabled={isSendingChat || !chatInput.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#c5b396] px-4 py-2.5 text-xs font-semibold text-[#0a0a0a] shadow-xs hover:bg-[#d6c7ae] transition-all disabled:opacity-50"
              >
                {isSendingChat ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0a0a0a]/30 border-t-[#0a0a0a]" />
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Send</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </section>
      )}
    </div>
  );
};
