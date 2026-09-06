import { useCapture } from '../scene/useCapture';

type CaptureButtonProps = {
  canvas: HTMLCanvasElement | null;
  filename?: string;
};

export function CaptureButton({ canvas, filename }: CaptureButtonProps) {
  const { capture, isCapturing, error } = useCapture(canvas, filename);

  return (
    <div className="capture-control">
      <button className="capture-button" type="button" disabled={isCapturing} onClick={capture}>
        {isCapturing ? 'Capturing…' : 'Capture PNG'}
      </button>
      {error && <p className="capture-error" role="alert">Capture failed. Try again.</p>}
    </div>
  );
}
