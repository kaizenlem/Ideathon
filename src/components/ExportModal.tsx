import React, { useState } from 'react';
import { JournalInteraction, ExportFormat } from '../types';
import {
  exportSingleInteraction,
  exportAllInteractions,
  formatInteractionToMarkdown,
  formatInteractionToText,
} from '../utils/exportUtils';
import { X, Download, FileText, Code, FileCode, Check, Eye } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentInteraction: JournalInteraction | null;
  allInteractions: JournalInteraction[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  currentInteraction,
  allInteractions,
}) => {
  const [scope, setScope] = useState<'current' | 'all'>(currentInteraction ? 'current' : 'all');
  const [format, setFormat] = useState<ExportFormat>('markdown');
  const [showPreview, setShowPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const activeItem = currentInteraction || allInteractions[0] || null;

  const handleExport = () => {
    setIsExporting(true);
    try {
      if (scope === 'current' && currentInteraction) {
        exportSingleInteraction(currentInteraction, format);
      } else {
        exportAllInteractions(allInteractions, format);
      }
      setDownloadSuccess(true);
      setTimeout(() => {
        setDownloadSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const getPreviewText = (): string => {
    if (!activeItem) return 'No entries available to export.';
    if (format === 'markdown') {
      return formatInteractionToMarkdown(activeItem);
    } else if (format === 'txt') {
      return formatInteractionToText(activeItem);
    } else {
      return JSON.stringify(scope === 'current' ? activeItem : allInteractions.slice(0, 3), null, 2);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-[#262626] bg-[#0f0f0f] shadow-2xl text-[#e5e5e5]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#262626] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#24201a] border border-[#3d362a] text-[#c5b396]">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold text-[#f5f5f5]">
                Export Reflections
              </h2>
              <p className="text-xs text-[#8a8a8a]">
                Export your private entries and Gemini dialogues in standard formats
              </p>
            </div>
          </div>

          <button
            id="btn-close-export-modal"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#a3a3a3] hover:bg-[#1a1a1a] hover:text-[#f5f5f5] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Scope Selector */}
          <div>
            <label className="block text-xs font-medium text-[#a3a3a3] mb-2">Export Scope</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={!currentInteraction}
                onClick={() => setScope('current')}
                className={`flex flex-col text-left rounded-xl border p-3.5 transition-all ${
                  scope === 'current'
                    ? 'border-[#c5b396] bg-[#1c1914] text-[#f5f5f5] ring-1 ring-[#c5b396]/30'
                    : 'border-[#262626] bg-[#141414] text-[#a3a3a3] hover:border-[#383838]'
                } ${!currentInteraction ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <span className="font-serif text-xs font-semibold">Active Reflection</span>
                <span className="mt-1 text-[11px] text-[#8a8a8a] line-clamp-1">
                  {currentInteraction ? currentInteraction.title || 'Untitled Entry' : 'No active selection'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setScope('all')}
                className={`flex flex-col text-left rounded-xl border p-3.5 transition-all ${
                  scope === 'all'
                    ? 'border-[#c5b396] bg-[#1c1914] text-[#f5f5f5] ring-1 ring-[#c5b396]/30'
                    : 'border-[#262626] bg-[#141414] text-[#a3a3a3] hover:border-[#383838]'
                }`}
              >
                <span className="font-serif text-xs font-semibold">Entire Journal Archive</span>
                <span className="mt-1 text-[11px] text-[#8a8a8a]">
                  All {allInteractions.length} saved reflection {allInteractions.length === 1 ? 'entry' : 'entries'}
                </span>
              </button>
            </div>
          </div>

          {/* Format Options */}
          <div>
            <label className="block text-xs font-medium text-[#a3a3a3] mb-2">File Format</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setFormat('markdown')}
                className={`flex items-center gap-2.5 rounded-xl border p-3 transition-all ${
                  format === 'markdown'
                    ? 'border-[#c5b396] bg-[#1c1914] text-[#f5f5f5] ring-1 ring-[#c5b396]/30'
                    : 'border-[#262626] bg-[#141414] text-[#a3a3a3] hover:border-[#383838]'
                }`}
              >
                <FileCode className="h-4 w-4 text-[#c5b396]" />
                <div className="text-left">
                  <div className="text-xs font-semibold text-[#f5f5f5]">Markdown</div>
                  <div className="text-[10px] text-[#8a8a8a]">.md format</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('txt')}
                className={`flex items-center gap-2.5 rounded-xl border p-3 transition-all ${
                  format === 'txt'
                    ? 'border-[#c5b396] bg-[#1c1914] text-[#f5f5f5] ring-1 ring-[#c5b396]/30'
                    : 'border-[#262626] bg-[#141414] text-[#a3a3a3] hover:border-[#383838]'
                }`}
              >
                <FileText className="h-4 w-4 text-[#6ee7b7]" />
                <div className="text-left">
                  <div className="text-xs font-semibold text-[#f5f5f5]">Plain Text</div>
                  <div className="text-[10px] text-[#8a8a8a]">.txt format</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('json')}
                className={`flex items-center gap-2.5 rounded-xl border p-3 transition-all ${
                  format === 'json'
                    ? 'border-[#c5b396] bg-[#1c1914] text-[#f5f5f5] ring-1 ring-[#c5b396]/30'
                    : 'border-[#262626] bg-[#141414] text-[#a3a3a3] hover:border-[#383838]'
                }`}
              >
                <Code className="h-4 w-4 text-[#7dd3fc]" />
                <div className="text-left">
                  <div className="text-xs font-semibold text-[#f5f5f5]">JSON Data</div>
                  <div className="text-[10px] text-[#8a8a8a]">.json backup</div>
                </div>
              </button>
            </div>
          </div>

          {/* Toggle Live Preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="inline-flex items-center gap-1.5 text-xs text-[#c5b396] hover:underline"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>{showPreview ? 'Hide preview' : 'View file preview'}</span>
              </button>
            </div>

            {showPreview && (
              <pre className="max-h-48 overflow-y-auto rounded-xl border border-[#262626] bg-[#121212] p-3 text-[11px] font-mono leading-relaxed text-[#a3a3a3] whitespace-pre-wrap">
                {getPreviewText()}
              </pre>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#262626] px-6 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#2e2e2e] bg-[#1a1a1a] px-4 py-2 text-xs font-medium text-[#d4d4d4] hover:bg-[#262626] hover:text-[#f5f5f5]"
          >
            Cancel
          </button>

          <button
            id="btn-confirm-export"
            type="button"
            onClick={handleExport}
            disabled={isExporting || (scope === 'all' && allInteractions.length === 0)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#c5b396] px-5 py-2 text-xs font-semibold text-[#0a0a0a] shadow-lg shadow-[#c5b396]/10 hover:bg-[#d6c7ae] transition-all disabled:opacity-50"
          >
            {downloadSuccess ? (
              <>
                <Check className="h-4 w-4 text-[#0a0a0a]" />
                <span>Exported Successfully!</span>
              </>
            ) : isExporting ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0a0a0a]/30 border-t-[#0a0a0a]" />
                <span>Preparing Download...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Download {format.toUpperCase()}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
