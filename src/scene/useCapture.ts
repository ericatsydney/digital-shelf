import { useCallback, useState } from 'react';

export type CaptureResult =
  | { ok: true; filename: string }
  | { ok: false; code: 'canvas-unavailable' | 'to-data-url-failed' | 'download-failed' };
type CaptureErrorCode = Extract<CaptureResult, { ok: false }>['code'];

const defaultFilename = () => `tactical-showcase-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;

export function captureCanvas(
  canvas: HTMLCanvasElement | null,
  filename = defaultFilename(),
  documentRef: Document = document,
): CaptureResult {
  if (!canvas) return { ok: false, code: 'canvas-unavailable' };

  let dataUrl: string;
  try {
    dataUrl = canvas.toDataURL('image/png');
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

export function useCapture(canvas: HTMLCanvasElement | null, filename?: string) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<CaptureErrorCode | null>(null);

  const capture = useCallback((): CaptureResult => {
    setIsCapturing(true);
    const result = captureCanvas(canvas, filename);
    setError(result.ok ? null : result.code);
    setIsCapturing(false);
    return result;
  }, [canvas, filename]);

  return { capture, isCapturing, error };
}
