import React, { useState, useEffect } from 'react';
import { UserProfile, JournalInteraction, ReflectionMode, MoodType, ChatTurn } from '../types';
import { HistorySidebar } from './HistorySidebar';
import { ReflectionWorkspace } from './ReflectionWorkspace';
import { MoodAnalyticsModal } from './MoodAnalyticsModal';
import { ExportModal } from './ExportModal';
import { MonthlyGrowthReportModal } from './MonthlyGrowthReportModal';
import {
  subscribeToUserInteractions,
  saveJournalInteraction,
  deleteJournalInteraction,
  appendChatTurn,
} from '../services/firestoreService';
import { requestGeminiReflection, sendGeminiChatMessage } from '../services/geminiService';
import { Menu } from 'lucide-react';

interface DashboardProps {
  user: UserProfile;
  onNewEntryTrigger: number;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onNewEntryTrigger }) => {
  const [interactions, setInteractions] = useState<JournalInteraction[]>([]);
  const [selectedInteraction, setSelectedInteraction] = useState<JournalInteraction | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastAutosavedAt, setLastAutosavedAt] = useState<number | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals state
  const [isMoodModalOpen, setIsMoodModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isMonthlyReportModalOpen, setIsMonthlyReportModalOpen] = useState(false);

  // Real-time Firestore Subscription for user's isolated interactions
  useEffect(() => {
    if (!user.uid) return;

    const unsubscribe = subscribeToUserInteractions(
      user.uid,
      (list) => {
        setInteractions(list);
        // If current selected item was updated, keep it in sync
        if (selectedInteraction?.id) {
          const updated = list.find((item) => item.id === selectedInteraction.id);
          if (updated) {
            setSelectedInteraction(updated);
          }
        }
      },
      (err) => {
        console.error('Firestore subscription error:', err);
        setError('Failed to sync with cloud database. Changes may not be visible.');
      }
    );

    return () => unsubscribe();
  }, [user.uid, selectedInteraction?.id]);

  // Handle header new entry click
  useEffect(() => {
    if (onNewEntryTrigger > 0) {
      handleNewReflection();
    }
  }, [onNewEntryTrigger]);

  const handleNewReflection = () => {
    setSelectedInteraction(null);
    setError(null);
    setSaveStatus('idle');
    setLastAutosavedAt(null);
  };

  const handleSelectInteraction = (interaction: JournalInteraction) => {
    setSelectedInteraction(interaction);
    setError(null);
    setSaveStatus('idle');
    setLastAutosavedAt(null);
  };

  const handleDeleteInteraction = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this reflection?')) return;

    try {
      await deleteJournalInteraction(user.uid, id);
      if (selectedInteraction?.id === id) {
        setSelectedInteraction(null);
      }
    } catch (err: any) {
      console.error('Failed to delete interaction:', err);
      setError('Could not delete the entry: ' + (err.message || 'Unknown error'));
    }
  };

  // Autosave Draft Function (Preserves drafts securely in Firestore)
  const handleSaveDraft = async (data: {
    title: string;
    entryText: string;
    mode: ReflectionMode;
    mood: MoodType;
    moodIntensity: number;
    tags: string[];
    id?: string;
  }) => {
    if (!data.entryText.trim()) return;

    setSaveStatus('saving');

    try {
      const draftData: Omit<JournalInteraction, 'id'> = {
        userId: user.uid,
        title: data.title,
        entryText: data.entryText,
        mode: data.mode,
        mood: data.mood,
        moodIntensity: data.moodIntensity,
        tags: data.tags,
        aiResponse: selectedInteraction?.aiResponse || '',
        modelUsed: selectedInteraction?.modelUsed || '',
        createdAt: selectedInteraction?.createdAt || Date.now(),
        updatedAt: Date.now(),
        turns: selectedInteraction?.turns || [],
        isDraft: !selectedInteraction?.aiResponse,
      };

      const docId = await saveJournalInteraction(
        user.uid,
        draftData,
        data.id || selectedInteraction?.id
      );

      const savedItem: JournalInteraction = {
        ...draftData,
        id: docId,
      };

      if (!selectedInteraction?.id || selectedInteraction.id === docId) {
        setSelectedInteraction(savedItem);
      }

      const now = Date.now();
      setLastAutosavedAt(now);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
      return docId;
    } catch (err: any) {
      console.error('Failed to autosave draft to Firestore:', err);
      setSaveStatus('error');
    }
  };

  const handleSaveAndGenerate = async (data: {
    title: string;
    entryText: string;
    mode: ReflectionMode;
    mood: MoodType;
    moodIntensity: number;
    tags: string[];
  }) => {
    setIsGenerating(true);
    setError(null);
    setSaveStatus('saving');

    try {
      // 1. Call Gemini API endpoint
      const result = await requestGeminiReflection({
        title: data.title,
        entryText: data.entryText,
        mode: data.mode,
        mood: data.mood,
        conversationHistory: selectedInteraction?.turns || [],
      });

      // 2. Persist to isolated Firestore path: /users/{userId}/interactions/{docId}
      const newInteractionData: Omit<JournalInteraction, 'id'> = {
        userId: user.uid,
        title: data.title,
        entryText: data.entryText,
        mode: data.mode,
        mood: data.mood,
        moodIntensity: data.moodIntensity,
        tags: data.tags,
        aiResponse: result.aiResponse,
        modelUsed: result.modelUsed,
        createdAt: selectedInteraction?.createdAt || Date.now(),
        updatedAt: Date.now(),
        turns: selectedInteraction?.turns || [],
        isDraft: false,
      };

      const savedId = await saveJournalInteraction(
        user.uid,
        newInteractionData,
        selectedInteraction?.id
      );

      const completeInteraction: JournalInteraction = {
        ...newInteractionData,
        id: savedId,
      };

      setSelectedInteraction(completeInteraction);
      setLastAutosavedAt(Date.now());
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: any) {
      console.error('Error generating and saving reflection:', err);
      setError(err.message || 'Failed to generate reflection from Gemini.');
      setSaveStatus('error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendChatTurn = async (message: string) => {
    if (!selectedInteraction?.id) return;

    setIsSendingChat(true);
    setError(null);

    const userTurn: ChatTurn = {
      role: 'user',
      content: message,
      timestamp: Date.now(),
    };

    const currentTurns = selectedInteraction.turns || [];
    const updatedTurnsWithUser = [...currentTurns, userTurn];

    // Optimistically update UI
    setSelectedInteraction({
      ...selectedInteraction,
      turns: updatedTurnsWithUser,
    });

    try {
      // 1. Send to Gemini Chat endpoint
      const chatResponse = await sendGeminiChatMessage(
        selectedInteraction.entryText,
        message,
        currentTurns
      );

      const aiTurn: ChatTurn = {
        role: 'model',
        content: chatResponse.reply,
        timestamp: Date.now(),
      };

      // 2. Save both user turn and model turn to Firestore
      await appendChatTurn(
        user.uid,
        selectedInteraction.id,
        aiTurn,
        updatedTurnsWithUser
      );
    } catch (err: any) {
      console.error('Error continuing conversation:', err);
      setError(err.message || 'Failed to receive reply from Gemini.');
    } finally {
      setIsSendingChat(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-65px)] bg-[#0a0a0a]">
      {/* Mobile Toggle Button for Sidebar */}
      <div className="md:hidden fixed bottom-5 left-5 z-30">
        <button
          id="btn-mobile-sidebar-toggle"
          onClick={() => setIsMobileSidebarOpen(true)}
          className="flex items-center gap-2 rounded-full bg-[#c5b396] px-4 py-2.5 text-xs font-semibold text-[#0a0a0a] shadow-lg hover:bg-[#d6c7ae]"
        >
          <Menu className="h-4 w-4" />
          <span>Past Reflections ({interactions.length})</span>
        </button>
      </div>

      {/* History Sidebar */}
      <HistorySidebar
        interactions={interactions}
        selectedId={selectedInteraction?.id || null}
        onSelect={handleSelectInteraction}
        onNew={handleNewReflection}
        onDelete={handleDeleteInteraction}
        onOpenMoodAnalytics={() => setIsMoodModalOpen(true)}
        onOpenExportArchive={() => setIsExportModalOpen(true)}
        onOpenMonthlyReport={() => setIsMonthlyReportModalOpen(true)}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Center Workspace */}
      <ReflectionWorkspace
        currentInteraction={selectedInteraction}
        onSaveAndGenerate={handleSaveAndGenerate}
        onSaveDraft={handleSaveDraft}
        onSendChatTurn={handleSendChatTurn}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        isGenerating={isGenerating}
        isSendingChat={isSendingChat}
        error={error}
        onClearError={() => setError(null)}
        onNewReflection={handleNewReflection}
        saveStatus={saveStatus}
        lastAutosavedAt={lastAutosavedAt}
        userId={user.uid}
      />

      {/* Mood Analytics & Wellness Trends Modal */}
      <MoodAnalyticsModal
        isOpen={isMoodModalOpen}
        onClose={() => setIsMoodModalOpen(false)}
        interactions={interactions}
      />

      {/* Monthly Growth Report Modal */}
      <MonthlyGrowthReportModal
        isOpen={isMonthlyReportModalOpen}
        onClose={() => setIsMonthlyReportModalOpen(false)}
        interactions={interactions}
      />

      {/* Export Reflections Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        currentInteraction={selectedInteraction}
        allInteractions={interactions}
      />
    </div>
  );
};
