# Ascend — Question Spec

How every challenge level should feel, so all question batches are written the same way.
Every batch holds Trivia, Logic, Typing and Math. Batch 0 is built into the app; batches 1–3 rotate weekly from the website.

## Rules for every question

- **Difficulty only goes up.** A level-N question must be harder than any level N−1 question.
- **One clear, correct answer.** Fact-checked, timeless (no "current president", no records that change), no trick wording.
- **Global audience.** Metric units; no US-only topics (state capitals, US sports, imperial units, US holidays).
- **Original.** No famous riddles or viral brain-teasers people already know.
- **Short on a phone.** Trivia prompts stay under 200 characters, logic puzzles under 300.
- **Never offensive.** No politics, religion, tragedies or anything upsetting.
- **Every Logic puzzle and Math example is re-solved from scratch** before it ships.

**Batch size:** 20 questions per level per type (Trivia, Logic, Typing and Math: 400 per batch).
Batch 0 is the built-in bank (the offline fallback), written to this same spec.
**IDs:** `b{batch}-{type}{level}-{nn}` with type `t` trivia, `l` logic, `p` typing (passage), `m` math, e.g. `b2-t4-07`. Unique forever.
**Source (local only, gitignored):** each batch is written in `scripts/questions/b{N}.py`; `python3 scripts/questions/b{N}.py` validates it (counts, ids, options, typing lengths, math, and a brute-force solve of every logic puzzle) and writes the JSON.

---

## Trivia

| Level | Format | Feels like | Example |
|---|---|---|---|
| **1** | 4 options | General knowledge; the wrong options are believable | *What gas makes up most of Earth's air?* — **Nitrogen** / Oxygen / Carbon dioxide / Argon |
| **2** | 4 options | Specific knowledge; the wrong options are close calls | *Which planet has the shortest day?* — **Jupiter** / Mercury / Earth / Saturn |
| **3** | Typed, 1–2 words | Recall with no options to lean on | *What is the hardest natural substance on Earth?* → **diamond** |
| **4** | Typed, 1–3 words | Two-step: work out one fact, then use it | *What is the capital of the country where the Taj Mahal stands?* → **New Delhi** |
| **5** | Typed | Combine two or more facts, often with a small calculation | *How many years passed between the first Moon landing and the fall of the Berlin Wall?* → **20** (1969 → 1989) |

**Typed answers (L3–5)** list the spellings to accept and the near-misses to reject:
```json
{ "id": "b1-t3-03", "prompt": "What is the hardest natural substance on Earth?",
  "answer": "Diamond", "accept": ["diamonds"], "reject": ["graphite"] }
```
Typed answers must be short, common words or a number, with one obvious spelling. Avoid answers that differ from a wrong word by one letter (lactase/lactose), unless that wrong word is in `reject`. Numeric answers must match exactly.

## Logic

All multiple choice, exactly one correct option. More options at higher levels make guessing harder.

| Level | Options | Feels like | Example |
|---|---|---|---|
| **1** | 4 | Spot a number or letter pattern | *2, 6, 12, 20, 30, ?* — **42** (gaps +4, +6, +8, +10, +12) |
| **2** | 4 | Three people or things, two clues to combine | *Riya, Sam and Tom own a cat, a dog and a fish. Riya doesn't own the dog. Sam owns the fish. Who owns the cat?* — **Riya** |
| **3** | 5 | Four people, a small ordering puzzle | *Dev, Ali, Mia and Sara race. Mia finishes before Dev. Ali finishes right after Sara. Dev isn't last. Who came second?* — **Dev** |
| **4** | 6 | Truth-teller / liar reasoning | *Exactly one of A, B, C is lying. A: "B is lying." B: "I'm telling the truth." C: "A is lying." Who is lying?* — **A** |
| **5** | 6 | Five people, 4–5 clues including "not" clues, several steps | *A, B, C, D and E sit in a row of five seats. B is in the middle. D sits right next to B, on B's right. C sits at one end. A is not at an end. E sits somewhere left of A. Who sits at the far left?* — **E** |

"Can't tell" may be an option, but only rarely as the right answer.

## Typing

The user copies a passage; accuracy needed: **85% · 87% · 90% · 93% · 95%** (L1 → L5).
Difficulty comes from **tricky characters as well as length**. Repeats are fine here: you still have to type it.

| Level | Length | What makes it harder | Example opening |
|---|---|---|---|
| **1** | 80–120 chars | Simple everyday words, one sentence | *The morning sun rose slowly over the quiet village, painting the rooftops gold.* |
| **2** | 150–220 chars | Two sentences, commas | *Honeybees visit thousands of flowers a day, carrying pollen from plant to plant…* |
| **3** | 250–350 chars | Some numbers and proper nouns | *In 1969, Apollo 11 carried three astronauts to the Moon…* |
| **4** | 400–500 chars | Numbers, names, semicolons, brackets | *The Great Wall stretches over 21,000 km; parts date back more than 2,000 years…* |
| **5** | 550–700 chars | Dense: figures, mixed case, quotes, hyphens | *Light travels at about 299,792 km per second - fast enough to circle Earth 7.5 times…* |

Passages are short, neutral, interesting facts written by us. No quotes from books, songs or websites.
Only plain keyboard characters (no em dashes, curly quotes or accents) so they can be typed on any phone; use ' - ' for a dash.

## Math (pre-generated into each batch by `scripts/questions/common.py`)

Mental math, typed answer. Whole-number answers only, no negatives, no trivial steps (×1, ×10, ÷1, round results), every sum and bracket carries or borrows. Within a level no answer repeats, and no sum repeats across batches.

| Level | Target time | Shape | Examples |
|---|---|---|---|
| **1** | ~10 s | 2-digit × 1-digit, or 3-digit ± 3-digit | `68 × 7` = 476 · `547 + 389` = 936 |
| **2** | ~20 s | 2-digit × 2-digit, or exact 3-digit ÷ 1-digit | `47 × 36` = 1692 · `924 ÷ 7` = 132 |
| **3** | ~30 s | Two operations, brackets or precedence | `(84 − 39) × 14` = 630 · `17 × 23 − 186` = 205 |
| **4** | ~45 s | Three operations, with a square or a percentage | `35% of 680 + 19 × 13` = 485 · `26² − 15 × 28` = 256 |
| **5** | 60–90 s | 3-digit × 2-digit, or four operations to hold in your head | `148 × 27` = 3996 · `18% of 1250 + 37 × 24 − 19²` = 752 |

## Decided

- Typing passages shorter (~100 → ~650 chars) and 20 per level.
- Trivia and Logic shifted up one level, with a new, harder level 5. Typing keeps its ladder.
- Math rebuilt so every level is harder; level 5 should take about a minute.
- The built-in bank is rewritten to this spec as batch 0.
- **3 weekly batches** (1–3) plus the built-in batch 0. Math is pre-written into every batch (generated offline, verified by recomputing every answer).
- Each batch was reviewed by two independent agents (trivia facts; logic, typing and math) and fixed before shipping.
