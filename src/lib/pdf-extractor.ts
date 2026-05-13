/**
 * PDF Text Extractor using pdf.js
 * Extracts readable text from a PDF given its public URL.
 */
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

// Point to CDN worker so we don't need to copy it locally
GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.9.155/pdf.worker.min.mjs`;

export async function extractPdfText(url: string, maxChars = 12000): Promise<string> {
  try {
    const pdf = await getDocument({ url, verbosity: 0 }).promise;
    let text = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      if (text.length >= maxChars) break;
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const pageText = content.items
        .filter((item: any) => 'str' in item)
        .map((item: any) => item.str)
        .join(' ');
      text += `\n--- Page ${pageNum} ---\n${pageText}`;
    }

    return text.substring(0, maxChars).trim();
  } catch (err: any) {
    console.error('PDF extraction failed:', err);
    throw new Error(`Could not extract PDF text: ${err.message}`);
  }
}
