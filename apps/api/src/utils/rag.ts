import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

/**
 * Extract text content from document file based on file extension
 */
export async function extractTextFromFile(filePath: string, ext: string): Promise<string> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File không tồn tại tại đường dẫn: ${filePath}`);
  }

  const extension = ext.toLowerCase().replace('.', '');
  
  try {
    if (extension === 'txt' || extension === 'md') {
      return fs.readFileSync(filePath, 'utf-8');
    } else if (extension === 'pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text || '';
    } else if (extension === 'docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value || '';
    }
  } catch (err: any) {
    console.error(`[RAG Text Extraction Error] Failed to extract from ${filePath}:`, err.message);
  }
  return '';
}

/**
 * Segment document text into smaller chunks and find the most similar chunks based on search query keywords
 */
export function getRAGContext(documentText: string, query: string): string {
  if (!documentText || !documentText.trim()) return '';

  // Split documentText into paragraphs
  const paragraphs = documentText.split(/\n+/).map(p => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  
  // Combine paragraphs into chunks of ~400-600 characters
  let currentChunk = '';
  for (const para of paragraphs) {
    if (currentChunk.length + para.length > 500) {
      chunks.push(currentChunk);
      currentChunk = para;
    } else {
      currentChunk = currentChunk ? currentChunk + '\n' + para : para;
    }
  }
  if (currentChunk) chunks.push(currentChunk);

  if (chunks.length === 0) return '';

  // Tokenize query into lowercase keywords, removing punctuation & Vietnamese common stop words
  const stopWords = new Set(['và', 'hoặc', 'nhưng', 'là', 'các', 'của', 'để', 'trong', 'cho', 'có', 'một', 'được', 'thì', 'ở', 'tại']);
  const keywords = query.toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
    .split(/\s+/)
    .filter(word => word.length > 1 && !stopWords.has(word));

  if (keywords.length === 0) {
    // If no meaningful keywords, return first 2 chunks
    return chunks.slice(0, 2).join('\n\n');
  }

  // Score chunks based on keyword matches
  const scoredChunks = chunks.map(chunk => {
    const chunkLower = chunk.toLowerCase();
    let score = 0;
    keywords.forEach(keyword => {
      // Find count of keyword occurrences
      const escapedKeyword = keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(escapedKeyword, 'g');
      const matches = chunkLower.match(regex);
      if (matches) {
        score += matches.length;
      }
    });
    return { chunk, score };
  });

  // Take up to 3 chunks with score > 0, ordered descending
  const relevantChunks = scoredChunks
    .filter(sc => sc.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(sc => sc.chunk);

  if (relevantChunks.length === 0) {
    // Fallback if no matching keywords are found
    return chunks.slice(0, 2).join('\n\n');
  }

  return relevantChunks.join('\n\n');
}

/**
 * Generate a simulated locally matching RAG response when OpenRouter API falls back or errors out
 */
export function generateLocalRAGAnswer(context: string, query: string): string {
  return `📖 **[EduBot - Trợ lý RAG Cục bộ]**
Dựa trên tài liệu học tập được đính kèm trong bài học này, thầy đã tìm kiếm và trích xuất được thông tin liên quan nhất để giải đáp thắc mắc của em:

---
${context}
---

*Mẹo ôn tập: Em có thể nhấp vào tab **Tài liệu ôn tập** ngay bên dưới màn hình video để tải về hoặc đọc chi tiết toàn bộ file tài liệu này nhé. Nếu có thêm câu hỏi, hãy cứ nhắn cho thầy!*`;
}
