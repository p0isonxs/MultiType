export const VALIDATION_RULES = {
  SENTENCE_LENGTH: { min: 10, max: 40 },
  TIME_LIMIT: { min: 30, max: 120 },
  MAX_PLAYERS: { min: 2, max: 6 },
} as const;


