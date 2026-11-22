import {LanguageTab} from '../types/snippet';

export interface TextEditResult {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

const HTML_VOID_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

export function getIndentUnit(_tab: LanguageTab): string {
  return '  ';
}

function getLineIndentAtIndex(source: string, index: number): string {
  const lineStart = source.lastIndexOf('\n', index - 1) + 1;
  const match = source.slice(lineStart).match(/^[ ]*/);
  return match ? match[0] : '';
}

function findMatchingOpenerIndex(source: string, closePos: number, closeChar: string): number {
  const openMap: Record<string, string> = {'}': '{', ']': '[', ')': '('};
  const targetOpen = openMap[closeChar];
  if (!targetOpen) return -1;

  let depth = 0;
  for (let i = closePos - 1; i >= 0; i -= 1) {
    const ch = source[i];
    if (ch === closeChar) {
      depth += 1;
    } else if (ch === targetOpen) {
      if (depth === 0) return i;
      depth -= 1;
    }
  }
  return -1;
}

function findMatchingHtmlOpenerIndent(
  sourceBeforeLine: string,
  tagName: string
): string | null {
  const lowerTarget = tagName.toLowerCase();
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9-]*)(?:\s+(?:"[^"]*"|'[^']*'|[^>"'])*)?(\/?)>/g;
  const matches: {tag: string; isClosing: boolean; isSelfClosing: boolean; index: number}[] = [];

  let match: RegExpExecArray | null;
  while ((match = tagRegex.exec(sourceBeforeLine)) !== null) {
    const full = match[0];
    const tag = match[1].toLowerCase();
    if (tag !== lowerTarget) continue;
    const isClosing = full.startsWith('</');
    const isSelfClosing = match[2] === '/' || HTML_VOID_TAGS.has(tag);
    if (!isSelfClosing) {
      matches.push({tag, isClosing, isSelfClosing, index: match.index});
    }
  }

  let depth = 0;
  for (let i = matches.length - 1; i >= 0; i -= 1) {
    const item = matches[i];
    if (item.isClosing) {
      depth += 1;
    } else {
      if (depth === 0) {
        return getLineIndentAtIndex(sourceBeforeLine, item.index);
      }
      depth -= 1;
    }
  }
  return null;
}

export function applyTabIndent(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  tab: LanguageTab,
  shiftKey: boolean
): TextEditResult | null {
  const indentUnit = getIndentUnit(tab);
  const indentStep = indentUnit.length;

  // Single-cursor Tab inserts spaces at cursor
  if (!shiftKey && selectionStart === selectionEnd) {
    const updated = value.slice(0, selectionStart) + indentUnit + value.slice(selectionEnd);
    const nextPos = selectionStart + indentStep;
    return {
      value: updated,
      selectionStart: nextPos,
      selectionEnd: nextPos,
    };
  }

  const blockStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
  const effectiveEnd =
    selectionEnd > selectionStart && value[selectionEnd - 1] === '\n'
      ? selectionEnd - 1
      : selectionEnd;
  const nextNewline = value.indexOf('\n', effectiveEnd);
  const blockEnd = nextNewline === -1 ? value.length : nextNewline;
  const block = value.slice(blockStart, blockEnd);
  const lines = block.split('\n');

  if (shiftKey) {
    let removedFirst = 0;
    let totalRemoved = 0;
    const dedentedLines = lines.map((line, index) => {
      let removable = 0;
      if (line.startsWith('\t')) {
        removable = 1;
      } else {
        const spaceMatch = line.match(/^ +/);
        removable = Math.min(spaceMatch ? spaceMatch[0].length : 0, indentStep);
      }
      if (index === 0) removedFirst = removable;
      totalRemoved += removable;
      return line.slice(removable);
    });

    if (totalRemoved === 0) return null;

    const updatedBlock = dedentedLines.join('\n');
    const updated = value.slice(0, blockStart) + updatedBlock + value.slice(blockEnd);

    if (selectionStart === selectionEnd) {
      const nextPos = Math.max(blockStart, selectionStart - removedFirst);
      return {value: updated, selectionStart: nextPos, selectionEnd: nextPos};
    }

    const nextStart = Math.max(blockStart, selectionStart - removedFirst);
    const nextEnd = Math.max(nextStart, selectionEnd - totalRemoved);
    return {value: updated, selectionStart: nextStart, selectionEnd: nextEnd};
  }

  // Multi-line Tab indent
  let addedFirst = 0;
  let totalAdded = 0;
  const indentedLines = lines.map((line, index) => {
    if (lines.length > 1 && line.length === 0) {
      return line;
    }
    if (index === 0) addedFirst = indentStep;
    totalAdded += indentStep;
    return indentUnit + line;
  });

  if (totalAdded === 0) return null;

  const updatedBlock = indentedLines.join('\n');
  const updated = value.slice(0, blockStart) + updatedBlock + value.slice(blockEnd);
  return {
    value: updated,
    selectionStart: selectionStart + addedFirst,
    selectionEnd: selectionEnd + totalAdded,
  };
}

export function applyEnterAutoIndent(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  tab: LanguageTab
): TextEditResult | null {
  const indentUnit = getIndentUnit(tab);
  const indentStep = indentUnit.length;

  const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
  const beforeCursor = value.slice(lineStart, selectionStart);
  const nextNl = value.indexOf('\n', selectionEnd);
  const lineEnd = nextNl === -1 ? value.length : nextNl;
  const afterOnLine = value.slice(selectionEnd, lineEnd);

  const baseIndent = beforeCursor.match(/^[ ]*/)?.[0] ?? '';
  const trimmedBefore = beforeCursor.trimEnd();
  const trimmedAfter = afterOnLine.trimStart();

  // 1) Cursor between matching delimiter pair: {|} or [|] or (|)
  const pairClose: Record<string, string> = {'{': '}', '[': ']', '(': ')'};
  const lastCharBefore = trimmedBefore.slice(-1);
  const firstCharAfter = trimmedAfter.slice(0, 1);
  if (pairClose[lastCharBefore] && pairClose[lastCharBefore] === firstCharAfter) {
    const innerIndent = baseIndent + indentUnit;
    const afterTrimOffset = afterOnLine.length - trimmedAfter.length;
    const insert = `\n${innerIndent}\n${baseIndent}`;
    const updated =
      value.slice(0, selectionStart) +
      insert +
      value.slice(selectionEnd + afterTrimOffset);
    const nextPos = selectionStart + 1 + innerIndent.length;
    return {value: updated, selectionStart: nextPos, selectionEnd: nextPos};
  }

  // 2) Cursor between opening & closing HTML tag: <div>|</div>
  if (tab === 'html') {
    const openMatch = trimmedBefore.match(/<([a-zA-Z][a-zA-Z0-9-]*)(?:\s[^>]*)?>$/);
    if (
      openMatch &&
      !trimmedBefore.endsWith('/>') &&
      !HTML_VOID_TAGS.has(openMatch[1].toLowerCase())
    ) {
      const tagName = openMatch[1];
      const closeMatch = trimmedAfter.match(/^<\/([a-zA-Z][a-zA-Z0-9-]*)\s*>/);
      if (closeMatch && closeMatch[1].toLowerCase() === tagName.toLowerCase()) {
        const innerIndent = baseIndent + indentUnit;
        const afterTrimOffset = afterOnLine.length - trimmedAfter.length;
        const insert = `\n${innerIndent}\n${baseIndent}`;
        const updated =
          value.slice(0, selectionStart) +
          insert +
          value.slice(selectionEnd + afterTrimOffset);
        const nextPos = selectionStart + 1 + innerIndent.length;
        return {value: updated, selectionStart: nextPos, selectionEnd: nextPos};
      }
    }
  }

  // 3) Compute automatic next-line indentation
  let nextIndent = baseIndent;

  if (tab === 'js' || tab === 'css') {
    const beforeComment =
      tab === 'js'
        ? beforeCursor.replace(/\/\/.*$/, '').trimEnd()
        : beforeCursor.replace(/\/\*[\s\S]*?\*\//g, '').trimEnd();
    if (
      beforeComment.endsWith('{') ||
      beforeComment.endsWith('[') ||
      beforeComment.endsWith('(')
    ) {
      nextIndent = baseIndent + indentUnit;
    }
  } else if (tab === 'html') {
    const openMatch = trimmedBefore.match(/<([a-zA-Z][a-zA-Z0-9-]*)(?:\s[^>]*)?>$/);
    if (
      openMatch &&
      !trimmedBefore.endsWith('/>') &&
      !HTML_VOID_TAGS.has(openMatch[1].toLowerCase())
    ) {
      nextIndent = baseIndent + indentUnit;
    }
  }

  if (!nextIndent && baseIndent === '') {
    return null;
  }

  const updated = value.slice(0, selectionStart) + '\n' + nextIndent + value.slice(selectionEnd);
  const nextPos = selectionStart + 1 + nextIndent.length;
  return {value: updated, selectionStart: nextPos, selectionEnd: nextPos};
}

export function applyElectricIndent(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  key: string,
  tab: LanguageTab
): TextEditResult | null {
  if (selectionStart !== selectionEnd) return null;

  const indentStep = getIndentUnit(tab).length;
  const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
  const beforeCursor = value.slice(lineStart, selectionStart);

  // 1) Closing delimiter on an indentation-only line: }, ], )
  if (key === '}' || key === ']' || key === ')') {
    if (!/^[ ]+$/.test(beforeCursor)) return null;

    const openerIdx = findMatchingOpenerIndex(value, lineStart, key);
    const targetIndent =
      openerIdx !== -1
        ? getLineIndentAtIndex(value, openerIdx)
        : beforeCursor.slice(0, Math.max(0, beforeCursor.length - indentStep));

    if (targetIndent.length >= beforeCursor.length) return null;

    const updated = value.slice(0, lineStart) + targetIndent + key + value.slice(selectionEnd);
    const nextPos = lineStart + targetIndent.length + 1;
    return {value: updated, selectionStart: nextPos, selectionEnd: nextPos};
  }

  // 2) Closing HTML tag `</tag>` when typing `>`
  if (tab === 'html' && key === '>') {
    const closeMatch = beforeCursor.match(/^([ ]+)<\/([a-zA-Z][a-zA-Z0-9-]*)$/);
    if (!closeMatch) return null;

    const currentIndent = closeMatch[1];
    const tagName = closeMatch[2];
    const openerIndent = findMatchingHtmlOpenerIndent(value.slice(0, lineStart), tagName);
    const targetIndent =
      openerIndent !== null
        ? openerIndent
        : currentIndent.slice(0, Math.max(0, currentIndent.length - indentStep));

    if (targetIndent.length >= currentIndent.length) return null;

    const replacement = `${targetIndent}</${tagName}>`;
    const updated = value.slice(0, lineStart) + replacement + value.slice(selectionEnd);
    const nextPos = lineStart + replacement.length;
    return {value: updated, selectionStart: nextPos, selectionEnd: nextPos};
  }

  return null;
}
