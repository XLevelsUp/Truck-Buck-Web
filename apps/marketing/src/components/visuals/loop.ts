import type { CSSProperties } from "react";

/**
 * One clock for every looping visual: route → fare → assigned → tracking.
 * 10s total, 2.5s per step (brief: 6–10s). Each step's element shares one
 * keyframe and is phase-shifted with a negative delay, so step i is visible
 * during [i·2.5s, (i+1)·2.5s). Only opacity and transform animate.
 */
export const LOOP_S = 10;
export const LOOP_STEPS = 4;
const STEP_S = LOOP_S / LOOP_STEPS;

export const loopPhase = (index: number): CSSProperties => ({
  animationDelay: `${index * STEP_S - LOOP_S}s`,
});
