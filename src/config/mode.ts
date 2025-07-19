export const MODE_CONFIG = {
  SOLO: {
    label: "solo",
    path: "/settings?mode=single",
  },
  ROYALE: {
    label: "royale", 
    path: "/multiplayer",
  },
} as const;

export const NAVIGATION_DELAY = 100; // Delay in milliseconds for navigation transitions