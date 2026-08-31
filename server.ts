import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 8080;

// Top-level Request Deserialization & Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Lazy Google GenAI Client Initialization
let genAIClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY environment variable is not set. API calls will fail until set.');
      throw new Error('GEMINI_API_KEY is required for Gemini operations');
    }
    genAIClient = new GoogleGenAI({ apiKey });
  }
  return genAIClient;
}

// Resilient Model Fallback Ladder
const MODEL_FALLBACK_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
];

async function generateContentWithFallback(prompt: string, systemInstruction?: string): Promise<{ text: string; modelUsed: string }> {
  const ai = getGenAI();
  let lastError: any = null;

  for (const model of MODEL_FALLBACK_LADDER) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: systemInstruction
          ? {
              systemInstruction,
              temperature: 0.7,
            }
          : {
              temperature: 0.7,
            },
      });

      const text = response.text || '';
      return { text, modelUsed: model };
    } catch (err: any) {
      console.warn(`Model ${model} failed with error:`, err?.message || err);
      lastError = err;
      // Continue to next fallback in ladder
    }
  }

  throw new Error(`All Gemini models in fallback ladder failed. Last error: ${lastError?.message || 'Unknown error'}`);
}

// API Routes
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Endpoint: Generate Reflection, Summary, Brainstorm, or Action Plan
app.post('/api/gemini/reflect', async (req: Request, res: Response) => {
  try {
    const data = (req.body && typeof req.body === 'object') ? req.body : {};
    const { title, entryText, mode = 'reflection', mood = 'thoughtful', conversationHistory = [] } = data;

    if (!entryText || typeof entryText !== 'string' || entryText.trim().length === 0) {
      res.status(400).json({ error: 'Journal entry text is required.' });
      return;
    }

    const modePrompts: Record<string, string> = {
      reflection: `You are an empathetic, insightful, and wise personal reflection companion. Provide deep, warm, and constructive reflections on the user's journal entry. Highlight psychological patterns, offer fresh viewpoints, validate their feelings, and share a gentle perspective on personal growth. Use markdown formatting with clear headings, bullet points, and gentle inspiring questions at the end.`,
      summary: `You are an executive summarizer and analytical assistant. Analyze the user's journal entry and produce a crisp executive summary, highlighting:
1. **Core Themes**: 2-3 main subjects.
2. **Key Emotional Drivers / Tone**: Analysis of the sentiment.
3. **Key Decisions or Observations**: What stood out.
4. **Actionable Takeaways**: Practical next steps.
Keep the tone professional yet supportive.`,
      brainstorm: `You are an imaginative, creative brainstorming partner. Based on the user's thoughts and experiences in this entry, generate 5-7 bold, innovative, and lateral ideas or creative opportunities they could explore. Categorize them into immediate wins, visionary projects, and creative experiments.`,
      action_plan: `You are a strategic personal productivity coach. Transform the user's reflections into a structured, step-by-step 3-phase Action Plan:
- **Phase 1: Quick Momentum (Next 24 Hours)**: 2 simple, high-impact tasks.
- **Phase 2: Core Implementation (This Week)**: 3 foundational milestones.
- **Phase 3: Long-term Reflection & Review**: Metrics to evaluate growth.`,
      chat: `You are a compassionate, thoughtful conversational AI mentor. Continue the multi-turn dialogue with the user about their reflection. Be direct, thoughtful, and helpful.`,
    };

    const systemInstruction = modePrompts[mode] || modePrompts.reflection;

    let fullPrompt = `User's Reflection Title: "${title || 'Untitled Reflection'}"\n`;
    fullPrompt += `Selected Mood: ${mood}\n\n`;
    fullPrompt += `User's Journal Entry:\n"""\n${entryText}\n"""\n\n`;

    if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      fullPrompt += `Previous Conversation Context:\n`;
      for (const turn of conversationHistory) {
        fullPrompt += `${turn.role === 'user' ? 'User' : 'Gemini'}: ${turn.content}\n`;
      }
      fullPrompt += `\nPlease provide your response now:`;
    } else {
      fullPrompt += `Please analyze this entry according to your instructions and provide your detailed guidance.`;
    }

    const { text, modelUsed } = await generateContentWithFallback(fullPrompt, systemInstruction);

    res.json({
      success: true,
      aiResponse: text,
      modelUsed,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('Error generating reflection:', error);
    res.status(500).json({
      error: error.message || 'Internal server error while processing Gemini reflection.',
    });
  }
});

// Endpoint: Multi-turn Chat Follow-up
app.post('/api/gemini/chat', async (req: Request, res: Response) => {
  try {
    const data = (req.body && typeof req.body === 'object') ? req.body : {};
    const { originalEntry, userMessage, history = [] } = data;

    if (!userMessage || typeof userMessage !== 'string' || userMessage.trim().length === 0) {
      res.status(400).json({ error: 'User message is required.' });
      return;
    }

    const systemInstruction = `You are an empathetic, insightful AI reflection mentor. The user is discussing a specific journal entry with you. Maintain continuity, reference their thoughts, and answer their follow-up questions thoughtfully. Format your response cleanly in Markdown.`;

    let prompt = `Original Journal Entry Context:\n"""\n${originalEntry || 'No context provided'}\n"""\n\n`;
    if (Array.isArray(history) && history.length > 0) {
      prompt += `Conversation History:\n`;
      for (const h of history) {
        prompt += `${h.role === 'user' ? 'User' : 'Gemini'}: ${h.content}\n`;
      }
    }
    prompt += `User's Latest Query:\n${userMessage}\n\nResponse:`;

    const { text, modelUsed } = await generateContentWithFallback(prompt, systemInstruction);

    res.json({
      success: true,
      reply: text,
      modelUsed,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('Error in multi-turn chat:', error);
    res.status(500).json({
      error: error.message || 'Internal server error while processing Gemini chat turn.',
    });
  }
});

// Endpoint: AI Mood & Wellbeing Synthesis
app.post('/api/gemini/mood-summary', async (req: Request, res: Response) => {
  try {
    const data = (req.body && typeof req.body === 'object') ? req.body : {};
    const { moodStats, recentEntries = [] } = data;

    if (!recentEntries || !Array.isArray(recentEntries) || recentEntries.length === 0) {
      res.status(400).json({ error: 'At least one journal entry is required for mood synthesis.' });
      return;
    }

    const systemInstruction = `You are a warm, certified mindfulness mentor and emotional wellbeing analyst.
Analyze the user's recent journaling habits, emotional distribution, and reflections.
Provide a compassionate, constructive, and uplifting synthesis with:
1. **Dominant Emotional Patterns**: What moods and themes have been most prevalent.
2. **Growth & Resilience Signals**: Positive habits, self-awareness milestones, or breakthroughs noted in their writings.
3. **Gentle Actionable Suggestions**: 2-3 mindfulness or reflective practices tailored to their current emotional trajectory.
Format cleanly with Markdown headers and bullet points.`;

    let prompt = `User's Journal & Mood Overview:\n`;
    prompt += `- Total Entries Analyzed: ${recentEntries.length}\n`;
    if (moodStats && typeof moodStats === 'object') {
      prompt += `- Mood Breakdown: ${JSON.stringify(moodStats)}\n\n`;
    }

    prompt += `Sample of Recent Reflections:\n`;
    recentEntries.slice(0, 10).forEach((entry: any, i: number) => {
      prompt += `\n[Entry ${i + 1}] Date: ${new Date(entry.createdAt).toLocaleDateString()} | Mood: ${entry.mood} (Intensity: ${entry.moodIntensity || 3}/5) | Title: "${entry.title || 'Untitled'}"\nExcerpt: "${(entry.entryText || '').slice(0, 250)}..."\n`;
    });

    prompt += `\nPlease generate a personalized, insightful, and supportive Emotional Wellbeing Synthesis:`;

    const { text, modelUsed } = await generateContentWithFallback(prompt, systemInstruction);

    res.json({
      success: true,
      analysis: text,
      modelUsed,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('Error generating mood summary:', error);
    res.status(500).json({
      error: error.message || 'Internal server error while processing mood analysis.',
    });
  }
});

// Endpoint: Dynamic Daily Philosophical Reflection Prompt
app.get('/api/gemini/daily-prompt', async (req: Request, res: Response) => {
  try {
    const systemInstruction = `You are a world-class philosophical mentor and executive thinking coach.
Generate a single, deeply thought-provoking, high-impact reflection prompt designed for an elite thinker or high-agency builder.
The prompt should challenge assumptions, prompt deep self-inquiry, or unlock creative clarity.
Include:
1. "category": A concise theme (e.g. "Stoic Equilibrium", "First Principles", "Asymmetric Leverage", "Radical Self-Honesty", "Creative Epiphany", "Intellectual Humility").
2. "quote": A short inspiring quote or premise (1 sentence) from philosophy or high-performance literature.
3. "question": The central, resonant question that makes someone immediately want to write their thoughts.
4. "surpriseTrigger": A targeted expansion on "What surprised you today?", e.g., "What was the most unexpected observation, conversation, or realization you encountered today, and what underlying assumption did it overturn?"

Return purely valid JSON matching this schema:
{
  "category": string,
  "quote": string,
  "question": string,
  "surpriseTrigger": string
}`;

    const dateSeed = new Date().toISOString().split('T')[0];
    const prompt = `Generate today's philosophical reflection question for date: ${dateSeed}. Make it unique, evocative, and impossible to ignore.`;

    const { text, modelUsed } = await generateContentWithFallback(prompt, systemInstruction);

    let parsed;
    try {
      // Strip markdown code fences if model enclosed in json blocks
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleanJson);
    } catch {
      parsed = {
        category: 'First Principles & Clarity',
        quote: 'The unexamined life is not worth living. — Socrates',
        question: 'What is the single most asymmetric decision or belief you are holding right now, and what if your primary assumption is completely inverted?',
        surpriseTrigger: 'What surprised you today? What unexpected friction or epiphany challenged your mental model of the world?',
      };
    }

    res.json({
      success: true,
      data: parsed,
      modelUsed,
      date: dateSeed,
    });
  } catch (error: any) {
    console.error('Error generating daily prompt:', error);
    res.status(500).json({
      error: error.message || 'Internal server error while fetching daily reflection prompt.',
    });
  }
});

// Endpoint: Comprehensive Monthly Growth Report Aggregator
app.post('/api/gemini/monthly-report', async (req: Request, res: Response) => {
  try {
    const data = (req.body && typeof req.body === 'object') ? req.body : {};
    const { monthName, entries = [], stats = {} } = data;

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      res.status(400).json({ error: 'At least one journal entry in this month is required to generate a Monthly Growth Report.' });
      return;
    }

    const systemInstruction = `You are an elite executive thinking partner and cognitive biographer.
You are generating a comprehensive "Monthly Growth & Intellectual Evolution Report" for the user based on all their journal reflections for the specified month.
Structure the report with clarity, sophistication, and actionable depth using Markdown:

# 📈 Monthly Growth Report — [Month Name]

### 1. Executive Summary & Core Evolution
A concise synthesis of the user's overarching trajectory, energy levels, and intellectual focus over the past month.

### 2. Dominant Themes & Mental Models
Identify the 3-4 recurring themes, philosophical inquiries, creative projects, or dilemmas that occupied their mind.

### 3. Key Milestones, Breakthroughs & Decisions
Highlight concrete decisions made, clarity gained, creative breakthroughs, or cognitive hurdles overcome.

### 4. Emotional Landscape & Resilience Analysis
Analyze emotional distribution, intensity trends, stressors transformed into learning, and moments of peak flow or peace.

### 5. Blindspots & Unexamined Assumptions
Respectfully spotlight any recurring loops, unresolved tensions, or areas where the user might benefit from deeper exploration.

### 6. Strategic Focus Horizons for Next Month
Provide 3 high-leverage strategic questions or focus vectors to prioritize in the coming month.

Use elegant typography formatting, bullet points, and crisp language suitable for a top 0.01% thinker.`;

    let userPrompt = `MONTH: ${monthName || 'Current Month'}\n`;
    userPrompt += `TOTAL ENTRIES IN MONTH: ${entries.length}\n`;
    userPrompt += `TOTAL WORDS WRITTEN: ${stats.totalWords || 'N/A'}\n`;
    userPrompt += `DOMINANT MOODS: ${JSON.stringify(stats.moodBreakdown || {})}\n\n`;
    userPrompt += `FULL CHRONOLOGICAL LOG OF MONTH ENTRIES:\n`;

    entries.forEach((entry: any, idx: number) => {
      userPrompt += `\n--- [Entry #${idx + 1} | ${new Date(entry.createdAt).toLocaleDateString()}] ---\n`;
      userPrompt += `Title: ${entry.title || 'Untitled'}\n`;
      userPrompt += `Mood: ${entry.mood || 'thoughtful'} (Intensity: ${entry.moodIntensity || 3}/5)\n`;
      userPrompt += `Tags: ${(entry.tags || []).join(', ') || 'None'}\n`;
      userPrompt += `Content: "${entry.entryText || ''}"\n`;
      if (entry.aiResponse) {
        userPrompt += `AI Guidance Highlights: "${(entry.aiResponse || '').slice(0, 200)}..."\n`;
      }
    });

    userPrompt += `\nPlease generate the full, comprehensive Monthly Growth Report:`;

    const { text, modelUsed } = await generateContentWithFallback(userPrompt, systemInstruction);

    res.json({
      success: true,
      report: text,
      modelUsed,
      monthName,
      totalEntries: entries.length,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('Error generating monthly report:', error);
    res.status(500).json({
      error: error.message || 'Internal server error while generating monthly growth report.',
    });
  }
});

// Vite middleware & Production Serving
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

start();
