# Kiden Hub: Development Log & Architecture Summary

This document provides a comprehensive history of the development, planning, and stabilization of **Kiden Hub**, based on project interactions and implementation steps.

---

## 1. Feature Planning & Vision
**Objective**: Build a production-grade, multi-modal research workspace for creators and researchers.

### Key Phases:
*   **Phase 1: Foundation**: Established Supabase integration, authentication flows, and basic navigation.
*   **Phase 2: Discovery Engine**: Built the YouTube-powered `DiscoverFeed` with batching logic to save API quota.
*   **Phase 3: Intelligence Layer**: Integrated NVIDIA AI for document analysis and synthesized research.
*   **Phase 4: Workspace Suite**: Developed Kanban boards (`ResearchBoards`), Markdown notes (`NotesEditor`), and file management.
*   **Phase 5: Stabilization**: Refined the UI to a minimalist Zinc/Emerald aesthetic and resolved deployment/CORS issues.

---

## 2. Architecture Decisions

### **Frontend Stack**
*   **Framework**: React with Vite for fast HMR and optimized builds.
*   **Styling**: Vanilla CSS + Tailwind. Used CSS variables (`--primary`, `--sidebar-active`) for global theme control.
*   **Animations**: `Framer Motion` for high-end micro-interactions and layout transitions.
*   **State Management**: `useWorkspace` and `useAuth` hooks for global context; `useRef` for infinite scroll and concurrency locks in feeds.

### **Backend & Infrastructure**
*   **Database**: Supabase (PostgreSQL) with Row-Level Security (RLS) for multi-tenant data isolation.
*   **AI Proxy**: Implemented a **Vite Dev Proxy** (`/api/nvidia/*`) to route AI requests server-side, bypassing browser CORS restrictions without needing complex Edge Function deployments during development.
*   **Storage**: Supabase Storage buckets (`kiden-files`, `journal-videos`) for asset management.
*   **PDF Extraction**: Used `pdfjs-dist` to extract text from binary files on the client side before sending context to the LLM.

---

## 3. Problem-Solving & Debugging Logs

### **Issue: AI Chat CORS Blocked**
*   **Symptom**: `Failed to fetch` errors when calling NVIDIA API directly from the browser.
*   **Initial Fix**: Attempted Supabase Edge Functions, but deployment failed due to CLI login requirements.
*   **Final Resolution**: Added a proxy configuration in `vite.config.ts`:
    ```typescript
    server: {
      proxy: {
        '/api/nvidia': {
          target: 'https://integrate.api.nvidia.com/v1',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/nvidia/, ''),
        },
      },
    }
    ```

### **Issue: Research Boards "Empty Columns"**
*   **Symptom**: Newly created boards appeared empty even though default columns were supposed to be created.
*   **Root Cause**: A race condition where `setActiveBoard()` was called before the database insertion of default columns finished.
*   **Resolution**: Sequentialized the creation flow: `Insert Board` → `Insert Columns` → `Set Active Board`.

### **Issue: Note Saving Failures**
*   **Symptom**: "Failed to save note" toast appearing during autosave.
*   **Root Cause**: Code was trying to update `content_text` and `word_count` columns which didn't exist in the active database schema.
*   **Resolution**: Stripped mismatched columns from the Supabase update call and added an `isSaving` concurrency guard.

---

## 4. Final Working Code Snippets (Key Services)

### **A. NVIDIA AI Service (`src/services/nvidia-service.ts`)**
Responsible for document analysis and research synthesis.
```typescript
class NVIDIAService {
  private model: string = 'meta/llama-3.1-8b-instruct';
  
  async chat(messages: any[], documentContext?: any[]) {
    // Build rich system prompt with document text
    let systemPrompt = "You are a research assistant...";
    if (documentContext) {
      systemPrompt += "\n\nDocuments:\n" + documentContext.map(d => d.content).join("\n");
    }
    
    const response = await fetch('/api/nvidia/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        max_tokens: 2048
      })
    });
    return response.json();
  }
}
```

### **B. PDF Text Extractor (`src/lib/pdf-extractor.ts`)**
```typescript
import { getDocument } from 'pdfjs-dist';

export const extractPDFText = async (url: string) => {
  const loadingTask = getDocument(url);
  const pdf = await loadingTask.promise;
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map((item: any) => item.str).join(" ");
  }
  return fullText.substring(0, 12000); // Limit context to 12k chars
};
```

---

## 5. Deployment & Production Checklist
1.  **Vercel Configuration**: Ensure `vercel.json` handles SPA routing (`rewrites` for index.html).
2.  **Env Variables**: `VITE_YOUTUBE_API_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` must be set in production.
3.  **Database**: Run `supabase/kiden_hub_all_in_one.sql` to initialize all tables and RLS policies on the production Supabase instance.
4.  **Logo Assets**: Ensure `@/assets/kiden-logo-green.jpg` is present for brand consistency.

---
*End of Development Summary*
