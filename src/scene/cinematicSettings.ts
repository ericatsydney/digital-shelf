import type { StageRecord } from '../app/types';

export type CinematicSettings = {
  /** 0 = no vignette, 1 = black corners. */
  vignette: number;
  exposure: number;
};

/** The single place to tune the colour grade per stage; daylight stages get a lighter vignette so they stay open. */
const settingsByStage: Record<StageRecord['backdrop']['variant'], CinematicSettings> = {
  hangar: { vignette: 0.75, exposure: 0.95 },
  forest: { vignette: 0.55, exposure: 1 },
  'ruined-city': { vignette: 0.65, exposure: 1 },
  space: { vignette: 0.75, exposure: 0.95 },
};

export function getCinematicSettings(stage: Pick<StageRecord, 'backdrop'>): CinematicSettings {
  return settingsByStage[stage.backdrop.variant] ?? settingsByStage.space;
}

/** True for CPU-only WebGL (SwiftShader, llvmpipe, Windows' basic driver), where post effects would stall the page. */
export function isSoftwareRenderer(rendererName: string | undefined): boolean {
  return rendererName !== undefined && /swiftshader|llvmpipe|softpipe|basic render driver/i.test(rendererName);
}

/** The unmasked WebGL renderer name, when the browser exposes it. */
export function getRendererName(context: WebGLRenderingContext | WebGL2RenderingContext): string | undefined {
  const info = context.getExtension('WEBGL_debug_renderer_info');
  return info ? String(context.getParameter(info.UNMASKED_RENDERER_WEBGL)) : undefined;
}
