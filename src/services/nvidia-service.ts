/**
 * NVIDIA API Service with Dual-Key Fallback
 * Uses NVIDIA's free API endpoints for document analysis and summarization
 * Automatically falls back to secondary API key if primary fails
 */

import { supabase } from '@/integrations/supabase/client';

interface NVIDIAMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface DocumentContext {
  filename: string;
  content: string;
  mimeType: string;
  size: number;
}

interface AnalysisResult {
  summary: string;
  keyInsights: string[];
  tags: string[];
  structured: boolean;
}

class NVIDIAService {
  private apiKey1: string;
  private apiKey2: string;
  private model: string = 'meta/llama-3.1-8b-instruct';
  private baseUrl: string = 'https://integrate.api.nvidia.com/v1';

  constructor() {
    this.apiKey1 = import.meta.env.VITE_NVIDIA_API_KEY_1 || '';
    this.apiKey2 = import.meta.env.VITE_NVIDIA_API_KEY_2 || '';

    if (!this.apiKey1 && !this.apiKey2) {
      console.warn(
        'NVIDIA API keys missing. Check .env for VITE_NVIDIA_API_KEY_1 and VITE_NVIDIA_API_KEY_2'
      );
    }
  }

  /**
   * Make API call with automatic fallback to secondary key
   */
  private async makeRequest(
    messages: NVIDIAMessage[],
    primaryKey: string,
    fallbackKey: string
  ): Promise<string> {
    // Use the Vite dev server proxy: /api/nvidia/* → https://integrate.api.nvidia.com/v1/*
    // This runs server-side, so CORS is bypassed entirely in the browser.
    // In production (Electron), we fall back to the direct URL.
    const proxyUrl = '/api/nvidia/chat/completions';
    const directUrl = `${this.baseUrl}/chat/completions`;
    
    // Detect if running through Vite dev server (browser) or Electron (file://)
    const isDevServer = window.location.protocol === 'http:' || window.location.protocol === 'https:';
    const url = isDevServer ? proxyUrl : directUrl;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${primaryKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 0.9,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices[0]?.message?.content || 'No response generated';
    }

    // If rate-limited or unauthorized, try fallback key
    if ((response.status === 401 || response.status === 429) && fallbackKey && fallbackKey !== primaryKey) {
      console.warn('Primary NVIDIA key failed, trying fallback key...');
      return this.makeRequest(messages, fallbackKey, '');
    }

    const errText = await response.text().catch(() => 'Unknown error');
    throw new Error(`NVIDIA API error ${response.status}: ${errText}`);
  }

  /**
   * Generate a chat response with optional document context
   */
  async chat(userMessage: string, documentContext?: DocumentContext[], conversationHistory?: NVIDIAMessage[]): Promise<string> {
    try {
      // Build system prompt with document context
      let systemPrompt = `You are Kiden AI, a helpful assistant integrated into the Kiden productivity workspace. You help users with:
- Writing, editing, and brainstorming content
- Organizing thoughts and ideas
- Planning projects and tasks
- Answering questions and providing information
- Summarizing content and documents
- Extracting key insights from materials
- Creative writing assistance

Be concise, helpful, and friendly. Format responses with markdown when appropriate.`;

      // Add document context if provided — send full extracted content
      if (documentContext && documentContext.length > 0) {
        systemPrompt += '\n\n---\nATTACHED DOCUMENTS (analyze these fully):\n';
        documentContext.forEach((doc, i) => {
          systemPrompt += `\n[Document ${i + 1}] ${doc.filename} (${doc.mimeType})\n`;
          systemPrompt += doc.content.substring(0, 8000); // up to 8000 chars per doc
          systemPrompt += '\n---\n';
        });
        systemPrompt += '\nUse the document content above to answer the user\'s question thoroughly.';
      }

      // Build message history
      const messages: NVIDIAMessage[] = [
        { role: 'system', content: systemPrompt },
        ...(conversationHistory || []),
        { role: 'user', content: userMessage },
      ];

      // Make API call with fallback
      const response = await this.makeRequest(
        messages,
        this.apiKey1,
        this.apiKey2
      );

      return response;
    } catch (error: any) {
      console.error('NVIDIA API error:', error);
      let errorMessage = error.message;
      if (errorMessage === 'Failed to fetch') {
        errorMessage = 'Network error or CORS block. If you are running in a browser, try running the Desktop app (Electron) or check your internet connection.';
      }
      throw new Error(`Failed to generate response: ${errorMessage}`);
    }
  }

  /**
   * Analyze and summarize a document
   */
  async analyzeDocument(document: DocumentContext): Promise<AnalysisResult> {
    try {
      const prompt = `Analyze the following document and provide:
1. A concise summary (2-3 sentences)
2. Key insights (3-5 bullet points)
3. Relevant tags (5-7 tags)

Format your response as JSON with keys: summary, keyInsights (array), tags (array)

Document: ${document.filename}
Content: ${document.content}`;

      const response = await this.chat(prompt);

      // Parse JSON response
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            summary: parsed.summary || '',
            keyInsights: parsed.keyInsights || [],
            tags: parsed.tags || [],
            structured: true,
          };
        }
      } catch (parseError) {
        console.warn('Failed to parse structured response, returning raw content');
      }

      // Fallback: return raw response as summary
      return {
        summary: response.substring(0, 200),
        keyInsights: [],
        tags: [],
        structured: false,
      };
    } catch (error: any) {
      console.error('Document analysis error:', error);
      throw new Error(`Failed to analyze document: ${error.message}`);
    }
  }

  /**
   * Generate key insights from documents
   */
  async generateInsights(documents: DocumentContext[]): Promise<string> {
    if (documents.length === 0) {
      throw new Error('No documents provided for analysis');
    }

    try {
      let documentSummary = 'Documents to analyze:\n\n';
      documents.forEach((doc) => {
        documentSummary += `**${doc.filename}:**\n${doc.content.substring(0, 300)}...\n\n`;
      });

      const prompt = `${documentSummary}

Based on the above documents, provide:
1. Main themes across documents
2. Key findings and conclusions
3. Actionable recommendations
4. Connections between concepts

Format your response with clear sections and use markdown.`;

      return await this.chat(prompt);
    } catch (error: any) {
      console.error('Insights generation error:', error);
      throw new Error(`Failed to generate insights: ${error.message}`);
    }
  }

  /**
   * Summarize multiple documents
   */
  async summarizeDocuments(documents: DocumentContext[]): Promise<string> {
    if (documents.length === 0) {
      throw new Error('No documents provided for summarization');
    }

    try {
      let documentContent = documents
        .map((doc) => `**${doc.filename}:**\n${doc.content.substring(0, 500)}`)
        .join('\n\n---\n\n');

      const prompt = `Please summarize the following documents in a structured format:

${documentContent}

Provide:
1. Executive Summary (2-3 sentences)
2. Key Points (5-7 bullet points)
3. Important Takeaways
4. Recommended Actions (if applicable)`;

      return await this.chat(prompt);
    } catch (error: any) {
      console.error('Summarization error:', error);
      throw new Error(`Failed to summarize documents: ${error.message}`);
    }
  }

  /**
   * Extract tags/keywords from documents
   */
  async extractTags(documents: DocumentContext[]): Promise<string[]> {
    try {
      let documentContent = documents
        .map((doc) => `${doc.filename}: ${doc.content.substring(0, 300)}`)
        .join(' | ');

      const response = await this.chat(
        `Extract 10-15 relevant tags/keywords from this content as a JSON array: ${documentContent}`
      );

      try {
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.warn('Failed to parse tags, extracting manually');
      }

      // Fallback: split by common delimiters
      return response
        .split(/[,\n;]/)
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
        .slice(0, 15);
    } catch (error: any) {
      console.error('Tag extraction error:', error);
      return [];
    }
  }
}

// Export singleton instance
export const nvidiaService = new NVIDIAService();
export default NVIDIAService;
