import {LanguageTab, WebTab} from '../types/snippet';

export interface CodeDiagnostic {
  id: string;
  tab: LanguageTab;
  line: number;
  severity: 'error' | 'warning';
  message: string;
}

const HTML_TAGS = new Set([
  'a', 'abbr', 'address', 'area', 'article', 'aside', 'audio', 'b', 'base', 'bdi', 'bdo',
  'blockquote', 'body', 'br', 'button', 'canvas', 'caption', 'cite', 'code', 'col',
  'colgroup', 'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'div', 'dl',
  'dt', 'em', 'embed', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2',
  'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hgroup', 'hr', 'html', 'i', 'iframe', 'img',
  'input', 'ins', 'kbd', 'label', 'legend', 'li', 'link', 'main', 'map', 'mark', 'menu',
  'meta', 'meter', 'nav', 'noscript', 'object', 'ol', 'optgroup', 'option', 'output', 'p',
  'param', 'picture', 'pre', 'progress', 'q', 'rp', 'rt', 'ruby', 's', 'samp', 'script',
  'search', 'section', 'select', 'slot', 'small', 'source', 'span', 'strong', 'style',
  'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th',
  'thead', 'time', 'title', 'tr', 'track', 'u', 'ul', 'var', 'video', 'wbr',
  // Common SVG tags
  'svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse', 'g', 'defs',
  'lineargradient', 'radialgradient', 'stop', 'text', 'tspan', 'use', 'symbol', 'clippath',
  'mask', 'pattern', 'foreignobject',
]);

const HTML_VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param',
  'source', 'track', 'wbr',
]);

const CSS_PROPERTIES = new Set([
  'accent-color', 'align-content', 'align-items', 'align-self', 'all', 'animation',
  'animation-delay', 'animation-direction', 'animation-duration', 'animation-fill-mode',
  'animation-iteration-count', 'animation-name', 'animation-play-state',
  'animation-timing-function', 'appearance', 'aspect-ratio', 'backdrop-filter',
  'backface-visibility', 'background', 'background-attachment', 'background-blend-mode',
  'background-clip', 'background-color', 'background-image', 'background-origin',
  'background-position', 'background-position-x', 'background-position-y',
  'background-repeat', 'background-size', 'block-size', 'border', 'border-block',
  'border-block-color', 'border-block-end', 'border-block-start', 'border-block-style',
  'border-block-width', 'border-bottom', 'border-bottom-color',
  'border-bottom-left-radius', 'border-bottom-right-radius', 'border-bottom-style',
  'border-bottom-width', 'border-collapse', 'border-color', 'border-end-end-radius',
  'border-end-start-radius', 'border-image', 'border-inline', 'border-inline-color',
  'border-inline-end', 'border-inline-start', 'border-inline-style',
  'border-inline-width', 'border-left', 'border-left-color', 'border-left-style',
  'border-left-width', 'border-radius', 'border-right', 'border-right-color',
  'border-right-style', 'border-right-width', 'border-spacing', 'border-start-end-radius',
  'border-start-start-radius', 'border-style', 'border-top', 'border-top-color',
  'border-top-left-radius', 'border-top-right-radius', 'border-top-style',
  'border-top-width', 'border-width', 'bottom', 'box-decoration-break', 'box-shadow',
  'box-sizing', 'break-after', 'break-before', 'break-inside', 'caption-side',
  'caret-color', 'clear', 'clip', 'clip-path', 'color', 'color-scheme', 'column-count',
  'column-fill', 'column-gap', 'column-rule', 'column-rule-color', 'column-rule-style',
  'column-rule-width', 'column-span', 'column-width', 'columns', 'contain',
  'container', 'container-name', 'container-type', 'content', 'counter-increment',
  'counter-reset', 'counter-set', 'cursor', 'direction', 'display', 'empty-cells',
  'fill', 'fill-opacity', 'fill-rule', 'filter', 'flex', 'flex-basis', 'flex-direction',
  'flex-flow', 'flex-grow', 'flex-shrink', 'flex-wrap', 'float', 'font', 'font-family',
  'font-feature-settings', 'font-kerning', 'font-optical-sizing', 'font-size',
  'font-size-adjust', 'font-stretch', 'font-style', 'font-variant',
  'font-variant-caps', 'font-variant-numeric', 'font-variation-settings', 'font-weight',
  'gap', 'grid', 'grid-area', 'grid-auto-columns', 'grid-auto-flow', 'grid-auto-rows',
  'grid-column', 'grid-column-end', 'grid-column-gap', 'grid-column-start', 'grid-gap',
  'grid-row', 'grid-row-end', 'grid-row-gap', 'grid-row-start', 'grid-template',
  'grid-template-areas', 'grid-template-columns', 'grid-template-rows', 'height',
  'hyphens', 'image-rendering', 'inline-size', 'inset', 'inset-block',
  'inset-block-end', 'inset-block-start', 'inset-inline', 'inset-inline-end',
  'inset-inline-start', 'isolation', 'justify-content', 'justify-items', 'justify-self',
  'left', 'letter-spacing', 'line-break', 'line-height', 'list-style',
  'list-style-image', 'list-style-position', 'list-style-type', 'margin', 'margin-block',
  'margin-block-end', 'margin-block-start', 'margin-bottom', 'margin-inline',
  'margin-inline-end', 'margin-inline-start', 'margin-left', 'margin-right',
  'margin-top', 'mask', 'mask-image', 'mask-position', 'mask-repeat', 'mask-size',
  'max-block-size', 'max-height', 'max-inline-size', 'max-width', 'min-block-size',
  'min-height', 'min-inline-size', 'min-width', 'mix-blend-mode', 'object-fit',
  'object-position', 'opacity', 'order', 'orphans', 'outline', 'outline-color',
  'outline-offset', 'outline-style', 'outline-width', 'overflow', 'overflow-anchor',
  'overflow-wrap', 'overflow-x', 'overflow-y', 'overscroll-behavior',
  'overscroll-behavior-x', 'overscroll-behavior-y', 'padding', 'padding-block',
  'padding-block-end', 'padding-block-start', 'padding-bottom', 'padding-inline',
  'padding-inline-end', 'padding-inline-start', 'padding-left', 'padding-right',
  'padding-top', 'page-break-after', 'page-break-before', 'page-break-inside',
  'perspective', 'perspective-origin', 'place-content', 'place-items', 'place-self',
  'pointer-events', 'position', 'quotes', 'resize', 'right', 'rotate', 'row-gap',
  'scale', 'scroll-behavior', 'scroll-margin', 'scroll-margin-top', 'scroll-padding',
  'scroll-padding-top', 'scroll-snap-align', 'scroll-snap-stop', 'scroll-snap-type',
  'scrollbar-color', 'scrollbar-gutter', 'scrollbar-width', 'shape-outside', 'src',
  'stroke', 'stroke-dasharray', 'stroke-dashoffset', 'stroke-linecap',
  'stroke-linejoin', 'stroke-opacity', 'stroke-width', 'tab-size', 'table-layout',
  'text-align', 'text-align-last', 'text-decoration', 'text-decoration-color',
  'text-decoration-line', 'text-decoration-style', 'text-decoration-thickness',
  'text-indent', 'text-justify', 'text-overflow', 'text-rendering', 'text-shadow',
  'text-transform', 'text-underline-offset', 'text-wrap', 'top', 'touch-action',
  'transform', 'transform-origin', 'transform-style', 'transition', 'transition-delay',
  'transition-duration', 'transition-property', 'transition-timing-function',
  'translate', 'unicode-bidi', 'user-select', 'vertical-align', 'visibility',
  'white-space', 'widows', 'width', 'will-change', 'word-break', 'word-spacing',
  'word-wrap', 'writing-mode', 'z-index', 'zoom',
  'font-display', 'unicode-range', 'line-clamp', 'field-sizing',
  'scroll-margin-bottom', 'scroll-margin-left', 'scroll-margin-right',
  'scroll-padding-bottom', 'scroll-padding-left', 'scroll-padding-right',
]);

const CSS_AT_RULES = new Set([
  'charset', 'container', 'font-face', 'import', 'keyframes', 'layer', 'media',
  'namespace', 'page', 'property', 'starting-style', 'supports', 'webkit-keyframes',
]);

const JS_KEYWORDS = new Set([
  'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
  'default', 'delete', 'do', 'else', 'export', 'extends', 'false', 'finally', 'for',
  'from', 'function', 'if', 'import', 'in', 'instanceof', 'let', 'new', 'null', 'of',
  'return', 'static', 'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof',
  'undefined', 'var', 'void', 'while', 'with', 'yield', 'as', 'get', 'set',
]);

const JS_GLOBALS = new Set([
  'AbortController', 'AbortSignal', 'Array', 'Audio', 'BigInt', 'Blob', 'Boolean',
  'CanvasRenderingContext2D', 'CustomEvent', 'DOMParser', 'Date', 'Document',
  'DocumentFragment', 'Element', 'Error', 'EvalError', 'Event', 'EventTarget', 'File',
  'FileReader', 'FormData', 'Function', 'HTMLElement', 'Headers', 'Image', 'Infinity',
  'IntersectionObserver', 'Intl', 'JSON', 'KeyboardEvent', 'Map', 'Math', 'MouseEvent',
  'MutationObserver', 'NaN', 'Node', 'NodeList', 'Number', 'Object', 'PointerEvent',
  'Promise', 'Proxy', 'RangeError', 'Reflect', 'RegExp', 'Request', 'Response',
  'ResizeObserver', 'Set', 'String', 'Symbol', 'SyntaxError', 'TouchEvent', 'TypeError',
  'URL', 'URLSearchParams', 'WeakMap', 'WeakSet', 'WebSocket', 'Worker', 'XMLHttpRequest',
  'alert', 'arguments', 'atob', 'btoa', 'cancelAnimationFrame', 'clearInterval',
  'clearTimeout', 'confirm', 'console', 'crypto', 'decodeURI', 'decodeURIComponent',
  'document', 'encodeURI', 'encodeURIComponent', 'eval', 'fetch', 'getComputedStyle',
  'globalThis', 'history', 'isFinite', 'isNaN', 'localStorage', 'location', 'matchMedia',
  'navigator', 'parseFloat', 'parseInt', 'performance', 'prompt', 'queueMicrotask',
  'requestAnimationFrame', 'screen', 'scrollBy', 'scrollTo', 'self', 'sessionStorage',
  'setInterval', 'setTimeout', 'structuredClone', 'undefined', 'window',
  'AudioContext', 'webkitAudioContext', 'SVGElement', 'HTMLInputElement',
  'HTMLCanvasElement', 'Notification', 'speechSynthesis', 'indexedDB', 'caches',
  'innerWidth', 'innerHeight', 'outerWidth', 'outerHeight', 'scrollX', 'scrollY',
  'pageXOffset', 'pageYOffset', 'devicePixelRatio',
]);

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 2) return 99;
  const dp: number[] = Array.from({length: b.length + 1}, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const temp = dp[j];
      if (a[i - 1] === b[j - 1]) {
        dp[j] = prev;
      } else {
        dp[j] = Math.min(prev, dp[j], dp[j - 1]) + 1;
      }
      prev = temp;
    }
  }
  return dp[b.length];
}

function findClosestMatch(target: string, candidates: Iterable<string>): string | null {
  const lower = target.toLowerCase();
  let best: string | null = null;
  let bestDist = 3;
  for (const candidate of candidates) {
    const dist = levenshtein(lower, candidate.toLowerCase());
    if (dist > 0 && dist < bestDist) {
      bestDist = dist;
      best = candidate;
    }
  }
  return best;
}

function lineNumberAt(source: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < source.length; i += 1) {
    if (source[i] === '\n') line += 1;
  }
  return line;
}

function maskPreservingNewlines(text: string): string {
  return text.replace(/[^\n]/g, ' ');
}

export function extractHtmlIds(html: string): Set<string> {
  const ids = new Set<string>();
  const cleaned = html.replace(/<!--[\s\S]*?-->/g, '');
  const idRegex = /\bid\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/gi;
  let match: RegExpExecArray | null;
  while ((match = idRegex.exec(cleaned)) !== null) {
    const value = (match[1] ?? match[2] ?? match[3] ?? '').trim();
    if (value) ids.add(value);
  }
  return ids;
}

export function validateHtml(html: string): CodeDiagnostic[] {
  const diagnostics: CodeDiagnostic[] = [];
  if (!html.trim()) return diagnostics;

  // Mask comments, <script>...</script>, and <style>...</style> contents while preserving line numbers
  let masked = html.replace(/<!--[\s\S]*?-->/g, maskPreservingNewlines);
  masked = masked.replace(
    /(<(script|style)\b[^>]*>)([\s\S]*?)(<\/\2\s*>)/gi,
    (_, open: string, _tag: string, inner: string, close: string) =>
      open + maskPreservingNewlines(inner) + close
  );

  // Check unclosed '<' before EOF or nested '<'
  const stack: {tag: string; line: number}[] = [];
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9-]*)(?:\s+(?:"[^"]*"|'[^']*'|[^>"'])*)?(\/?)>/g;

  let match: RegExpExecArray | null;
  while ((match = tagRegex.exec(masked)) !== null) {
    const full = match[0];
    const rawTag = match[1];
    const tag = rawTag.toLowerCase();
    const isClosing = full.startsWith('</');
    const isSelfClosing = match[2] === '/' || HTML_VOID_TAGS.has(tag);
    const line = lineNumberAt(masked, match.index);

    const isCustomElement = tag.includes('-');
    if (!isCustomElement && !HTML_TAGS.has(tag)) {
      const suggestion = findClosestMatch(tag, HTML_TAGS);
      diagnostics.push({
        id: `html-unknown-${line}-${tag}`,
        tab: 'html',
        line,
        severity: 'warning',
        message: suggestion
          ? `Tag <${rawTag}> não existe em HTML. Você quis dizer <${suggestion}>?`
          : `Tag <${rawTag}> não existe em HTML.`,
      });
      continue;
    }

    if (isClosing) {
      if (HTML_VOID_TAGS.has(tag)) {
        diagnostics.push({
          id: `html-void-close-${line}-${tag}`,
          tab: 'html',
          line,
          severity: 'warning',
          message: `A tag <${rawTag}> não precisa de fechamento </${rawTag}>.`,
        });
        continue;
      }
      const lastIndex = [...stack].reverse().findIndex((item) => item.tag === tag);
      if (lastIndex === -1) {
        diagnostics.push({
          id: `html-stray-close-${line}-${tag}`,
          tab: 'html',
          line,
          severity: 'error',
          message: `Fechamento </${rawTag}> sem uma tag <${rawTag}> aberta correspondente.`,
        });
      } else {
        const realIndex = stack.length - 1 - lastIndex;
        const unclosedBetween = stack.slice(realIndex + 1);
        for (const orphan of unclosedBetween) {
          diagnostics.push({
            id: `html-unclosed-${orphan.line}-${orphan.tag}`,
            tab: 'html',
            line: orphan.line,
            severity: 'error',
            message: `Tag <${orphan.tag}> aberta na linha ${orphan.line} não foi fechada antes de </${rawTag}>.`,
          });
        }
        stack.splice(realIndex);
      }
    } else if (!isSelfClosing) {
      stack.push({tag, line});
    }
  }

  for (const unclosed of stack) {
    diagnostics.push({
      id: `html-eof-unclosed-${unclosed.line}-${unclosed.tag}`,
      tab: 'html',
      line: unclosed.line,
      severity: 'error',
      message: `Tag <${unclosed.tag}> não foi fechada.`,
    });
  }

  return diagnostics;
}

export function validateCss(css: string): CodeDiagnostic[] {
  const diagnostics: CodeDiagnostic[] = [];
  if (!css.trim()) return diagnostics;

  // Check unclosed block comments
  const openComments = (css.match(/\/\*/g) || []).length;
  const closeComments = (css.match(/\*\//g) || []).length;
  if (openComments > closeComments) {
    const idx = css.lastIndexOf('/*');
    const line = lineNumberAt(css, idx);
    diagnostics.push({
      id: `css-unclosed-comment-${line}`,
      tab: 'css',
      line,
      severity: 'error',
      message: 'Comentário /* não foi fechado com */.',
    });
  }

  // Strip comments and quoted strings while keeping newlines for accurate line numbers
  let masked = css.replace(/\/\*[\s\S]*?\*\//g, maskPreservingNewlines);
  masked = masked.replace(/"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/g, maskPreservingNewlines);

  // Validate @at-rules
  const atRuleRegex = /@([a-zA-Z-]+)/g;
  let atMatch: RegExpExecArray | null;
  while ((atMatch = atRuleRegex.exec(masked)) !== null) {
    const ruleName = atMatch[1].toLowerCase();
    if (!CSS_AT_RULES.has(ruleName)) {
      const line = lineNumberAt(masked, atMatch.index);
      const suggestion = findClosestMatch(ruleName, CSS_AT_RULES);
      diagnostics.push({
        id: `css-atrule-${line}-${ruleName}`,
        tab: 'css',
        line,
        severity: 'warning',
        message: suggestion
          ? `Regra @${atMatch[1]} não existe em CSS. Você quis dizer @${suggestion}?`
          : `Regra @${atMatch[1]} não existe em CSS.`,
      });
    }
  }

  // Track brace depth & validate declarations inside blocks
  const braceStack: number[] = [];
  let inAtRuleHeader = false;
  let currentToken = '';
  let tokenStart = 0;

  // Simple block parser: find every `{ ... }` declaration block
  for (let i = 0; i < masked.length; i += 1) {
    const ch = masked[i];
    if (ch === '{') {
      braceStack.push(i);
      inAtRuleHeader = false;
      currentToken = '';
      tokenStart = i + 1;
    } else if (ch === '}') {
      if (braceStack.length === 0) {
        const line = lineNumberAt(masked, i);
        diagnostics.push({
          id: `css-stray-brace-${line}-${i}`,
          tab: 'css',
          line,
          severity: 'error',
          message: 'Chave "}" sobrando sem abertura "{" correspondente.',
        });
      } else {
        const blockStart = braceStack.pop()!;
        // Only check declarations inside innermost style blocks (or blocks without nested '{')
        const blockContent = masked.slice(blockStart + 1, i);
        if (!blockContent.includes('{')) {
          const declarations = blockContent.split(';');
          let offset = blockStart + 1;
          for (const decl of declarations) {
            const trimmed = decl.trim();
            if (trimmed) {
              const colonIdx = decl.indexOf(':');
              if (colonIdx === -1) {
                const line = lineNumberAt(masked, offset + decl.search(/\S/));
                diagnostics.push({
                  id: `css-missing-colon-${line}-${offset}`,
                  tab: 'css',
                  line,
                  severity: 'error',
                  message: `Declaração CSS inválida "${trimmed.slice(0, 32)}" (faltando ":").`,
                });
              } else {
                const propRaw = decl.slice(0, colonIdx).trim();
                const valueRaw = decl.slice(colonIdx + 1).trim();
                const propLine = lineNumberAt(masked, offset + decl.search(/\S/));

                if (!valueRaw) {
                  diagnostics.push({
                    id: `css-empty-val-${propLine}-${propRaw}`,
                    tab: 'css',
                    line: propLine,
                    severity: 'warning',
                    message: `A propriedade "${propRaw}" está sem valor após ":".`,
                  });
                }

                if (
                  propRaw &&
                  !propRaw.startsWith('--') &&
                  !propRaw.startsWith('-webkit-') &&
                  !propRaw.startsWith('-moz-') &&
                  !propRaw.startsWith('-ms-')
                ) {
                  const lowerProp = propRaw.toLowerCase();
                  if (!CSS_PROPERTIES.has(lowerProp)) {
                    const suggestion = findClosestMatch(lowerProp, CSS_PROPERTIES);
                    diagnostics.push({
                      id: `css-prop-${propLine}-${lowerProp}`,
                      tab: 'css',
                      line: propLine,
                      severity: 'warning',
                      message: suggestion
                        ? `Propriedade CSS "${propRaw}" não existe. Você quis dizer "${suggestion}"?`
                        : `Propriedade CSS "${propRaw}" não existe.`,
                    });
                  }
                }
              }
            }
            offset += decl.length + 1;
          }
        }
      }
      currentToken = '';
      tokenStart = i + 1;
    } else if (ch === '@' && braceStack.length === 0) {
      inAtRuleHeader = true;
    } else if (ch === ';' && braceStack.length === 0) {
      inAtRuleHeader = false;
      currentToken = '';
      tokenStart = i + 1;
    } else if (!inAtRuleHeader) {
      currentToken += ch;
    }
  }

  for (const unclosedIdx of braceStack) {
    const line = lineNumberAt(masked, unclosedIdx);
    diagnostics.push({
      id: `css-unclosed-brace-${line}-${unclosedIdx}`,
      tab: 'css',
      line,
      severity: 'error',
      message: 'Bloco CSS aberto com "{" não foi fechado com "}".',
    });
  }

  void currentToken;
  void tokenStart;
  return diagnostics;
}

function maskJsNonCode(js: string): {masked: string; unclosedError: CodeDiagnostic | null} {
  const out: string[] = [];
  let i = 0;
  let unclosedError: CodeDiagnostic | null = null;

  while (i < js.length) {
    const ch = js[i];
    const next = js[i + 1];

    // Line comment
    if (ch === '/' && next === '/') {
      while (i < js.length && js[i] !== '\n') {
        out.push(' ');
        i += 1;
      }
      continue;
    }

    // Block comment
    if (ch === '/' && next === '*') {
      const startLine = lineNumberAt(js, i);
      out.push(' ', ' ');
      i += 2;
      let closed = false;
      while (i < js.length) {
        if (js[i] === '*' && js[i + 1] === '/') {
          out.push(' ', ' ');
          i += 2;
          closed = true;
          break;
        }
        out.push(js[i] === '\n' ? '\n' : ' ');
        i += 1;
      }
      if (!closed && !unclosedError) {
        unclosedError = {
          id: `js-unclosed-comment-${startLine}`,
          tab: 'js',
          line: startLine,
          severity: 'error',
          message: 'Comentário /* não foi fechado com */.',
        };
      }
      continue;
    }

    // RegExp literal (/pattern/flags) heuristic based on preceding non-whitespace token
    if (ch === '/' && next !== '/' && next !== '*') {
      let prevIdx = out.length - 1;
      while (prevIdx >= 0 && (out[prevIdx] === ' ' || out[prevIdx] === '\t')) {
        prevIdx -= 1;
      }
      const prevChar = prevIdx >= 0 ? out[prevIdx] : '';
      let isRegexStart =
        prevIdx < 0 || '([,{:;=!&|?+-*%<>^~\n'.includes(prevChar);
      if (!isRegexStart && /[a-zA-Z_$]/.test(prevChar)) {
        let wordStart = prevIdx;
        while (wordStart > 0 && /[\w$]/.test(out[wordStart - 1])) {
          wordStart -= 1;
        }
        const prevWord = out.slice(wordStart, prevIdx + 1).join('');
        if (
          [
            'return', 'throw', 'case', 'typeof', 'void', 'delete',
            'await', 'yield', 'in', 'of', 'else', 'new',
          ].includes(prevWord)
        ) {
          isRegexStart = true;
        }
      }
      if (isRegexStart) {
        let scan = i + 1;
        let inClass = false;
        let closedRegex = false;
        while (scan < js.length && js[scan] !== '\n') {
          if (js[scan] === '\\') {
            scan += 2;
            continue;
          }
          if (js[scan] === '[') {
            inClass = true;
          } else if (js[scan] === ']' && inClass) {
            inClass = false;
          } else if (js[scan] === '/' && !inClass) {
            closedRegex = true;
            scan += 1;
            while (scan < js.length && /[a-z]/i.test(js[scan])) {
              scan += 1;
            }
            break;
          }
          scan += 1;
        }
        if (closedRegex) {
          for (let k = i; k < scan; k += 1) {
            out.push(' ');
          }
          i = scan;
          continue;
        }
      }
    }

    // Single or double quoted string
    if (ch === '"' || ch === "'") {
      const quote = ch;
      const startLine = lineNumberAt(js, i);
      out.push(' ');
      i += 1;
      let closed = false;
      while (i < js.length) {
        if (js[i] === '\\') {
          out.push(' ');
          i += 1;
          if (i < js.length) {
            out.push(js[i] === '\n' ? '\n' : ' ');
            i += 1;
          }
          continue;
        }
        if (js[i] === quote) {
          out.push(' ');
          i += 1;
          closed = true;
          break;
        }
        if (js[i] === '\n') {
          break;
        }
        out.push(' ');
        i += 1;
      }
      if (!closed && !unclosedError) {
        unclosedError = {
          id: `js-unclosed-string-${startLine}`,
          tab: 'js',
          line: startLine,
          severity: 'error',
          message: `Texto iniciado com ${quote} não foi fechado na linha ${startLine}.`,
        };
      }
      continue;
    }

    // Template literal (preserve ${...} expressions)
    if (ch === '`') {
      const startLine = lineNumberAt(js, i);
      out.push(' ');
      i += 1;
      let closed = false;
      while (i < js.length) {
        if (js[i] === '\\') {
          out.push(' ');
          i += 1;
          if (i < js.length) {
            out.push(js[i] === '\n' ? '\n' : ' ');
            i += 1;
          }
          continue;
        }
        if (js[i] === '`') {
          out.push(' ');
          i += 1;
          closed = true;
          break;
        }
        if (js[i] === '$' && js[i + 1] === '{') {
          out.push(' ', ' ');
          i += 2;
          let depth = 1;
          while (i < js.length && depth > 0) {
            if (js[i] === '{') depth += 1;
            else if (js[i] === '}') depth -= 1;
            if (depth > 0) {
              out.push(js[i]);
            } else {
              out.push(' ');
            }
            i += 1;
          }
          continue;
        }
        out.push(js[i] === '\n' ? '\n' : ' ');
        i += 1;
      }
      if (!closed && !unclosedError) {
        unclosedError = {
          id: `js-unclosed-template-${startLine}`,
          tab: 'js',
          line: startLine,
          severity: 'error',
          message: 'Template literal iniciado com ` não foi fechado.',
        };
      }
      continue;
    }

    out.push(ch);
    i += 1;
  }

  return {masked: out.join(''), unclosedError};
}

function extractParamIdentifiers(rawParams: string, declared: Set<string>): void {
  const cleaned = rawParams.replace(/[{}[\]]/g, ' ');
  for (const part of cleaned.split(',')) {
    const lhs = part.split('=')[0].trim();
    if (!lhs) continue;
    const colonParts = lhs.split(':');
    const candidate = (colonParts[1] ?? colonParts[0]).replace(/^\.\.\./, '').trim();
    if (/^[a-zA-Z_$][\w$]*$/.test(candidate)) {
      declared.add(candidate);
    }
  }
}

function collectDeclaredIdentifiers(maskedJs: string): Set<string> {
  const declared = new Set<string>();

  // var / let / const declarations (including simple destructuring)
  const varDeclRegex = /\b(?:const|let|var)\s+([a-zA-Z_$][\w$]*|\{[^}]+\}|\[[^\]]+\])/g;
  let match: RegExpExecArray | null;
  while ((match = varDeclRegex.exec(maskedJs)) !== null) {
    const target = match[1];
    if (target.startsWith('{') || target.startsWith('[')) {
      extractParamIdentifiers(target, declared);
    } else {
      declared.add(target);
    }
  }

  // Multi-variable comma declarations like let a = 1, b = 2;
  const multiVarRegex = /\b(?:const|let|var)\s+([^;\n]+)/g;
  while ((match = multiVarRegex.exec(maskedJs)) !== null) {
    const names = match[1].matchAll(/(?:^|,)\s*([a-zA-Z_$][\w$]*)\s*(?==|,|$)/g);
    for (const n of names) {
      declared.add(n[1]);
    }
  }

  // function name(param1, param2) and class Name
  const fnRegex = /\bfunction\s*\*?\s*([a-zA-Z_$][\w$]*)?\s*\(([^()]*)\)/g;
  while ((match = fnRegex.exec(maskedJs)) !== null) {
    if (match[1]) declared.add(match[1]);
    extractParamIdentifiers(match[2], declared);
  }

  // Class / object method definitions: methodName(params) { ... }
  const methodDefRegex = /(?:^|[;{},]\s*)(?:(?:async|static|get|set)\s+)*\*?\s*([a-zA-Z_$][\w$]*)\s*\(([^()]*)\)\s*\{/gm;
  while ((match = methodDefRegex.exec(maskedJs)) !== null) {
    const methodName = match[1];
    if (!JS_KEYWORDS.has(methodName)) {
      declared.add(methodName);
      extractParamIdentifiers(match[2], declared);
    }
  }

  const classRegex = /\bclass\s+([a-zA-Z_$][\w$]*)/g;
  while ((match = classRegex.exec(maskedJs)) !== null) {
    declared.add(match[1]);
  }

  // Arrow functions: (a, b) => or item =>
  const arrowParenRegex = /\(([^()]*)\)\s*=>/g;
  while ((match = arrowParenRegex.exec(maskedJs)) !== null) {
    extractParamIdentifiers(match[1], declared);
  }

  const arrowSingleRegex = /\b([a-zA-Z_$][\w$]*)\s*=>/g;
  while ((match = arrowSingleRegex.exec(maskedJs)) !== null) {
    if (!JS_KEYWORDS.has(match[1])) {
      declared.add(match[1]);
    }
  }

  // catch (err)
  const catchRegex = /\bcatch\s*\(\s*([a-zA-Z_$][\w$]*)\s*\)/g;
  while ((match = catchRegex.exec(maskedJs)) !== null) {
    declared.add(match[1]);
  }

  return declared;
}

export function validateJs(js: string, html: string): CodeDiagnostic[] {
  const diagnostics: CodeDiagnostic[] = [];
  if (!js.trim()) return diagnostics;

  const {masked, unclosedError} = maskJsNonCode(js);
  if (unclosedError) {
    diagnostics.push(unclosedError);
  }

  // Check bracket / paren / brace balance
  const delimStack: {ch: string; line: number}[] = [];
  const pairs: Record<string, string> = {'(': ')', '{': '}', '[': ']'};
  const closingPairs: Record<string, string> = {')': '(', '}': '{', ']': '['};

  for (let i = 0; i < masked.length; i += 1) {
    const ch = masked[i];
    if (pairs[ch]) {
      delimStack.push({ch, line: lineNumberAt(masked, i)});
    } else if (closingPairs[ch]) {
      const expected = closingPairs[ch];
      const top = delimStack[delimStack.length - 1];
      if (!top) {
        const line = lineNumberAt(masked, i);
        diagnostics.push({
          id: `js-stray-delim-${line}-${i}`,
          tab: 'js',
          line,
          severity: 'error',
          message: `Símbolo "${ch}" sobrando sem abertura "${expected}" correspondente.`,
        });
      } else if (top.ch !== expected) {
        const line = lineNumberAt(masked, i);
        diagnostics.push({
          id: `js-mismatch-delim-${line}-${i}`,
          tab: 'js',
          line,
          severity: 'error',
          message: `Esperado fechamento "${pairs[top.ch]}" para "${top.ch}" da linha ${top.line}, mas encontrou "${ch}".`,
        });
        delimStack.pop();
      } else {
        delimStack.pop();
      }
    }
  }

  for (const unclosed of delimStack) {
    diagnostics.push({
      id: `js-unclosed-delim-${unclosed.line}-${unclosed.ch}`,
      tab: 'js',
      line: unclosed.line,
      severity: 'error',
      message: `Abertura "${unclosed.ch}" não foi fechada com "${pairs[unclosed.ch]}".`,
    });
  }

  // Full JS syntax check via Function parser (parses only, never executes)
  if (diagnostics.length === 0) {
    try {
      // eslint-disable-next-line no-new-func
      new Function(js);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro de sintaxe em JavaScript.';
      diagnostics.push({
        id: 'js-syntax-error',
        tab: 'js',
        line: 1,
        severity: 'error',
        message: `Erro de sintaxe: ${msg}`,
      });
    }
  }

  // Check referenced DOM IDs that don't exist in HTML (unless JS also creates/assigns IDs dynamically)
  const createsDynamicIds =
    /\.innerHTML\b|\.id\s*=|setAttribute\s*\(\s*['"]id['"]/i.test(js);
  if (!createsDynamicIds) {
    const htmlIds = extractHtmlIds(html);
    const domIdRegex =
      /document\.(?:getElementById\s*\(\s*['"]([a-zA-Z0-9_-]+)['"]\s*\)|querySelector\s*\(\s*['"]#([a-zA-Z0-9_-]+)['"]\s*\))/g;
    let idMatch: RegExpExecArray | null;
    while ((idMatch = domIdRegex.exec(js)) !== null) {
      const targetId = idMatch[1] ?? idMatch[2];
      if (targetId && !htmlIds.has(targetId)) {
        const line = lineNumberAt(js, idMatch.index);
        diagnostics.push({
          id: `js-missing-dom-id-${line}-${targetId}`,
          tab: 'js',
          line,
          severity: 'warning',
          message: `O elemento com id "${targetId}" não existe no seu HTML.`,
        });
      }
    }
  }

  // Check undeclared identifiers (typos or non-existent variables/functions)
  const declared = collectDeclaredIdentifiers(masked);
  const identRegex = /\b([a-zA-Z_$][\w$]*)\b/g;
  const seenMissing = new Set<string>();
  let identMatch: RegExpExecArray | null;

  while ((identMatch = identRegex.exec(masked)) !== null) {
    const name = identMatch[1];
    const start = identMatch.index;
    const end = start + name.length;

    if (JS_KEYWORDS.has(name) || JS_GLOBALS.has(name) || declared.has(name)) {
      continue;
    }

    // Look behind (skip whitespace) to ignore property access `obj.prop`
    let prevIdx = start - 1;
    while (prevIdx >= 0 && /\s/.test(masked[prevIdx])) prevIdx -= 1;
    if (prevIdx >= 0 && masked[prevIdx] === '.') {
      continue;
    }

    // Look ahead (skip horizontal whitespace) to ignore object keys `{ key: value }`
    let nextIdx = end;
    while (nextIdx < masked.length && (masked[nextIdx] === ' ' || masked[nextIdx] === '\t')) {
      nextIdx += 1;
    }
    if (nextIdx < masked.length && masked[nextIdx] === ':' && masked[nextIdx + 1] !== ':') {
      continue;
    }

    const line = lineNumberAt(masked, start);
    const dedupKey = `${line}:${name}`;
    if (seenMissing.has(dedupKey)) continue;
    seenMissing.add(dedupKey);

    const suggestion =
      findClosestMatch(name, declared) ?? findClosestMatch(name, JS_GLOBALS);

    diagnostics.push({
      id: `js-undeclared-${line}-${name}`,
      tab: 'js',
      line,
      severity: 'warning',
      message: suggestion
        ? `"${name}" não foi declarado ou não existe. Você quis dizer "${suggestion}"?`
        : `"${name}" não foi declarado ou não existe.`,
    });
  }

  return diagnostics;
}

export function analyzeCode(
  html: string,
  css: string,
  js: string,
  webTabs: WebTab[] = ['html', 'css', 'js']
): CodeDiagnostic[] {
  const enabled = new Set<WebTab>(webTabs);
  const activeHtml = enabled.has('html') ? html : '';
  return [
    ...(enabled.has('html') ? validateHtml(html) : []),
    ...(enabled.has('css') ? validateCss(css) : []),
    ...(enabled.has('js') ? validateJs(js, activeHtml) : []),
  ];
}
