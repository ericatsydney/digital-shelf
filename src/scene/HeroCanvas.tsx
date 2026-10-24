import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PresentationControls } from '@react-three/drei';
import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useThree } from '@react-three/fiber';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { CollectionRecord, StageRecord } from '../app/types';
import { HeroModel } from './HeroModel';
import { StageScene } from './StageScene';
import { StageBackdrop } from './StageBackdrop';
import { Turntable } from './Turntable';
import { getCameraLimits } from './cameraLimits';
import { CaptureButton } from '../components/CaptureButton';

const canvasDpr: [number, number] = [1, 2];

type HeroCanvasProps = {
  unit: CollectionRecord | null;
  stage: StageRecord;
  requestId: number;
  cameraResetId: number;
  onReady?: (requestId: number) => void;
  onError?: (requestId: number) => void;
};

type CameraVector = [number, number, number];

type HeroCameraDefaults = {
  position: CameraVector;
  target: CameraVector;
};

const defaultCamera: HeroCameraDefaults = {
  position: [4, 2.5, 6],
  target: [0, 0, 0],
};

const ruinedCityCamera: HeroCameraDefaults = { position: [4.3, 1.8, 48.3], target: [0, 10.3, 0] };
const hangarCamera: HeroCameraDefaults = { position: [11.2, 15.9, 47.5], target: [0, 10.3, 0] };
const forestCamera: HeroCameraDefaults = { position: [-11.1, 3.3, 47.3], target: [0, 10.3, 0] };

export function getHeroCameraDefaults(
  stage: Pick<StageRecord, 'backdrop'>,
  camera?: CollectionRecord['camera'],
): HeroCameraDefaults {
  if (camera) return camera;
  if (stage.backdrop.variant === 'hangar') return hangarCamera;
  if (stage.backdrop.variant === 'forest') return forestCamera;
  return stage.backdrop.variant === 'ruined-city' ? ruinedCityCamera : defaultCamera;
}

/** The Hangar spins a platform under a fixed camera; every other stage orbits the camera. */
export function getHeroControlsMode(stage: Pick<StageRecord, 'backdrop'>): 'turntable' | 'orbit' {
  return stage.backdrop.variant === 'hangar' ? 'turntable' : 'orbit';
}

/** Largest orbit polar angle (from straight up) that keeps the camera at or above minY. */
export function getMaxPolarAngle(targetY: number, distance: number, minY: number): number {
  if (!(distance > 0)) return Math.PI;
  const ratio = (minY - targetY) / distance;
  if (ratio <= -1) return Math.PI;
  if (ratio >= 1) return 0;
  return Math.acos(ratio);
}

/** Keeps the orbiting camera above the ground so it never drops into a weird, under-floor angle. */
function CameraFloorGuard({ controlsRef, minY }: { controlsRef: React.MutableRefObject<OrbitControlsImpl | null>; minY: number }) {
  const camera = useThree(({ camera }) => camera);
  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.maxPolarAngle = getMaxPolarAngle(controls.target.y, camera.position.distanceTo(controls.target), minY);
    if (camera.position.y < minY) {
      camera.position.y = minY;
      controls.update();
    }
  });
  return null;
}

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

/** Places the camera at its fixed default; nothing depends on the model or its measured size. */
function CameraRig({ position, target, cameraResetId, controlsRef }: {
  position: CameraVector;
  target: CameraVector;
  cameraResetId: number;
  controlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
}) {
  const camera = useThree(({ camera }) => camera);

  useEffect(() => {
    camera.position.set(...position);
    camera.lookAt(...target);
    camera.updateProjectionMatrix();
    if (controlsRef.current) {
      controlsRef.current.target.set(...target);
      controlsRef.current.update();
    }
  }, [camera, cameraResetId, controlsRef, position, target]);

  return null;
}

export function HeroCanvas({ unit, stage, requestId, cameraResetId, onReady, onError }: HeroCanvasProps) {
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
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

  const { position: cameraPosition, target: cameraTarget } = useMemo(
    () => getHeroCameraDefaults(stage, unit?.camera),
    [stage.backdrop.variant, unit?.camera],
  );
  const camera = useMemo(() => ({ position: cameraPosition, fov: 42 }), [cameraPosition]);
  const handleCanvasCreated = useCallback(({ gl }: { gl: { domElement: HTMLCanvasElement } }) => {
    setCanvas(gl.domElement);
  }, []);

  const turntable = getHeroControlsMode(stage) === 'turntable';
  const limits = getCameraLimits(stage);
  if (!unit) {
    return <div className="hero-canvas hero-canvas--empty" role="status">Select a unit from the roster</div>;
  }

  const model = (
    <HeroLoadBoundary key={requestId} requestId={requestId} onError={handleError}>
      <Suspense fallback={null}>
        <HeroModel record={unit} onLoaded={handleReady} />
      </Suspense>
    </HeroLoadBoundary>
  );

  return (
    <div
      className="hero-canvas"
      style={{ backgroundColor: stage.background }}
      data-backdrop-variant={stage.backdrop.variant}
      aria-label={`${unit.title} 3D model`}
    >
      <Canvas
        gl={{ preserveDrawingBuffer: true }}
        camera={camera}
        dpr={canvasDpr}
        onCreated={handleCanvasCreated}
      >
        <StageBackdrop stage={stage} config={stage.backdrop} />
        <StageScene stage={stage} />
        {turntable ? (
          <PresentationControls global polar={[0, 0]} azimuth={[-Infinity, Infinity]} speed={1.6} damping={0.2}>
            <Turntable accentColor={stage.accentColor} />
            {model}
          </PresentationControls>
        ) : model}
        {limits.floorY !== undefined && <CameraFloorGuard controlsRef={controlsRef} minY={limits.floorY + limits.minHeightAboveFloor} />}
        <CameraRig position={cameraPosition} target={cameraTarget} cameraResetId={cameraResetId} controlsRef={controlsRef} />
        <OrbitControls ref={controlsRef} target={cameraTarget} enablePan={!turntable} enableZoom enableRotate={!turntable} maxDistance={limits.maxDistance} />
      </Canvas>
      {!loaded && !loadError && <LoadingFallback />}
      {loadError && <div className="hero-canvas__status" role="alert">Model unavailable</div>}
      <CaptureButton canvas={canvas} filename={`${unit.id}-tactical-showcase.png`} />
    </div>
  );
}
