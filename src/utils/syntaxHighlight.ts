import {LanguageTab} from '../types/snippet';
import {SyntaxTokenType} from './syntaxThemes';

export interface SyntaxToken {
  start: number;
  end: number;
  type: SyntaxTokenType;
}

const JS_KEYWORDS = new Set([
  'async',
  'await',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'export',
  'extends',
  'finally',
  'for',
  'from',
  'function',
  'if',
  'import',
  'in',
  'instanceof',
  'let',
  'new',
  'of',
  'return',
  'static',
  'super',
  'switch',
  'this',
  'throw',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  'yield',
]);

const JS_CONSTANTS = new Set(['true', 'false', 'null', 'undefined', 'NaN', 'Infinity']);

const JS_GLOBALS = new Set([
  'Array',
  'Boolean',
  'Date',
  'Error',
  'JSON',
  'Map',
  'Math',
  'Number',
  'Object',
  'Promise',
  'RegExp',
  'Set',
  'String',
  'Symbol',
  'console',
  'document',
  'fetch',
  'localStorage',
  'sessionStorage',
  'window',
]);


const CSS_VALUE_KEYWORDS = new Set([
  'absolute',
  'auto',
  'block',
  'bold',
  'both',
  'center',
  'column',
  'contain',
  'cover',
  'currentColor',
  'dashed',
  'dotted',
  'ease',
  'ease-in',
  'ease-in-out',
  'ease-out',
  'fixed',
  'flex',
  'grid',
  'hidden',
  'inherit',
  'initial',
  'inline',
  'inline-block',
  'inline-flex',
  'italic',
  'left',
  'linear',
  'none',
  'normal',
  'nowrap',
  'pointer',
  'relative',
  'right',
  'row',
  'scroll',
  'solid',
  'space-around',
  'space-between',
  'space-evenly',
  'sticky',
  'stretch',
  'transparent',
  'unset',
  'visible',
  'wrap',
]);

function pushToken(
  tokens: SyntaxToken[],
  start: number,
  end: number,
  type: SyntaxTokenType
) {
  if (end <= start) return;
  const last = tokens[tokens.length - 1];
  if (last && start < last.end) return;
  tokens.push({start, end, type});
}

function isIdentStart(ch: string): boolean {
  return /[a-zA-Z_$]/.test(ch);
}

function isIdentChar(ch: string): boolean {
  return /[a-zA-Z0-9_$]/.test(ch);
}

function skipQuoted(code: string, start: number, quote: string): number {
  let i = start + 1;
  while (i < code.length) {
    const ch = code[i];
    if (ch === '\\') {
      i += 2;
      continue;
    }
    if (ch === quote) {
      return i + 1;
    }
    if (ch === '\n' && quote !== '`') {
      return i;
    }
    i += 1;
  }
  return code.length;
}

function tokenizeJs(code: string, baseOffset = 0): SyntaxToken[] {
  const tokens: SyntaxToken[] = [];
  let i = 0;
  let prevSignificant = '';
  let expectDeclName: 'fn' | 'type' | null = null;

  const emit = (s: number, e: number, type: SyntaxTokenType) => {
    pushToken(tokens, baseOffset + s, baseOffset + e, type);
  };

  while (i < code.length) {
    const ch = code[i];

    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      i += 1;
      continue;
    }

    // Line comment
    if (ch === '/' && code[i + 1] === '/') {
      const nl = code.indexOf('\n', i + 2);
      const end = nl === -1 ? code.length : nl;
      emit(i, end, 'comment');
      i = end;
      continue;
    }

    // Block comment
    if (ch === '/' && code[i + 1] === '*') {
      const close = code.indexOf('*/', i + 2);
      const end = close === -1 ? code.length : close + 2;
      emit(i, end, 'comment');
      i = end;
      continue;
    }

    // Strings
    if (ch === '"' || ch === "'") {
      const end = skipQuoted(code, i, ch);
      emit(i, end, 'string');
      i = end;
      prevSignificant = 'string';
      expectDeclName = null;
      continue;
    }

    // Template literal
    if (ch === '`') {
      let j = i + 1;
      let segStart = i;
      while (j < code.length) {
        if (code[j] === '\\') {
          j += 2;
          continue;
        }
        if (code[j] === '$' && code[j + 1] === '{') {
          emit(segStart, j, 'string');
          emit(j, j + 2, 'keyword');
          j += 2;
          const exprStart = j;
          let depth = 1;
          while (j < code.length && depth > 0) {
            const inner = code[j];
            if (inner === '"' || inner === "'" || inner === '`') {
              j = skipQuoted(code, j, inner);
              continue;
            }
            if (inner === '{') depth += 1;
            else if (inner === '}') depth -= 1;
            if (depth > 0) j += 1;
          }
          const subTokens = tokenizeJs(
            code.slice(exprStart, j),
            baseOffset + exprStart
          );
          for (const st of subTokens) {
            tokens.push(st);
          }
          if (j < code.length && code[j] === '}') {
            emit(j, j + 1, 'keyword');
            j += 1;
          }
          segStart = j;
          continue;
        }
        if (code[j] === '`') {
          j += 1;
          break;
        }
        j += 1;
      }
      emit(segStart, j, 'string');
      i = j;
      prevSignificant = 'string';
      expectDeclName = null;
      continue;
    }

    // Regex literal heuristic
    if (
      ch === '/' &&
      code[i + 1] !== '/' &&
      code[i + 1] !== '*' &&
      (prevSignificant === '' ||
        '=([,:!&|?{};+-*%^~<>'.includes(prevSignificant) ||
        prevSignificant === 'return' ||
        prevSignificant === 'typeof')
    ) {
      let j = i + 1;
      let inClass = false;
      let closed = false;
      while (j < code.length) {
        const c = code[j];
        if (c === '\n') break;
        if (c === '\\') {
          j += 2;
          continue;
        }
        if (c === '[') inClass = true;
        else if (c === ']') inClass = false;
        else if (c === '/' && !inClass) {
          j += 1;
          while (j < code.length && /[gimsuy]/.test(code[j])) j += 1;
          closed = true;
          break;
        }
        j += 1;
      }
      if (closed) {
        emit(i, j, 'string');
        i = j;
        prevSignificant = 'regex';
        expectDeclName = null;
        continue;
      }
    }

    // Numbers
    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(code[i + 1] ?? ''))) {
      let j = i;
      if (code[j] === '0' && (code[j + 1] === 'x' || code[j + 1] === 'X')) {
        j += 2;
        while (j < code.length && /[0-9a-fA-F_]/.test(code[j])) j += 1;
      } else {
        while (j < code.length && /[0-9_]/.test(code[j])) j += 1;
        if (code[j] === '.' && /[0-9]/.test(code[j + 1] ?? '')) {
          j += 1;
          while (j < code.length && /[0-9_]/.test(code[j])) j += 1;
        }
        if (code[j] === 'e' || code[j] === 'E') {
          j += 1;
          if (code[j] === '+' || code[j] === '-') j += 1;
          while (j < code.length && /[0-9_]/.test(code[j])) j += 1;
        }
      }
      emit(i, j, 'number');
      i = j;
      prevSignificant = 'number';
      expectDeclName = null;
      continue;
    }

    // Identifiers & keywords
    if (isIdentStart(ch)) {
      let j = i + 1;
      while (j < code.length && isIdentChar(code[j])) j += 1;
      const word = code.slice(i, j);

      let k = j;
      while (k < code.length && (code[k] === ' ' || code[k] === '\t')) k += 1;
      const followedByParen = code[k] === '(';

      if (expectDeclName) {
        emit(i, j, expectDeclName);
        expectDeclName = null;
      } else if (prevSignificant === '.') {
        emit(i, j, followedByParen ? 'fn' : 'prop');
      } else if (JS_KEYWORDS.has(word)) {
        emit(i, j, 'keyword');
        if (word === 'function') expectDeclName = 'fn';
        else if (word === 'class') expectDeclName = 'type';
      } else if (JS_CONSTANTS.has(word)) {
        emit(i, j, 'number');
      } else if (JS_GLOBALS.has(word)) {
        emit(i, j, followedByParen ? 'fn' : 'type');
      } else if (followedByParen) {
        emit(i, j, 'fn');
      } else if (/^[A-Z][a-zA-Z0-9_]*$/.test(word)) {
        emit(i, j, 'type');
      }

      i = j;
      prevSignificant = word;
      continue;
    }

    // Multi-char operators
    if (
      code.startsWith('===', i) ||
      code.startsWith('!==', i) ||
      code.startsWith('...', i)
    ) {
      emit(i, i + 3, code[i] === '.' ? 'punctuation' : 'operator');
      prevSignificant = code.slice(i, i + 3);
      i += 3;
      expectDeclName = null;
      continue;
    }

    if (
      code.startsWith('=>', i) ||
      code.startsWith('==', i) ||
      code.startsWith('!=', i) ||
      code.startsWith('<=', i) ||
      code.startsWith('>=', i) ||
      code.startsWith('&&', i) ||
      code.startsWith('||', i) ||
      code.startsWith('??', i) ||
      code.startsWith('?.', i) ||
      code.startsWith('++', i) ||
      code.startsWith('--', i)
    ) {
      emit(i, i + 2, code[i] === '?' && code[i + 1] === '.' ? 'punctuation' : 'operator');
      prevSignificant = code[i + 1] === '.' ? '.' : code.slice(i, i + 2);
      i += 2;
      expectDeclName = null;
      continue;
    }

    if ('=+-*/%<>!&|^~?:'.includes(ch)) {
      emit(i, i + 1, 'operator');
      prevSignificant = ch;
      i += 1;
      expectDeclName = null;
      continue;
    }

    if ('{}()[];,.'.includes(ch)) {
      emit(i, i + 1, 'punctuation');
      prevSignificant = ch;
      i += 1;
      expectDeclName = null;
      continue;
    }

    i += 1;
  }

  return tokens;
}

function tokenizeCss(code: string, baseOffset = 0): SyntaxToken[] {
  const tokens: SyntaxToken[] = [];
  let i = 0;
  let braceDepth = 0;
  let inValue = false;

  const emit = (s: number, e: number, type: SyntaxTokenType) => {
    pushToken(tokens, baseOffset + s, baseOffset + e, type);
  };

  while (i < code.length) {
    const ch = code[i];

    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      i += 1;
      continue;
    }

    // Comment
    if (ch === '/' && code[i + 1] === '*') {
      const close = code.indexOf('*/', i + 2);
      const end = close === -1 ? code.length : close + 2;
      emit(i, end, 'comment');
      i = end;
      continue;
    }

    // String
    if (ch === '"' || ch === "'") {
      const end = skipQuoted(code, i, ch);
      emit(i, end, 'string');
      i = end;
      continue;
    }

    if (ch === '{') {
      emit(i, i + 1, 'punctuation');
      braceDepth += 1;
      inValue = false;
      i += 1;
      continue;
    }

    if (ch === '}') {
      emit(i, i + 1, 'punctuation');
      braceDepth = Math.max(0, braceDepth - 1);
      inValue = false;
      i += 1;
      continue;
    }

    if (ch === ';') {
      emit(i, i + 1, 'punctuation');
      inValue = false;
      i += 1;
      continue;
    }

    // @at-rule
    if (ch === '@') {
      let j = i + 1;
      while (j < code.length && /[a-zA-Z0-9_-]/.test(code[j])) j += 1;
      emit(i, j, 'keyword');
      i = j;
      continue;
    }

    // !important
    if (ch === '!' && code.slice(i, i + 10).toLowerCase() === '!important') {
      emit(i, i + 10, 'keyword');
      i += 10;
      continue;
    }

    if (braceDepth === 0) {
      // Selectors
      if (ch === '.') {
        let j = i + 1;
        while (j < code.length && /[a-zA-Z0-9_-]/.test(code[j])) j += 1;
        emit(i, j, 'attr');
        i = j;
        continue;
      }
      if (ch === '#') {
        let j = i + 1;
        while (j < code.length && /[a-zA-Z0-9_-]/.test(code[j])) j += 1;
        emit(i, j, 'fn');
        i = j;
        continue;
      }
      if (ch === ':') {
        let j = i + 1;
        if (code[j] === ':') j += 1;
        while (j < code.length && /[a-zA-Z0-9_-]/.test(code[j])) j += 1;
        emit(i, j, 'keyword');
        i = j;
        continue;
      }
      if (/[a-zA-Z*]/.test(ch)) {
        let j = i + 1;
        while (j < code.length && /[a-zA-Z0-9_-]/.test(code[j])) j += 1;
        emit(i, j, 'tag');
        i = j;
        continue;
      }
      if ('[],()>=+~'.includes(ch)) {
        emit(i, i + 1, 'punctuation');
        i += 1;
        continue;
      }
    } else {
      // Inside rule block
      if (ch === ':' && !inValue) {
        emit(i, i + 1, 'punctuation');
        inValue = true;
        i += 1;
        continue;
      }

      if (!inValue) {
        // Property name or custom property
        if (/[a-zA-Z-]/.test(ch)) {
          let j = i + 1;
          while (j < code.length && /[a-zA-Z0-9_-]/.test(code[j])) j += 1;
          const prop = code.slice(i, j);
          emit(i, j, prop.startsWith('--') ? 'attr' : 'prop');
          i = j;
          continue;
        }
      } else {
        // Property value
        if (ch === '#' && /[0-9a-fA-F]/.test(code[i + 1] ?? '')) {
          let j = i + 1;
          while (j < code.length && /[0-9a-fA-F]/.test(code[j])) j += 1;
          emit(i, j, 'number');
          i = j;
          continue;
        }
        if (
          /[0-9]/.test(ch) ||
          ((ch === '-' || ch === '.') && /[0-9]/.test(code[i + 1] ?? ''))
        ) {
          let j = i + 1;
          while (j < code.length && /[0-9.]/.test(code[j])) j += 1;
          while (j < code.length && /[a-zA-Z%]/.test(code[j])) j += 1;
          emit(i, j, 'number');
          i = j;
          continue;
        }
        if (/[a-zA-Z_-]/.test(ch)) {
          let j = i + 1;
          while (j < code.length && /[a-zA-Z0-9_-]/.test(code[j])) j += 1;
          const word = code.slice(i, j);
          if (code[j] === '(') {
            emit(i, j, 'fn');
          } else if (word.startsWith('--')) {
            emit(i, j, 'attr');
          } else if (CSS_VALUE_KEYWORDS.has(word)) {
            emit(i, j, 'attr');
          }
          i = j;
          continue;
        }
        if ('(),/+-*'.includes(ch)) {
          emit(i, i + 1, ch === ',' || ch === '(' || ch === ')' ? 'punctuation' : 'operator');
          i += 1;
          continue;
        }
      }
    }

    i += 1;
  }

  return tokens;
}

function tokenizeHtml(code: string): SyntaxToken[] {
  const tokens: SyntaxToken[] = [];
  let i = 0;

  while (i < code.length) {
    const lt = code.indexOf('<', i);
    if (lt === -1) break;

    // HTML comment
    if (code.startsWith('<!--', lt)) {
      const close = code.indexOf('-->', lt + 4);
      const end = close === -1 ? code.length : close + 3;
      pushToken(tokens, lt, end, 'comment');
      i = end;
      continue;
    }

    // DOCTYPE
    if (/^<!doctype/i.test(code.slice(lt, lt + 10))) {
      const gt = code.indexOf('>', lt);
      const end = gt === -1 ? code.length : gt + 1;
      pushToken(tokens, lt, end, 'keyword');
      i = end;
      continue;
    }

    // Tag open `<` or `</`
    const isClosing = code[lt + 1] === '/';
    const nameStart = lt + (isClosing ? 2 : 1);
    let nameEnd = nameStart;
    while (nameEnd < code.length && /[a-zA-Z0-9:-]/.test(code[nameEnd])) {
      nameEnd += 1;
    }

    if (nameEnd === nameStart) {
      i = lt + 1;
      continue;
    }

    pushToken(tokens, lt, nameStart, 'punctuation');
    const tagName = code.slice(nameStart, nameEnd);
    const lowerTag = tagName.toLowerCase();
    pushToken(tokens, nameStart, nameEnd, 'tag');

    let j = nameEnd;
    let selfClosing = false;
    while (j < code.length) {
      const ch = code[j];
      if (ch === '>') {
        if (j > 0 && code[j - 1] === '/') {
          selfClosing = true;
        }
        pushToken(tokens, j, j + 1, 'punctuation');
        j += 1;
        break;
      }
      if (ch === '/' && code[j + 1] === '>') {
        selfClosing = true;
        pushToken(tokens, j, j + 2, 'punctuation');
        j += 2;
        break;
      }
      if (ch === '"' || ch === "'") {
        const end = skipQuoted(code, j, ch);
        pushToken(tokens, j, end, 'string');
        j = end;
        continue;
      }
      if (ch === '=') {
        pushToken(tokens, j, j + 1, 'operator');
        j += 1;
        continue;
      }
      if (/[a-zA-Z_:@]/.test(ch)) {
        let attrEnd = j + 1;
        while (attrEnd < code.length && /[a-zA-Z0-9_.:-]/.test(code[attrEnd])) {
          attrEnd += 1;
        }
        pushToken(tokens, j, attrEnd, 'attr');
        j = attrEnd;
        continue;
      }
      j += 1;
    }

    // Embedded <style> or <script> blocks
    if (!isClosing && !selfClosing && (lowerTag === 'style' || lowerTag === 'script')) {
      const closePattern = new RegExp(`</${lowerTag}\\s*>`, 'i');
      const rest = code.slice(j);
      const match = closePattern.exec(rest);
      const contentEnd = match ? j + match.index : code.length;
      if (contentEnd > j) {
        const innerCode = code.slice(j, contentEnd);
        const subTokens =
          lowerTag === 'style'
            ? tokenizeCss(innerCode, j)
            : tokenizeJs(innerCode, j);
        for (const st of subTokens) {
          tokens.push(st);
        }
      }
      i = contentEnd;
      continue;
    }

    i = j;
  }

  return tokens;
}

export function tokenizeCode(code: string, tab: LanguageTab): SyntaxToken[] {
  if (!code) return [];
  switch (tab) {
    case 'html':
      return tokenizeHtml(code);
    case 'css':
      return tokenizeCss(code);
    case 'js':
      return tokenizeJs(code);
  }
}
