import { prisma } from '../lib/prisma.js';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createRequire } from 'module';
import { DOMParser } from '@xmldom/xmldom';
import JSZip from 'jszip';
import CFB from 'cfb';
import { fileURLToPath } from 'url';
import { DocConverter } from './docConverter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

// =========================================================================
// OMML TO LATEX MATH PARSER
// =========================================================================

const mathCharacterMap: Record<string, string> = {
  // Greek letters
  'α': '\\alpha', 'β': '\\beta', 'γ': '\\gamma', 'δ': '\\delta', 'ε': '\\epsilon',
  'ζ': '\\zeta', 'η': '\\eta', 'θ': '\\theta', 'ι': '\\iota', 'κ': '\\kappa',
  'λ': '\\lambda', 'μ': '\\mu', 'ν': '\\nu', 'ξ': '\\xi', 'ο': 'o', 'π': '\\pi',
  'ρ': '\\rho', 'σ': '\\sigma', 'τ': '\\tau', 'υ': '\\upsilon', 'φ': '\\phi',
  'χ': '\\chi', 'ψ': '\\psi', 'ω': '\\omega',
  'Α': 'A', 'Β': 'B', 'Γ': '\\Gamma', 'Δ': '\\Delta', 'Ε': 'E', 'Ζ': 'Z',
  'Η': 'H', 'Θ': '\\Theta', 'Ι': 'I', 'Κ': 'K', 'Λ': '\\Lambda', 'Μ': 'M',
  'N': 'N', 'Ξ': '\\Xi', 'Ο': 'O', 'Π': '\\Pi', 'Ρ': 'P', 'Σ': '\\Sigma',
  'Τ': 'T', 'Υ': '\\Upsilon', 'Φ': '\\Phi', 'Χ': 'X', 'Ψ': '\\Psi', 'Ω': '\\Omega',

  // Operators & Symbols
  '±': '\\pm', '∓': '\\mp', '×': '\\times', '÷': '\\div', '∗': '*', '★': '\\star',
  '∘': '\\circ', '∙': '\\cdot', '·': '\\cdot', '√': '\\sqrt', '∝': '\\propto',
  '∞': '\\infty', '∟': '\\angle', '∠': '\\angle', '∡': '\\measuredangle',
  '∥': '\\parallel', '∦': '\\not\\parallel', '⊥': '\\perp',
  '∼': '\\sim', '∽': '\\backsim', '≈': '\\approx', '≅': '\\cong', '≌': '\\simeq',
  '≠': '\\neq', '≡': '\\equiv', '≤': '\\le', '≥': '\\ge', '≦': '\\le', '≧': '\\ge',
  '≪': '\\ll', '≫': '\\gg', '⊂': '\\subset', '⊃': '\\supset', '⊆': '\\subseteq',
  '⊇': '\\supseteq', '⊈': '\\nsubseteq', '⊉': '\\nsupseteq',
  '∈': '\\in', '∉': '\\notin', '∋': '\\ni', '∌': '\\not\\ni',
  '∩': '\\cap', '∪': '\\cup', '∅': '\\varnothing', '∀': '\\forall',
  '∃': '\\exists', '∄': '\\nexists', '∇': '\\nabla',
  '∴': '\\therefore', '∵': '\\because', '∷': '\\approx',
  '→': '\\rightarrow', '↑': '\\uparrow', '↓': '\\downarrow', '←': '\\leftarrow',
  '↔': '\\leftrightarrow', '⇒': '\\Rightarrow', '⇔': '\\Leftrightarrow',
  '⇌': '\\rightleftharpoons', 'ℝ': '\\mathbb{R}', 'ℤ': '\\mathbb{Z}',
  'ℚ': '\\mathbb{Q}', 'ℕ': '\\mathbb{N}', 'ℂ': '\\mathbb{C}',
  'đ': 'd', 'để': '\\text{ để }', 'với': '\\text{ với }', 'và': '\\text{ và }',
  'hoặc': '\\text{ hoặc }', 'khi': '\\text{ khi }'
};

function cleanMathText(text: string): string {
  let cleaned = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (mathCharacterMap[char]) {
      cleaned += ' ' + mathCharacterMap[char] + ' ';
    } else {
      cleaned += char;
    }
  }
  
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  // Wrap non-latex plain words in \text{}
  if (cleaned.length > 1 && /^[a-zA-Zà-ỹÀ-Ỹ\s]+$/.test(cleaned) && !cleaned.startsWith('\\')) {
    return `\\text{${cleaned}}`;
  }
  
  return cleaned;
}

function getChildByLocalName(node: any, name: string): any | null {
  const childs = node.childNodes || [];
  for (let i = 0; i < childs.length; i++) {
    const local = childs[i].localName || childs[i].nodeName.split(':').pop();
    if (local === name) return childs[i];
  }
  return null;
}

function getChildrenByLocalName(node: any, name: string): any[] {
  const result: any[] = [];
  const childs = node.childNodes || [];
  for (let i = 0; i < childs.length; i++) {
    const local = childs[i].localName || childs[i].nodeName.split(':').pop();
    if (local === name) result.push(childs[i]);
  }
  return result;
}

function ommlToLatex(node: any): string {
  if (!node) return '';
  if (node.nodeType === 3) {
    return node.nodeValue || '';
  }
  
  const localName = node.localName || node.nodeName.split(':').pop();
  
  switch (localName) {
    case 'oMath':
    case 'oMathPara': {
      let latex = '';
      const children = node.childNodes || [];
      for (let i = 0; i < children.length; i++) {
        latex += ommlToLatex(children[i]);
      }
      return latex;
    }
    
    case 'r': {
      let latex = '';
      const children = node.childNodes || [];
      for (let i = 0; i < children.length; i++) {
        latex += ommlToLatex(children[i]);
      }
      return latex;
    }
    
    case 't': {
      const text = node.textContent || '';
      return cleanMathText(text);
    }
    
    case 'f': {
      const numNode = getChildByLocalName(node, 'num');
      const denNode = getChildByLocalName(node, 'den');
      const numLatex = numNode ? ommlToLatex(numNode) : '';
      const denLatex = denNode ? ommlToLatex(denNode) : '';
      return `\\frac{${numLatex}}{${denLatex}}`;
    }
    
    case 'num':
    case 'den':
    case 'e': {
      let latex = '';
      const children = node.childNodes || [];
      for (let i = 0; i < children.length; i++) {
        latex += ommlToLatex(children[i]);
      }
      return latex;
    }
    
    case 'rad': {
      const degNode = getChildByLocalName(node, 'deg');
      const eNode = getChildByLocalName(node, 'e');
      const baseLatex = eNode ? ommlToLatex(eNode) : '';
      if (degNode && degNode.textContent && degNode.textContent.trim().length > 0) {
        const degLatex = ommlToLatex(degNode);
        return `\\sqrt[${degLatex}]{${baseLatex}}`;
      }
      return `\\sqrt{${baseLatex}}`;
    }
    
    case 'deg': {
      return node.textContent || '';
    }
    
    case 'sSup': {
      const eNode = getChildByLocalName(node, 'e');
      const supNode = getChildByLocalName(node, 'sup');
      const baseLatex = eNode ? ommlToLatex(eNode) : '';
      const supLatex = supNode ? ommlToLatex(supNode) : '';
      return `${baseLatex}^{${supLatex}}`;
    }
    
    case 'sup': {
      let latex = '';
      const children = node.childNodes || [];
      for (let i = 0; i < children.length; i++) {
        latex += ommlToLatex(children[i]);
      }
      return latex;
    }
    
    case 'sSub': {
      const eNode = getChildByLocalName(node, 'e');
      const subNode = getChildByLocalName(node, 'sub');
      const baseLatex = eNode ? ommlToLatex(eNode) : '';
      const subLatex = subNode ? ommlToLatex(subNode) : '';
      return `${baseLatex}_{${subLatex}}`;
    }
    
    case 'sub': {
      let latex = '';
      const children = node.childNodes || [];
      for (let i = 0; i < children.length; i++) {
        latex += ommlToLatex(children[i]);
      }
      return latex;
    }
    
    case 'sSubSup': {
      const eNode = getChildByLocalName(node, 'e');
      const subNode = getChildByLocalName(node, 'sub');
      const supNode = getChildByLocalName(node, 'sup');
      const baseLatex = eNode ? ommlToLatex(eNode) : '';
      const subLatex = subNode ? ommlToLatex(subNode) : '';
      const supLatex = supNode ? ommlToLatex(supNode) : '';
      return `${baseLatex}_{${subLatex}}^{${supLatex}}`;
    }
    
    case 'd': {
      const eNodes = getChildrenByLocalName(node, 'e');
      let insideLatex = '';
      for (const eNode of eNodes) {
        insideLatex += ommlToLatex(eNode);
      }
      return `\\left( ${insideLatex} \\right)`;
    }
    
    case 'm': {
      const rows: string[] = [];
      const mrNodes = getChildrenByLocalName(node, 'mr');
      for (const mr of mrNodes) {
        const cells: string[] = [];
        const eNodes = getChildrenByLocalName(mr, 'e');
        for (const cell of eNodes) {
          cells.push(ommlToLatex(cell));
        }
        rows.push(cells.join(' & '));
      }
      return `\\begin{matrix} ${rows.join(' \\\\ ')} \\end{matrix}`;
    }
    
    case 'limLow': {
      const eNode = getChildByLocalName(node, 'e');
      const limNode = getChildByLocalName(node, 'lim');
      const baseLatex = eNode ? ommlToLatex(eNode) : '\\lim';
      const limLatex = limNode ? ommlToLatex(limNode) : '';
      return `${baseLatex}_{${limLatex}}`;
    }
    
    case 'lim': {
      let latex = '';
      const children = node.childNodes || [];
      for (let i = 0; i < children.length; i++) {
        latex += ommlToLatex(children[i]);
      }
      return latex;
    }
    
    case 'limUpp': {
      const eNode = getChildByLocalName(node, 'e');
      const limNode = getChildByLocalName(node, 'lim');
      const baseLatex = eNode ? ommlToLatex(eNode) : '';
      const limLatex = limNode ? ommlToLatex(limNode) : '';
      return `\\overset{${limLatex}}{${baseLatex}}`;
    }
    
    case 'nary': {
      const naryPr = getChildByLocalName(node, 'naryPr');
      const subNode = getChildByLocalName(node, 'sub');
      const supNode = getChildByLocalName(node, 'sup');
      const eNode = getChildByLocalName(node, 'e');
      
      let op = '\\sum';
      if (naryPr) {
        const chrNode = getChildByLocalName(naryPr, 'chr');
        const chr = chrNode ? chrNode.getAttribute('m:val') || chrNode.textContent || '' : '';
        if (chr === '∫' || chr.includes('int')) {
          op = '\\int';
        } else if (chr === '∏' || chr.includes('prod')) {
          op = '\\prod';
        } else if (chr) {
          op = cleanMathText(chr);
        }
      }
      
      const subLatex = subNode ? ommlToLatex(subNode) : '';
      const supLatex = supNode ? ommlToLatex(supNode) : '';
      const argumentLatex = eNode ? ommlToLatex(eNode) : '';
      
      if (subLatex && supLatex) {
        return `${op}_{${subLatex}}^{${supLatex}}{${argumentLatex}}`;
      } else if (subLatex) {
        return `${op}_{${subLatex}}{${argumentLatex}}`;
      }
      return `${op} {${argumentLatex}}`;
    }
    
    case 'func': {
      const fNameNode = getChildByLocalName(node, 'fName');
      const eNode = getChildByLocalName(node, 'e');
      const fNameText = fNameNode ? fNameNode.textContent || '' : '';
      const argumentLatex = eNode ? ommlToLatex(eNode) : '';
      
      let fNameLatex = fNameText.trim();
      const standardFunctions = ['sin', 'cos', 'tan', 'cot', 'log', 'ln', 'lim', 'arcsin', 'arccos', 'arctan'];
      if (standardFunctions.includes(fNameLatex.toLowerCase())) {
        fNameLatex = '\\' + fNameLatex.toLowerCase();
      } else {
        fNameLatex = `\\text{${fNameLatex}}`;
      }
      
      return `${fNameLatex}{${argumentLatex}}`;
    }
    
    case 'acc': {
      const accPr = getChildByLocalName(node, 'accPr');
      const eNode = getChildByLocalName(node, 'e');
      const baseLatex = eNode ? ommlToLatex(eNode) : '';
      
      let accentCmd = '\\overline';
      if (accPr) {
        const chrNode = getChildByLocalName(accPr, 'chr');
        const chr = chrNode ? chrNode.getAttribute('m:val') || chrNode.textContent || '' : '';
        if (chr === '→' || chr === '->') {
          accentCmd = '\\vec';
        } else if (chr === '^') {
          accentCmd = '\\hat';
        } else if (chr === '~') {
          accentCmd = '\\tilde';
        } else if (chr === '¯') {
          accentCmd = '\\bar';
        }
      }
      
      return `${accentCmd}{${baseLatex}}`;
    }
    
    case 'groupChr': {
      const groupChrPr = getChildByLocalName(node, 'groupChrPr');
      const eNode = getChildByLocalName(node, 'e');
      const baseLatex = eNode ? ommlToLatex(eNode) : '';
      
      let groupCmd = '\\overline';
      if (groupChrPr) {
        const chrNode = getChildByLocalName(groupChrPr, 'chr');
        const chr = chrNode ? chrNode.getAttribute('m:val') || chrNode.textContent || '' : '';
        const posNode = getChildByLocalName(groupChrPr, 'pos');
        const pos = posNode ? posNode.getAttribute('m:val') || posNode.textContent || '' : 'top';
        
        if (chr === '→' && pos === 'top') {
          groupCmd = '\\overrightarrow';
        } else if (chr === '⏟' || pos === 'bot') {
          groupCmd = '\\underbrace';
        } else if (chr === '⏞' || pos === 'top') {
          groupCmd = '\\overbrace';
        }
      }
      
      return `${groupCmd}{${baseLatex}}`;
    }
    
    case 'sPre': {
      const subNode = getChildByLocalName(node, 'sub');
      const supNode = getChildByLocalName(node, 'sup');
      const eNode = getChildByLocalName(node, 'e');
      const subLatex = subNode ? ommlToLatex(subNode) : '';
      const supLatex = supNode ? ommlToLatex(supNode) : '';
      const baseLatex = eNode ? ommlToLatex(eNode) : '';
      return `_{${subLatex}}^{${supLatex}}{${baseLatex}}`;
    }
    
    case 'borderBox': {
      const eNode = getChildByLocalName(node, 'e');
      const baseLatex = eNode ? ommlToLatex(eNode) : '';
      return `\\boxed{${baseLatex}}`;
    }
    
    case 'bar': {
      const eNode = getChildByLocalName(node, 'e');
      const baseLatex = eNode ? ommlToLatex(eNode) : '';
      return `\\overline{${baseLatex}}`;
    }
    
    default: {
      let latex = '';
      const children = node.childNodes || [];
      for (let i = 0; i < children.length; i++) {
        latex += ommlToLatex(children[i]);
      }
      return latex;
    }
  }
}

// =========================================================================
// OPTION PARSER TOKENIZER
// =========================================================================

interface Token {
  type: 'text' | 'tag' | 'math';
  content: string;
}

function tokenizeHtml(html: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  
  while (i < html.length) {
    // 1. Math block (delimited by $)
    if (html[i] === '$') {
      let j = i + 1;
      let escaped = false;
      while (j < html.length) {
        if (html[j] === '\\') {
          escaped = !escaped;
        } else if (html[j] === '$' && !escaped) {
          break;
        } else {
          escaped = false;
        }
        j++;
      }
      if (j < html.length) {
        tokens.push({ type: 'math', content: html.substring(i, j + 1) });
        i = j + 1;
        continue;
      }
    }
    
    // 2. HTML Tag (delimited by < and >)
    if (html[i] === '<') {
      let j = html.indexOf('>', i);
      if (j !== -1) {
        tokens.push({ type: 'tag', content: html.substring(i, j + 1) });
        i = j + 1;
        continue;
      }
    }
    
    // 3. Plain text
    let j = i;
    while (j < html.length && html[j] !== '$' && html[j] !== '<') {
      j++;
    }
    tokens.push({ type: 'text', content: html.substring(i, j) });
    i = j;
  }
  
  return tokens;
}

interface OptionMatch {
  label: string;
  tokenIndex: number;
  charIndex: number;
  length: number;
}

function findOptionMarkers(tokens: Token[]): OptionMatch[] {
  const matches: OptionMatch[] = [];
  const expectedLabels = ['A', 'B', 'C', 'D'];
  let currentExpectedIdx = 0;
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.type !== 'text') continue;
    
    const content = token.content;
    let offset = 0;
    
    while (offset < content.length) {
      const nextExpected = expectedLabels[currentExpectedIdx];
      // Match option labels e.g. A. or A)
      const regex = new RegExp(`\\b(${nextExpected})[\\.\\)]\\s+`, 'g');
      regex.lastIndex = offset;
      
      const match = regex.exec(content);
      if (match) {
        matches.push({
          label: nextExpected,
          tokenIndex: i,
          charIndex: match.index,
          length: match[0].length
        });
        currentExpectedIdx++;
        offset = match.index + match[0].length;
        if (currentExpectedIdx >= expectedLabels.length) {
          return matches; // Found all A, B, C, D in order
        }
      } else {
        break; // Try next token
      }
    }
  }
  
  return matches;
}

function findStatementMarkers(tokens: Token[]): OptionMatch[] {
  const matches: OptionMatch[] = [];
  const expectedLabels = ['a', 'b', 'c', 'd'];
  let currentExpectedIdx = 0;
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.type !== 'text') continue;
    
    const content = token.content;
    let offset = 0;
    
    while (offset < content.length) {
      const nextExpected = expectedLabels[currentExpectedIdx];
      // Match statement labels e.g. a) or a.
      const regex = new RegExp(`\\b(${nextExpected})[\\.\\)]\\s+`, 'g');
      regex.lastIndex = offset;
      
      const match = regex.exec(content);
      if (match) {
        matches.push({
          label: nextExpected,
          tokenIndex: i,
          charIndex: match.index,
          length: match[0].length
        });
        currentExpectedIdx++;
        offset = match.index + match[0].length;
        if (currentExpectedIdx >= expectedLabels.length) {
          return matches;
        }
      } else {
        break;
      }
    }
  }
  return matches;
}

function tokensToHtml(tokens: Token[], startToken: number, startChar: number, endToken: number, endChar: number): string {
  let html = '';
  for (let i = startToken; i <= endToken; i++) {
    const token = tokens[i];
    let content = token.content;
    if (i === endToken) {
      content = content.substring(0, endChar);
    }
    if (i === startToken) {
      content = content.substring(startChar);
    }
    html += content;
  }
  return html;
}

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

function getOleObjectNode(node: any): any | null {
  const localName = node.localName || node.nodeName.split(':').pop();
  if (localName === 'OLEObject') return node;
  const children = node.childNodes || [];
  for (let i = 0; i < children.length; i++) {
    const res = getOleObjectNode(children[i]);
    if (res) return res;
  }
  return null;
}

// =========================================================================
// MAIN IMPORT ENGINE CLASS
// =========================================================================

interface ParsedBlock {
  type: 'p' | 'table';
  content: string;
  rawText: string;
  section: string;
}

export class ImportEngine {
  
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

    // Step 1: Document Loader & Normalizer
    if (ext === '.docx' || ext === '.doc') {
      const normalizedPath = path.join(path.dirname(filePath), `normalized_${path.basename(filePath)}.docx`);
      try {
        console.log(`[ImportEngine] Normalizing Word file ${originalName} via COM Object...`);
        await DocConverter.convertAndNormalize(filePath, normalizedPath);
        questions = await this.parseDocx(normalizedPath, questionsDir);
      } catch (err: any) {
        console.error('[ImportEngine Word Normalization Failed, using Fallback direct unzip]', err);
        // Fallback directly to direct DOCX parse if Word COM is unavailable/errors out
        if (ext === '.docx') {
          questions = await this.parseDocx(filePath, questionsDir);
        } else {
          throw new Error('Định dạng .doc cũ yêu cầu môi trường hỗ trợ Microsoft Word COM để chuyển đổi!');
        }
      } finally {
        // Clean up temporary normalized file
        if (fs.existsSync(normalizedPath)) {
          try { fs.unlinkSync(normalizedPath); } catch (e) {}
        }
      }
    } else if (ext === '.pdf') {
      questions = await this.parsePdf(filePath);
    } else {
      throw new Error('Định dạng tệp không hỗ trợ! Vui lòng tải lên file .docx, .doc hoặc .pdf');
    }

    if (questions.length === 0) {
      throw new Error('Không trích xuất được bất kỳ câu hỏi nào từ tài liệu!');
    }

    // Step 13: Duplicate Detection (Similarity check against existing bank)
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

      // Step 12: Question Validator & Warning/Status Injection
      const warnings: string[] = [];
      if (!q.content || q.content.trim().length === 0) {
        warnings.push('Câu hỏi rỗng (thiếu nội dung).');
      }
      if (q.type === 'SHORT_ANSWER') {
        if (!q.correctAnswer || q.correctAnswer.trim().length === 0 || q.correctAnswer === '0') {
          warnings.push('Thiếu đáp án ngắn.');
        }
      } else {
        if (!q.options || !Array.isArray(q.options) || q.options.length < 4 || q.options.some((o: any) => !o.text || o.text === '...')) {
          warnings.push(q.type === 'TRUE_FALSE' ? 'Thiếu hoặc không đủ 4 phát biểu.' : 'Thiếu hoặc không đủ 4 phương án trả lời.');
        }
      }
      if (maxSim > 80) {
        warnings.push(`Trùng lặp cao (${maxSim}%) với câu hỏi ID #${dupId} trong ngân hàng.`);
      }

      const hasError = q.content.trim().length === 0;
      const status = hasError ? 'ERROR' : (warnings.length > 0 ? 'WARNING' : 'OK');
      const statusDetails = warnings.join(' | ') || null;

      return {
        ...q,
        status,
        statusDetails,
        similarityScore: maxSim > 0 ? maxSim : null,
        duplicateOfId: maxSim > 80 ? dupId : null
      };
    });
  }

  // =========================================================================
  // OFFICE OPEN XML PARSER
  // =========================================================================

  private static async parseDocx(filePath: string, questionsDir: string): Promise<any[]> {
    const dataBuffer = fs.readFileSync(filePath);
    const zip = await JSZip.loadAsync(dataBuffer);

    const docXml = await zip.file('word/document.xml')?.async('string');
    const relsXml = await zip.file('word/_rels/document.xml.rels')?.async('string');

    if (!docXml || !relsXml) {
      throw new Error('Không thể giải nén cấu trúc XML của Word Document!');
    }

    // Map relationships (rId -> Target)
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
      throw new Error('Không tìm thấy thẻ body trong XML!');
    }

    const bodyChildren = bodyNode.childNodes || [];
    const blocks: ParsedBlock[] = [];
    let currentSection = 'PHẦN I';

    // Step 2 & 3: Iterate body elements (paragraphs & tables)
    for (let i = 0; i < bodyChildren.length; i++) {
      const child = bodyChildren[i];
      const localName = child.localName || child.nodeName.split(':').pop();

      if (localName === 'p') {
        const blockHtml = await this.parseParagraph(child, relsMap, zip, questionsDir);
        const trimmed = blockHtml.trim();
        if (trimmed.length > 0) {
          const rawText = blockHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          
          // Detect section change
          if (/PHẦN\s+I\b/i.test(rawText)) {
            currentSection = 'PHẦN I';
          } else if (/PHẦN\s+II\b/i.test(rawText)) {
            currentSection = 'PHẦN II';
          } else if (/PHẦN\s+III\b/i.test(rawText)) {
            currentSection = 'PHẦN III';
          }

          blocks.push({
            type: 'p',
            content: trimmed,
            rawText,
            section: currentSection
          });
        }
      } else if (localName === 'tbl') {
        const tableHtml = await this.parseTable(child, relsMap, zip, questionsDir);
        const trimmed = tableHtml.trim();
        if (trimmed.length > 0) {
          blocks.push({
            type: 'table',
            content: trimmed,
            rawText: tableHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
            section: currentSection
          });
        }
      }
    }

    const isAnswerKeyTableStart = (text: string): boolean => {
      const t = text.trim();
      return /^(?:BẢNG\s+)?ĐÁP\s+ÁN\s*(?:CÁC\s+MÃ\s+ĐỀ)?\s*$/i.test(t) ||
             /^PHẦN\s+ĐÁP\s+ÁN\s*$/i.test(t) ||
             /^BẢNG\s+ĐÁP\s+ÁN\s+MÃ\s+ĐỀ\s*\d*/i.test(t);
    };

    const isExplanationSectionStart = (text: string): boolean => {
      const t = text.trim();
      return /^(?:HƯỚNG\s+DẪN\s+GIẢI|LỜI\s+GIẢI|LỜI\s+GIẢI\s+CHI\s+TIẾT|ĐÁP\s+ÁN\s+CHI\s+TIẾT)\b/i.test(t) ||
             /^PHẦN\s+LỜI\s+GIẢI/i.test(t) ||
             /^HƯỚNG\s+DẪN\s+GIẢI\s+VÀ\s+ĐÁP\s+ÁN/i.test(t);
    };

    const examBlocks: ParsedBlock[] = [];
    const explanationSectionBlocks: ParsedBlock[] = [];
    let currentMode: 'EXAM' | 'ANSWER_KEY' | 'EXPLANATION' = 'EXAM';

    for (const block of blocks) {
      const text = block.rawText.trim();
      
      // Update parsing mode based on headers
      if (isExplanationSectionStart(text)) {
        currentMode = 'EXPLANATION';
        continue;
      } else if (isAnswerKeyTableStart(text)) {
        currentMode = 'ANSWER_KEY';
        continue;
      }

      if (currentMode === 'EXAM') {
        // Skip tables that contain answer patterns like Câu 1, Câu 2
        if (block.type === 'table') {
          const cellsText = text.toLowerCase();
          if (cellsText.includes('câu 1') && cellsText.includes('câu 2') && (cellsText.includes('đáp án') || cellsText.includes('đúng') || cellsText.includes('sai') || cellsText.includes('chọn'))) {
            continue;
          }
        }
        examBlocks.push(block);
      } else if (currentMode === 'EXPLANATION') {
        explanationSectionBlocks.push(block);
      } else if (currentMode === 'ANSWER_KEY') {
        // Skip answer key tables/paragraphs. If we encounter explanation header, switch
        if (isExplanationSectionStart(text)) {
          currentMode = 'EXPLANATION';
        }
      }
    }

    // Step 4: Layout Analyzer & Question Boundary Detector (on examBlocks only)
    const questions: any[] = [];
    let currentQuestionBlocks: ParsedBlock[] = [];
    const sectionCounts: Record<string, number> = {};

    const saveCurrentQuestion = () => {
      if (currentQuestionBlocks.length > 0) {
        const questionSection = currentQuestionBlocks[0].section;
        sectionCounts[questionSection] = (sectionCounts[questionSection] || 0) + 1;
        
        const assembled = this.assembleQuestionFromBlocks(currentQuestionBlocks, questionSection, questions.length + 1);
        if (assembled) {
          assembled.orderInSection = sectionCounts[questionSection];
          questions.push(assembled);
        }
        currentQuestionBlocks = [];
      }
    };

    const questionRules = [
      /^(Câu|Question|Câu hỏi|Bài)\s*\d+[\.\:\-\t\s]/i,
      /^\d+[\.\)]\s+/
    ];

    const isQuestionStart = (text: string) => {
      for (const rule of questionRules) {
        if (rule.test(text)) {
          if (/^[A-D][\.\)]\s+/.test(text)) {
            return false;
          }
          return true;
        }
      }
      return false;
    };

    for (const block of examBlocks) {
      if (isQuestionStart(block.rawText)) {
        saveCurrentQuestion();
        currentQuestionBlocks.push(block);
      } else if (currentQuestionBlocks.length > 0) {
        currentQuestionBlocks.push(block);
      }
    }
    saveCurrentQuestion();

    // Step 4b: Parse Explanations from explanationSectionBlocks
    interface ParsedExplanation {
      section: string;
      number: number;
      html: string;
    }
    const parsedExplanations: ParsedExplanation[] = [];
    let currentExplSection = 'PHẦN I';
    let currentQNumber: number | null = null;
    let currentExplBlocks: ParsedBlock[] = [];

    const saveCurrentExplanation = () => {
      if (currentQNumber !== null && currentExplBlocks.length > 0) {
        const firstExplBlock = currentExplBlocks[0];
        const match = /^(Câu|Question|Câu hỏi|Bài)\s*(\d+)/i.exec(firstExplBlock.rawText);
        let headerHtml = firstExplBlock.content;
        if (match) {
          headerHtml = headerHtml.replace(/^(?:<p[^>]*>)?\s*(?:Câu|Question|Câu hỏi|Bài)\s*\d+[\.\:\-\t\s]*/i, '').trim();
        }
        
        let explanationHtml = headerHtml;
        if (currentExplBlocks.length > 1) {
          explanationHtml += ' ' + currentExplBlocks.slice(1).map(b => b.content).join(' ');
        }
        
        explanationHtml = explanationHtml.replace(/^(?:<p[^>]*>)?\s*(?:Hướng dẫn giải|Lời giải chi tiết|Lời giải|Giải thích|Hướng dẫn giải)[\:\.\-\s]*/i, '').trim();
        
        parsedExplanations.push({
          section: currentExplSection,
          number: currentQNumber,
          html: explanationHtml.trim()
        });
        currentExplBlocks = [];
      }
    };

    for (const block of explanationSectionBlocks) {
      const text = block.rawText.trim();
      
      // Update explanation section based on header blocks
      if (/PHẦN\s+I\b/i.test(text)) {
        currentExplSection = 'PHẦN I';
      } else if (/PHẦN\s+II\b/i.test(text)) {
        currentExplSection = 'PHẦN II';
      } else if (/PHẦN\s+III\b/i.test(text)) {
        currentExplSection = 'PHẦN III';
      }

      const match = /^(Câu|Question|Câu hỏi|Bài)\s*(\d+)/i.exec(text);
      if (match) {
        saveCurrentExplanation();
        currentQNumber = parseInt(match[2], 10);
        currentExplBlocks.push(block);
      } else if (currentQNumber !== null) {
        currentExplBlocks.push(block);
      }
    }
    saveCurrentExplanation();

    // Map parsed explanations to questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      let match = parsedExplanations.find(e => e.section === q.section && e.number === q.orderInSection);
      if (!match) {
        // Fallback to sequential index match
        match = parsedExplanations[i];
      }
      if (match && match.html) {
        q.explanation = match.html;
      }
    }

    return questions;
  }

  // Step 5: Run Merger - processes paragraph recursively in document order
  private static async parseParagraph(pNode: any, relsMap: Record<string, string>, zip: any, questionsDir: string): Promise<string> {
    return this.parseParagraphNode(pNode, relsMap, zip, questionsDir);
  }

  private static async parseParagraphNode(node: any, relsMap: Record<string, string>, zip: any, questionsDir: string): Promise<string> {
    if (!node) return '';
    
    // If it's a text node (nodeType === 3), return its text content
    if (node.nodeType === 3) {
      return node.nodeValue || '';
    }
    
    const localName = node.localName || node.nodeName.split(':').pop();
    
    switch (localName) {
      case 't': { // w:t or m:t
        return node.textContent || '';
      }
      
      case 'br': {
        return '<br/>';
      }
      
      case 'tab': {
        return ' ';
      }
      
      case 'oMath':
      case 'oMathPara': {
        const latex = ommlToLatex(node);
        return latex.trim().length > 0 ? `$${latex.trim()}$` : '';
      }
      
      case 'drawing':
      case 'pict': {
        return await this.extractAndSaveImage(node, relsMap, zip, questionsDir);
      }
      
      case 'object': { // w:object (OLE Object container)
        return await this.parseOleObjectContainer(node, relsMap, zip, questionsDir);
      }
      
      default: {
        let html = '';
        const children = node.childNodes || [];
        for (let i = 0; i < children.length; i++) {
          html += await this.parseParagraphNode(children[i], relsMap, zip, questionsDir);
        }
        return html;
      }
    }
  }

  private static async parseOleObjectContainer(node: any, relsMap: Record<string, string>, zip: any, questionsDir: string): Promise<string> {
    const oleNode = getOleObjectNode(node);
    let formulaText = '';
    
    if (oleNode) {
      const rId = oleNode.getAttribute ? oleNode.getAttribute('r:id') : null;
      if (rId && relsMap[rId]) {
        const target = relsMap[rId];
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
    }
    
    if (formulaText) {
      return `$${formulaText}$`;
    }
    
    // Fallback: extract the visual preview image inside the OLE container (wmf/emf format)
    let wmfUrl = '';
    const findImagedataRId = (n: any): string | null => {
      const name = n.localName || n.nodeName.split(':').pop();
      if (name === 'imagedata') {
        return n.getAttribute ? n.getAttribute('r:id') : null;
      }
      const children = n.childNodes || [];
      for (let i = 0; i < children.length; i++) {
        const res = findImagedataRId(children[i]);
        if (res) return res;
      }
      return null;
    };
    
    const imgRId = findImagedataRId(node);
    if (imgRId && relsMap[imgRId]) {
      const wmfTarget = relsMap[imgRId];
      const wmfFile = zip.file(`word/${wmfTarget}`);
      if (wmfFile) {
        try {
          const wmfBuffer = await wmfFile.async('nodebuffer');
          const uniqueWmfName = `${crypto.randomUUID()}${path.extname(wmfTarget)}`;
          const savePath = path.join(questionsDir, uniqueWmfName);
          fs.writeFileSync(savePath, wmfBuffer);
          
          const relativePath = path.relative(path.resolve(__dirname, '../../'), savePath).replace(/\\/g, '/');
          wmfUrl = `/${relativePath}`;
        } catch (err) {
          console.error(`Failed to extract OLE WMF preview:`, err);
        }
      }
    }
    
    if (wmfUrl) {
      return `<img src="${wmfUrl}" data-formula="true" />`;
    }
    
    return '';
  }


  // Step 10: Table Parser (converts w:tbl to HTML table, recursively processes cell contents)
  private static async parseTable(tblNode: any, relsMap: Record<string, string>, zip: any, questionsDir: string): Promise<string> {
    const rowsHtml: string[] = [];
    const trNodes = getChildrenByLocalName(tblNode, 'tr');
    
    for (const tr of trNodes) {
      const cellsHtml: string[] = [];
      const tcNodes = getChildrenByLocalName(tr, 'tc');
      
      for (const tc of tcNodes) {
        let cellContent = '';
        const childs = tc.childNodes || [];
        for (let i = 0; i < childs.length; i++) {
          const child = childs[i];
          const localName = child.localName || child.nodeName.split(':').pop();
          if (localName === 'p') {
            const pHtml = await this.parseParagraph(child, relsMap, zip, questionsDir);
            if (pHtml.trim().length > 0) {
              cellContent += `<p>${pHtml.trim()}</p>`;
            }
          } else if (localName === 'tbl') {
            cellContent += await this.parseTable(child, relsMap, zip, questionsDir);
          }
        }
        cellsHtml.push(`<td>${cellContent}</td>`);
      }
      rowsHtml.push(`<tr>${cellsHtml.join('')}</tr>`);
    }
    
    return `<table class="question-inline-table">${rowsHtml.join('')}</table>`;
  }

  // Helper to extract image file from JSZip and classify it
  private static async extractAndSaveImage(node: any, relsMap: Record<string, string>, zip: any, questionsDir: string): Promise<string> {
    // Traverse DOM to find any rId relationship attributes
    const findRIds = (n: any): string[] => {
      const rIds: string[] = [];
      const traverse = (curr: any) => {
        if (curr.attributes) {
          for (let i = 0; i < curr.attributes.length; i++) {
            const attr = curr.attributes[i];
            if (attr.name.includes('embed') || attr.name.includes('id')) {
              if (attr.value && attr.value.startsWith('rId')) {
                rIds.push(attr.value);
              }
            }
          }
        }
        const childs = curr.childNodes || [];
        for (let i = 0; i < childs.length; i++) {
          traverse(childs[i]);
        }
      };
      traverse(n);
      return rIds;
    };

    const rIds = findRIds(node);
    if (rIds.length === 0) return '';

    // Search targets of relationship IDs
    for (const rId of rIds) {
      if (relsMap[rId]) {
        const target = relsMap[rId];
        const targetExt = path.extname(target).toLowerCase();
        
        // We accept standard images + vector fallback (WMF)
        const allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.wmf', '.emf'];
        if (allowedExtensions.includes(targetExt)) {
          const fileInZip = zip.file(`word/${target}`);
          if (fileInZip) {
            const imgBuffer = await fileInZip.async('nodebuffer');
            const uniqueName = `${crypto.randomUUID()}${targetExt}`;
            const savePath = path.join(questionsDir, uniqueName);
            
            fs.writeFileSync(savePath, imgBuffer);
            
            // Format relative path for public URL reference
            const relativePath = path.relative(path.resolve(__dirname, '../../'), savePath).replace(/\\/g, '/');
            const url = `/${relativePath}`;
            
            return `<img src="${url}" data-filename="${uniqueName}" />`;
          }
        }
      }
    }

    return '';
  }

  // =========================================================================
  // QUESTION & OPTION ASSEMBLY
  // =========================================================================

  private static assembleQuestionFromBlocks(blocks: ParsedBlock[], section: string, order: number): any | null {
    if (blocks.length === 0) return null;

    const type = section === 'PHẦN II' ? 'TRUE_FALSE' : (section === 'PHẦN III' ? 'SHORT_ANSWER' : 'MULTIPLE_CHOICE');

    const firstBlock = blocks[0];
    let headerHtml = firstBlock.content;
    const headerText = firstBlock.rawText;

    // Isolate the question label (e.g. "Câu 1:")
    const questionLabelMatch = /^(Câu|Question|Câu hỏi|Bài)\s*\d+[\.\:\-\t\s]*/i.exec(headerText);
    const questionLabel = questionLabelMatch ? questionLabelMatch[0] : '';
    // Strip the label from the start of the first block content
    let startOfContent = headerHtml.substring(questionLabel.length).trim();
    // Uppercase first letter if it got stripped
    if (startOfContent.startsWith('<')) {
      // It's a tag, leave it
    } else {
      startOfContent = startOfContent.charAt(0).toUpperCase() + startOfContent.slice(1);
    }
    
    let contentHtml = startOfContent;

    // Collect explanation blocks and separate them from option blocks
    const explanationRegex = /(Hướng dẫn giải|Lời giải chi tiết|Lời giải|Giải thích|Hướng dẫn giải)/i;
    let explanationHtml = '';
    let explanationIndex = -1;

    for (let i = 1; i < blocks.length; i++) {
      if (explanationRegex.test(blocks[i].rawText)) {
        explanationIndex = i;
        break;
      }
    }

    let optionBlocks: ParsedBlock[] = [];
    let explanationBlocks: ParsedBlock[] = [];

    if (explanationIndex !== -1) {
      optionBlocks = blocks.slice(1, explanationIndex);
      explanationBlocks = blocks.slice(explanationIndex);
    } else {
      optionBlocks = blocks.slice(1);
    }

    // Prepare variables based on type
    let finalOptions: any = null;
    let correctAnswer = '';

    // Assemble Explanation first (needed if answer is parsed from it in SHORT_ANSWER)
    if (explanationBlocks.length > 0) {
      explanationHtml = explanationBlocks.map(b => b.content).join(' ');
      // Strip the explanation keyword from the front
      explanationHtml = explanationHtml.replace(/^(?:<p[^>]*>)?\s*(?:Hướng dẫn giải|Lời giải chi tiết|Lời giải|Giải thích|Hướng dẫn giải)[\:\.\-\s]*/i, '').trim();
    }

    if (type === 'MULTIPLE_CHOICE') {
      const optionsHtmlCombined = optionBlocks.map(b => b.content).join(' ');
      const optionTokens = tokenizeHtml(optionsHtmlCombined);
      const optionMatches = findOptionMarkers(optionTokens);
      const options: Array<{ label: string; text: string }> = [];

      if (optionMatches.length === 4) {
        const extraContentTokenIdx = optionMatches[0].tokenIndex;
        const extraContentCharIdx = optionMatches[0].charIndex;
        const extraHtml = tokensToHtml(optionTokens, 0, 0, extraContentTokenIdx, extraContentCharIdx);
        if (extraHtml.trim().length > 0) {
          contentHtml += ' ' + extraHtml.trim();
        }

        for (let i = 0; i < 4; i++) {
          const startToken = optionMatches[i].tokenIndex;
          const startChar = optionMatches[i].charIndex + optionMatches[i].length;
          const endToken = i + 1 < 4 ? optionMatches[i + 1].tokenIndex : optionTokens.length - 1;
          const endChar = i + 1 < 4 ? optionMatches[i + 1].charIndex : optionTokens[endToken].content.length;

          options.push({
            label: optionMatches[i].label,
            text: tokensToHtml(optionTokens, startToken, startChar, endToken, endChar).trim()
          });
        }
      } else {
        for (const block of optionBlocks) {
          const optMatch = /^([A-D])[\.\)]\s+(.*)$/i.exec(block.rawText);
          if (optMatch) {
            options.push({
              label: optMatch[1].toUpperCase(),
              text: block.content.replace(/^<[^>]*>|^(?:[A-D][\.\)]\s+)/i, '').replace(/<\/[^>]*>$/, '').trim()
            });
          } else {
            contentHtml += ' ' + block.content;
          }
        }
      }

      while (options.length < 4) {
        const labels = ['A', 'B', 'C', 'D'];
        options.push({ label: labels[options.length], text: '...' });
      }

      finalOptions = options;
      correctAnswer = 'A'; // Default, resolved by review
    } 
    else if (type === 'TRUE_FALSE') {
      const optionsHtmlCombined = optionBlocks.map(b => b.content).join(' ');
      const optionTokens = tokenizeHtml(optionsHtmlCombined);
      const statementMatches = findStatementMarkers(optionTokens);
      const statements: Array<{ label: string; text: string; isCorrect: boolean }> = [];

      if (statementMatches.length > 0) {
        const extraHtml = tokensToHtml(optionTokens, 0, 0, statementMatches[0].tokenIndex, statementMatches[0].charIndex);
        if (extraHtml.trim().length > 0) {
          contentHtml += ' ' + extraHtml.trim();
        }

        for (let i = 0; i < statementMatches.length; i++) {
          const startToken = statementMatches[i].tokenIndex;
          const startChar = statementMatches[i].charIndex + statementMatches[i].length;
          const endToken = i + 1 < statementMatches.length ? statementMatches[i + 1].tokenIndex : optionTokens.length - 1;
          const endChar = i + 1 < statementMatches.length ? statementMatches[i + 1].charIndex : optionTokens[endToken].content.length;

          let statementText = tokensToHtml(optionTokens, startToken, startChar, endToken, endChar).trim();
          
          let isCorrect = true;
          const cleanText = statementText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          
          if (/\b(Đúng|đúng)\b/i.test(cleanText)) {
            if (/\b(Sai|sai)\b/i.test(cleanText)) {
              if (/<u>\s*(Đúng|đúng)\s*<\/u>|<b>\s*(Đúng|đúng)\s*<\/b>|<strong>\s*(Đúng|đúng)\s*<\/strong>/i.test(statementText)) {
                isCorrect = true;
              } else if (/<u>\s*(Sai|sai)\s*<\/u>|<b>\s*(Sai|sai)\s*<\/b>|<strong>\s*(Sai|sai)\s*<\/strong>/i.test(statementText)) {
                isCorrect = false;
              } else {
                const matchCorrect = /đúng\s*[\.\)]*$/i.test(cleanText);
                const matchWrong = /sai\s*[\.\)]*$/i.test(cleanText);
                if (matchCorrect) isCorrect = true;
                else if (matchWrong) isCorrect = false;
              }
            } else {
              isCorrect = true;
            }
          } else if (/\b(Sai|sai)\b/i.test(cleanText)) {
            isCorrect = false;
          }

          statementText = statementText
            .replace(/\b(Đúng|đúng|Sai|sai)\b\s*$/gi, '')
            .replace(/[\(\[\-\s]+(Đúng|đúng|Sai|sai)[\)\]\s]*$/gi, '')
            .trim();

          statements.push({
            label: statementMatches[i].label.toLowerCase(),
            text: statementText,
            isCorrect
          });
        }
      } else {
        for (const block of optionBlocks) {
          const match = /^([a-d])[\.\)]\s*(.*)$/i.exec(block.rawText);
          if (match) {
            const label = match[1].toLowerCase();
            let statementText = block.content.replace(/^<[^>]*>|^(?:[a-d][\.\)]\s+)/i, '').replace(/<\/[^>]*>$/, '').trim();
            
            let isCorrect = true;
            const cleanText = block.rawText.toLowerCase();
            if (cleanText.includes('sai')) {
              isCorrect = false;
            }

            statementText = statementText
              .replace(/\b(Đúng|đúng|Sai|sai)\b\s*$/gi, '')
              .replace(/[\(\[\-\s]+(Đúng|đúng|Sai|sai)[\)\]\s]*$/gi, '')
              .trim();
              
            statements.push({
              label,
              text: statementText,
              isCorrect
            });
          } else {
            contentHtml += ' ' + block.content;
          }
        }
      }

      while (statements.length < 4) {
        const labels = ['a', 'b', 'c', 'd'];
        statements.push({
          label: labels[statements.length],
          text: '...',
          isCorrect: true
        });
      }

      finalOptions = statements;
      correctAnswer = ''; // Blank, sub-answers stored in options
    } 
    else if (type === 'SHORT_ANSWER') {
      const answerRegex = /(?:Đáp án|Đáp số|Kết quả|Điền đáp án)[\s\:\-\=]+([^\r\n<]+)/i;
      
      if (explanationHtml) {
        const matchAns = answerRegex.exec(explanationHtml.replace(/<[^>]*>/g, ' '));
        if (matchAns) {
          correctAnswer = matchAns[1].trim();
        }
      }

      for (const block of optionBlocks) {
        const matchAns = answerRegex.exec(block.rawText);
        if (matchAns) {
          correctAnswer = matchAns[1].trim();
        } else {
          contentHtml += ' ' + block.content;
        }
      }

      if (!correctAnswer) {
        correctAnswer = '0';
      }

      correctAnswer = correctAnswer.replace(/[\.\s]*$/, '').trim();

      finalOptions = {
        tolerance: 0.0,
        format: isNaN(Number(correctAnswer.replace(/,/g, '.'))) ? 'TEXT' : 'NUMBER'
      };
    }

    // Step 9: Asset Extractor - Collect images inside question content and options/explanation
    const optionsTextForMedia = type === 'MULTIPLE_CHOICE'
      ? finalOptions.map((o: any) => o.text).join(' ')
      : (type === 'TRUE_FALSE' ? finalOptions.map((s: any) => s.text).join(' ') : '');

    const fullQuestionHtml = `${contentHtml} ${optionsTextForMedia} ${explanationHtml}`;
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    const mediaList: any[] = [];
    let imgMatch;
    let mediaOrder = 0;

    const plainTextAll = fullQuestionHtml.replace(/<[^>]*>/g, ' ').toLowerCase();

    while ((imgMatch = imgRegex.exec(fullQuestionHtml)) !== null) {
      const url = imgMatch[1];
      let imgType = 'IMAGE';

      if (plainTextAll.includes('bảng biến thiên') || plainTextAll.includes('bbt')) {
        imgType = 'VARIATION_TABLE';
      } else if (plainTextAll.includes('đồ thị') || plainTextAll.includes('hàm số y =')) {
        imgType = 'GRAPH';
      } else if (plainTextAll.includes('hình chóp') || plainTextAll.includes('lăng trụ') || plainTextAll.includes('tứ diện') || plainTextAll.includes('hình vẽ')) {
        imgType = 'GEOMETRY';
      } else if (plainTextAll.includes('bảng số liệu') || plainTextAll.includes('bảng sau')) {
        imgType = 'TABLE';
      }

      mediaList.push({
        url,
        type: imgType,
        order: mediaOrder++
      });
    }

    let optionsHtml = finalOptions;
    if (type === 'MULTIPLE_CHOICE') {
      optionsHtml = finalOptions.map((o: any) => ({ label: o.label, html: o.text }));
    }

    return {
      type,
      section,
      questionOrder: order,
      content: contentHtml.trim(),
      contentHtml: `<p>${contentHtml.trim()}</p>`,
      options: finalOptions,
      optionsHtml,
      correctAnswer,
      explanation: explanationHtml.trim(),
      difficulty: 'MEDIUM',
      media: mediaList
    };
  }

  // =========================================================================
  // PDF PARSER & OCR FALLBACK
  // =========================================================================

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

    const isQuestionStart = (line: string) => {
      return /^(Câu|Question)\s*\d+[\.\:\s]/i.test(line) ||
             /^\d+[\.\)]\s+[A-ZẮẰẲẴẶĂÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ]/i.test(line);
    };

    for (const line of lines) {
      if (isQuestionStart(line)) {
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
}
