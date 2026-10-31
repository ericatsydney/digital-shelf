type ControlsHintProps = {
  mode: 'turntable' | 'orbit';
  onDismiss: () => void;
};

const hintText = {
  turntable: 'Drag to rotate · Scroll or pinch to zoom',
  orbit: 'Drag to rotate · Scroll or pinch to zoom · Right-drag to pan',
} as const;

export function ControlsHint({ mode, onDismiss }: ControlsHintProps) {
  return (
    <div className="controls-hint" role="note">
      <span>{hintText[mode]}</span>
      <button type="button" aria-label="Dismiss controls hint" onClick={onDismiss}>
        ×
      </button>
    </div>
  );
}
