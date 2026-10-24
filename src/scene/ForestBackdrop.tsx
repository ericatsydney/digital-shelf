import { getForestLayout, type ForestTree } from './environmentLayout';

function Tree({ tree }: { tree: ForestTree }) {
  return (
    <group position={tree.position} rotation={[0, tree.position[2] * 0.13, 0]}>
      <mesh position={[0, tree.height * 0.36, 0]}>
        <cylinderGeometry args={[0.35, 0.65, tree.height * 0.72, 7]} />
        <meshStandardMaterial color="#574e3b" roughness={1} />
      </mesh>
      <mesh
        position={[0, tree.height * 0.78, 0]}
        scale={tree.canopy === 'flat' ? [tree.radius * 1.5, tree.radius * 0.5, tree.radius * 1.5] : [tree.radius, tree.radius * 0.85, tree.radius]}
      >
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color={tree.color} roughness={1} flatShading />
      </mesh>
    </group>
  );
}

export function ForestBackdrop() {
  const forest = getForestLayout();
  return (
    <group>
      <mesh position={[0, forest.floorY - 0.12, -10]}>
        <boxGeometry args={[160, 0.24, 180]} />
        <meshStandardMaterial color="#5d8f3e" roughness={1} />
      </mesh>
      <mesh position={[0, forest.floorY + 0.025, 0]}>
        <cylinderGeometry args={[13, 13, 0.04, 32]} />
        <meshStandardMaterial color="#9a9b63" roughness={1} />
      </mesh>
      <mesh position={[0, forest.floorY + 0.01, 16]} rotation={[0, -0.1, 0]}>
        <boxGeometry args={[7, 0.025, 72]} />
        <meshStandardMaterial color="#b3a574" roughness={1} />
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
