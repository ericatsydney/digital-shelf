import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { CollectionRecord, StageRecord } from '../app/types';
import { HeroModel } from './HeroModel';
import { StageScene } from './StageScene';
import { StageBackdrop } from './StageBackdrop';
import { CaptureButton } from '../components/CaptureButton';

const canvasDpr: [number, number] = [1, 2];

type HeroCanvasProps = {
  unit: CollectionRecord | null;
  stage: StageRecord;
  requestId: number;
  onReady?: (requestId: number) => void;
  onError?: (requestId: number) => void;
};

class ErrorBoundary<P extends { children: ReactNode } = { children: ReactNode }> extends Component<
  P,
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

type HeroLoadBoundaryProps = {
  children: ReactNode;
  requestId: number;
  onError?: (requestId: number) => void;
};

class HeroLoadBoundary extends ErrorBoundary<HeroLoadBoundaryProps> {
  private readonly requestId: number;
  private readonly onError?: (requestId: number) => void;

  constructor(props: HeroLoadBoundaryProps) {
    super(props);
    this.requestId = props.requestId;
    this.onError = props.onError;
  }

  override componentDidCatch() {
    this.onError?.(this.requestId);
  }
}

function LoadingFallback() {
  return <div className="hero-canvas__status" role="status">Loading unit…</div>;
}

export function HeroCanvas({ unit, stage, requestId, onReady, onError }: HeroCanvasProps) {
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const currentRequestId = useRef(requestId);
  currentRequestId.current = requestId;
  useEffect(() => {
    setLoaded(false);
    setLoadError(false);
  }, [requestId, unit?.id]);
  const isCurrent = useCallback(() => currentRequestId.current === requestId, [requestId]);
  const handleReady = useCallback(() => {
    if (isCurrent()) {
      setLoaded(true);
      onReady?.(requestId);
    }
  }, [isCurrent, onReady, requestId]);
  const handleError = useCallback(() => {
    if (isCurrent()) {
      setLoadError(true);
      onError?.(requestId);
    }
  }, [isCurrent, onError, requestId]);

  const cameraPosition = useMemo<[number, number, number]>(
    () => unit?.camera?.position ?? [4, 2.5, 6],
    [unit?.camera?.position],
  );
  const cameraTarget = useMemo<[number, number, number]>(
    () => unit?.camera?.target ?? [0, 0, 0],
    [unit?.camera?.target],
  );
  const camera = useMemo(() => ({ position: cameraPosition, fov: 42 }), [cameraPosition]);
  const handleCanvasCreated = useCallback(({ gl }: { gl: { domElement: HTMLCanvasElement } }) => {
    setCanvas(gl.domElement);
  }, []);

  if (!unit) {
    return <div className="hero-canvas hero-canvas--empty" role="status">Select a unit from the roster</div>;
  }

  return (
    <div
      className="hero-canvas"
      style={{ backgroundColor: stage.background }}
      data-backdrop-variant={stage.backdrop.variant}
      aria-label={`${unit.title} 3D model`}
    >
      <Canvas
        camera={camera}
        dpr={canvasDpr}
        onCreated={handleCanvasCreated}
      >
        <StageBackdrop stage={stage} config={stage.backdrop} />
        <StageScene stage={stage} />
        <HeroLoadBoundary key={requestId} requestId={requestId} onError={handleError}>
          <Suspense fallback={null}>
            <HeroModel record={unit} onLoaded={handleReady} />
          </Suspense>
        </HeroLoadBoundary>
        <OrbitControls target={cameraTarget} enablePan enableZoom enableRotate />
      </Canvas>
      {!loaded && !loadError && <LoadingFallback />}
      {loadError && <div className="hero-canvas__status" role="alert">Model unavailable</div>}
      <CaptureButton canvas={canvas} filename={`${unit.id}-tactical-showcase.png`} />
    </div>
  );
}
