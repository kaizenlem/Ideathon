import React, { useState } from 'react';
import { JournalInteraction, MoodType, ReflectionMode, DateFilterOption, SortOption } from '../types';
import { MOOD_META } from '../utils/moodAnalytics';
import {
  Search,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  MessageCircle,
  X,
  TrendingUp,
  Download,
  SlidersHorizontal,
  Tag,
  ArrowUpDown,
} from 'lucide-react';

interface HistorySidebarProps {
  interactions: JournalInteraction[];
  selectedId: string | null;
  onSelect: (interaction: JournalInteraction) => void;
  onNew: () => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onOpenMoodAnalytics: () => void;
  onOpenExportArchive: () => void;
  onOpenMonthlyReport: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

const modeLabels: Record<ReflectionMode, string> = {
  reflection: 'Reflection',
  summary: 'Summary',
  brainstorm: 'Brainstorm',
  action_plan: 'Action Plan',
  chat: 'Dialogue',
};

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  interactions,
  selectedId,
  onSelect,
  onNew,
  onDelete,
  onOpenMoodAnalytics,
  onOpenExportArchive,
  onOpenMonthlyReport,
  isOpenMobile,
  onCloseMobile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMood, setFilterMood] = useState<string>('all');
  const [filterMode, setFilterMode] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Extract all unique tags
  const allUniqueTags = Array.from(
    new Set(interactions.flatMap((item) => item.tags || []).filter(Boolean))
  ).slice(0, 10);

  const filteredInteractions = interactions
    .filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.entryText && item.entryText.toLowerCase().includes(q)) ||
        (item.aiResponse && item.aiResponse.toLowerCase().includes(q)) ||
        (item.tags && item.tags.some((t) => t.toLowerCase().includes(q))) ||
        (item.turns && item.turns.some((turn) => turn.content.toLowerCase().includes(q)));

      const matchesMood = filterMood === 'all' || item.mood === filterMood;
      const matchesMode = filterMode === 'all' || item.mode === filterMode;
      const matchesTag = !selectedTag || (item.tags && item.tags.includes(selectedTag));

      // Date filtering
      let matchesDate = true;
      const now = Date.now();
      if (dateFilter === 'today') {
        const startOfToday = new Date().setHours(0, 0, 0, 0);
        matchesDate = item.createdAt >= startOfToday;
      } else if (dateFilter === 'week') {
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
        matchesDate = item.createdAt >= sevenDaysAgo;
      } else if (dateFilter === 'month') {
        const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
        matchesDate = item.createdAt >= thirtyDaysAgo;
      }

      return matchesSearch && matchesMood && matchesMode && matchesTag && matchesDate;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return b.createdAt - a.createdAt;
      if (sortBy === 'oldest') return a.createdAt - b.createdAt;
      if (sortBy === 'longest') {
        const aLen = (a.entryText || '').length;
        const bLen = (b.entryText || '').length;
        return bLen - aLen;
      }
      if (sortBy === 'shortest') {
        const aLen = (a.entryText || '').length;
        const bLen = (b.entryText || '').length;
        return aLen - bLen;
      }
      return 0;
    });

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    filterMood !== 'all' ||
    filterMode !== 'all' ||
    dateFilter !== 'all' ||
    selectedTag !== null ||
    sortBy !== 'newest';

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterMood('all');
    setFilterMode('all');
    setDateFilter('all');
    setSelectedTag(null);
    setSortBy('newest');
  };

  const content = (
    <div className="flex h-full flex-col bg-[#0d0d0d] border-r border-[#262626] text-[#e5e5e5]">
      {/* Top Header */}
      <div className="p-4 border-b border-[#262626] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-base font-semibold text-[#f5f5f5]">Journal History</h2>
            <span className="rounded-full bg-[#1c1c1c] border border-[#2e2e2e] px-2 py-0.5 text-xs font-medium text-[#a3a3a3]">
              {filteredInteractions.length} / {interactions.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              id="btn-sidebar-new-entry"
              onClick={onNew}
              title="Create new entry"
              className="inline-flex items-center gap-1 rounded-lg bg-[#c5b396] px-2.5 py-1.5 text-xs font-semibold text-[#0a0a0a] shadow-xs hover:bg-[#d6c7ae] transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New</span>
            </button>
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 text-[#a3a3a3] hover:text-[#f5f5f5] rounded-md"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#666666]" />
          <input
            type="text"
            id="input-history-search"
            placeholder="Search entries, tags, AI insights..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[#262626] bg-[#141414] py-1.5 pl-8 pr-8 text-xs text-[#e5e5e5] placeholder-[#666666] focus:border-[#c5b396] focus:outline-none"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-[#666666] hover:text-[#a3a3a3]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              title="Toggle filters"
              className={`absolute right-2.5 top-2 ${
                showAdvancedFilters || hasActiveFilters ? 'text-[#c5b396]' : 'text-[#666666]'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filters Panel */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
            {/* Mood selector */}
            <select
              id="select-filter-mood"
              value={filterMood}
              onChange={(e) => setFilterMood(e.target.value)}
              className="rounded-md border border-[#262626] bg-[#141414] px-2 py-1 text-[#a3a3a3] focus:border-[#c5b396] focus:outline-none"
            >
              <option value="all">All Moods</option>
              {Object.entries(MOOD_META).map(([key, meta]) => (
                <option key={key} value={key} className="bg-[#141414] text-[#f5f5f5]">
                  {meta.emoji} {meta.label}
                </option>
              ))}
            </select>

            {/* Mode selector */}
            <select
              id="select-filter-mode"
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
              className="rounded-md border border-[#262626] bg-[#141414] px-2 py-1 text-[#a3a3a3] focus:border-[#c5b396] focus:outline-none"
            >
              <option value="all">All Modes</option>
              <option value="reflection">Reflection</option>
              <option value="summary">Summary</option>
              <option value="brainstorm">Brainstorm</option>
              <option value="action_plan">Action Plan</option>
            </select>
          </div>

          {/* Extended Filters Drawer */}
          {(showAdvancedFilters || hasActiveFilters) && (
            <div className="rounded-lg border border-[#262626] bg-[#121212] p-2.5 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-[#8a8a8a] block mb-1">Timeframe</span>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value as DateFilterOption)}
                    className="w-full rounded border border-[#262626] bg-[#181818] px-2 py-1 text-[11px] text-[#d4d4d4]"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Past 7 Days</option>
                    <option value="month">Past 30 Days</option>
                  </select>
                </div>

                <div>
                  <span className="text-[10px] text-[#8a8a8a] block mb-1">Sort Order</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full rounded border border-[#262626] bg-[#181818] px-2 py-1 text-[11px] text-[#d4d4d4]"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="longest">Longest Entry</option>
                    <option value="shortest">Shortest Entry</option>
                  </select>
                </div>
              </div>

              {/* Tag filters */}
              {allUniqueTags.length > 0 && (
                <div>
                  <span className="text-[10px] text-[#8a8a8a] block mb-1">Filter by Tag</span>
                  <div className="flex flex-wrap gap-1">
                    {allUniqueTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                        className={`rounded px-1.5 py-0.5 text-[10px] transition-colors ${
                          selectedTag === tag
                            ? 'bg-[#c5b396] text-[#0a0a0a] font-medium'
                            : 'bg-[#1c1c1c] text-[#a3a3a3] hover:text-[#f5f5f5]'
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="w-full text-center text-[10px] text-[#fca5a5] hover:underline pt-1"
                >
                  Reset all filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Entry List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredInteractions.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#666666]">
            {hasActiveFilters ? (
              <div className="space-y-1.5">
                <p className="text-[#a3a3a3]">No reflections match your filters.</p>
                <button
                  onClick={handleClearFilters}
                  className="text-xs text-[#c5b396] hover:underline"
                >
                  Clear search filters
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Sparkles className="mx-auto h-6 w-6 text-[#333333]" />
                <p className="text-[#a3a3a3]">No entries saved yet.</p>
                <p className="text-[11px] text-[#666666]">Write your first reflection to get started!</p>
              </div>
            )}
          </div>
        ) : (
          filteredInteractions.map((item) => {
            const isSelected = item.id === selectedId;
            const moodMeta = MOOD_META[item.mood] || MOOD_META.thoughtful;
            const modeName = modeLabels[item.mode] || 'Reflection';
            const totalTurns = item.turns ? item.turns.length : 0;

            return (
              <div
                key={item.id}
                id={`history-entry-${item.id}`}
                onClick={() => {
                  onSelect(item);
                  onCloseMobile();
                }}
                className={`group relative flex cursor-pointer flex-col gap-1.5 rounded-xl border p-3 text-left transition-all ${
                  isSelected
                    ? 'border-[#c5b396] bg-[#171613] shadow-xs ring-1 ring-[#c5b396]/30'
                    : 'border-[#262626] bg-[#121212] hover:border-[#383838] hover:bg-[#161616]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-medium text-[#f5f5f5] text-xs">
                    <span>{moodMeta.emoji}</span>
                    <span className="truncate max-w-[140px] font-serif">{item.title || 'Untitled Entry'}</span>
                    {item.isDraft && (
                      <span className="rounded bg-[#2e261a] border border-[#4d3d24] px-1 py-0.2 text-[9px] text-[#fcd34d]">
                        Draft
                      </span>
                    )}
                  </div>

                  <button
                    onClick={(e) => onDelete(item.id!, e)}
                    title="Delete reflection"
                    className="opacity-0 group-hover:opacity-100 p-1 text-[#666666] hover:text-[#f87171] transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <p className="line-clamp-2 text-[11px] text-[#8a8a8a] leading-relaxed">
                  {item.entryText}
                </p>

                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {item.tags.slice(0, 3).map((t) => (
                      <span key={t} className="text-[9px] text-[#666666]">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-1 flex items-center justify-between text-[10px] text-[#666666]">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded bg-[#1c1c1c] border border-[#2e2e2e] px-1.5 py-0.5 text-[#a3a3a3] font-medium">
                      {modeName}
                    </span>
                    {totalTurns > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-[#8a8a8a]">
                        <MessageCircle className="h-3 w-3" />
                        {totalTurns}
                      </span>
                    )}
                  </div>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(item.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Tool Actions (Mood Trends, Monthly Report & Export) */}
      <div className="p-3 border-t border-[#262626] bg-[#0a0a0a] space-y-2">
        <button
          id="btn-sidebar-monthly-report"
          onClick={onOpenMonthlyReport}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#3d362a] bg-[#1a1713] py-2 px-3 text-xs font-semibold text-[#c5b396] hover:border-[#c5b396] hover:bg-[#24201a] transition-all shadow-xs"
        >
          <TrendingUp className="h-3.5 w-3.5 text-[#c5b396]" />
          <span>Monthly Growth Report 📈</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            id="btn-sidebar-mood-trends"
            onClick={onOpenMoodAnalytics}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-[#2e2e2e] bg-[#141414] py-2 px-2 text-xs font-medium text-[#d4d4d4] hover:border-[#c5b396] hover:text-[#f5f5f5] hover:bg-[#1a1a1a] transition-all"
          >
            <Sparkles className="h-3 w-3 text-[#c5b396]" />
            <span>Mood Trends</span>
          </button>

          <button
            id="btn-sidebar-export-archive"
            onClick={onOpenExportArchive}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-[#262626] bg-[#101010] py-2 px-2 text-xs text-[#a3a3a3] hover:text-[#f5f5f5] hover:bg-[#161616] transition-all"
          >
            <Download className="h-3 w-3 text-[#6ee7b7]" />
            <span>Export</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-80 shrink-0 h-[calc(100vh-65px)] sticky top-[65px]">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onCloseMobile} />
          <div className="fixed inset-y-0 left-0 w-4/5 max-w-sm z-50 shadow-xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
