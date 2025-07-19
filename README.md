# type-multisynq-race

A real-time multiplayer typing race game built with React, TypeScript, TailwindCSS, and synchronized using Multisynq (legacy model-based).

---

## Overview

`type-multisynq-race` is a real-time multiplayer typing game where users can join rooms, wait for other players, and start a synchronized race. Features include countdown, player progress tracking, scoring, leaderboard, and support for singleplayer practice mode.

---

## Project Structure

```
src/
├── App.tsx                # Main app routing
├── main.tsx               # Entry point with context and router
├── TypingGame.tsx         # Core multiplayer game logic and UI
├── components/            # Reusable UI components and pages
├── pages/                 # Standalone game pages (e.g., singleplayer)
├── multisynq/             # Legacy multiplayer model classes
├── contexts/              # Global context for user data
├── config/                # Static configuration files
├── validation/            # Schema validation using Zod
├── assets/                # Fonts, animations, images
├── index.css              # Global stylesheet
```

---

## Key Features

- Real-time multiplayer synchronization (players, scores, progress)
- Countdown timer across all clients
- Singleplayer mode for practice
- Customizable room settings (timer, word count, theme)
- Live leaderboard and final results screen
- Form validation using Zod
- Fully responsive UI with TailwindCSS
- Global context management for user data

---

## Tech Stack

- React + TypeScript
- TailwindCSS
- Zod (for validation)
- Multisynq (via `@multisynq/react`)
- Vite (build tool)

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Create a `.env` file or use Vite’s `import.meta.env`:

```
VITE_MULTISYNQ_API_KEY=your_api_key
VITE_MULTISYNQ_APP_ID=your_app_id
VITE_BACKEND_GEMINI_URL=your_backend_url
VITE_MULTISYNQ_NAME=
VITE_MULTISYNQ_PASSWORD=
```

### 3. Start the development server

```bash
npm run dev
```

---

## Directory Details

### `components/`
Main UI components for the multiplayer experience:
- `RoomLobby.tsx`, `RoomGameWrapper.tsx`: Room flow components
- `RoomSettings.tsx`: Room configuration (timer, word list, etc.)
- `UsernameInput.tsx`: Input form for player name and avatar
- `ui/`: UI helpers like spinners, error messages, etc.

### `multisynq/`
Legacy implementation of Multisynq model classes:
- `TypingModel.ts`, `RoomTypingModel.ts`, `PlayerModel.ts`

Note: These will eventually be removed after migration to a hook-based architecture.

### `contexts/`
Global state management for user profile and session data using React Context.

### `validation/`
Zod schemas for data validation:
- Room settings, user input, and internal state guards

### `config/`
Configuration files and statics:
- Avatar list, game modes, room default presets

### `assets/`
Fonts, Lottie animations, and static images.

---

## Contribution

Contributions are welcome! Feel free to fork the project and submit pull requests, especially for:

- Migrating legacy models to hook-based state
- Enhancing UI/UX and animations
- Implementing new game modes (e.g., Royale)

---

