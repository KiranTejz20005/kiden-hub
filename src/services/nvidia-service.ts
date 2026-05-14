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
  private model: string = 'meta/llama-3.1-8b-instruct';

  /**
   * Make API call through Supabase Edge Function
   */
  private async makeRequest(messages: NVIDIAMessage[]): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('nvidia-chat', {
        body: { action: 'chat', messages, model: this.model },
      });

      if (error) throw error;
      return data.choices[0]?.message?.content || 'No response generated';
    } catch (error: any) {
      console.error('NVIDIA Service Error:', error);
      throw new Error(`AI Service Error: ${error.message}`);
    }
  }

  /**
   * Generate vector embedding for semantic search
   */
  async generateEmbedding(input: string): Promise<number[]> {
    try {
      const { data, error } = await supabase.functions.invoke('nvidia-chat', {
        body: { action: 'embedding', input },
      });

      if (error) throw error;
      return data.embedding;
    } catch (error: any) {
      console.error('Embedding Generation Error:', error);
      throw new Error(`Embedding Error: ${error.message}`);
    }
  }

  /**
   * Generate a chat response with optional document context
   */
  async chat(userMessage: string, documentContext?: DocumentContext[], conversationHistory?: NVIDIAMessage[]): Promise<string> {
    // Build system prompt
    let systemPrompt = `You are Kiden AI, a helpful assistant integrated into the Kiden productivity workspace.
Format responses with markdown. Be concise and professional.`;

    // Add document context if provided
    if (documentContext && documentContext.length > 0) {
      systemPrompt += '\n\n---\nATTACHED DOCUMENTS:\n';
      documentContext.forEach((doc, i) => {
        systemPrompt += `\n[Document ${i + 1}] ${doc.filename}\n`;
        systemPrompt += doc.content.substring(0, 8000);
        systemPrompt += '\n---\n';
      });
      systemPrompt += '\nUse the documents above to answer the user thoroughly.';
    }

    const messages: NVIDIAMessage[] = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []),
      { role: 'user', content: userMessage },
    ];

    return this.makeRequest(messages);
  }

  /**
   * Analyze and summarize a document
   */
  async analyzeDocument(document: DocumentContext): Promise<AnalysisResult> {
    const prompt = `Analyze this document and provide JSON:
{ "summary": "...", "keyInsights": ["...", "..."], "tags": ["...", "..."] }

Document: ${document.filename}
Content: ${document.content}`;

    const response = await this.chat(prompt);

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
    } catch (e) {}

    return { summary: response.substring(0, 200), keyInsights: [], tags: [], structured: false };
  }
}

export const nvidiaService = new NVIDIAService();
export default NVIDIAService;
