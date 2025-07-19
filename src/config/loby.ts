
export const ROOM_CODE_CONFIG = {
  MAX_LENGTH: 4,
  TRANSFORM: 'toUpperCase',
} as const;

export const LOBBY_CONTENT = {
  TITLE: "Multiplayer Lobby",
  SUBTITLE: "Create or join a typing race room",
  CREATE_ROOM: {
    title: "Create Room",
    description: "Configure game settings before starting",
    button: "Setup Room Settings",
    fallbackIcon: "🏗️",
  },
  JOIN_ROOM: {
    title: "Join Room",
    description: "Enter a room code to join an existing race",
    label: "Room Code",
    placeholder: "Enter Room Code",
    fallbackIcon: "🚪",
  },
  FOOTER: "Race against friends in real-time typing competitions",
} as const;

