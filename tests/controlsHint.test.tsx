import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ControlsHint } from '../src/components/ControlsHint';

describe('ControlsHint', () => {
  it('describes turntable controls without panning', () => {
    render(<ControlsHint mode="turntable" onDismiss={() => undefined} />);
    expect(screen.getByRole('note')).toHaveTextContent('Drag to rotate · Scroll or pinch to zoom');
    expect(screen.getByRole('note')).not.toHaveTextContent('pan');
  });

  it('describes orbit controls including panning', () => {
    render(<ControlsHint mode="orbit" onDismiss={() => undefined} />);
    expect(screen.getByRole('note')).toHaveTextContent('Drag to rotate · Scroll or pinch to zoom · Right-drag to pan');
  });

  it('calls onDismiss from the dismiss button', () => {
    const onDismiss = vi.fn();
    render(<ControlsHint mode="orbit" onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss controls hint' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
