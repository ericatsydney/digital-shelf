import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';
import { CONSOLE_LOG_LINES, consoleLogLines, getConsoleLayout, scrollOffset } from './consoleLayout';

const motionAmount = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : 1;
/** Texture heights scrolled per second, and the share of the log block visible on the screen at once. */
const SCROLL_SPEED = 0.02;
const VISIBLE_SHARE = 0.4;

/** Green terminal text on near-black; the block repeats vertically so scrolling never shows a seam. */
function createLogTexture(): CanvasTexture | null {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.fillStyle = '#04120a';
  context.fillRect(0, 0, canvas.width, canvas.height);
  const lineHeight = canvas.height / CONSOLE_LOG_LINES;
  context.font = `${Math.round(lineHeight * 0.72)}px monospace`;
  context.textBaseline = 'middle';
  consoleLogLines(CONSOLE_LOG_LINES).forEach((line, i) => {
    context.fillStyle = i % 9 === 4 ? '#c9ffd6' : '#4dff7a';
    context.fillText(line, 14, lineHeight * (i + 0.5));
  });
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(1, VISIBLE_SHARE);
  return texture;
}

/** A big status screen on the left wall; it faces the right wall and slowly scrolls a green log upward. */
export function HangarConsole() {
  const layout = getConsoleLayout();
  const texture = useMemo(createLogTexture, []);
  const textureRef = useRef(texture);
  textureRef.current = texture;
  useEffect(() => () => texture?.dispose(), [texture]);
  useFrame(({ clock }) => {
    const current = textureRef.current;
    if (current) current.offset.y = scrollOffset(clock.elapsedTime, SCROLL_SPEED, motionAmount);
  });
  return (
    <group data-testid="hangar-console">
      <mesh position={layout.frame.position}>
        <boxGeometry args={layout.frame.size} />
        <meshStandardMaterial color="#2b3136" roughness={0.7} />
      </mesh>
      <mesh data-testid="console-screen" position={layout.screen.position} rotation={[0, layout.screen.rotationY, 0]}>
        <planeGeometry args={layout.screen.size} />
        <meshBasicMaterial color={texture ? '#ffffff' : '#0b2a14'} map={texture ?? undefined} toneMapped={false} />
      </mesh>
    </group>
  );
}
