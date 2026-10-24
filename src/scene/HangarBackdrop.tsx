import { useMemo } from 'react';
import { CatmullRomCurve3, Vector3, type CanvasTexture } from 'three';
import { getHangarLayout, type Position } from './environmentLayout';
import { getHangarWallTexture } from './hangarWallTexture';
import { getHangarFloorTexture } from './hangarFloorTexture';
import { getCrateTexture } from './crateTexture';

function SteelBox({ position, size, color = '#263746' }: { position: Position; size: Position; color?: string }) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.65} metalness={0.45} />
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

function CableConnector({ position }: { position: Position }) {
  return (
    <mesh data-testid="cable-connector" position={position}>
      <boxGeometry args={[0.95, 0.75, 0.95]} />
      <meshStandardMaterial color="#3a4047" roughness={0.6} metalness={0.35} />
    </mesh>
  );
}

function FloorCable({ points }: { points: Position[] }) {
  const curve = useMemo(() => new CatmullRomCurve3(points.map((point) => new Vector3(...point))), [points]);
  const start = points[0];
  const end = points[points.length - 1];
  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 120, 0.28, 10, false]} />
        <meshStandardMaterial color="#23272b" roughness={0.85} />
      </mesh>
      <CableConnector position={[start[0], start[1] + 0.05, start[2]]} />
      <CableConnector position={[end[0], end[1] + 0.05, end[2]]} />
    </group>
  );
}

const cableY = -1.25 + 0.28;
const floorCables: Position[][] = [
  [[-9.2, cableY, 0.5], [-11.5, cableY, 3.2], [-13.6, cableY, 0.8], [-15.6, cableY, -1.6], [-17.6, cableY, 1.4], [-20, cableY, 4.6], [-24, cableY, 3.4], [-27.5, cableY, 7]],
  [[9.2, cableY, 3], [11.6, cableY, 6.4], [14, cableY, 9.6], [17, cableY, 8], [19.6, cableY, 11.4], [23.6, cableY, 14], [27.5, cableY, 12]],
];

function PaintedWall({ position, rotationY = 0, size, texture }: {
  position: Position;
  rotationY?: number;
  size: [number, number];
  texture: CanvasTexture | null;
}) {
  return (
    <mesh position={position} rotation={[0, rotationY, 0]}>
      <planeGeometry args={size} />
      <meshBasicMaterial color={texture ? '#ffffff' : '#1b2834'} map={texture ?? undefined} />
    </mesh>
  );
}

export function HangarBackdrop({ color }: { color: string }) {
  const bay = getHangarLayout();
  const sideDepth = 48;
  const backTexture = useMemo(() => getHangarWallTexture(1, bay.width / bay.height), [bay.width, bay.height]);
  const floorTexture = useMemo(() => getHangarFloorTexture(), []);
  const sideTexture = useMemo(() => getHangarWallTexture(2, sideDepth / bay.height), [bay.height]);
  return (
    <group>
      <mesh position={[0, bay.floorY - 0.12, -2]}>
        <boxGeometry args={[bay.width, 0.24, 90]} />
        <meshStandardMaterial color="#968f85" roughness={0.95} />
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
          {bay.beamZs.map(z => (
            <mesh key={z} position={[side * 26.2, 16, z]}>
              <boxGeometry args={[0.14, 12, 0.4]} />
              <meshBasicMaterial color={color} />
            </mesh>
          ))}
        </group>
      ))}
      {bay.beamZs.map(z => (
        <group key={z}>
          <SteelBox position={[0, 27, z]} size={[bay.width, 1.2, 1.1]} color="#61727e" />
          <mesh position={[0, 26.25, z]}>
            <boxGeometry args={[35, 0.16, 0.6]} />
            <meshBasicMaterial color="#c0e5ed" />
          </mesh>
        </group>
      ))}
      {bay.crates.map((crate, index) => (
        <CargoCrate key={index} position={crate.position} size={crate.size} index={index} />
      ))}
      {floorCables.map((points, index) => (
        <FloorCable key={index} points={points} />
      ))}
    </group>
  );
}
