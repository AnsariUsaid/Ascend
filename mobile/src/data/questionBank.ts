import { QuestionType } from '../store/useAppStore';
import { activePack, BUILT_IN, type Pack, type PackQuestion } from './questionPacks';

/**
 * Challenge questions. The content lives in question packs (see questionPacks.ts
 * and docs/QUESTION_SPEC.md): batch 0 is built into the app, and batches 1..N are
 * downloaded weekly. This file picks questions from the active pack and checks
 * answers; it holds no questions of its own.
 */
export type Question = PackQuestion;

/** The friction ladder caps here; difficulty never climbs past this level. */
export const MAX_LEVEL = 5;
/** Clamp a ladder level to the curated 1..MAX_LEVEL range. */
const clampLevel = (lvl: number) => Math.max(1, Math.min(MAX_LEVEL, lvl));

/** Typing pass bars by level (character-accuracy %): cleaner typing higher up. */
export const TYPING_THRESHOLDS: Record<number, number> = { 1: 85, 2: 87, 3: 90, 4: 93, 5: 95 };

/** Character-accuracy bar (%) a typing answer must meet to pass, by ladder level. */
export function typingThreshold(level: number): number {
  return TYPING_THRESHOLDS[clampLevel(level)];
}

/** Questions for a type + level from a pack, falling back to the built-in batch. */
function poolFrom(pack: Pack, type: QuestionType, lvl: number): Question[] {
  const items = pack[type]?.[String(lvl)];
  return items && items.length ? items : BUILT_IN[type][String(lvl)];
}

function pick<T>(arr: T[], excludeId?: string, idOf?: (t: T) => string): T {
  if (excludeId && idOf) {
    const others = arr.filter((x) => idOf(x) !== excludeId);
    if (others.length) return others[Math.floor(Math.random() * others.length)];
  }
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Fisher–Yates shuffle into a new array (the pack itself is never mutated). */
function shuffled<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Serve a copy with its options in a fresh random order, so the answer's position means nothing. */
const withShuffledOptions = (q: Question): Question =>
  q.options ? { ...q, options: shuffled(q.options) } : q;

/** Next question for a type at a ladder level, avoiding an immediate repeat. */
export function getQuestion(type: QuestionType, level: number, excludeId?: string): Question {
  const q = pick(poolFrom(activePack(), type, clampLevel(level)), excludeId, (x) => x.id);
  return withShuffledOptions(q);
}

/**
 * Look up a specific question again (to resume the one already on screen). Also
 * checks the built-in batch, in case the pack changed since it was shown.
 */
export function findQuestion(type: QuestionType, level: number, id: string): Question | undefined {
  const lvl = clampLevel(level);
  const q =
    poolFrom(activePack(), type, lvl).find((x) => x.id === id) ??
    BUILT_IN[type][String(lvl)].find((x) => x.id === id);
  return q ? withShuffledOptions(q) : undefined;
}

/** Compare a typed math answer, ignoring currency symbols, commas, spaces and units. */
export function normalizeMath(s: string): string {
  return s.replace(/[^0-9.\-]/g, '');
}

// ---- Fuzzy matching for typed trivia (levels 3-5) ----

/** Lowercase, strip accents/punctuation, drop leading articles, collapse spaces. */
function normalizeFuzzy(s: string): string {
  return s
    .normalize('NFD')
    .toLowerCase()
    .replace(/[^\x00-\x7f]/g, '') // NFD split accents above, then drop the non-ASCII marks
    .replace(/[^a-z0-9\s]/g, '') // drop punctuation
    .replace(/\b(the|a|an)\b/g, ' ') // drop leading-ish articles
    .replace(/\s+/g, ' ')
    .trim();
}

/** Classic edit distance between two strings. */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const curr = [i];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[n];
}

/** True if `needle` tokens appear as a contiguous run inside `hay` tokens. */
function tokensContain(hay: string[], needle: string[]): boolean {
  if (needle.length === 0 || needle.length > hay.length) return false;
  for (let i = 0; i + needle.length <= hay.length; i++) {
    let ok = true;
    for (let j = 0; j < needle.length; j++) {
      if (hay[i + j] !== needle[j]) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  return false;
}

/**
 * Harmless extra words a correct answer may carry ("planet venus", "mount everest").
 * Anything else outside the answer is treated as a guess, so "mercury venus mars"
 * can't clear "venus". Full-name variants ("vincent van gogh") live in `accept`.
 */
const QUALIFIERS = new Set([
  'planet', 'mount', 'mt', 'river', 'lake', 'sea', 'ocean', 'desert', 'island', 'city',
  'country', 'state', 'empire', 'republic', 'saint', 'st', 'sir', 'dr', 'of',
]);

/** Lenient match of typed `input` against one acceptable answer `candidate`. */
function fuzzyOne(input: string, candidate: string): boolean {
  const ni = normalizeFuzzy(input);
  const nc = normalizeFuzzy(candidate);
  if (!ni || !nc) return false;
  if (ni === nc) return true;
  // Numeric answers: compare just the digits, so "80 years" or "1,440" count, but
  // with no typo allowance ("5731" must not pass for "5730").
  if (/^[\d\s]+$/.test(nc)) return ni.replace(/\D/g, '') === nc.replace(/\D/g, '');
  // Answers that mix letters and digits (CO2, O2, Apollo 11) must match exactly.
  if (/\d/.test(nc)) return false;
  // Forgive a small typo on longer answers only, and only if the first letter is right
  // (short words are too easy to swap for a different real word: shin/skin, red/dead).
  const tol = nc.length <= 5 ? 0 : nc.length <= 10 ? 1 : 2;
  if (tol > 0 && ni[0] === nc[0] && levenshtein(ni, nc) <= tol) return true;
  if (nc.length >= 4) {
    const ti = ni.split(' ');
    const tc = nc.split(' ');
    // Input wraps the answer in at most one harmless qualifier ("planet venus").
    if (ti.length === tc.length + 1 && tokensContain(ti, tc)) {
      const extra = ti[0] === tc[0] ? ti[ti.length - 1] : ti[0];
      if (QUALIFIERS.has(extra)) return true;
    }
    // Input is a shorter sub-phrase of the answer ("civil war" -> "american civil war"),
    // but require >=2 words so a lone generic word ("ocean", "war") can't clear it.
    if (ti.length >= 2 && tokensContain(tc, ti)) return true;
  }
  return false;
}

/** Fuzzy-match typed input against a question's answer + accepted variants. */
export function fuzzyMatches(input: string, q: Question): boolean {
  // A listed near-miss ("lactose" for "lactase") never counts, even if it's within
  // the typo allowance.
  const typed = normalizeFuzzy(input);
  if ((q.reject ?? []).some((r) => normalizeFuzzy(r) === typed)) return false;
  return [q.answer, ...(q.accept ?? [])].some((c) => fuzzyOne(input, c));
}

/** Character-level accuracy of `typed` against `reference` (0..100). */
export function typingAccuracy(typed: string, reference: string): number {
  if (typed.length === 0) return 100;
  let correct = 0;
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] === reference[i]) correct++;
  }
  return Math.round((correct / typed.length) * 100);
}
