import { useMemo } from 'react';
import { Instanced, type Part } from './Instanced';

const radius = 8.4;
const topY = 0;
const floorY = -1.25;
const stripeCount = 32;

function stripeParts(offset: number): Part[] {
  return Array.from({ length: stripeCount / 2 }, (_, i) => {
    const angle = ((i * 2 + offset) / stripeCount) * Math.PI * 2;
    return {
      position: [Math.cos(angle) * (radius - 0.55), topY + 0.02, Math.sin(angle) * (radius - 0.55)],
      scale: [0.9, 0.04, 1.35],
      rotation: [0, -angle, 0],
    };
  });
}

function seamParts(): Part[] {
  return [0, Math.PI / 2, Math.PI / 4, -Math.PI / 4].map((angle) => ({
    position: [0, topY + 0.015, 0],
    scale: [radius * 1.9, 0.03, 0.08],
    rotation: [0, angle, 0],
  }));
}

/** Round display platform; rotates with the model when wrapped in presentation controls. */
export function Turntable({ accentColor }: { accentColor: string }) {
  const yellowStripes = useMemo(() => stripeParts(0), []);
  const blackStripes = useMemo(() => stripeParts(1), []);
  const seams = useMemo(seamParts, []);

  return (
    <group data-testid="turntable">
      <mesh position={[0, (topY + floorY) / 2 - 0.02, 0]}>
        <cylinderGeometry args={[radius, radius + 0.5, topY - floorY - 0.04, 64]} />
        <meshStandardMaterial color="#3b4650" roughness={0.7} metalness={0.2} />
      </mesh>
      <mesh position={[0, topY - 0.02, 0]}>
        <cylinderGeometry args={[radius - 0.2, radius - 0.2, 0.06, 64]} />
        <meshStandardMaterial color="#222b33" roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh position={[0, topY + 0.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius - 1.6, 0.07, 8, 96]} />
        <meshBasicMaterial color={accentColor} />
      </mesh>
      <mesh position={[0, topY + 0.01, 0]}>
        <cylinderGeometry args={[radius - 2.4, radius - 2.4, 0.04, 64]} />
        <meshStandardMaterial color="#2e3942" roughness={0.8} />
      </mesh>
      <Instanced parts={yellowStripes} shape="box" color="#c9a63c" />
      <Instanced parts={blackStripes} shape="box" color="#15191d" />
      <Instanced parts={seams} shape="box" color="#10151a" />
    </group>
  );
}
