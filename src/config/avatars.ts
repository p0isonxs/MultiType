// src/config/avatars.ts

export const AVATAR_CONFIG = {
  avatars: Array.from({ length: 6 }, (_, i) => `/avatars/avatar${i + 1}.png`),
  defaultAvatar: `/avatars/avatar1.png`,
} as const;