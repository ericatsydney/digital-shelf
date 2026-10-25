import { useEffect, useMemo, useState } from 'react';
import type { Texture, WebGLProgramParametersWithUniforms } from 'three';
import { loadForestGroundTexture } from './forestGroundTexture';
import { getForestLayout, type ForestTree } from './environmentLayout';
import { buildTreeGeometry } from './treeGeometry';
import { applyWind, tickWind } from './windMaterial';

function Tree({ tree }: { tree: ForestTree }) {
  const geometry = useMemo(() => buildTreeGeometry(tree), [tree]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const strength = tree.layer === 3 ? 0.3 : 0.5;
  const sway = (shader: WebGLProgramParametersWithUniforms) => applyWind(shader, { treeHeight: tree.height, strength });
  return (
    <mesh geometry={geometry} position={tree.position} rotation={[0, tree.position[2] * 0.13, 0]} onBeforeRender={tickWind}>
      <meshStandardMaterial vertexColors roughness={1} flatShading onBeforeCompile={sway} customProgramCacheKey={() => 'tree-wind'} />
    </mesh>
  );
}

export function ForestBackdrop() {
  const forest = getForestLayout();
  const [groundTexture, setGroundTexture] = useState<Texture | null>(null);
  useEffect(() => {
    let active = true;
    void loadForestGroundTexture().then((texture) => { if (active) setGroundTexture(texture); });
    return () => { active = false; };
  }, []);
  return (
    <group>
      <mesh position={[0, forest.floorY - 0.22, -10]}>
        <boxGeometry args={[160, 0.24, 180]} />
        <meshStandardMaterial color="#5d8f3e" roughness={1} />
      </mesh>
      <mesh position={[0, forest.floorY, -10]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[160, 180]} />
        <meshStandardMaterial key={groundTexture ? 'textured' : 'flat'} color={groundTexture ? '#ffffff' : '#5d8f3e'} map={groundTexture ?? undefined} roughness={1} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
      </mesh>
      {[...forest.trees, ...forest.horizon].map((tree, i) => (
        <Tree key={i} tree={tree} />
      ))}
      {forest.rocks.map((rock, i) => (
        <mesh key={i} position={rock.position} scale={rock.size} rotation={[0.2, i * 0.8, 0.1]}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={i % 2 ? '#697267' : '#7b8070'} roughness={1} flatShading />
        </mesh>
      ))}
      {forest.rocks.map((rock, i) => (
        <mesh key={`fern-${i}`} position={[rock.position[0] + 2, -0.65, rock.position[2] - 3]}>
          <coneGeometry args={[1.5, 1.2, 5]} />
          <meshStandardMaterial color="#59794a" roughness={1} flatShading />
        </mesh>
      ))}
    </group>
  );
}
