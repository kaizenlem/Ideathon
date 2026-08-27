import React from 'react';
import { Sparkles, Shield, Lock, Brain, ArrowRight, MessageSquare, Compass, Zap, CheckCircle2, TrendingUp } from 'lucide-react';

interface LandingPageProps {
  onSignIn: () => void;
  isLoading: boolean;
  error?: string | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSignIn, isLoading, error }) => {
  return (
    <div className="relative min-h-[calc(100vh-65px)] bg-[#0a0a0a] text-[#e5e5e5]">
      {/* Background Subtle Ambient Glow & Grid */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:24px_24px] opacity-35" />
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-[#c5b396]/5 blur-[120px]" />

      <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
        {/* High-Agency Eyebrow Pill */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#3d362a] bg-[#1a1713] px-4 py-1.5 text-xs font-medium text-[#c5b396] shadow-xs backdrop-blur-xs">
            <Sparkles className="h-3.5 w-3.5 text-[#c5b396]" />
            <span className="tracking-wide">THE EXECUTIVE COGNITIVE SANCTUARY</span>
          </div>
        </div>

        {/* Hero Headline */}
        <div className="mt-8 text-center">
          <h1 className="font-serif text-4xl font-normal tracking-tight text-[#f5f5f5] sm:text-6xl sm:leading-[1.12]">
            Where Unfiltered Thought
            <span className="block italic text-[#c5b396]">Becomes Unfair Advantage.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#a3a3a3] sm:text-lg">
            Great minds aren&apos;t built in public feeds—they&apos;re forged in private reflection.
            Pressure-test raw epiphanies, deconstruct complex decisions, and engage in high-caliber
            multi-turn dialogue with Gemini AI. Total clarity, zero noise, absolute sovereign privacy.
          </p>

          {/* Action CTA */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              id="btn-google-signin-hero"
              onClick={onSignIn}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-3 rounded-xl bg-[#c5b396] px-8 py-3.5 text-sm font-semibold text-[#0a0a0a] shadow-lg shadow-[#c5b396]/15 transition-all hover:bg-[#d6c7ae] hover:shadow-xl hover:shadow-[#c5b396]/25 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#0a0a0a]/30 border-t-[#0a0a0a]" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Claim Your Private Sanctuary</span>
              <ArrowRight className="h-4 w-4 text-[#0a0a0a]/70" />
            </button>
          </div>

          {error && (
            <div className="mx-auto mt-4 max-w-md rounded-lg border border-[#522525] bg-[#211212] p-3 text-xs text-[#fca5a5] text-left">
              <span className="font-semibold text-[#f87171]">Authentication Notice: </span>
              {error}
            </div>
          )}
        </div>

        {/* Feature Pillars Showcase */}
        <div className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#262626] bg-[#121212] p-6 shadow-xs transition-all hover:border-[#3d362a] hover:bg-[#141414]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#24201a] border border-[#3d362a] text-[#c5b396]">
              <Brain className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-serif text-lg font-medium text-[#f5f5f5]">Intellectual Sparring Partner</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#a3a3a3]">
              Distill raw streams into executive summaries, 3-phase execution roadmaps, and lateral strategic angles powered by resilient Gemini AI.
            </p>
          </div>

          <div className="rounded-2xl border border-[#262626] bg-[#121212] p-6 shadow-xs transition-all hover:border-[#2a4433] hover:bg-[#141414]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#12241a] border border-[#1e3d2b] text-[#6ee7b7]">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-serif text-lg font-medium text-[#f5f5f5]">Cognitive Compounding</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#a3a3a3]">
              Track emotional resonance trajectories and reflection streaks. Discover recurring triggers before they become cognitive bottlenecks.
            </p>
          </div>

          <div className="rounded-2xl border border-[#262626] bg-[#121212] p-6 shadow-xs transition-all hover:border-[#1d354d] hover:bg-[#141414]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#142333] border border-[#1d354d] text-[#7dd3fc]">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-serif text-lg font-medium text-[#f5f5f5]">Sovereign User Isolation</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#a3a3a3]">
              Cryptographically partitioned Cloud Firestore documents (<code className="rounded bg-[#1a1a1a] border border-[#2e2e2e] px-1 py-0.5 text-xs text-[#c5b396]">/users/{`{uid}`}</code>). Zero cross-user data leakage.
            </p>
          </div>
        </div>

        {/* Stoic Quote / Epigraph Banner */}
        <div className="mt-14 rounded-2xl border border-[#3d362a] bg-[#171410] p-6 sm:p-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <p className="font-serif text-base italic text-[#f5f5f5]">
              &ldquo;Nowhere can man find a quieter or more untroubled retreat than in his own mind.&rdquo;
            </p>
            <p className="text-xs text-[#c5b396] font-medium">&mdash; Marcus Aurelius, Meditations</p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#1a1713] px-3.5 py-1.5 text-xs font-medium text-[#c5b396] border border-[#3d362a]">
              <Shield className="h-3.5 w-3.5" /> Zero-Telemetry Vault
            </span>
          </div>
        </div>

        {/* Security & Architecture Guarantee Section */}
        <div className="mt-8 rounded-2xl border border-[#262626] bg-[#121212]/90 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#c5b396]" />
                <h4 className="font-serif text-base font-semibold text-[#f5f5f5]">Zero-Compromise Security Architecture</h4>
              </div>
              <p className="mt-1 text-xs text-[#8a8a8a] max-w-xl">
                Federated Google Identity authentication, Secret Manager credential isolation, and automated Gemini fallback ladder.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#1a1a1a] px-3 py-1 text-xs font-medium text-[#d4d4d4] border border-[#2e2e2e]">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#6ee7b7]" /> Google Auth
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#1a1a1a] px-3 py-1 text-xs font-medium text-[#d4d4d4] border border-[#2e2e2e]">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#6ee7b7]" /> Secret Manager
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#1a1a1a] px-3 py-1 text-xs font-medium text-[#d4d4d4] border border-[#2e2e2e]">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#6ee7b7]" /> ABAC Isolation
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

