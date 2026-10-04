import { getHangarLayout, type Position } from './environmentLayout';

function SteelBox({ position, size, color = '#263746' }: { position: Position; size: Position; color?: string }) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.65} metalness={0.45} />
    </mesh>
  );
}

export function HangarBackdrop({ color }: { color: string }) {
  const bay = getHangarLayout();
  return (
    <group>
      <SteelBox position={[0, bay.floorY - 0.12, -2]} size={[bay.width, 0.24, 90]} color="#25323c" />
      <SteelBox position={[0, 13, bay.rearZ]} size={[bay.width, bay.height, 1]} color="#1b2834" />
      <SteelBox position={[0, 10, bay.rearZ + 0.55]} size={[22, 22, 0.2]} color="#344653" />
      {[-1, 1].map(side => (
        <group key={side}>
          <SteelBox position={[side * 29, 13, -13]} size={[1, bay.height, 48]} />
          <SteelBox position={[side * 24, 7, -13]} size={[7, 0.5, 47]} color="#536575" />
          <SteelBox position={[side * 21, 8.4, -13]} size={[0.12, 0.12, 47]} color="#8398a2" />
          {bay.beamZs.map(z => (
            <group key={z}>
              <SteelBox position={[side * 27, 13, z]} size={[1.3, 29, 1.3]} color="#516270" />
              <SteelBox position={[side * 21, 7.7, z]} size={[0.12, 2, 0.12]} color="#8398a2" />
              <mesh position={[side * 26.2, 16, z]}>
                <boxGeometry args={[0.14, 12, 0.4]} />
                <meshBasicMaterial color={color} />
              </mesh>
            </group>
          ))}
          <mesh position={[side * 12, bay.floorY + 0.035, -8]}>
            <boxGeometry args={[0.18, 0.025, 55]} />
            <meshBasicMaterial color="#d1ae45" />
          </mesh>
          {Array.from({ length: 12 }, (_, i) => (
            <mesh key={i} position={[side * 14, bay.floorY + 0.04, -30 + i * 4]} rotation={[0, side * 0.5, 0]}>
              <boxGeometry args={[2.2, 0.03, 0.32]} />
              <meshBasicMaterial color="#d1ae45" />
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
        <group key={index}>
          <SteelBox {...crate} color={index % 2 ? '#52636a' : '#726950'} />
          <SteelBox position={[crate.position[0], crate.position[1], crate.position[2] + 1.82]} size={[3.3, 0.16, 0.05]} color="#b5a257" />
        </group>
      ))}
      {[-16, -8, 0, 8, 16].map(x => (
        <SteelBox key={x} position={[x, bay.floorY + 0.005, -2]} size={[0.025, 0.015, 90]} color="#45525b" />
      ))}
    </group>
  );
}
