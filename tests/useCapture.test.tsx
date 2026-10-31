import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CaptureButton } from '../src/components/CaptureButton';
import { captureCanvas, composeCaptureCanvas, defaultCaptureFilename } from '../src/scene/useCapture';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function createCanvas() {
  return document.createElement('canvas');
}

describe('captureCanvas', () => {
  it('captures the current canvas and removes the temporary download link', () => {
    const canvas = createCanvas();
    const click = vi.fn();
    const link = { href: '', download: '', click } as unknown as HTMLAnchorElement;
    const documentRef = {
      createElement: vi.fn(() => link),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
    } as unknown as Document;
    vi.spyOn(canvas, 'toDataURL').mockReturnValue('data:image/png;base64,scene');

    const result = captureCanvas(canvas, 'tactical-showcase.png', documentRef);

    expect(result).toEqual({ ok: true, filename: 'tactical-showcase.png' });
    expect(link.href).toBe('data:image/png;base64,scene');
    expect(link.download).toBe('tactical-showcase.png');
    expect(click).toHaveBeenCalledOnce();
    expect(documentRef.body.appendChild).toHaveBeenCalledWith(link);
    expect(documentRef.body.removeChild).toHaveBeenCalledWith(link);
  });

  it('classifies a missing canvas without creating a download link', () => {
    const documentRef = { createElement: vi.fn() } as unknown as Document;

    expect(captureCanvas(null, 'scene.png', documentRef)).toEqual({
      ok: false,
      code: 'canvas-unavailable',
    });
    expect(documentRef.createElement).not.toHaveBeenCalled();
  });

  it('classifies canvas conversion failures', () => {
    const canvas = createCanvas();
    vi.spyOn(canvas, 'toDataURL').mockImplementation(() => {
      throw new Error('tainted canvas');
    });

    expect(captureCanvas(canvas)).toEqual({ ok: false, code: 'to-data-url-failed' });
  });

  it('classifies download failures and still removes the temporary link', () => {
    const canvas = createCanvas();
    const link = {
      href: '',
      download: '',
      click: vi.fn(() => {
        throw new Error('download blocked');
      }),
    } as unknown as HTMLAnchorElement;
    const removeChild = vi.fn();
    const documentRef = {
      createElement: vi.fn(() => link),
      body: { appendChild: vi.fn(), removeChild },
    } as unknown as Document;
    vi.spyOn(canvas, 'toDataURL').mockReturnValue('data:image/png;base64,scene');

    expect(captureCanvas(canvas, 'scene.png', documentRef)).toEqual({
      ok: false,
      code: 'download-failed',
    });
    expect(removeChild).toHaveBeenCalledWith(link);
  });

  it('shows a retryable error after a failed capture', async () => {
    const canvas = createCanvas();
    const toDataURL = vi.spyOn(canvas, 'toDataURL')
      .mockImplementationOnce(() => { throw new Error('tainted canvas'); })
      .mockReturnValueOnce('data:image/png;base64,scene');
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    render(<CaptureButton canvas={canvas} filename="scene.png" />);

    fireEvent.click(screen.getByRole('button', { name: 'Capture PNG' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Capture failed. Try again.');
    expect(screen.getByRole('button', { name: 'Capture PNG' })).not.toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Capture PNG' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(toDataURL).toHaveBeenCalledTimes(2);
  });
});

describe('composeCaptureCanvas', () => {
  function fakeDocument(context: unknown) {
    const target = { width: 0, height: 0, getContext: vi.fn(() => context) };
    return { target, documentRef: { createElement: vi.fn(() => target) } as unknown as Document };
  }

  it('adds a caption strip with the model title and branding under the scene', () => {
    const context = { drawImage: vi.fn(), fillRect: vi.fn(), fillText: vi.fn(), measureText: vi.fn(() => ({ width: 10 })) };
    const { target, documentRef } = fakeDocument(context);
    const source = Object.assign(createCanvas(), { width: 1200, height: 800 });

    const result = composeCaptureCanvas(source, 'Light Guncannon', documentRef);

    expect(result).toBe(target);
    expect(target.width).toBe(1200);
    expect(target.height).toBeGreaterThan(800);
    expect(context.drawImage).toHaveBeenCalledWith(source, 0, 0);
    const texts = context.fillText.mock.calls.map((call) => call[0]);
    expect(texts).toEqual(['Light Guncannon', 'Digital Shelf']);
  });

  it('returns null when a 2D context is unavailable so the raw canvas is saved', () => {
    const { documentRef } = fakeDocument(null);
    expect(composeCaptureCanvas(createCanvas(), 'Unit', documentRef)).toBeNull();
  });

  it('saves the composed canvas when a title is given and falls back to the raw canvas otherwise', () => {
    const source = createCanvas();
    const composed = createCanvas();
    vi.spyOn(source, 'toDataURL').mockReturnValue('data:raw');
    vi.spyOn(composed, 'toDataURL').mockReturnValue('data:composed');
    const link = { href: '', download: '', click: vi.fn() } as unknown as HTMLAnchorElement;
    const documentRef = {
      createElement: vi.fn((tag: string) => (tag === 'canvas' ? composed : link)),
      body: { appendChild: vi.fn(), removeChild: vi.fn() },
    } as unknown as Document;
    vi.spyOn(composed, 'getContext').mockReturnValue({
      drawImage: vi.fn(), fillRect: vi.fn(), fillText: vi.fn(), measureText: vi.fn(() => ({ width: 1 })),
    } as unknown as CanvasRenderingContext2D);

    captureCanvas(source, 'a.png', documentRef, 'Unit A');
    expect(link.href).toBe('data:composed');

    captureCanvas(source, 'a.png', documentRef);
    expect(link.href).toBe('data:raw');
  });
});

describe('defaultCaptureFilename', () => {
  it('includes the unit id and a filesystem-safe timestamp', () => {
    expect(defaultCaptureFilename('light-guncannon')).toMatch(/^digital-shelf-light-guncannon-[0-9T-]+Z\.png$/);
    expect(defaultCaptureFilename()).toMatch(/^digital-shelf-[0-9T-]+Z\.png$/);
  });
});

describe('CaptureButton save confirmation', () => {
  it('shows Saved <filename> after a successful capture and clears it after 3 seconds', () => {
    vi.useFakeTimers();
    const canvas = createCanvas();
    vi.spyOn(canvas, 'toDataURL').mockReturnValue('data:image/png;base64,scene');
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    render(<CaptureButton canvas={canvas} filename="scene.png" />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Capture PNG' }));
    expect(screen.getByRole('status')).toHaveTextContent('Saved scene.png');

    act(() => { vi.advanceTimersByTime(3000); });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
