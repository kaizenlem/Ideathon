# Gemini AI Reflections & Private Journal Sandbox

A full-stack, user-authenticated AI journaling and reflection application built with **React**, **Express**, **Firebase Authentication (Google Identity)**, **Cloud Firestore (Isolated Sandboxes)**, and **Gemini 3.6 Flash**.

---

## 1. Threat Modeling & Security Architecture

| Threat Zone | Identified Risks | Countermeasures & Applied Controls |
| :--- | :--- | :--- |
| **1. Input Surfaces** | Malicious injection, XSS, malformed or oversized payloads | Strict schema validation, sanitization of entries, input character counting, treating prompts strictly as non-executable text data. |
| **2. Planning & Reasoning** | Prompt injection, goal hijacking, hallucinated leakages | Strict role-bounded system instructions for each reflection mode; automated fallback ladder across Gemini models. |
| **3. Tool Execution & API Access** | API key leakage to browser, SSRF, proxy exhaustion | Zero frontend API key exposure; all Gemini requests proxy through server-side endpoints with model fallback ladder (`gemini-3.6-flash` &rarr; `gemini-3.1-flash-lite` &rarr; `gemini-flash-latest` &rarr; `gemini-3.7-flash`). |
| **4. Memory & State** | Cross-user data contamination, unauthorized document reads/writes | Strict Cloud Firestore ABAC security rules (`/users/{userId}/interactions/{docId}` requiring `request.auth.uid == userId`); zero insecure defaults; atomic persistence. |
| **5. Inter-System Communication** | Token interception, credential exposure | Google Cloud Secret Manager for credentials; federated Google Sign-In via Firebase Auth. |

---

## 2. Architecture & Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, React Markdown.
- **Backend API**: Node.js & Express with top-level payload deserialization, lazy SDK initialization, and fallback model orchestration.
- **User Identity**: Firebase Authentication with Google Sign-In (no custom password storage).
- **Backend Database**: Google Cloud Firestore with real-time snapshot synchronization and owner-bound isolation.
- **AI Processing Engine**: Gemini 3.6 Flash (`@google/genai` SDK).
- **Secrets**: Google Cloud Secret Manager & Environment Variables.

---

## 3. Cloud Firestore Security Rules

Deploy the following owner-bound security rules to ensure user data isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/{subcollection}/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 4. Google Cloud Setup & Deployment Guide

### Prerequisites
1. Install [Google Cloud CLI](https://cloud.google.com/sdk/docs/install).
2. Authenticate and configure your project:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```
3. Enable necessary Google Cloud APIs:
   ```bash
   gcloud services enable \
     run.googleapis.com \
     secretmanager.googleapis.com \
     firestore.googleapis.com \
     identitytoolkit.googleapis.com
   ```

### Step 1: Secret Manager Configuration
Store the Gemini API Key securely in Secret Manager:
```bash
# Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Grant the default Cloud Run service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Step 2: Deploy to Google Cloud Run
Deploy the application directly from source:
```bash
gcloud run deploy gemini-reflections-app \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest"
```

### Step 3: Required Campaign Labeling for Challenge Verification
Apply the mandatory resource label to register the service for automated challenge verification:
```bash
gcloud run services update gemini-reflections-app \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 5. Functional Stability Walkthrough & Verification Test Cases

Below is the structured test matrix covering every interactive flow:

### Test Suite 1: Authentication & Landing Page Flow
1. **Initial Unauthenticated State**:
   - **Action**: Open the root URL in an incognito session.
   - **Expected Result**: Landing page displays with "Continue with Google" button, architecture guarantees, and feature badges. No private data is visible.
2. **Google Sign-In**:
   - **Action**: Click "Continue with Google".
   - **Expected Result**: Firebase Auth Google Identity popup opens. After authentication, user is transitioned smoothly into the private dashboard.
3. **Session Persistence**:
   - **Action**: Refresh the browser tab after signing in.
   - **Expected Result**: The active user session is retained via local persistence without requiring re-login.
4. **Sign Out**:
   - **Action**: Click the Sign Out icon in the top navigation bar.
   - **Expected Result**: User session terminates and the UI immediately renders the landing page.

### Test Suite 2: Journaling & Multi-Turn AI Reflections
1. **Drafting a Reflection**:
   - **Action**: In the dashboard, enter a title, select a mood (e.g., "Thoughtful"), choose an objective (e.g., "Executive Summary"), and type journal content.
   - **Expected Result**: Character and word counters update dynamically in real time.
2. **Generating Gemini Reflection**:
   - **Action**: Click "Generate Executive Summary" / "Reflect with Gemini".
   - **Expected Result**: Spinner activates, backend executes the resilient model fallback ladder (`gemini-3.6-flash`), and returns markdown-formatted guidance with core themes, emotional tone, and actionable steps.
3. **Real-Time Cloud Firestore Persistence**:
   - **Action**: Inspect Firestore / the History Sidebar.
   - **Expected Result**: The entry is instantly saved to `/users/{userId}/interactions/{interactionId}`. A green "Saved to Firestore Sandbox" badge confirms successful write.
4. **Multi-Turn Conversational Dialogue**:
   - **Action**: In the "Continue the Conversation" panel, type a follow-up query (e.g., "Can you elaborate on step 2 of the action plan?") and click "Send".
   - **Expected Result**: User message appears on the right, Gemini generates an intelligent contextual reply on the left, and both turns are persisted to the Firestore interaction document.

### Test Suite 3: History, Search & Advanced Filtering
1. **History Retrieval**:
   - **Action**: Open the History Sidebar.
   - **Expected Result**: All past reflections for the authenticated user load chronologically with timestamp, mood emoji, tags, and conversation turn count.
2. **Full-Text Search**:
   - **Action**: Enter keywords in the search bar (searching titles, body text, tags, AI responses, or dialogue turns).
   - **Expected Result**: The list filters instantly and updates the counter pill (e.g. `Showing 3 / 10`).
3. **Multi-Criteria Filtering & Sorting**:
   - **Action**: Use the Mood selector, Mode selector, Timeframe filter (Today / Past 7 Days / Past 30 Days), or Tag chips, and change sort order (Newest, Oldest, Longest, Shortest).
   - **Expected Result**: Real-time filtered and sorted interaction list with one-click "Reset all filters" capability.
4. **Deleting Reflections**:
   - **Action**: Click the delete icon on an entry in the sidebar and confirm.
   - **Expected Result**: The document is deleted from Firestore and immediately removed from the UI.

### Test Suite 4: Background Autosave & Draft Management
1. **Automatic Debounced Autosave**:
   - **Action**: Type a thought in the reflection textarea without clicking generate.
   - **Expected Result**: After a 1.8s pause, status pill shows "Autosaving to Firestore..." followed by "Autosaved [time]". The draft is safely saved to Firestore with `isDraft: true`.
2. **Explicit Draft Flush**:
   - **Action**: Click the "Save Draft" button in the top toolbar or bottom action bar.
   - **Expected Result**: Immediate Firestore commit with confirmed visual badge.

### Test Suite 5: Mood Tracking & Wellbeing Analytics
1. **Mood Intensity Tracking**:
   - **Action**: Select a mood (e.g. "Grateful") and adjust the intensity slider (1 to 5).
   - **Expected Result**: Intensity resonance label updates immediately and saves with the reflection.
2. **Mood Analytics Dashboard**:
   - **Action**: Click "Mood Trends & Insights" in the sidebar.
   - **Expected Result**: Modal opens displaying total reflections, reflection streak (consecutive days), total word count, dominant mood percentage, visual color-coded distribution bars, and chronological trajectory graph.
3. **Gemini AI Emotional Wellbeing Synthesis**:
   - **Action**: In the Mood Analytics modal, click "Generate AI Synthesis".
   - **Expected Result**: Server queries `/api/gemini/mood-summary` using the fallback ladder, delivering a comprehensive emotional synthesis with mindfulness recommendations in formatted markdown.

### Test Suite 6: Multi-Format Exporting
1. **Single Reflection Export**:
   - **Action**: With an active reflection open, click the "Export" button in the workspace header.
   - **Expected Result**: Export modal opens with active reflection preselected. Choose Markdown (.md), Plain Text (.txt), or JSON (.json), toggle preview to inspect formatted output, and click Download. File downloads directly to local storage.
2. **Full Journal Archive Export**:
   - **Action**: Click "Export Reflections" from the sidebar bottom action bar.
   - **Expected Result**: Choose "Entire Journal Archive", select format, and download all user entries bundled into a single file.

### Test Suite 7: Daily Reflection Prompt & Surprise Trigger
1. **Daily Dynamic Prompt Calibration**:
   - **Action**: Open the dashboard upon sign-in.
   - **Expected Result**: The "Daily Philosophical Calibration" banner displays a fresh, thought-provoking philosophical question generated by Gemini, with category, philosophical quote citation, and a "Write on this Prompt" button.
2. **Surprise Trigger Execution**:
   - **Action**: Click the "What surprised you today? " button in the daily banner.
   - **Expected Result**: Immediately populates the reflection title and editor with an evocative prompt targeting unexpected real-world observations and overturned assumptions.
3. **On-Demand Angle Refresh**:
   - **Action**: Click "New Angle" on the daily banner.
   - **Expected Result**: Generates and renders a new philosophical inquiry using Gemini AI with fallback ladder resilience.

### Test Suite 8: Monthly Growth Report
1. **Monthly Growth Report Generation**:
   - **Action**: Click "Monthly Growth Report " in the history sidebar.
   - **Expected Result**: Modal opens displaying month selection dropdown, total reflections count in the month, total words written, and dominant emotional state.
2. **AI-Powered Synthesis**:
   - **Action**: Click "Generate Growth Report".
   - **Expected Result**: Gemini aggregates all monthly entries and produces a structured, multi-section report covering Executive Summary, Dominant Themes & Mental Models, Breakthroughs & Decisions, Emotional Landscape, Blindspots, and Strategic Focus Horizons for next month.
3. **Report Export & Copy**:
   - **Action**: Click "Copy" or "Download (.md)" inside the modal.
   - **Expected Result**: The report is either copied to the clipboard or downloaded as a Markdown file for offline retention.

