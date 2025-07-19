import { THEMES } from "../src/config/roomsetting";

export interface ImageWithFallbackProps {
  src: string;
  alt: string;
  fallbackIcon: string;
  className?: string;
}

export interface RoomSettingsProps {
  mode?: "create" | undefined;
}

export type RoomMode = "single" | "multi";
export type Theme = (typeof THEMES)[number];

export interface FormData {
  sentenceLength: string;
  timeLimit: string;
  maxPlayers: string;
  theme: Theme | "";
}

