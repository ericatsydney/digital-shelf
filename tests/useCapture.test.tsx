import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CaptureButton } from '../src/components/CaptureButton';
import { captureCanvas } from '../src/scene/useCapture';

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
