import { BufferGeometry, Color, ConeGeometry, CylinderGeometry, Float32BufferAttribute, IcosahedronGeometry, Matrix4, Quaternion, Vector3 } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { ForestTree } from './environmentLayout';

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hashTree = (tree: ForestTree) => Math.abs(Math.round(tree.position[0] * 31 + tree.position[2] * 17 + tree.height * 7));

/** Tint a part, bake it into tree space, and tag it for the wind shader (leaf flag, per-part phase). */
function bake(geometry: BufferGeometry, matrix: Matrix4, color: Color, leaf: number, phase: number) {
  const part = geometry.index ? geometry.toNonIndexed() : geometry;
  part.deleteAttribute('uv');
  part.applyMatrix4(matrix);
  const count = part.getAttribute('position').count;
  part.setAttribute('color', new Float32BufferAttribute(Array.from({ length: count }, () => [color.r, color.g, color.b]).flat(), 3));
  part.setAttribute('aLeaf', new Float32BufferAttribute(new Array(count).fill(leaf), 1));
  part.setAttribute('aPhase', new Float32BufferAttribute(new Array(count).fill(phase), 1));
  return part;
}

/** Trunk, branches and a canopy of leaf clusters (or stacked pine cones) merged into one geometry; y = 0 is the base. */
export function buildTreeGeometry(tree: ForestTree): BufferGeometry {
  const hash = hashTree(tree);
  const random = seededRandom(hash + 1);
  const isPine = tree.canopy === 'round' && hash % 3 === 0;
  const { height, radius } = tree;
  const parts: BufferGeometry[] = [];
  const bark = new Color('#574e3b');
  const place = (x: number, y: number, z: number, scale: [number, number, number] = [1, 1, 1], quaternion = new Quaternion()) =>
    new Matrix4().compose(new Vector3(x, y, z), quaternion, new Vector3(...scale));

  const trunkHeight = height * (isPine ? 0.5 : 0.72);
  parts.push(bake(new CylinderGeometry(0.3, 0.85, trunkHeight, 8, 1), place(0, trunkHeight / 2, 0), bark.clone().offsetHSL(0, 0, (random() - 0.5) * 0.05), 0, 0));

  const green = new Color(tree.color);
  if (isPine) {
    const tiers = 5;
    for (let i = 0; i < tiers; i++) {
      const t = i / (tiers - 1);
      const tierRadius = radius * (1.15 - t * 0.7);
      const tierHeight = height * 0.3;
      const y = height * (0.3 + t * 0.62);
      const color = green.clone().offsetHSL(0.01, -0.05, -0.12 + t * 0.1 + (random() - 0.5) * 0.04);
      parts.push(bake(new ConeGeometry(tierRadius, tierHeight, 9, 1), place(0, y + tierHeight / 2, 0), color, 1, random() * Math.PI * 2));
    }
  } else {
    const flat = tree.canopy === 'flat';
    const centerY = height * 0.78;
    const spread = radius * (flat ? 1.25 : 0.85);
    const clusterCount = 7 + Math.floor(random() * 3);
    const up = new Vector3(0, 1, 0);
    for (let i = 0; i < clusterCount; i++) {
      const angle = (i / clusterCount) * Math.PI * 2 + random() * 0.6;
      const reach = i === 0 ? 0 : spread * (0.55 + random() * 0.45);
      const x = Math.cos(angle) * reach;
      const z = Math.sin(angle) * reach;
      const y = centerY + (random() - 0.4) * radius * (flat ? 0.25 : 0.7) + (i === 0 ? radius * 0.35 : 0);
      const size = radius * (flat ? 0.55 : 0.5) * (0.75 + random() * 0.45);
      const lift = (y - centerY) / (radius * 0.9);
      const color = green.clone().offsetHSL((random() - 0.5) * 0.03, 0, lift * 0.07 + (random() - 0.5) * 0.08);
      parts.push(bake(new IcosahedronGeometry(1, 1), place(x, y, z, [size, size * (flat ? 0.62 : 0.85), size]), color, 1, random() * Math.PI * 2));
      if (i > 0 && i < 4) {
        const attach = new Vector3(0, trunkHeight * (0.55 + 0.1 * i), 0);
        const tip = new Vector3(x * 0.7, y - size * 0.3, z * 0.7);
        const direction = tip.clone().sub(attach);
        const quaternion = new Quaternion().setFromUnitVectors(up, direction.clone().normalize());
        const middle = attach.clone().add(tip).multiplyScalar(0.5);
        parts.push(bake(new CylinderGeometry(0.1, 0.22, direction.length(), 5, 1), place(middle.x, middle.y, middle.z, [1, 1, 1], quaternion), bark, 0, 0));
      }
    }
  }

  const merged = mergeGeometries(parts, false);
  parts.forEach((part) => part.dispose());
  return merged;
}
