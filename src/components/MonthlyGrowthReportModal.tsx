import React, { useState, useMemo } from 'react';
import { X, Sparkles, TrendingUp, Calendar, FileText, Download, Copy, Check, BarChart2, BookOpen, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { JournalInteraction, MonthlyGrowthReportData } from '../types';
import { requestMonthlyGrowthReport } from '../services/geminiService';

interface MonthlyGrowthReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  interactions: JournalInteraction[];
}

export const MonthlyGrowthReportModal: React.FC<MonthlyGrowthReportModalProps> = ({
  isOpen,
  onClose,
  interactions,
}) => {
  // Group entries by Month Year (e.g. "August 2026")
  const availableMonths = useMemo(() => {
    const monthsMap = new Map<string, { label: string; key: string; entries: JournalInteraction[] }>();

    // Always include current month
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    monthsMap.set(currentKey, { label: currentLabel, key: currentKey, entries: [] });

    interactions.forEach((item) => {
      const d = new Date(item.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!monthsMap.has(key)) {
        monthsMap.set(key, { label, key, entries: [] });
      }
      monthsMap.get(key)!.entries.push(item);
    });

    return Array.from(monthsMap.values()).sort((a, b) => b.key.localeCompare(a.key));
  }, [interactions]);

  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [reportData, setReportData] = useState<MonthlyGrowthReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const selectedMonthData = useMemo(() => {
    return availableMonths.find((m) => m.key === selectedMonthKey) || availableMonths[0];
  }, [availableMonths, selectedMonthKey]);

  // Compute month stats
  const monthStats = useMemo(() => {
    if (!selectedMonthData) return { totalEntries: 0, totalWords: 0, topMood: 'None', moodBreakdown: {} };
    const entries = selectedMonthData.entries;
    let totalWords = 0;
    const moodCounts: Record<string, number> = {};

    entries.forEach((e) => {
      const words = (e.entryText || '').trim().split(/\s+/).filter(Boolean).length;
      totalWords += words;
      moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
    });

    let topMood = 'None';
    let maxCount = 0;
    Object.entries(moodCounts).forEach(([mood, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topMood = mood;
      }
    });

    return {
      totalEntries: entries.length,
      totalWords,
      topMood,
      moodBreakdown: moodCounts,
    };
  }, [selectedMonthData]);

  if (!isOpen) return null;

  const handleGenerateReport = async () => {
    if (!selectedMonthData || selectedMonthData.entries.length === 0) {
      setError('No reflections found in this month to generate a report.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await requestMonthlyGrowthReport(
        selectedMonthData.label,
        selectedMonthData.entries,
        monthStats
      );

      setReportData({
        monthName: result.monthName,
        totalEntries: result.totalEntries,
        report: result.report,
        modelUsed: result.modelUsed,
        timestamp: Date.now(),
      });
    } catch (err: any) {
      console.error('Failed to generate monthly report:', err);
      setError(err.message || 'Failed to generate report.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!reportData) return;
    navigator.clipboard.writeText(reportData.report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (format: 'md' | 'txt') => {
    if (!reportData) return;
    const blob = new Blob([reportData.report], { type: format === 'md' ? 'text/markdown' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Monthly_Growth_Report_${reportData.monthName.replace(/\s+/g, '_')}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000]/80 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-[#2e271d] bg-[#12100d] text-[#e5e5e5] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#262017] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#3d362a] bg-[#1f1a14] text-[#c5b396]">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold text-[#f5f5f5]">
                Monthly Growth Report
              </h2>
              <p className="text-xs text-[#8a8a8a]">
                Gemini-powered cognitive synthesis and milestone aggregation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#8a8a8a] transition-colors hover:bg-[#1f1a14] hover:text-[#f5f5f5]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Controls Bar: Select Month & Overview Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="sm:col-span-2 rounded-xl border border-[#262017] bg-[#17130f] p-4">
              <label className="block text-xs font-medium text-[#c5b396] uppercase tracking-wider mb-2">
                Select Month
              </label>
              <select
                value={selectedMonthKey}
                onChange={(e) => {
                  setSelectedMonthKey(e.target.value);
                  setReportData(null); // Clear previous report when changing month
                }}
                className="w-full rounded-lg border border-[#3d362a] bg-[#0f0d0a] px-3 py-2 text-sm text-[#f5f5f5] focus:border-[#c5b396] focus:outline-hidden"
              >
                {availableMonths.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label} ({m.entries.length} {m.entries.length === 1 ? 'entry' : 'entries'})
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-xl border border-[#262017] bg-[#17130f] p-4 flex flex-col justify-center">
              <span className="text-[11px] uppercase tracking-wider text-[#8a8a8a]">Total Reflections</span>
              <span className="mt-1 font-serif text-2xl font-semibold text-[#f5f5f5]">{monthStats.totalEntries}</span>
              <span className="text-[11px] text-[#6ee7b7]">{monthStats.totalWords.toLocaleString()} words</span>
            </div>

            <div className="rounded-xl border border-[#262017] bg-[#17130f] p-4 flex flex-col justify-center">
              <span className="text-[11px] uppercase tracking-wider text-[#8a8a8a]">Dominant State</span>
              <span className="mt-1 font-serif text-lg font-medium capitalize text-[#c5b396]">
                {monthStats.topMood !== 'None' ? monthStats.topMood : 'No entries'}
              </span>
              <span className="text-[11px] text-[#8a8a8a]">
                {selectedMonthData?.label}
              </span>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Trigger / Generating Banner */}
          {!reportData && !isGenerating && (
            <div className="rounded-2xl border border-[#2e271d] bg-[#14110d] p-8 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#3d362a] bg-[#1f1a14] text-[#c5b396]">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="font-serif text-lg font-medium text-[#f5f5f5]">
                  Synthesize {selectedMonthData?.label}
                </h3>
                <p className="text-xs text-[#8a8a8a] leading-relaxed">
                  Gemini will analyze all {monthStats.totalEntries} reflection logs from {selectedMonthData?.label} to extract recurring themes, breakthrough milestones, emotional patterns, and next-month strategic levers.
                </p>
              </div>

              <button
                id="btn-generate-monthly-report"
                onClick={handleGenerateReport}
                disabled={monthStats.totalEntries === 0}
                className="inline-flex items-center gap-2.5 rounded-xl bg-[#c5b396] px-6 py-3 text-sm font-semibold text-[#0a0a0a] shadow-lg shadow-[#c5b396]/10 transition-all hover:bg-[#d6c7ae] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                <span>Generate Growth Report</span>
              </button>
            </div>
          )}

          {isGenerating && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-[#2e271d] bg-[#14110d] py-16 text-center space-y-4">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#c5b396]/30 border-t-[#c5b396]" />
              <div className="space-y-1">
                <h4 className="font-serif text-base font-medium text-[#f5f5f5]">
                  Aggregating & Synthesizing {selectedMonthData?.label}...
                </h4>
                <p className="text-xs text-[#8a8a8a]">
                  Extracting psychological patterns, breakthroughs, and growth trajectories with Gemini AI
                </p>
              </div>
            </div>
          )}

          {/* Render Generated Report */}
          {reportData && !isGenerating && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#2e271d] bg-[#1a1611] px-4 py-3">
                <div className="flex items-center gap-2 text-xs text-[#c5b396]">
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>Generated with {reportData.modelUsed} &bull; {reportData.totalEntries} reflections synthesized</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#3d362a] bg-[#14110d] px-3 py-1.5 text-xs text-[#c5b396] hover:bg-[#24201a]"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={() => handleDownload('md')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#3d362a] bg-[#14110d] px-3 py-1.5 text-xs text-[#c5b396] hover:bg-[#24201a]"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download (.md)</span>
                  </button>
                  <button
                    onClick={handleGenerateReport}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#c5b396] px-3 py-1.5 text-xs font-semibold text-[#0a0a0a] hover:bg-[#d6c7ae]"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Regenerate</span>
                  </button>
                </div>
              </div>

              {/* Formatted Markdown Container */}
              <div className="rounded-2xl border border-[#262017] bg-[#0d0b09] p-6 sm:p-8">
                <div className="prose prose-invert max-w-none prose-headings:font-serif prose-headings:text-[#f5f5f5] prose-p:text-[#c4c4c4] prose-p:leading-relaxed prose-li:text-[#c4c4c4] prose-strong:text-[#c5b396]">
                  <ReactMarkdown>{reportData.report}</ReactMarkdown>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#262017] px-6 py-4 bg-[#14110d] rounded-b-2xl">
          <span className="text-xs text-[#6a6a6a]">
            Monthly summaries preserve end-to-end user isolation
          </span>
          <button
            onClick={onClose}
            className="rounded-xl border border-[#3d362a] bg-[#1c1813] px-4 py-2 text-xs font-medium text-[#c5b396] hover:bg-[#262017]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
