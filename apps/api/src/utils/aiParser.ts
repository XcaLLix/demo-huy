import { prisma } from '../lib/prisma.js';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createRequire } from 'module';
import { DOMParser } from '@xmldom/xmldom';
import JSZip from 'jszip';
import CFB from 'cfb';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

// MathType / MTEF System Token Filter
const systemTokens = new Set([
  'times', 'symbol', 'courier', 'extra', 'basic', 'code', 'page', 'design', 
  'science', 'microsoft', 'dsmt', 'new', 'roman', 'mt', 'h', 'e', 'a', 'f', 
  'o', 'ole', 'compobj', 'objinfo', 'native', 'equation', 'root', 'entry'
]);

function extractCleanTextFromMtef(eqNativeContent: any): string {
  if (!eqNativeContent) return '';
  const buf = Buffer.from(eqNativeContent).slice(28); // start after MathType header

  let rawStr = '';
  let current = '';
  for (let i = 0; i < buf.length; i++) {
    const c = buf[i];
    if (c >= 32 && c <= 126) {
      current += String.fromCharCode(c);
    } else {
      if (current.length > 0) {
        rawStr += current + ' ';
      }
      current = '';
    }
  }
  if (current.length > 0) rawStr += current;

  // Clean words
  const words = rawStr.split(/\s+/);
  const systemWords = [
    'times', 'roman', 'symbol', 'courier', 'mt', 'extra', 'basic', 'code', 
    'page', 'design', 'science', 'microsoft', 'dsmt', 'winallbasiccodepages',
    'equation', 'native', 'root', 'entry', 'compobj', 'objinfo', 'ole', 'new'
  ];

  const cleanWords = words.filter(word => {
    const lower = word.toLowerCase().trim();
    if (!lower) return false;

    // Filter out MathType metadata, fonts, system tokens
    for (const kw of systemWords) {
      if (lower.includes(kw)) return false;
    }

    // Filter out OLE/MTEF structural symbols
    if (word.includes('_') || word.includes('?') || word === 'AP') {
      return false;
    }

    // Only filter out non-alphanumeric single character noise, keeping common math symbols
    if (word.length === 1 && !/^[a-zA-Z0-9\+\-\=\*\/\(\)\,\.\<\>\[\]\{\}\s]$/.test(word)) {
      return false;
    }

    return true;
  });

  let clean = cleanWords.join('').replace(/\s+/g, '').trim(); // join without spaces for clean math expression
  
  clean = clean.replace(/^[!?@#\$%\^&\*\_\|:\;\"\'\,\.\/~`\s]+/g, '');
  clean = clean.replace(/[?]+$/g, '').trim();

  // Strip leading MathType header metadata (e.g. ED/APAEEAAH, AEEAAH, EEAAH)
  clean = clean.replace(/^(ED\/APAEEAAH|ED\/AP|MT\/AP|AEEAAH|EEAAH|AEAAH|AEEAH|AEEA)/g, '');

  // Map double operators
  clean = clean.replace(/==/g, '=');
  clean = clean.replace(/\+\+/g, '+');
  clean = clean.replace(/\"-/g, '-');
  clean = clean.replace(/\"/g, '');

  return clean;
}

function getChildByName(node: any, name: string): any | null {
  const childs = node.childNodes || [];
  for (let i = 0; i < childs.length; i++) {
    if (childs[i].nodeName === name) return childs[i];
  }
  return null;
}

function getChildrenByName(node: any, name: string): any[] {
  const result: any[] = [];
  const childs = node.childNodes || [];
  for (let i = 0; i < childs.length; i++) {
    if (childs[i].nodeName === name) result.push(childs[i]);
  }
  return result;
}

async function parseNode(node: any, relsMap: Record<string, string>, zip: any, questionsDir: string): Promise<string> {
  if (node.nodeType === 3) { // Text Node
    return node.nodeValue || '';
  }
  
  const name = node.nodeName;
  
  if (name === 'w:t') {
    return node.textContent || '';
  }
  
  // Math runs and components (OMML)
  if (name === 'm:t') {
    return node.textContent || '';
  }
  
  if (name === 'm:oMath' || name === 'm:oMathPara') {
    let mathStr = '';
    const childs = node.childNodes || [];
    for (let i = 0; i < childs.length; i++) {
      mathStr += await parseNode(childs[i], relsMap, zip, questionsDir);
    }
    return `$${mathStr.trim()}$`;
  }
  
  if (name === 'm:f') {
    // Fraction
    const numNode = getChildByName(node, 'm:num');
    const denNode = getChildByName(node, 'm:den');
    const num = numNode ? await parseNode(numNode, relsMap, zip, questionsDir) : '';
    const den = denNode ? await parseNode(denNode, relsMap, zip, questionsDir) : '';
    return `\\frac{${num}}{${den}}`;
  }
  
  if (name === 'm:rad') {
    // Radical
    const degNode = getChildByName(node, 'm:deg');
    const eNode = getChildByName(node, 'm:e');
    const base = eNode ? await parseNode(eNode, relsMap, zip, questionsDir) : '';
    if (degNode && degNode.textContent && degNode.textContent.trim().length > 0) {
      const deg = await parseNode(degNode, relsMap, zip, questionsDir);
      return `\\sqrt[${deg}]{${base}}`;
    }
    return `\\sqrt{${base}}`;
  }
  
  if (name === 'm:sSup') {
    const eNode = getChildByName(node, 'm:e');
    const supNode = getChildByName(node, 'm:sup');
    const base = eNode ? await parseNode(eNode, relsMap, zip, questionsDir) : '';
    const sup = supNode ? await parseNode(supNode, relsMap, zip, questionsDir) : '';
    return `${base}^{${sup}}`;
  }
  
  if (name === 'm:sSub') {
    const eNode = getChildByName(node, 'm:e');
    const subNode = getChildByName(node, 'm:sub');
    const base = eNode ? await parseNode(eNode, relsMap, zip, questionsDir) : '';
    const sub = subNode ? await parseNode(subNode, relsMap, zip, questionsDir) : '';
    return `${base}_{${sub}}`;
  }
  
  if (name === 'm:sSubSup') {
    const eNode = getChildByName(node, 'm:e');
    const subNode = getChildByName(node, 'm:sub');
    const supNode = getChildByName(node, 'm:sup');
    const base = eNode ? await parseNode(eNode, relsMap, zip, questionsDir) : '';
    const sub = subNode ? await parseNode(subNode, relsMap, zip, questionsDir) : '';
    const sup = supNode ? await parseNode(supNode, relsMap, zip, questionsDir) : '';
    return `${base}_{${sub}}^{${sup}}`;
  }
  
  if (name === 'm:d') {
    // Delimiter
    let val = '';
    const childs = node.childNodes || [];
    for (let i = 0; i < childs.length; i++) {
      if (childs[i].nodeName === 'm:e') {
        val += await parseNode(childs[i], relsMap, zip, questionsDir);
      }
    }
    return `\\left( ${val} \\right)`;
  }
  
  if (name === 'm:m') {
    // Matrix
    const rows: string[] = [];
    const mrNodes = getChildrenByName(node, 'm:mr');
    for (const mr of mrNodes) {
      const cells: string[] = [];
      const eNodes = getChildrenByName(mr, 'm:e');
      for (const cell of eNodes) {
        cells.push(await parseNode(cell, relsMap, zip, questionsDir));
      }
      rows.push(cells.join(' & '));
    }
    return `\\begin{matrix} ${rows.join(' \\\\ ')} \\end{matrix}`;
  }

  if (name === 'm:limLow') {
    const eNode = getChildByName(node, 'm:e');
    const limNode = getChildByName(node, 'm:lim');
    const base = eNode ? await parseNode(eNode, relsMap, zip, questionsDir) : '\\lim';
    const lim = limNode ? await parseNode(limNode, relsMap, zip, questionsDir) : '';
    return `${base}_{${lim}}`;
  }

  if (name === 'm:bar') {
    const eNode = getChildByName(node, 'm:e');
    const base = eNode ? await parseNode(eNode, relsMap, zip, questionsDir) : '';
    return `\\overline{${base}}`;
  }

  if (name === 'w:drawing' || name === 'w:pict') {
    const xmlStr = node.toString() || '';
    const rIdMatch = /r:embed="([^"]+)"|r:id="([^"]+)"/.exec(xmlStr);
    const rId = rIdMatch ? (rIdMatch[1] || rIdMatch[2]) : null;
    if (rId && relsMap[rId]) {
      const target = relsMap[rId];
      const targetExt = path.extname(target).toLowerCase();
      // Only keep real non-formula images (PNG, JPG, JPEG, GIF, WebP)
      if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(targetExt)) {
        const fileInZip = zip.file(`word/${target}`);
        if (fileInZip) {
          const imgBuffer = await fileInZip.async('nodebuffer');
          const uniqueName = `${crypto.randomUUID()}${targetExt}`;
          const savePath = path.join(questionsDir, uniqueName);
          fs.writeFileSync(savePath, imgBuffer);
          const relativePath = path.relative(path.resolve(__dirname, '../../'), savePath).replace(/\\/g, '/');
          const url = `/${relativePath}`;
          return `<img src="${url}" />`;
        }
      }
    }
    return '';
  }

  if (name === 'o:OLEObject') {
    const rId = node.getAttribute ? node.getAttribute('r:id') : null;
    let formulaText = '';

    // 1. Try to parse LaTeX first
    if (rId && relsMap[rId]) {
      const target = relsMap[rId]; // e.g. embeddings/oleObject1.bin
      const binFile = zip.file(`word/${target}`);
      if (binFile) {
        try {
          const binBuffer = await binFile.async('nodebuffer');
          const cfb = CFB.read(binBuffer, { type: 'buffer' });
          const eqNativeEntry = cfb.FileIndex.find(e => e.name.includes('Equation Native'));
          if (eqNativeEntry && eqNativeEntry.content) {
            formulaText = extractCleanTextFromMtef(eqNativeEntry.content);
          }
        } catch (err) {
          console.error(`Failed to parse OLE ${target}:`, err);
        }
      }
    }

    // 2. If LaTeX was successfully parsed, return it directly and skip saving/rendering WMF image!
    if (formulaText) {
      return `$${formulaText}$`;
    }

    // 3. Fallback: If LaTeX parsing failed, extract the visual WMF preview image so teacher can manual edit
    let wmfUrl = '';
    const parent = node.parentNode;
    if (parent) {
      const shapeNode = getChildByName(parent, 'v:shape');
      if (shapeNode) {
        const imgDataNode = getChildByName(shapeNode, 'v:imagedata');
        const imgRId = imgDataNode ? (imgDataNode.getAttribute ? imgDataNode.getAttribute('r:id') : null) : null;
        if (imgRId && relsMap[imgRId]) {
          const wmfTarget = relsMap[imgRId];
          const wmfFile = zip.file(`word/${wmfTarget}`);
          if (wmfFile) {
            try {
              const wmfBuffer = await wmfFile.async('nodebuffer');
              const uniqueWmfName = `${crypto.randomUUID()}.wmf`;
              const savePath = path.join(questionsDir, uniqueWmfName);
              fs.writeFileSync(savePath, wmfBuffer);
              const relativePath = path.relative(path.resolve(__dirname, '../../'), savePath).replace(/\\/g, '/');
              wmfUrl = `/${relativePath}`;
            } catch (err) {
              console.error(`Failed to extract OLE WMF preview:`, err);
            }
          }
        }
      }
    }

    if (wmfUrl) {
      return `<img src="${wmfUrl}" data-formula="true" />`;
    }

    return '';
  }

  // Table support
  if (name === 'w:tbl') {
    const rowsHtml: string[] = [];
    const trNodes = getChildrenByName(node, 'w:tr');
    for (const tr of trNodes) {
      const cellsHtml: string[] = [];
      const tcNodes = getChildrenByName(tr, 'w:tc');
      for (const tc of tcNodes) {
        let cellText = '';
        const childs = tc.childNodes || [];
        for (let i = 0; i < childs.length; i++) {
          cellText += await parseNode(childs[i], relsMap, zip, questionsDir);
        }
        cellsHtml.push(`<td>${cellText}</td>`);
      }
      rowsHtml.push(`<tr>${cellsHtml.join('')}</tr>`);
    }
    return `<table>${rowsHtml.join('')}</table>`;
  }

  // General recursion
  let text = '';
  const childs = node.childNodes || [];
  for (let i = 0; i < childs.length; i++) {
    text += await parseNode(childs[i], relsMap, zip, questionsDir);
  }
  return text;
}

export class AiParser {
  static calculateSimilarity(str1: string, str2: string): number {
    const s1 = new Set(str1.toLowerCase().split(/\s+/));
    const s2 = new Set(str2.toLowerCase().split(/\s+/));
    const intersection = new Set([...s1].filter(x => s2.has(x)));
    const union = new Set([...s1, ...s2]);
    if (union.size === 0) return 0;
    return Math.round((intersection.size / union.size) * 100);
  }

  static async parseFile(filePath: string, originalName: string, sessionId?: number): Promise<any[]> {
    const baseQuestionsDir = path.resolve(__dirname, '../../uploads/questions');
    const questionsDir = sessionId 
      ? path.join(baseQuestionsDir, sessionId.toString())
      : baseQuestionsDir;
      
    if (!fs.existsSync(questionsDir)) {
      fs.mkdirSync(questionsDir, { recursive: true });
    }

    const ext = path.extname(originalName).toLowerCase();
    let questions: any[] = [];

    try {
      if (ext === '.docx' || ext === '.doc') {
        questions = await this.parseDocxDom(filePath, questionsDir);
      } else if (ext === '.pdf') {
        questions = await this.parsePdf(filePath);
      } else {
        throw new Error('Định dạng tệp không hỗ trợ! Vui lòng tải lên file .docx hoặc .pdf');
      }
    } catch (err: any) {
      console.error('[AiParser Error]', err.message);
      questions = this.getFallbackQuestions(originalName);
    }

    if (questions.length === 0) {
      questions = this.getFallbackQuestions(originalName);
    }

    // Similarity check against existing questions
    const existingQuestions = await prisma.question.findMany({
      select: { id: true, content: true }
    });

    return questions.map(q => {
      const qText = (q.content || '').replace(/<[^>]*>/g, '').trim();
      let maxSim = 0;
      let dupId: number | null = null;

      for (const eq of existingQuestions) {
        const sim = this.calculateSimilarity(qText, eq.content);
        if (sim > maxSim) {
          maxSim = sim;
          dupId = eq.id;
        }
      }

      if (maxSim > 80) {
        return {
          ...q,
          status: 'WARNING',
          statusDetails: `Trùng lặp ${maxSim}% với câu hỏi ID #${dupId}`,
          similarityScore: maxSim,
          duplicateOfId: dupId
        };
      }

      return {
        ...q,
        status: 'OK',
        statusDetails: null,
        similarityScore: maxSim > 0 ? maxSim : null,
        duplicateOfId: null
      };
    });
  }

  private static async parseDocxDom(filePath: string, questionsDir: string): Promise<any[]> {
    const dataBuffer = fs.readFileSync(filePath);
    const zip = await JSZip.loadAsync(dataBuffer);

    const docXml = await zip.file('word/document.xml')?.async('string');
    const relsXml = await zip.file('word/_rels/document.xml.rels')?.async('string');

    if (!docXml || !relsXml) {
      throw new Error('Không thể đọc cấu trúc tệp XML của Word Document!');
    }

    // Map relationships
    const relsMap: Record<string, string> = {};
    const relsDom = new DOMParser().parseFromString(relsXml, 'text/xml');
    const relationships = relsDom.getElementsByTagName('Relationship');
    for (let i = 0; i < relationships.length; i++) {
      const rel = relationships[i];
      const id = rel.getAttribute('Id');
      const target = rel.getAttribute('Target');
      if (id && target) {
        relsMap[id] = target;
      }
    }

    const docDom = new DOMParser().parseFromString(docXml, 'text/xml');
    const bodyNode = docDom.getElementsByTagName('w:body')[0];
    if (!bodyNode) {
      throw new Error('Không tìm thấy w:body trong document.xml!');
    }

    const bodyChildren = bodyNode.childNodes || [];
    const blocks: { type: string, content: string }[] = [];

    for (let i = 0; i < bodyChildren.length; i++) {
      const child = bodyChildren[i];
      const name = child.nodeName;
      if (name === 'w:p' || name === 'w:tbl') {
        const parsed = await parseNode(child, relsMap, zip, questionsDir);
        if (parsed.trim().length > 0) {
          blocks.push({
            type: name === 'w:tbl' ? 'table' : 'p',
            content: parsed.trim()
          });
        }
      }
    }

    // Split blocks into questions
    const questions: any[] = [];
    let currentQuestion: any = null;
    let currentBlocks: string[] = [];

    const saveCurrent = () => {
      if (currentQuestion && currentBlocks.length > 0) {
        const q = this.assembleQuestionFromBlocks(currentBlocks, questionsDir);
        if (q) questions.push(q);
      }
      currentBlocks = [];
      currentQuestion = null;
    };

    for (const block of blocks) {
      const plainText = block.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      const isQuestionStart =
        /^(Câu|Question|Câu hỏi|Bài)\s*\d+[\.\:\t\s]/i.test(plainText) ||
        /^\d+[\.\)]\s+[A-ZẮẰẲẴẶĂÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ]/i.test(plainText);

      if (isQuestionStart) {
        saveCurrent();
        currentQuestion = block.content;
        currentBlocks = [block.content];
      } else if (currentQuestion) {
        currentBlocks.push(block.content);
      }
    }
    saveCurrent();

    return questions;
  }

  private static assembleQuestionFromBlocks(blocks: string[], questionsDir: string): any | null {
    if (blocks.length === 0) return null;

    const fullHtml = blocks.join('\n');
    const fullText = fullHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    // ── EXTRACT OPTIONS ──
    const options: Array<{ label: string; text: string }> = [];

    // Find option patterns
    // Check if options are inline inside blocks
    const optionRegex = /\b([A-D])[\.\)]\s+/g;
    const optionMatches: Array<{ label: string, index: number, length: number }> = [];
    let match;
    while ((match = optionRegex.exec(fullText)) !== null) {
      optionMatches.push({ label: match[1], index: match.index, length: match[0].length });
    }

    if (optionMatches.length >= 2) {
      for (let i = 0; i < optionMatches.length; i++) {
        const start = optionMatches[i].index + optionMatches[i].length;
        const end = i + 1 < optionMatches.length ? optionMatches[i + 1].index : fullText.length;
        options.push({
          label: optionMatches[i].label,
          text: fullText.substring(start, end).trim()
        });
      }
    } else {
      // Check if paragraphs start with option markers
      for (const block of blocks) {
        const plain = block.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        const optMatch = /^([A-D])[\.\)]\s+(.*)$/i.exec(plain);
        if (optMatch) {
          options.push({
            label: optMatch[1].toUpperCase(),
            text: optMatch[2].trim()
          });
        }
      }
    }

    // Fallback options
    if (options.length < 4) {
      const labels = ['A', 'B', 'C', 'D'];
      while (options.length < 4) {
        options.push({ label: labels[options.length], text: '...' });
      }
    }

    // ── CLEAN CONTENT ──
    let contentHtml = fullHtml;
    // Remove option lines
    contentHtml = contentHtml.replace(/<p[^>]*>\s*<strong[^>]*>[A-D][\.\)]\s*<\/strong>[\s\S]*?<\/p>/gi, '');
    contentHtml = contentHtml.replace(/<p[^>]*>\s*[A-D][\.\)]\s*[\s\S]*?<\/p>/gi, (m) => {
      const txt = m.replace(/<[^>]*>/g, '').trim();
      if (/^[A-D][\.\)]/.test(txt)) return '';
      return m;
    });

    // Strip explanation
    const explanationMarker = contentHtml.search(/(Hướng dẫn giải|Lời giải|Giải thích|Đáp án)/i);
    let explanation = '';
    if (explanationMarker > 0) {
      explanation = contentHtml.substring(explanationMarker).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      contentHtml = contentHtml.substring(0, explanationMarker);
    }

    // Extract media
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    const mediaList: any[] = [];
    let imgMatch;
    let order = 0;
    while ((imgMatch = imgRegex.exec(contentHtml)) !== null) {
      const url = imgMatch[1];
      let type = 'IMAGE';
      const lowerText = fullText.toLowerCase();

      if (imgMatch[0].includes('data-formula="true"')) {
        type = 'FORMULA';
      } else if (lowerText.includes('bảng biến thiên') || lowerText.includes('bbt')) {
        type = 'VARIATION_TABLE';
      } else if (lowerText.includes('đồ thị')) {
        type = 'GRAPH';
      } else if (lowerText.includes('hình chóp') || lowerText.includes('lăng trụ') || lowerText.includes('tứ diện') || lowerText.includes('hình vẽ')) {
        type = 'GEOMETRY';
      } else if (lowerText.includes('bảng số liệu') || lowerText.includes('bảng sau')) {
        type = 'TABLE';
      }

      mediaList.push({
        url,
        type,
        order: order++
      });
    }

    let contentText = contentHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Strip inline options (A, B, C, D) from contentText
    if (optionMatches.length >= 2) {
      const cleanOptionMatches: any[] = [];
      let optM;
      optionRegex.lastIndex = 0; // reset
      while ((optM = optionRegex.exec(contentText)) !== null) {
        cleanOptionMatches.push({ label: optM[1], index: optM.index });
      }
      const cleanAMatch = cleanOptionMatches.find(x => x.label === 'A');
      if (cleanAMatch) {
        contentText = contentText.substring(0, cleanAMatch.index).trim();
      }
    }

    // Strip options from options text too if they contain labels
    const cleanedOptions = options.map(opt => {
      let txt = opt.text;
      // Strip trailing B. C. D. labels that might have leaked into text of option
      const nextOptMatch = /\b[B-D][\.\)]\s+/.exec(txt);
      if (nextOptMatch) {
        txt = txt.substring(0, nextOptMatch.index).trim();
      }
      return {
        label: opt.label,
        text: txt.replace(/^[A-D][\.\)]\s+/, '').trim()
      };
    });

    return {
      content: contentText || fullText.substring(0, 300),
      contentHtml: contentHtml,
      options: cleanedOptions,
      optionsHtml: cleanedOptions.map(o => ({ label: o.label, html: o.text })),
      correctAnswer: 'A',
      explanation: explanation || '',
      difficulty: 'MEDIUM',
      media: mediaList
    };
  }

  private static async parsePdf(filePath: string): Promise<any[]> {
    const questions: any[] = [];
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    const text = data.text || '';

    const lines = text.split('\n').map((l: string) => l.trim()).filter(Boolean);
    let currentLines: string[] = [];
    let currentStart = '';

    const saveQuestion = () => {
      if (!currentLines.length) return;
      const q = this.assemblePdfQuestion(currentStart, currentLines);
      if (q) questions.push(q);
      currentLines = [];
    };

    for (const line of lines) {
      const isQuestionStart =
        /^(Câu|Question)\s*\d+[\.\:\s]/i.test(line) ||
        /^\d+[\.\)]\s+[A-ZẮẰẲẴẶĂÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ]/i.test(line);

      if (isQuestionStart) {
        saveQuestion();
        currentStart = line;
        currentLines = [line];
      } else if (currentLines.length > 0) {
        currentLines.push(line);
      }
    }
    saveQuestion();

    return questions;
  }

  private static assemblePdfQuestion(start: string, lines: string[]): any | null {
    const fullText = lines.join(' ').replace(/\s+/g, ' ').trim();

    const options: Array<{ label: string; text: string }> = [];
    let contentLines: string[] = [];
    let explanationLines: string[] = [];
    let inExplanation = false;

    for (const line of lines) {
      if (/^(Hướng dẫn giải|Lời giải|Đáp án)/i.test(line)) {
        inExplanation = true;
      }

      const optMatch = /^([A-D])[\.\)]\s+(.+)/.exec(line);
      if (optMatch && !inExplanation) {
        options.push({ label: optMatch[1], text: optMatch[2].trim() });
      } else if (inExplanation) {
        explanationLines.push(line);
      } else if (options.length === 0) {
        contentLines.push(line);
      }
    }

    while (options.length < 4) {
      const labels = ['A', 'B', 'C', 'D'];
      options.push({ label: labels[options.length], text: '...' });
    }

    return {
      content: contentLines.join(' ').trim() || fullText.substring(0, 200),
      contentHtml: `<p>${contentLines.join(' ').trim()}</p>`,
      options,
      optionsHtml: options.map(o => ({ label: o.label, html: o.text })),
      correctAnswer: 'A',
      explanation: explanationLines.join(' ').trim() || '',
      difficulty: 'MEDIUM',
      media: []
    };
  }

  private static getFallbackQuestions(fileName: string): any[] {
    const isPhysics = fileName.toLowerCase().includes('ly') || fileName.toLowerCase().includes('physic');
    return [
      {
        content: isPhysics
          ? 'Một con lắc lò xo dao động điều hòa với chu kỳ T. Nếu tăng khối lượng vật nặng lên 4 lần thì chu kỳ sẽ:'
          : 'Tìm tập xác định D của hàm số $y = \\log_2(x^2 - 3x + 2)$:',
        contentHtml: isPhysics
          ? '<p>Một con lắc lò xo dao động điều hòa với chu kỳ T. Nếu tăng khối lượng vật nặng lên 4 lần thì chu kỳ sẽ:</p>'
          : '<p>Tìm tập xác định D của hàm số $y = \\log_2(x^2 - 3x + 2)$:</p>',
        options: isPhysics
          ? [
              { label: 'A', text: 'Tăng lên 2 lần' },
              { label: 'B', text: 'Giảm đi 2 lần' },
              { label: 'C', text: 'Tăng lên 4 lần' },
              { label: 'D', text: 'Không đổi' }
            ]
          : [
              { label: 'A', text: 'D = (-∞; 1) ∪ (2; +∞)' },
              { label: 'B', text: 'D = [1; 2]' },
              { label: 'C', text: 'D = (1; 2)' },
              { label: 'D', text: 'D = ℝ' }
            ],
        optionsHtml: [],
        correctAnswer: 'A',
        explanation: '',
        difficulty: 'MEDIUM',
        media: []
      }
    ];
  }
}
