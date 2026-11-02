import { useMemo } from 'react';
import type { CanvasTexture } from 'three';
import { getHangarFence, getHangarLayout, getHangarSkeleton, type Position } from './environmentLayout';
import { getHangarWallTexture } from './hangarWallTexture';
import { getHangarFloorTexture } from './hangarFloorTexture';
import { getCrateTexture } from './crateTexture';
import { HANGAR_GREYS, steelFaceColors } from './hangarPalette';
import { HangarConsole } from './HangarConsole';

function SteelBox({ position, size, color = '#263746' }: { position: Position; size: Position; color?: string }) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} emissive={HANGAR_GREYS.coolFill} roughness={0.65} metalness={0.45} />
    </mesh>
  );
}

function CargoCrate({ position, size, index }: { position: Position; size: Position; index: number }) {
  const [width, height, depth] = size;
  const onFloor = position[1] < 2;
  const palletHeight = onFloor ? 0.35 : 0;
  const bodyHeight = height - palletHeight;
  const baseColor = index % 2 ? '#7a7d58' : '#8b8056';
  const texture = useMemo(() => getCrateTexture(index + 1, baseColor), [index, baseColor]);
  return (
    <group data-testid="cargo-crate" position={position} rotation={[0, (index - 1) * 0.12, 0]}>
      {onFloor && (
        <mesh position={[0, -height / 2 + palletHeight / 2, 0]}>
          <boxGeometry args={[width * 1.04, palletHeight, depth * 1.04]} />
          <meshStandardMaterial color="#5a4a37" roughness={0.95} />
        </mesh>
      )}
      <mesh position={[0, palletHeight / 2, 0]}>
        <boxGeometry args={[width, bodyHeight, depth]} />
        <meshStandardMaterial color={texture ? '#ffffff' : baseColor} map={texture ?? undefined} roughness={0.9} />
      </mesh>
    </group>
  );
}

function PaintedWall({ position, rotationY = 0, size, texture }: {
  position: Position;
  rotationY?: number;
  size: [number, number];
  texture: CanvasTexture | null;
}) {
  return (
    <mesh position={position} rotation={[0, rotationY, 0]}>
      <planeGeometry args={size} />
      <meshBasicMaterial color={texture ? '#ffffff' : HANGAR_GREYS.wallFallback} map={texture ?? undefined} />
    </mesh>
  );
}

export function HangarBackdrop({ color }: { color: string }) {
  const bay = getHangarLayout();
  const sideDepth = 48;
  const backTexture = useMemo(() => getHangarWallTexture(1, bay.width / bay.height), [bay.width, bay.height]);
  const floorTexture = useMemo(() => getHangarFloorTexture(), []);
  const steelColors = useMemo(() => steelFaceColors(), []);
  const sideTexture = useMemo(() => getHangarWallTexture(2, sideDepth / bay.height), [bay.height]);
  return (
    <group>
      <mesh position={[0, bay.floorY - 0.12, -2]}>
        <boxGeometry args={[bay.width, 0.24, 90]} />
        <meshStandardMaterial color={HANGAR_GREYS.floorSlab} roughness={0.95} />
      </mesh>
      {floorTexture && (
        <mesh position={[0, bay.floorY + 0.003, -2]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[bay.width, 90]} />
          <meshStandardMaterial color="#ffffff" map={floorTexture} roughness={0.95} />
        </mesh>
      )}
      <PaintedWall position={[0, 13, bay.rearZ + 0.5]} size={[bay.width, bay.height]} texture={backTexture} />
      {[-1, 1].map(side => (
        <group key={side}>
          <PaintedWall position={[side * 29, 13, -13]} rotationY={-side * Math.PI / 2} size={[sideDepth, bay.height]} texture={sideTexture} />
        </group>
      ))}
      <HangarConsole />
      {[...getHangarSkeleton(), ...getHangarFence()].map((box, index) => (
        <mesh key={`girder-${index}`} position={box.position}>
          <boxGeometry args={box.size}>
            <bufferAttribute attach="attributes-color" args={[steelColors, 3]} />
          </boxGeometry>
          {/* Unlit like the walls: the face shading is baked in, so both side walls match. */}
          <meshBasicMaterial color={HANGAR_GREYS.girder} vertexColors />
        </mesh>
      ))}
      {bay.beamZs.map(z => (
        <group key={z}>
          <SteelBox position={[0, 27, z]} size={[bay.width, 1.2, 1.1]} color={HANGAR_GREYS.beam} />
          <mesh position={[0, 26.25, z]}>
            <boxGeometry args={[35, 0.16, 0.6]} />
            <meshBasicMaterial color={HANGAR_GREYS.ceilingLight} />
          </mesh>
        </group>
      ))}
      {bay.crates.map((crate, index) => (
        <CargoCrate key={index} position={crate.position} size={crate.size} index={index} />
      ))}
    </group>
  );
}
