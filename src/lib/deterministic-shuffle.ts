// Seeded PRNG (mulberry32) fed by a djb2-style string hash, so a given seed
// always produces the same shuffle — same order on every refresh and every
// replay. Display order only; winner selection already happened server-side
// before any of this runs.

function hashSeed(seed: string): number {
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) + hash + seed.charCodeAt(i)) >>> 0;
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function deterministicShuffle<T>(items: T[], seed: string): T[] {
  const random = mulberry32(hashSeed(seed));
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Evenly samples up to `maxCount` indices from [0, endIndex], always ending
// on endIndex — caps how many stops the Participant Reveal shows for large
// ticket pools while keeping the sequence fully deterministic.
export function sampleStepIndices(endIndex: number, maxCount: number): number[] {
  if (endIndex <= 0) return [0];
  const count = Math.min(endIndex + 1, Math.max(2, maxCount));
  const steps: number[] = [];
  for (let i = 0; i < count; i++) {
    const index = Math.round((i / (count - 1)) * endIndex);
    if (steps[steps.length - 1] !== index) steps.push(index);
  }
  if (steps[steps.length - 1] !== endIndex) steps.push(endIndex);
  return steps;
}

// A deterministic ease-out delay curve for the Participant Reveal "slot
// stop" — fast at the start, slow as it nears the winning ticket.
export function stepDelayMs(stepIndex: number, totalSteps: number): number {
  const MIN_DELAY = 45;
  const MAX_DELAY = 480;
  const progress = totalSteps <= 1 ? 1 : stepIndex / (totalSteps - 1);
  const eased = 1 - Math.pow(1 - progress, 3);
  return Math.round(MIN_DELAY + (MAX_DELAY - MIN_DELAY) * eased);
}
