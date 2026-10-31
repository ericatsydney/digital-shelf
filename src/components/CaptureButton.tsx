import { useCapture } from '../scene/useCapture';

type CaptureButtonProps = {
  canvas: HTMLCanvasElement | null;
  filename?: string;
  unitId?: string;
  title?: string;
};

export function CaptureButton({ canvas, filename, unitId, title }: CaptureButtonProps) {
  const { capture, isCapturing, error, savedFilename } = useCapture(canvas, { filename, unitId, title });

  return (
    <div className="capture-control">
      <button className="capture-button" type="button" disabled={isCapturing} onClick={capture}>
        {isCapturing ? 'Capturing…' : 'Capture PNG'}
      </button>
      {savedFilename && <p className="capture-saved" role="status">Saved {savedFilename}</p>}
      {error && <p className="capture-error" role="alert">Capture failed. Try again.</p>}
    </div>
  );
}
