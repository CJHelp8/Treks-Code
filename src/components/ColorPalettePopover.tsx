import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Check, X} from 'lucide-react';
import {
  ColorFormat,
  PALETTE_SWATCHES,
  ParsedColorMatch,
  RgbaColor,
  formatColorCode,
  hexToRgba,
  hsvToRgb,
  parseColorToken,
  rgbToHsv,
} from '../utils/colors';

interface ColorPalettePopoverProps {
  initialColor: RgbaColor;
  anchorRect: {top: number; left: number; bottom: number; right: number};
  lineColors?: ParsedColorMatch[];
  activeMatchStart?: number;
  onSelectLineColor?: (match: ParsedColorMatch) => void;
  onChangeColor: (colorCode: string, rgba: RgbaColor) => void;
  onClose: () => void;
}

export function ColorPalettePopover({
  initialColor,
  anchorRect,
  lineColors,
  activeMatchStart,
  onSelectLineColor,
  onChangeColor,
  onClose,
}: ColorPalettePopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const svBoxRef = useRef<HTMLDivElement>(null);

  const initialHsv = useMemo(
    () => rgbToHsv(initialColor.r, initialColor.g, initialColor.b),
    [initialColor.r, initialColor.g, initialColor.b]
  );

  const [hue, setHue] = useState(initialHsv.h);
  const [sat, setSat] = useState(initialHsv.s);
  const [val, setVal] = useState(initialHsv.v);
  const [alpha, setAlpha] = useState(initialColor.a);
  const [format, setFormat] = useState<ColorFormat>('hex');
  const [hexDraft, setHexDraft] = useState(() => formatColorCode(initialColor, 'hex'));

  // Sync internal HSV when switching between multiple colors on the same line
  useEffect(() => {
    const nextHsv = rgbToHsv(initialColor.r, initialColor.g, initialColor.b);
    setHue(nextHsv.h);
    setSat(nextHsv.s);
    setVal(nextHsv.v);
    setAlpha(initialColor.a);
    setHexDraft(formatColorCode(initialColor, format));
  }, [activeMatchStart]);

  const currentRgba: RgbaColor = useMemo(() => {
    const {r, g, b} = hsvToRgb(hue, sat, val);
    return {r, g, b, a: alpha};
  }, [hue, sat, val, alpha]);

  const formattedCode = useMemo(
    () => formatColorCode(currentRgba, format),
    [currentRgba, format]
  );

  useEffect(() => {
    setHexDraft(formattedCode);
  }, [formattedCode]);

  // Close on Escape or outside pointerdown
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onPointerDown = (e: PointerEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, [onClose]);

  const emitColor = (nextH: number, nextS: number, nextV: number, nextA: number, nextFmt = format) => {
    const rgb = hsvToRgb(nextH, nextS, nextV);
    const rgba: RgbaColor = {...rgb, a: nextA};
    onChangeColor(formatColorCode(rgba, nextFmt), rgba);
  };

  const handleSvPointer = (clientX: number, clientY: number) => {
    const box = svBoxRef.current;
    if (!box) return;
    const rect = box.getBoundingClientRect();
    const xRatio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const yRatio = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    const nextS = Math.round(xRatio * 100);
    const nextV = Math.round((1 - yRatio) * 100);
    setSat(nextS);
    setVal(nextV);
    emitColor(hue, nextS, nextV, alpha);
  };

  const handleSwatchClick = (hex: string) => {
    const parsed = hexToRgba(hex);
    if (!parsed) return;
    const hsv = rgbToHsv(parsed.r, parsed.g, parsed.b);
    // Keep hue if grayscale (s === 0) would reset hue arbitrarily, or update cleanly
    if (hsv.s > 0) setHue(hsv.h);
    setSat(hsv.s);
    setVal(hsv.v);
    setAlpha(1);
    onChangeColor(formatColorCode(parsed, format), parsed);
  };

  const handleManualInput = (rawValue: string) => {
    setHexDraft(rawValue);
    const parsed = parseColorToken(rawValue);
    if (parsed) {
      const hsv = rgbToHsv(parsed.r, parsed.g, parsed.b);
      if (hsv.s > 0) setHue(hsv.h);
      setSat(hsv.s);
      setVal(hsv.v);
      setAlpha(parsed.a);
      onChangeColor(rawValue.trim(), parsed);
    }
  };

  const handleFormatChange = (nextFmt: ColorFormat) => {
    setFormat(nextFmt);
    emitColor(hue, sat, val, alpha, nextFmt);
  };

  // Clamp popover position safely inside viewport
  const stylePos = useMemo(() => {
    const width = 288;
    const estHeight = 390;
    const pad = 12;
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 768;

    let left = anchorRect.left;
    if (left + width > vw - pad) {
      left = Math.max(pad, vw - width - pad);
    }
    if (left < pad) left = pad;

    let top = anchorRect.bottom + 8;
    if (top + estHeight > vh - pad) {
      const aboveTop = anchorRect.top - estHeight - 8;
      top = aboveTop >= pad ? aboveTop : Math.max(pad, vh - estHeight - pad);
    }

    return {top, left, width: Math.min(width, vw - pad * 2)};
  }, [anchorRect]);

  const previewRgbaCss =
    currentRgba.a < 1
      ? `rgba(${currentRgba.r}, ${currentRgba.g}, ${currentRgba.b}, ${currentRgba.a})`
      : `rgb(${currentRgba.r}, ${currentRgba.g}, ${currentRgba.b})`;

  const hueBg = `hsl(${hue}, 100%, 50%)`;

  return (
    <div
      ref={popoverRef}
      role="dialog"
      aria-label="Paleta de cores"
      style={{top: stylePos.top, left: stylePos.left, width: stylePos.width}}
      className="anim-dropdown-in origin-top-left fixed z-50 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-xl p-3.5 text-neutral-900 dark:text-neutral-100 select-none"
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-7 h-7 rounded-md border border-neutral-300 dark:border-neutral-700 shrink-0 overflow-hidden"
            style={{
              backgroundImage:
                'linear-gradient(45deg, #e5e5e5 25%, transparent 25%), linear-gradient(-45deg, #e5e5e5 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e5e5 75%), linear-gradient(-45deg, transparent 75%, #e5e5e5 75%)',
              backgroundSize: '8px 8px',
              backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0',
            }}
          >
            <div className="w-full h-full" style={{backgroundColor: previewRgbaCss}} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold leading-tight">Paleta de cores</p>
            <p className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 truncate">
              {formattedCode}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar paleta de cores"
          className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all duration-150 active:scale-90 cursor-pointer"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {lineColors && lineColors.length > 1 && onSelectLineColor && (
        <div className="mb-3 pb-2.5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2">
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400 shrink-0">
            Cores na linha:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {lineColors.map((item) => {
              const isSelected = item.start === activeMatchStart;
              return (
                <button
                  key={`${item.start}-${item.raw}`}
                  type="button"
                  onClick={() => onSelectLineColor(item)}
                  title={item.raw}
                  aria-label={`Editar cor ${item.raw}`}
                  className={`w-5 h-5 rounded border transition-all duration-150 active:scale-95 cursor-pointer ${
                    isSelected
                      ? 'ring-2 ring-neutral-900 dark:ring-neutral-100 scale-110 border-white dark:border-neutral-900'
                      : 'border-neutral-300 dark:border-neutral-700 hover:scale-105'
                  }`}
                  style={
                    item.isPending
                      ? {
                          backgroundImage:
                            'linear-gradient(45deg, #d4d4d4 25%, transparent 25%), linear-gradient(-45deg, #d4d4d4 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #d4d4d4 75%), linear-gradient(-45deg, transparent 75%, #d4d4d4 75%)',
                          backgroundSize: '6px 6px',
                          backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0',
                        }
                      : {backgroundColor: item.rgbaCss}
                  }
                />
              );
            })}
          </div>
        </div>
      )}

      {/* 2D Saturation / Brightness picker */}
      <div
        ref={svBoxRef}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          handleSvPointer(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (e.buttons === 1 || e.pointerType === 'touch') {
            handleSvPointer(e.clientX, e.clientY);
          }
        }}
        style={{backgroundColor: hueBg}}
        className="relative h-32 w-full rounded-lg overflow-hidden cursor-crosshair touch-none border border-black/10 dark:border-white/10 mb-3"
      >
        <div
          className="absolute inset-0"
          style={{background: 'linear-gradient(to right, #ffffff, transparent)'}}
        />
        <div
          className="absolute inset-0"
          style={{background: 'linear-gradient(to top, #000000, transparent)'}}
        />
        <div
          style={{
            left: `${sat}%`,
            top: `${100 - val}%`,
            backgroundColor: previewRgbaCss,
          }}
          className="absolute -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm pointer-events-none"
        />
      </div>

      {/* Hue & Alpha sliders */}
      <div className="space-y-2 mb-3">
        <label className="block">
          <span className="sr-only">Matiz</span>
          <input
            type="range"
            min={0}
            max={359}
            value={hue}
            onChange={(e) => {
              const nextHue = Number(e.target.value);
              setHue(nextHue);
              emitColor(nextHue, sat, val, alpha);
            }}
            style={{
              background:
                'linear-gradient(to right, #ef4444, #eab308, #22c55e, #06b6d4, #3b82f6, #a855f7, #ef4444)',
            }}
            className="w-full h-2.5 rounded-full appearance-none cursor-pointer accent-neutral-900 dark:accent-white"
          />
        </label>

        <label className="flex items-center gap-2">
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400 w-14 shrink-0">
            Opacidade
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(alpha * 100)}
            onChange={(e) => {
              const nextAlpha = Math.round(Number(e.target.value)) / 100;
              setAlpha(nextAlpha);
              emitColor(hue, sat, val, nextAlpha);
            }}
            className="flex-1 h-1.5 rounded-full appearance-none bg-neutral-200 dark:bg-neutral-800 cursor-pointer accent-neutral-900 dark:accent-neutral-100"
          />
          <span className="text-[11px] font-mono tabular-nums text-neutral-500 dark:text-neutral-400 w-8 text-right">
            {Math.round(alpha * 100)}%
          </span>
        </label>
      </div>

      {/* Curated Swatches Grid */}
      <div className="grid grid-cols-8 gap-1.5 mb-3">
        {PALETTE_SWATCHES.map((swatchHex) => {
          const isCurrent =
            formatColorCode(currentRgba, 'hex').toLowerCase() === swatchHex.toLowerCase();
          return (
            <button
              key={swatchHex}
              type="button"
              onClick={() => handleSwatchClick(swatchHex)}
              title={swatchHex}
              aria-label={`Escolher cor ${swatchHex}`}
              style={{backgroundColor: swatchHex}}
              className={`aspect-square w-full rounded-[4px] border transition-transform duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-90 cursor-pointer flex items-center justify-center ${
                isCurrent
                  ? 'ring-2 ring-neutral-900 dark:ring-neutral-100 border-white dark:border-neutral-900 scale-105'
                  : 'border-black/15 dark:border-white/15 hover:scale-110'
              }`}
            >
              {isCurrent && (
                <Check
                  className={`anim-pop-in w-3 h-3 ${
                    swatchHex === '#ffffff' ||
                    swatchHex === '#f4f4f5' ||
                    swatchHex === '#fee2e2' ||
                    swatchHex === '#ffedd5' ||
                    swatchHex === '#dcfce7' ||
                    swatchHex === '#e0f2fe' ||
                    swatchHex === '#e0e7ff'
                      ? 'text-neutral-900'
                      : 'text-white'
                  }`}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Format switch + code input */}
      <div className="flex items-center gap-1.5 pt-2.5 border-t border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center p-0.5 rounded-md bg-neutral-100 dark:bg-neutral-900 shrink-0">
          {(['hex', 'rgb', 'hsl'] as ColorFormat[]).map((fmt) => (
            <button
              key={fmt}
              type="button"
              onClick={() => handleFormatChange(fmt)}
              className={`px-1.5 py-1 text-[10px] font-semibold uppercase rounded transition-all duration-150 active:scale-95 cursor-pointer ${
                format === fmt
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              {fmt}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={hexDraft}
          onChange={(e) => handleManualInput(e.target.value)}
          aria-label="Código da cor"
          spellCheck={false}
          className="flex-1 min-w-0 px-2 py-1 text-xs font-mono rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600"
        />
      </div>
    </div>
  );
}
