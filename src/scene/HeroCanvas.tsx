import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Box3, Sphere, Vector3 } from 'three';
import { useThree } from '@react-three/fiber';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
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

const ruinedCityCamera: HeroCameraDefaults = {
  position: [10, 12, 34],
  target: [0, 5, 0],
};
const hangarCamera: HeroCameraDefaults = { position: [8, 10, 34], target: [0, 6, 0] };
const forestCamera: HeroCameraDefaults = { position: [-8, 10, 34], target: [0, 6, 0] };

export function getCameraFit(
  bounds: Box3,
  fallback: HeroCameraDefaults,
  fov: number,
  aspect = 1,
): HeroCameraDefaults {
  if (bounds.isEmpty() || !Number.isFinite(fov) || fov <= 0) return fallback;

  const center = new Vector3();
  const sphere = new Sphere();
  bounds.getCenter(center);
  bounds.getBoundingSphere(sphere);
  if (!Number.isFinite(sphere.radius) || sphere.radius <= 0) return fallback;

  const fallbackDirection = new Vector3(...fallback.position).sub(new Vector3(...fallback.target));
  if (fallbackDirection.lengthSq() === 0) fallbackDirection.set(0, 0, 1);
  fallbackDirection.normalize();

  const halfVerticalFov = (fov * Math.PI) / 360;
  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 1;
  const halfHorizontalFov = Math.atan(Math.tan(halfVerticalFov) * safeAspect);
  const halfFov = Math.min(halfVerticalFov, halfHorizontalFov);
  const distance = (sphere.radius / Math.sin(halfFov)) * 1.35;
  const position = center.clone().add(fallbackDirection.multiplyScalar(distance));

  return {
    position: [position.x, position.y, position.z],
    target: [center.x, center.y, center.z],
  };
}

export function getHeroCameraDefaults(
  stage: Pick<StageRecord, 'backdrop'>,
  camera?: CollectionRecord['camera'],
): HeroCameraDefaults {
  if (camera) return camera;
  if (stage.backdrop.variant === 'hangar') return hangarCamera;
  if (stage.backdrop.variant === 'forest') return forestCamera;
  return stage.backdrop.variant === 'ruined-city' ? ruinedCityCamera : defaultCamera;
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

function HeroCameraFit({ bounds, fallback, fov, cameraResetId, controlsRef }: {
  bounds: Box3 | null;
  fallback: HeroCameraDefaults;
  fov: number;
  cameraResetId: number;
  controlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
}) {
  const camera = useThree(({ camera }) => camera);

  useEffect(() => {
    if (!bounds) return;

    const aspect = 'aspect' in camera && typeof camera.aspect === 'number' ? camera.aspect : 1;
    const fit = getCameraFit(bounds, fallback, fov, aspect);
    camera.position.set(...fit.position);
    camera.lookAt(...fit.target);
    camera.updateProjectionMatrix();

    if (controlsRef.current) {
      controlsRef.current.target.set(...fit.target);
      controlsRef.current.update();
    }
  }, [bounds, camera, cameraResetId, controlsRef, fallback, fov]);

  return null;
}

export function HeroCanvas({ unit, stage, requestId, cameraResetId, onReady, onError }: HeroCanvasProps) {
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [modelBounds, setModelBounds] = useState<Box3 | null>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const currentRequestId = useRef(requestId);
  currentRequestId.current = requestId;
  useEffect(() => {
    setLoaded(false);
    setLoadError(false);
    setModelBounds(null);
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
  const handleBounds = useCallback((bounds: Box3) => {
    setModelBounds(bounds.clone());
  }, []);

  const { position: cameraPosition, target: cameraTarget } = useMemo(
    () => getHeroCameraDefaults(stage, unit?.camera),
    [stage.backdrop.variant, unit?.camera],
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
        gl={{ preserveDrawingBuffer: true }}
        camera={camera}
        dpr={canvasDpr}
        onCreated={handleCanvasCreated}
      >
        <StageBackdrop stage={stage} config={stage.backdrop} />
        <StageScene stage={stage} />
        <HeroLoadBoundary key={requestId} requestId={requestId} onError={handleError}>
          <Suspense fallback={null}>
            <HeroModel record={unit} onLoaded={handleReady} onBounds={handleBounds} />
          </Suspense>
        </HeroLoadBoundary>
        <HeroCameraFit
          bounds={modelBounds}
          fallback={{ position: cameraPosition, target: cameraTarget }}
          fov={camera.fov}
          cameraResetId={cameraResetId}
          controlsRef={controlsRef}
        />
        <OrbitControls ref={controlsRef} target={cameraTarget} enablePan enableZoom enableRotate />
      </Canvas>
      {!loaded && !loadError && <LoadingFallback />}
      {loadError && <div className="hero-canvas__status" role="alert">Model unavailable</div>}
      <CaptureButton canvas={canvas} filename={`${unit.id}-tactical-showcase.png`} />
    </div>
  );
}
