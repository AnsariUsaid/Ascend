import { QuestionType } from '../store/useAppStore';

export type Question = {
  prompt: string;
  /** Expected answer (exact for typing; numeric/string otherwise). */
  answer: string;
  /** Reference sentence for the typing variant. */
  reference?: string;
};

const TYPING_SENTENCES = [
  'The quick brown fox jumped over the lazy dog near the riverside.',
  'Bright autumn leaves drifted slowly across the quiet, narrow courtyard.',
  'Seventeen curious sparrows gathered by the old fountain at half past nine.',
  'Punctuation matters: clarity, rhythm, and pace shape every careful sentence!',
  'In 1923, exactly 48 travelers crossed the bridge — quietly, before sunrise.',
];

const TRIVIA = [
  { prompt: 'What is the capital of Japan?', answer: 'tokyo' },
  { prompt: 'How many continents are there?', answer: '7' },
  { prompt: 'What planet is known as the Red Planet?', answer: 'mars' },
];

const LOGIC = [
  { prompt: 'If all Bloops are Razzies and all Razzies are Lazzies, are all Bloops Lazzies? (yes/no)', answer: 'yes' },
  { prompt: 'Next in sequence: 2, 4, 8, 16, ?', answer: '32' },
  { prompt: 'A is taller than B. C is shorter than B. Who is tallest? (A/B/C)', answer: 'a' },
];

/**
 * Minimal placeholder generator for the friction preview. The real curated
 * question bank + difficulty escalation arrives in Milestone 3.
 */
export function generateQuestion(type: QuestionType, level: number): Question {
  switch (type) {
    case 'math': {
      const span = 4 + level * 3;
      const a = 6 + Math.floor(Math.random() * span);
      const b = 3 + Math.floor(Math.random() * span);
      if (level >= 3) {
        // simple linear equation: a*x + c = result
        const x = 2 + Math.floor(Math.random() * 9);
        const c = 1 + Math.floor(Math.random() * 20);
        return { prompt: `Solve for x:  ${a}x + ${c} = ${a * x + c}`, answer: String(x) };
      }
      return { prompt: `What is ${a} × ${b}?`, answer: String(a * b) };
    }
    case 'trivia':
      return TRIVIA[(level - 1) % TRIVIA.length];
    case 'logic':
      return LOGIC[(level - 1) % LOGIC.length];
    case 'typing': {
      const ref = TYPING_SENTENCES[Math.min(level - 1, TYPING_SENTENCES.length - 1)];
      return { prompt: 'Type the sentence exactly.', answer: ref, reference: ref };
    }
  }
}

export function normalizeAnswer(s: string) {
  return s.trim().toLowerCase();
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
