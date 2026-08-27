import { JournalInteraction, ExportFormat } from '../types';

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 40);
}

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function formatInteractionToMarkdown(item: JournalInteraction): string {
  const dateStr = new Date(item.createdAt).toISOString().split('T')[0];
  const tagsStr = (item.tags || []).map((t) => `#${t}`).join(' ');

  let md = `---
title: "${item.title || 'Untitled Reflection'}"
date: ${dateStr}
mood: ${item.mood} (intensity: ${item.moodIntensity || 3}/5)
mode: ${item.mode}
model: ${item.modelUsed || 'gemini-3.6-flash'}
tags: [${(item.tags || []).map((t) => `"${t}"`).join(', ')}]
---

# ${item.title || 'Untitled Reflection'}

*Date: ${new Date(item.createdAt).toLocaleString()} | Mood: ${item.mood} | Mode: ${item.mode}*
${tagsStr ? `\n**Tags:** ${tagsStr}\n` : ''}

## Reflection Entry
${item.entryText}

`;

  if (item.aiResponse) {
    md += `## Gemini AI Reflection & Guidance
${item.aiResponse}

`;
  }

  if (item.turns && item.turns.length > 0) {
    md += `## Conversation Stream
`;
    item.turns.forEach((turn, idx) => {
      const speaker = turn.role === 'user' ? 'You' : 'Gemini';
      const time = new Date(turn.timestamp).toLocaleTimeString();
      md += `### ${idx + 1}. ${speaker} (${time})
${turn.content}

`;
    });
  }

  md += `\n---\n*Exported from Gemini Reflections Sanctuary on ${new Date().toLocaleString()}*`;
  return md;
}

export function formatInteractionToText(item: JournalInteraction): string {
  const dateStr = new Date(item.createdAt).toLocaleString();
  let txt = `=====================================================
${(item.title || 'UNTITLED REFLECTION').toUpperCase()}
=====================================================
Date: ${dateStr}
Mood: ${item.mood.toUpperCase()} (Intensity: ${item.moodIntensity || 3}/5)
Mode: ${item.mode}
Tags: ${(item.tags || []).join(', ') || 'None'}
Model: ${item.modelUsed || 'gemini-3.6-flash'}
-----------------------------------------------------

[YOUR ENTRY]
${item.entryText}

`;

  if (item.aiResponse) {
    txt += `-----------------------------------------------------
[GEMINI AI REFLECTION & INSIGHTS]
${item.aiResponse}

`;
  }

  if (item.turns && item.turns.length > 0) {
    txt += `-----------------------------------------------------
[CONVERSATION TURNS]
`;
    item.turns.forEach((turn, i) => {
      const speaker = turn.role === 'user' ? 'You' : 'Gemini AI';
      txt += `\n(${i + 1}) ${speaker} [${new Date(turn.timestamp).toLocaleTimeString()}]:\n${turn.content}\n`;
    });
  }

  txt += `\n=====================================================\nExported from Gemini Reflections Sanctuary\n=====================================================`;
  return txt;
}

export function exportSingleInteraction(item: JournalInteraction, format: ExportFormat) {
  const baseName = sanitizeFilename(item.title || 'reflection') || 'reflection';
  const dateStr = new Date(item.createdAt).toISOString().split('T')[0];

  switch (format) {
    case 'markdown': {
      const mdContent = formatInteractionToMarkdown(item);
      downloadBlob(mdContent, `${dateStr}_${baseName}.md`, 'text/markdown;charset=utf-8');
      break;
    }
    case 'txt': {
      const txtContent = formatInteractionToText(item);
      downloadBlob(txtContent, `${dateStr}_${baseName}.txt`, 'text/plain;charset=utf-8');
      break;
    }
    case 'json': {
      const jsonContent = JSON.stringify(item, null, 2);
      downloadBlob(jsonContent, `${dateStr}_${baseName}.json`, 'application/json;charset=utf-8');
      break;
    }
  }
}

export function exportAllInteractions(items: JournalInteraction[], format: ExportFormat) {
  const dateStr = new Date().toISOString().split('T')[0];

  switch (format) {
    case 'markdown': {
      let combinedMd = `# Gemini Journal Sanctuary - Complete Archive\n\n`;
      combinedMd += `*Total entries: ${items.length} | Exported on: ${new Date().toLocaleString()}*\n\n---\n\n`;
      items.forEach((item, index) => {
        combinedMd += `\n# Entry ${index + 1}: ${item.title || 'Untitled'}\n\n`;
        combinedMd += formatInteractionToMarkdown(item);
        combinedMd += `\n\n---\n\n`;
      });
      downloadBlob(combinedMd, `gemini_journal_archive_${dateStr}.md`, 'text/markdown;charset=utf-8');
      break;
    }
    case 'json': {
      const archive = {
        exportedAt: new Date().toISOString(),
        totalInteractions: items.length,
        interactions: items,
      };
      const jsonContent = JSON.stringify(archive, null, 2);
      downloadBlob(jsonContent, `gemini_journal_archive_${dateStr}.json`, 'application/json;charset=utf-8');
      break;
    }
    case 'txt': {
      let combinedTxt = `=====================================================\nGEMINI JOURNAL SANCTUARY - COMPLETE ARCHIVE\n=====================================================\nExported: ${new Date().toLocaleString()}\nTotal Reflections: ${items.length}\n\n`;
      items.forEach((item, idx) => {
        combinedTxt += `\n\n====================== ENTRY ${idx + 1} ======================\n`;
        combinedTxt += formatInteractionToText(item);
      });
      downloadBlob(combinedTxt, `gemini_journal_archive_${dateStr}.txt`, 'text/plain;charset=utf-8');
      break;
    }
  }
}
