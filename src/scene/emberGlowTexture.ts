import { SRGBColorSpace, TextureLoader, type Texture } from 'three';

export const EMBER_GLOW_URL = '/textures/ember-glow.png';

let pending: Promise<Texture | null> | undefined;

/** Loads the baked glow image once; resolves null if it is missing so the glow spots simply stay hidden. */
export function loadEmberGlowTexture(): Promise<Texture | null> {
  pending ??= new TextureLoader().loadAsync(EMBER_GLOW_URL).then((texture) => {
    texture.colorSpace = SRGBColorSpace;
    return texture;
  }).catch(() => null);
  return pending;
}
