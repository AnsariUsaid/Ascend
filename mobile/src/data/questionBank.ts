import { QuestionType } from '../store/useAppStore';

export type Question = {
  id: string;
  prompt: string;
  /** Expected answer. Compared exactly for typing, else case/space-insensitive. */
  answer: string;
  /** Reference sentence for the typing variant (equals `answer`). */
  reference?: string;
};

/** Clamp a ladder level to the curated 1..5 range. */
const clampLevel = (lvl: number) => Math.max(1, Math.min(5, lvl));

// ---- Curated bank (trivia / logic / typing), indexed by level 1..5 ----

const TRIVIA: Record<number, Question[]> = {
  1: [
    { id: 't1a', prompt: 'What is the capital of Japan?', answer: 'tokyo' },
    { id: 't1b', prompt: 'How many continents are there?', answer: '7' },
    { id: 't1c', prompt: 'What colour do you get mixing blue and yellow?', answer: 'green' },
  ],
  2: [
    { id: 't2a', prompt: 'What planet is known as the Red Planet?', answer: 'mars' },
    { id: 't2b', prompt: 'How many sides does a hexagon have?', answer: '6' },
    { id: 't2c', prompt: 'What is the largest ocean on Earth?', answer: 'pacific' },
  ],
  3: [
    { id: 't3a', prompt: 'In what year did World War II end?', answer: '1945' },
    { id: 't3b', prompt: 'What is the chemical symbol for gold?', answer: 'au' },
    { id: 't3c', prompt: 'Who wrote "Romeo and Juliet"?', answer: 'shakespeare' },
  ],
  4: [
    { id: 't4a', prompt: 'What is the square root of 144?', answer: '12' },
    { id: 't4b', prompt: 'How many bones are in the adult human body?', answer: '206' },
    { id: 't4c', prompt: 'What is the capital of Australia?', answer: 'canberra' },
  ],
  5: [
    { id: 't5a', prompt: 'What is the speed of light in km/s (nearest 1000)?', answer: '300000' },
    { id: 't5b', prompt: 'Which element has atomic number 26?', answer: 'iron' },
    { id: 't5c', prompt: 'In what year did the Berlin Wall fall?', answer: '1989' },
  ],
};

const LOGIC: Record<number, Question[]> = {
  1: [
    { id: 'l1a', prompt: 'Next in sequence: 2, 4, 6, 8, ?', answer: '10' },
    { id: 'l1b', prompt: 'If today is Monday, what day is in 2 days?', answer: 'wednesday' },
  ],
  2: [
    { id: 'l2a', prompt: 'Next in sequence: 2, 4, 8, 16, ?', answer: '32' },
    { id: 'l2b', prompt: 'A is taller than B. C is shorter than B. Who is tallest? (A/B/C)', answer: 'a' },
  ],
  3: [
    { id: 'l3a', prompt: 'If all Bloops are Razzies and all Razzies are Lazzies, are all Bloops Lazzies? (yes/no)', answer: 'yes' },
    { id: 'l3b', prompt: 'Next in sequence: 1, 1, 2, 3, 5, 8, ?', answer: '13' },
  ],
  4: [
    { id: 'l4a', prompt: 'Next in sequence: 3, 6, 11, 18, 27, ?', answer: '38' },
    { id: 'l4b', prompt: 'Tom is twice Sam’s age. In 5 years their ages sum to 40. How old is Sam now?', answer: '10' },
  ],
  5: [
    { id: 'l5a', prompt: 'Next in sequence: 2, 3, 5, 7, 11, 13, ?', answer: '17' },
    { id: 'l5b', prompt: 'A clock shows 3:15. What is the angle between the hands (degrees)?', answer: '7.5' },
  ],
};

const TYPING_SENTENCES: Record<number, string[]> = {
  1: ['The cat sat on the warm mat.', 'A small bird sang at dawn.'],
  2: ['The quick brown fox jumped over the lazy dog.', 'Bright autumn leaves drifted across the yard.'],
  3: [
    'Seventeen curious sparrows gathered by the old fountain at noon.',
    'She carefully balanced the tray while crossing the crowded room.',
  ],
  4: [
    'Punctuation matters: clarity, rhythm, and pace shape every careful sentence!',
    'The committee reviewed forty-two proposals before reaching a quiet consensus.',
  ],
  5: [
    'In 1923, exactly 48 travelers crossed the bridge — quietly, before sunrise.',
    'Complexity (when unmanaged) breeds 99 problems; simplicity solves them, mostly.',
  ],
};

function pick<T>(arr: T[], excludeId?: string, idOf?: (t: T) => string): T {
  if (excludeId && idOf) {
    const others = arr.filter((x) => idOf(x) !== excludeId);
    if (others.length) return others[Math.floor(Math.random() * others.length)];
  }
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateMath(level: number): Question {
  const span = 4 + level * 3;
  const a = 6 + Math.floor(Math.random() * span);
  const b = 3 + Math.floor(Math.random() * span);
  if (level >= 3) {
    const x = 2 + Math.floor(Math.random() * 9);
    const c = 1 + Math.floor(Math.random() * 20);
    return {
      id: `math-eq-${Date.now()}-${Math.random()}`,
      prompt: `Solve for x:  ${a}x + ${c} = ${a * x + c}`,
      answer: String(x),
    };
  }
  return {
    id: `math-${Date.now()}-${Math.random()}`,
    prompt: `What is ${a} × ${b}?`,
    answer: String(a * b),
  };
}

/** Next question for a type at a ladder level, avoiding an immediate repeat. */
export function getQuestion(type: QuestionType, level: number, excludeId?: string): Question {
  const lvl = clampLevel(level);
  switch (type) {
    case 'math':
      return generateMath(level);
    case 'trivia':
      return pick(TRIVIA[lvl], excludeId, (q) => q.id);
    case 'logic':
      return pick(LOGIC[lvl], excludeId, (q) => q.id);
    case 'typing': {
      const sentences = TYPING_SENTENCES[lvl];
      const ref = pick(sentences, excludeId, (s) => `type-${lvl}-${s}`);
      return { id: `type-${lvl}-${ref}`, prompt: 'Type the sentence exactly.', answer: ref, reference: ref };
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
