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
export function generateLocalRAGAnswer(context: string, query: string, lessonTitle = ''): string {
  const queryLower = query.toLowerCase();
  const titleLower = lessonTitle.toLowerCase();

  // 1. Biology (Sinh học) specialized response for DNA/RNA
  if (titleLower.includes('dna') || titleLower.includes('rna') || titleLower.includes('phiên mã') || titleLower.includes('sinh học')) {
    if (queryLower.includes('tóm tắt') || queryLower.includes('trọng tâm') || queryLower.includes('tóm tắt bài này')) {
      return `🧬 **[Gia sư AI EduPath] Tóm tắt trọng tâm bài học: ${lessonTitle}**

1. **Cấu trúc DNA (Axit Đêôxiribônuclêic):**
   * Cấu tạo từ 4 loại nuclêôtit: **A (Ađênin), T (Timin), G (Guanin), X (Xitôzin)**.
   * Gồm 2 chuỗi pôlinuclêôtit xoắn kép song song ngược chiều (5' -> 3' và 3' -> 5').
   * Liên kết theo **nguyên tắc bổ sung**: A liên kết với T bằng 2 liên kết hiđrô, G liên kết với X bằng 3 liên kết hiđrô.
2. **Cấu trúc RNA (Axit Ribônuclêic):**
   * Là mạch đơn, gồm 4 loại nuclêôtit: **A, U (Uraxin), G, X**.
   * Ba loại chính:
     * **mRNA**: Truyền đạt thông tin di truyền từ gen tới ribôxôm.
     * **tRNA**: Vận chuyển axit amin tới ribôxôm để dịch mã.
     * **rRNA**: Cấu tạo nên bào quan ribôxôm - nơi tổng hợp prôtêin.
3. **Cơ chế Phiên mã:**
   * Diễn ra trong nhân tế bào ở kì trung gian. Enzyme **RNA pôlimêraza** bám vào vùng khởi đầu, trượt dọc theo mạch mã gốc (3' -> 5') của gen để tổng hợp nên phân tử RNA theo nguyên tắc bổ sung (A-U, T-A, G-X, X-G).`;
    }

    if (queryLower.includes('công thức') || queryLower.includes('liệt kê')) {
      return `🧮 **[Gia sư AI EduPath] Công thức di truyền cốt lõi cần nhớ:**

1. **Tổng số nuclêôtit của gen (N):**
   $$N = 2A + 2G = 2T + 2X = \\frac{2 \\times L}{3,4}$$
   *(L là chiều dài của gen tính bằng Angstrom - Å)*
2. **Số liên kết hiđrô (H):**
   $$H = 2A + 3G$$
3. **Số liên kết hóa trị giữa các nuclêôtit trong gen:**
   $$HT = N - 2$$
4. **Công thức phiên mã (tổng hợp RNA):**
   * Số nuclêôtit tự do môi trường cung cấp cho quá trình phiên mã $k$ lần:
     $$rN_{mt} = k \\times rN = k \\times \\frac{N}{2}$$
   * Tỷ lệ các loại đơn phân trên mRNA:
     $$rA = T_{gốc}, \\quad rU = A_{gốc}, \\quad rG = X_{gốc}, \\quad rX = G_{gốc}$$`;
    }

    if (queryLower.includes('câu hỏi') || queryLower.includes('trắc nghiệm') || queryLower.includes('luyện tập')) {
      return `❓ **[Gia sư AI EduPath] Câu hỏi luyện tập trắc nghiệm:**

**Đề bài:** Một mạch khuôn của gen có trình tự nuclêôtit là \`3'-ATG-GXX-GTA-TAA-5'\`. Phân tử mRNA được tổng hợp từ mạch này sẽ có trình tự đơn phân tương ứng là gì?
* **A.** \`5'-UAX-XGG-XAU-AUU-3'\`
* **B.** \`5'-UAC-CGG-CAU-AUU-3'\`
* **C.** \`5'-TAX-XGG-XAT-ATT-3'\`
* **D.** \`3'-UAX-XGG-XAU-AUU-5'\`

👉 **Đáp án đúng:** **A**
*Giải thích chi tiết:* Áp dụng nguyên tắc bổ sung trong phiên mã (mạch gốc liên kết với nuclêôtit tự do): A bổ sung với U, T bổ sung với A, G bổ sung với X, X bổ sung với G. Chiều mạch mRNA ngược chiều với mạch khuôn, do đó mạch 3' -> 5' sẽ cho ra mRNA chiều 5' -> 3'.`;
    }
  }

  // 2. Math (Toán học / Giải tích) specialized response
  if (titleLower.includes('toán') || titleLower.includes('tiệm cận') || titleLower.includes('đạo hàm') || titleLower.includes('tích phân') || titleLower.includes('hình học') || titleLower.includes('hàm số')) {
    if (queryLower.includes('tóm tắt') || queryLower.includes('trọng tâm') || queryLower.includes('tóm tắt bài này')) {
      return `📉 **[Gia sư AI EduPath] Tóm tắt kiến thức hàm số & Tiệm cận:**

1. **Đường tiệm cận ngang:**
   * Đường thẳng $y = y_0$ là tiệm cận ngang của đồ thị hàm số $y = f(x)$ nếu:
     $$\\lim_{x \\to +\\infty} f(x) = y_0 \\quad \\text{hoặc} \\quad \\lim_{x \\to -\\infty} f(x) = y_0$$
2. **Đường tiệm cận đứng:**
   * Đường thẳng $x = x_0$ là tiệm cận đứng của đồ thị hàm số $y = f(x)$ nếu ít nhất một trong các điều kiện sau thỏa mãn:
     $$\\lim_{x \\to x_0^+} f(x) = \\pm\\infty \\quad \\text{hoặc} \\quad \\lim_{x \\to x_0^-} f(x) = \\pm\\infty$$
3. **Mẹo tìm nhanh cho hàm phân thức bậc nhất $y = \\frac{ax+b}{cx+d}$:**
   * Tiệm cận đứng: Nghiệm mẫu số $x = -\\frac{d}{c}$.
   * Tiệm cận ngang: Tỷ số hệ số bậc nhất $y = \\frac{a}{c}$.`;
    }

    if (queryLower.includes('công thức') || queryLower.includes('liệt kê')) {
      return `🧮 **[Gia sư AI EduPath] Tổng hợp công thức khảo sát hàm số:**

1. **Hàm số bậc nhất trên bậc nhất:**
   $$y = \\frac{ax + b}{cx + d} \\implies y' = \\frac{ad - bc}{(cx + d)^2}$$
2. **Phương trình tiếp tuyến của đồ thị hàm số tại điểm $M(x_0; y_0)$:**
   $$y = f'(x_0)(x - x_0) + y_0$$
3. **Điều kiện có cực trị của hàm số bậc ba $y = ax^3 + bx^2 + cx + d$:**
   * Hàm số có 2 điểm cực trị $\\iff y' = 0$ có 2 nghiệm phân biệt $\\iff b^2 - 3ac > 0$.
   * Hàm số không có cực trị $\\iff b^2 - 3ac \\le 0$.`;
    }

    if (queryLower.includes('câu hỏi') || queryLower.includes('trắc nghiệm') || queryLower.includes('luyện tập')) {
      return `❓ **[Gia sư AI EduPath] Câu hỏi luyện tập trắc nghiệm:**

**Đề bài:** Tìm tiệm cận đứng và tiệm cận ngang của đồ thị hàm số $y = \\frac{2x - 3}{x - 1}$.
* **A.** TCĐ: $x = 1$, TCN: $y = 2$
* **B.** TCĐ: $x = 2$, TCN: $y = 1$
* **C.** TCĐ: $x = -1$, TCN: $y = 2$
* **D.** TCĐ: $x = 1$, TCN: $y = -3$

👉 **Đáp án đúng:** **A**
*Giải thích chi tiết:*
- Nghiệm của mẫu số: $x - 1 = 0 \\implies x = 1$ (tiệm cận đứng).
- Giới hạn vô hạn: $\\lim_{x \\to \\pm\\infty} \\frac{2x-3}{x-1} = 2 \\implies y = 2$ (tiệm cận ngang).`;
    }
  }

  // 3. Fallback dynamically querying local context (RAG)
  if (context && context.trim()) {
    return `📖 **[Gia sư AI EduPath] Giải đáp dựa trên tài liệu bài học:**

Thầy đã tìm thấy thông tin hữu ích trong tài liệu bài học tương ứng với câu hỏi của em:

---
${context.substring(0, 1000)}...
---

*Mẹo học tập: Em có thể đọc kỹ thêm tài liệu hoặc xem lại video bài học ở phần bên cạnh để làm sâu sắc kiến thức nhé!*`;
  }

  // 4. Final generic response if context is empty
  return `👋 **Chào em! Thầy là Gia sư AI EduPath đây.**

Đối với bài học **"${lessonTitle || 'Ôn tập THPT Quốc Gia'}"**, em nên tập trung vào các điểm sau:
1. **Ôn tập lý thuyết:** Ghi nhớ các định nghĩa, định luật cốt lõi trong sách giáo khoa.
2. **Hệ thống hóa công thức:** Tự làm sơ đồ tư duy (Mindmap) để kết nối các công thức liên quan.
3. **Luyện tập:** Hãy tải tài liệu ôn tập của buổi học này để tự giải các bài trắc nghiệm nhé.

Nếu em có câu hỏi cụ thể nào về bài học này, hãy nhắn tin ngay cho thầy để được giải đáp!`;
}

/**
 * Retrieve cached text for a document or extract it from the local file and save to cache.
 */
export async function getCachedDocumentText(docId: number, fileUrl: string): Promise<string> {
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  const cacheDir = path.join(uploadsDir, 'rag_cache');
  
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  
  const cacheFilePath = path.join(cacheDir, `${docId}.txt`);
  
  // Return cached text if exists
  if (fs.existsSync(cacheFilePath)) {
    try {
      return fs.readFileSync(cacheFilePath, 'utf-8');
    } catch (err: any) {
      console.error(`[RAG Cache Read Error] Failed to read cache for doc ${docId}:`, err.message);
    }
  }
  
  // Otherwise extract it
  try {
    const filename = fileUrl.substring(fileUrl.lastIndexOf('/') + 1);
    const localFilePath = path.join(uploadsDir, filename);
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    
    console.log(`[RAG System] Extracting text for Document #${docId} (${filename})...`);
    const extractedText = await extractTextFromFile(localFilePath, ext);
    
    if (extractedText && extractedText.trim()) {
      fs.writeFileSync(cacheFilePath, extractedText, 'utf-8');
      console.log(`[RAG System] Cached extracted text for Document #${docId} (${extractedText.length} chars)`);
      return extractedText;
    }
  } catch (err: any) {
    console.error(`[RAG Cache Write Error] Failed to extract/cache doc ${docId}:`, err.message);
  }
  
  return '';
}

/**
 * Segment multiple documents text into chunks, and find most similar chunks based on query keywords
 */
export function getMultiDocRAGContext(docs: { title: string, text: string }[], query: string): string {
  const allChunks: string[] = [];
  
  for (const doc of docs) {
    if (!doc.text || !doc.text.trim()) continue;
    
    // Split document text into paragraphs
    const paragraphs = doc.text.split(/\n+/).map(p => p.trim()).filter(Boolean);
    const docChunks: string[] = [];
    
    let currentChunk = '';
    for (const para of paragraphs) {
      if (currentChunk.length + para.length > 500) {
        docChunks.push(currentChunk);
        currentChunk = para;
      } else {
        currentChunk = currentChunk ? currentChunk + '\n' + para : para;
      }
    }
    if (currentChunk) docChunks.push(currentChunk);
    
    // Prefix each chunk with its document title
    const prefixedChunks = docChunks.map(chunk => `[Tài liệu: ${doc.title}]\n${chunk}`);
    allChunks.push(...prefixedChunks);
  }
  
  if (allChunks.length === 0) return '';
  
  // Tokenize query into lowercase keywords
  const stopWords = new Set(['và', 'hoặc', 'nhưng', 'là', 'các', 'của', 'để', 'trong', 'cho', 'có', 'một', 'được', 'thì', 'ở', 'tại', 'hỏi', 'ai', 'tôi', 'bài', 'học', 'em']);
  const keywords = query.toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
    .split(/\s+/)
    .filter(word => word.length > 1 && !stopWords.has(word));
    
  if (keywords.length === 0) {
    // If no keywords, return first 3 chunks
    return allChunks.slice(0, 3).join('\n\n');
  }
  
  // Score chunks
  const scoredChunks = allChunks.map(chunk => {
    const chunkLower = chunk.toLowerCase();
    let score = 0;
    keywords.forEach(keyword => {
      const escapedKeyword = keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(escapedKeyword, 'g');
      const matches = chunkLower.match(regex);
      if (matches) {
        score += matches.length;
      }
    });
    return { chunk, score };
  });
  
  // Take up to 4 chunks with score > 0, ordered descending
  const relevantChunks = scoredChunks
    .filter(sc => sc.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(sc => sc.chunk);
    
  if (relevantChunks.length === 0) {
    return allChunks.slice(0, 3).join('\n\n');
  }
  
  return relevantChunks.join('\n\n');
}

/**
 * Generate simulated high-quality lesson flashcards locally when API Key is missing or rate limited
 */
export function generateLocalFlashcards(text: string): { front: string, back: string }[] {
  const textLower = text.toLowerCase();
  
  // 1. Biology (Sinh học)
  if (textLower.includes('dna') || textLower.includes('rna') || textLower.includes('phiên mã') || textLower.includes('sinh học')) {
    return [
      { front: 'Cấu trúc xoắn kép DNA', back: 'Gồm 2 chuỗi pôlinuclêôtit xoắn song song ngược chiều (5\' -> 3\' và 3\' -> 5\') liên kết hydro bổ sung.' },
      { front: 'Nguyên tắc bổ sung ở DNA', back: 'A liên kết với T bằng 2 liên kết hiđrô, G liên kết với X bằng 3 liên kết hiđrô.' },
      { front: 'Chức năng của mRNA', back: 'Truyền thông tin di truyền từ gen trong nhân ra tế bào chất làm khuôn tổng hợp prôtêin.' },
      { front: 'Cơ chế phiên mã', back: 'Quá trình enzyme RNA pôlimêraza tháo xoắn gen và tổng hợp RNA từ mạch khuôn gốc 3\' -> 5\'.' },
      { front: 'Chức năng của tRNA', back: 'Vận chuyển axit amin tới ribôxôm để thực hiện dịch mã tổng hợp chuỗi pôlipeptit.' }
    ];
  }

  // 2. Mathematics (Toán học)
  if (textLower.includes('toán') || textLower.includes('tiệm cận') || textLower.includes('đạo hàm') || textLower.includes('tích phân') || textLower.includes('hàm số')) {
    return [
      { front: 'Tiệm cận đứng', back: 'Đường thẳng x = x0 sao cho giới hạn lim y khi x -> x0 bằng vô cực (+vô cực hoặc -vô cực).' },
      { front: 'Tiệm cận ngang', back: 'Đường thẳng y = y0 sao cho giới hạn lim y khi x -> vô cực bằng hằng số y0.' },
      { front: 'Đạo hàm hàm phân thức bậc 1', back: 'Hàm y = (ax+b)/(cx+d) có đạo hàm y\' = (ad - bc) / (cx + d)^2.' },
      { front: 'Tiệm cận hàm y = (ax+b)/(cx+d)', back: 'Tiệm cận đứng: x = -d/c (nghiệm mẫu). Tiệm cận ngang: y = a/c.' },
      { front: 'Cực trị hàm số', back: 'Điểm cực đại hoặc cực tiểu của đồ thị hàm số, tại đó đạo hàm f\'(x) đổi dấu khi qua điểm đó.' }
    ];
  }

  // 3. Physics (Vật lý)
  if (textLower.includes('vật lý') || textLower.includes('dao động') || textLower.includes('sóng') || textLower.includes('điện')) {
    return [
      { front: 'Dao động điều hòa', back: 'Dao động trong đó li độ của vật là một hàm hình sin hoặc côsin theo thời gian: x = A*cos(wt + phi).' },
      { front: 'Chu kì dao động con lắc lò xo', back: 'Công thức T = 2 * pi * căn bậc hai của (m / k).' },
      { front: 'Tần số góc con lắc đơn', back: 'Công thức omega = căn bậc hai của (g / l).' },
      { front: 'Sóng cơ học', back: 'Quá trình lan truyền dao động cơ học trong môi trường vật chất theo thời gian.' },
      { front: 'Cộng hưởng cơ', back: 'Hiện tượng biên độ dao động cưỡng bức tăng đột ngột đến cực đại khi tần số lực cưỡng bức bằng tần số riêng.' }
    ];
  }

  // 4. Default / Generic fallback
  return [
    { front: 'Khái niệm trọng tâm', back: 'Định nghĩa quan trọng cần ghi nhớ để chuẩn bị cho kỳ thi tốt nghiệp.' },
    { front: 'Hệ thống công thức', back: 'Kết nối và xâu chuỗi các công thức liên quan bằng sơ đồ tư duy để nhớ lâu hơn.' },
    { front: 'Ngân hàng bài tập', back: 'Nguồn luyện tập các dạng đề thi trắc nghiệm thực tế sau mỗi bài học lý thuyết.' },
    { front: 'Gia sư AI trợ giúp', back: 'Bấm nút Trợ lý học tập ở góc để hỏi công thức hoặc nhờ tóm tắt nhanh.' },
    { front: 'Ôn luyện hiệu quả', back: 'Kết hợp học lý thuyết qua video, làm flashcard và luyện đề thường xuyên.' }
  ];
}

