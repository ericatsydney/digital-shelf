import { useCallback, useEffect, useRef, useState } from 'react';

export type CaptureResult =
  | { ok: true; filename: string }
  | { ok: false; code: 'canvas-unavailable' | 'to-data-url-failed' | 'download-failed' };
type CaptureErrorCode = Extract<CaptureResult, { ok: false }>['code'];

const SAVED_NOTICE_MS = 3000;

export const defaultCaptureFilename = (unitId?: string) =>
  `digital-shelf-${unitId ? `${unitId}-` : ''}${new Date().toISOString().replace(/[:.]/g, '-')}.png`;

/** Draws the scene above a caption strip (model title left, branding right); null if no 2D context is available. */
export function composeCaptureCanvas(
  source: HTMLCanvasElement,
  title: string,
  documentRef: Document = document,
): HTMLCanvasElement | null {
  const target = documentRef.createElement('canvas');
  const context = target.getContext('2d');
  if (!context) return null;

  const strip = Math.max(48, Math.round(source.height * 0.07));
  target.width = source.width;
  target.height = source.height + strip;
  context.drawImage(source, 0, 0);
  context.fillStyle = '#07111f';
  context.fillRect(0, source.height, target.width, strip);
  context.fillStyle = '#e8f7ff';
  context.font = `700 ${Math.round(strip * 0.42)}px Inter, system-ui, sans-serif`;
  context.textBaseline = 'middle';
  context.textAlign = 'left';
  context.fillText(title, strip * 0.4, source.height + strip / 2);
  context.fillStyle = '#55d6ff';
  context.textAlign = 'right';
  context.fillText('Digital Shelf', target.width - strip * 0.4, source.height + strip / 2);
  return target;
}

export function captureCanvas(
  canvas: HTMLCanvasElement | null,
  filename = defaultCaptureFilename(),
  documentRef: Document = document,
  title?: string,
): CaptureResult {
  if (!canvas) return { ok: false, code: 'canvas-unavailable' };

  let dataUrl: string;
  try {
    const output = title ? composeCaptureCanvas(canvas, title, documentRef) ?? canvas : canvas;
    dataUrl = output.toDataURL('image/png');
  } catch {
    return { ok: false, code: 'to-data-url-failed' };
  }

  let link: HTMLAnchorElement | null = null;
  let appended = false;
  try {
    link = documentRef.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    documentRef.body.appendChild(link);
    appended = true;
    link.click();
    return { ok: true, filename };
  } catch {
    return { ok: false, code: 'download-failed' };
  } finally {
    if (link && appended) {
      try {
        documentRef.body.removeChild(link);
      } catch {
        // Cleanup must not replace the original capture result.
      }
    }
  }
}

type CaptureOptions = { filename?: string; unitId?: string; title?: string };

export function useCapture(canvas: HTMLCanvasElement | null, { filename, unitId, title }: CaptureOptions = {}) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<CaptureErrorCode | null>(null);
  const [savedFilename, setSavedFilename] = useState<string | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(savedTimer.current), []);

  const capture = useCallback((): CaptureResult => {
    setIsCapturing(true);
    clearTimeout(savedTimer.current);
    const result = captureCanvas(canvas, filename ?? defaultCaptureFilename(unitId), document, title);
    setError(result.ok ? null : result.code);
    setSavedFilename(result.ok ? result.filename : null);
    if (result.ok) savedTimer.current = setTimeout(() => setSavedFilename(null), SAVED_NOTICE_MS);
    setIsCapturing(false);
    return result;
  }, [canvas, filename, unitId, title]);

  return { capture, isCapturing, error, savedFilename };
}
