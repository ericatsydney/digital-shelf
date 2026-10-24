import { useMemo } from 'react';
import { Euler, Matrix4, Quaternion, Vector3 } from 'three';

export type Vec3 = [number, number, number];

export type Part = { position: Vec3; scale: Vec3; rotation?: Vec3 };

/** One draw call for many copies of a unit shape; matrices are declarative so no hooks run inside the scene. */
export function Instanced({ parts, shape, color, opacity = 1 }: {
  parts: Part[];
  shape: 'box' | 'cylinder' | 'sphere';
  color: string;
  opacity?: number;
}) {
  const matrices = useMemo(() => {
    const data = new Float32Array(parts.length * 16);
    const matrix = new Matrix4();
    parts.forEach((part, index) => {
      const [rx, ry, rz] = part.rotation ?? [0, 0, 0];
      matrix.compose(new Vector3(...part.position), new Quaternion().setFromEuler(new Euler(rx, ry, rz)), new Vector3(...part.scale));
      matrix.toArray(data, index * 16);
    });
    return data;
  }, [parts]);
  if (parts.length === 0) return null;

  return (
    <instancedMesh args={[undefined, undefined, parts.length]} frustumCulled={false}>
      {shape === 'box' && <boxGeometry args={[1, 1, 1]} />}
      {shape === 'cylinder' && <cylinderGeometry args={[0.5, 0.5, 1, 14]} />}
      {shape === 'sphere' && <sphereGeometry args={[0.5, 10, 8]} />}
      {opacity < 1
        ? <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
        : <meshStandardMaterial color={color} roughness={1} />}
      <instancedBufferAttribute attach="instanceMatrix" args={[matrices, 16]} />
    </instancedMesh>
  );
}
