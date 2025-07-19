// ✅ COMPLETE FIX - File: src/multisynq/TypingModel.ts
import { ReactModel } from "@multisynq/react";
import { PlayerModel } from "./PlayerModel";

type Highscores = Record<string, number>;

interface RoomSettings {
  sentenceLength: number;
  timeLimit: number;
  maxPlayers: number;
  theme: string;
  words: string[];
}
interface ChatMessage {
  id: string;
  viewId: string;
  initials: string;
  avatarUrl: string;
  message: string;
  timestamp: number;
}

interface TypingModelOptions {
  roomSettings?: Partial<RoomSettings>;
}

export class TypingModel extends ReactModel {
  words!: string[];
  players!: Map<string, PlayerModel>;
  started!: boolean;
  timeLeft!: number;
  highscores!: Highscores;
  gameTickScheduled = false;
  sentenceLength!: number;
  theme!: string;
  timeLimit!: number;
  maxPlayers!: number;
  roomSettingsInitialized = false;

  // ✅ NEW: Synchronized countdown state
  countdownActive!: boolean;
  countdown!: number;
  countdownTickScheduled = false;
  chatMessages!: ChatMessage[];

  // ✅ Anti-loop optimization
  private lastViewUpdateTime = 0;

  init(options: TypingModelOptions = {}): void {
    super.init(options);

    // Keep all original logic unchanged
    this.subscribe("room", "initialize-settings", this.initializeRoomSettings);
    this.subscribe("game", "start", this.startGame);
    this.subscribe("game", "reset", this.resetGame);
    this.subscribe("game", "state-sync", this.restoreGameState);
    this.subscribe("game", "request-state", this.handleStateRequest);

    this.setDefaultSettings();

    if (options.roomSettings && Object.keys(options.roomSettings).length > 0) {
      this.applyRoomSettings(options.roomSettings);
      this.roomSettingsInitialized = true;
    }

    this.players = new Map();
    this.started = false;
    this.timeLeft = this.timeLimit;
    this.highscores = {};

    // ✅ Initialize countdown state
    this.countdownActive = false;
    this.countdown = 3;

    this.chatMessages = [];
    this.subscribe("chat", "message", this.handleChatMessage);
  }

  setDefaultSettings(): void {
    this.theme = "tech";
    this.sentenceLength = 30;
    this.timeLimit = 60;
    this.maxPlayers = 4;
    this.words = this.generateWords(this.sentenceLength, this.theme);
    // this.shuffle(this.words);
  }

  initializeRoomSettings(settings: Partial<RoomSettings>): void {
    if (!this.roomSettingsInitialized) {
      this.applyRoomSettings(settings);
      this.roomSettingsInitialized = true;
      this.throttledViewUpdate();
    }
  }

  handleStateRequest(requesterId: string): void {
    // ✅ PREVENT LOOP: Only respond if we have players and requester is different
    if (!requesterId || this.players.size === 0) return;

    const playerIds = Array.from(this.players.keys());
    const hostId = playerIds[0];

    // ✅ PREVENT LOOP: Don't respond to self or if not host
    if (!hostId || requesterId === hostId) return;

    // ✅ THROTTLE: Only respond once per requester per session
    const now = this.now();
    if (this.lastStateRequestTime[requesterId] &&
      now - this.lastStateRequestTime[requesterId] < 5000) {
      return;
    }

    this.lastStateRequestTime[requesterId] = now;

    this.future(500).saveGameState();
  }

  applyRoomSettings(settings: Partial<RoomSettings>): void {
    if (settings.theme) this.theme = settings.theme;
    if (settings.sentenceLength) this.sentenceLength = settings.sentenceLength;
    if (settings.timeLimit) this.timeLimit = settings.timeLimit;
    if (settings.maxPlayers) this.maxPlayers = settings.maxPlayers;

    // ✅ REPLACE existing words generation logic with this:
    if (settings.words && settings.words.length > 0) {
      this.words = [...settings.words];

    } else {
      // Only generate if we don't have words yet
      if (!this.words || this.words.length === 0) {
        this.words = this.generateWords(this.sentenceLength, this.theme);




      }
    }

    // ✅ CRITICAL: Don't shuffle if words are already set from settings
    if (!settings.words || settings.words.length === 0) {
      this.shuffle(this.words);
    }
  }

  handleViewJoin(viewId: string): void {
    // ✅ Check if player already exists
    if (this.players.has(viewId)) {
      this.publish("game", "request-state", viewId);
      return;
    }

    if (this.players.size >= this.maxPlayers) {
      this.publish(viewId, "room-full");
      return;
    }

    const player = PlayerModel.create({ viewId, parent: this }) as PlayerModel;
    this.players.set(viewId, player);

    // ✅ NEW: Request current game state from existing players
    if (this.players.size > 1) {
      this.publish("game", "request-state", viewId);
    }

    if (this.players.size === 1) {
      this.future(500).checkAndInitializeSettings();
    }

    this.throttledViewUpdate();
  }

  checkAndInitializeSettings(roomSettings?: any): void {
    if (!this.roomSettingsInitialized) {
      if (roomSettings && Object.keys(roomSettings).length > 0) {
        this.publish("room", "initialize-settings", roomSettings);
      }
    }
  }

  handleViewExit(viewId: string): void {
    const player = this.players.get(viewId);
    if (player) {
      player.destroy();
    }
    this.players.delete(viewId);

    this.throttledViewUpdate();
  }

  // ✅ Simple throttle function - prevents spam updates
  private throttledViewUpdate(): void {
    const now = this.now();
    if (now - this.lastViewUpdateTime > 100) {
      this.lastViewUpdateTime = now;
      this.publish("view", "update");
    }
  }

  // ✅ NEW: Start game with countdown
  startGame(): void {
    if (this.started || this.countdownActive) return;

    // ✅ FIXED: Reset and start countdown properly
    this.countdownActive = true;
    this.countdown = 3;
    this.countdownTickScheduled = false; // Reset this flag

    // ✅ CRITICAL: Publish immediately so all players see countdown: 3
    this.publish("view", "update");

    // ✅ FIXED: Wait longer before starting countdown to ensure navigation
    this.future(1500).scheduleCountdownTick();

  }

  // ✅ NEW: Countdown tick system
  scheduleCountdownTick(): void {
    if (!this.countdownTickScheduled) {
      this.countdownTickScheduled = true;
      this.future(1000).countdownTick();
    }
  }

  countdownTick(): void {
    this.countdownTickScheduled = false;

    if (!this.countdownActive) return;

    // ✅ FIXED: Decrement AFTER displaying current number
    if (this.countdown > 0) {
      this.countdown--;
      this.publish("view", "update");

      if (this.countdown > 0) {
        // Continue countdown
        this.scheduleCountdownTick();
      } else {
        // Countdown finished (reached 0), show "GO!" briefly then start
        this.future(500).finishCountdown();
      }
    }
  }

  // ✅ NEW: Finish countdown and start game
  finishCountdown(): void {
    this.countdownActive = false;
    this.actuallyStartGame();
  }
  // ✅ ADD: Handle chat messages
  handleChatMessage(message: ChatMessage): void {
    // Validate message
    if (!message.viewId || !message.message || !message.message.trim()) {
      return;
    }

    // Check if player exists
    const player = this.players.get(message.viewId);
    if (!player) {
      return;
    }

    // Add timestamp if not present
    if (!message.timestamp) {
      message.timestamp = this.now();
    }

    // Ensure unique message ID
    if (!message.id) {
      message.id = `${message.viewId}-${message.timestamp}`;
    }

    // Add to messages (keep only last 50 messages for performance)
    this.chatMessages.push(message);
    if (this.chatMessages.length > 50) {
      this.chatMessages = this.chatMessages.slice(-50);
    }

    // Broadcast to all players
    this.publish("chat", "message-received", message);
  }

  // ✅ NEW: Actually start the game after countdown
  actuallyStartGame(): void {
    this.started = true;
    this.timeLeft = this.timeLimit;

    for (const player of this.players.values()) {
      player.reset();
    }

    // this.shuffle(this.words);
    this.scheduleNextTick();
    this.publish("view", "update");
  }

  resetGame(): void {
    this.started = false;
    this.timeLeft = this.timeLimit;
    this.gameTickScheduled = false;

    // ✅ Reset countdown state
    this.countdownActive = false;
    this.countdown = 3;
    this.countdownTickScheduled = false;
    // ✅ ADD: Clear chat on reset (optional - you might want to keep chat history)
    // this.chatMessages = [];
    this.chatMessages = [];

    for (const player of this.players.values()) {
      player.reset();
    }

    // this.shuffle(this.words);
    this.publish("view", "update");
  }

  scheduleNextTick(): void {
    if (!this.gameTickScheduled) {
      this.gameTickScheduled = true;
      this.future(1000).tick();
    }
  }

  saveGameState(): void {
    const now = this.now();

    // ✅ THROTTLE: Prevent spam saving
  

    this.lastSaveTime = now;

    const gameState = {
      started: this.started,
      timeLeft: this.timeLeft,
      countdownActive: this.countdownActive,
      countdown: this.countdown,
      words: this.words,
      theme: this.theme,
      sentenceLength: this.sentenceLength,
      timeLimit: this.timeLimit,
      maxPlayers: this.maxPlayers,
      roomSettingsInitialized: this.roomSettingsInitialized,
      timestamp: now
    };



    this.publish("game", "state-sync", gameState);
  }

  // ✅ ADD: Throttling variables at class level
  private lastSaveTime = 0;
  private saveThrottleMs = 2000;
  private lastStateRequestTime: Record<string, number> = {};

  restoreGameState(state: any): void {
    if (!state) return;

    // ✅ CRITICAL: Add detailed state comparison to prevent loops
    const currentState = {
      started: this.started,
      timeLeft: this.timeLeft,
      countdownActive: this.countdownActive,
      countdown: this.countdown,
      wordsLength: this.words.length
    };

    const newState = {
      started: state.started || false,
      timeLeft: state.timeLeft || this.timeLimit,
      countdownActive: state.countdownActive || false,
      countdown: state.countdown || 3,
      wordsLength: state.words ? state.words.length : this.words.length
    };

    // ✅ PREVENT LOOP: Only restore if there's actual meaningful difference
    const hasSignificantChange =
      currentState.started !== newState.started ||
      Math.abs(currentState.timeLeft - newState.timeLeft) > 1 ||
      currentState.countdownActive !== newState.countdownActive ||
      currentState.wordsLength !== newState.wordsLength;

  

    this.started = newState.started;
    this.timeLeft = newState.timeLeft;
    this.countdownActive = newState.countdownActive;
    this.countdown = newState.countdown;

    // ✅ Only update words if actually different
    if (state.words && state.words.length !== this.words.length) {
      this.words = [...state.words];
    }

    if (state.theme) this.theme = state.theme;
    if (state.sentenceLength) this.sentenceLength = state.sentenceLength;
    if (state.timeLimit) this.timeLimit = state.timeLimit;
    if (state.maxPlayers) this.maxPlayers = state.maxPlayers;
    if (state.roomSettingsInitialized !== undefined) {
      this.roomSettingsInitialized = state.roomSettingsInitialized;
    }

    this.publish("view", "update");
  }

  tick(): void {
    this.gameTickScheduled = false;

    if (!this.started) return;

    this.timeLeft--;

    // ✅ MOVE: Sync every 10 seconds during active game (BEFORE timeLeft check)
    if (this.timeLeft > 0 && this.timeLeft % 10 === 0) {
      this.saveGameState();
    }

    this.publish("view", "update");

    if (this.timeLeft > 0) {
      this.scheduleNextTick();
    } else {
      this.started = false;

      for (const player of this.players.values()) {
        if (player.initials) {
          this.setHighscore(player.initials, player.score);
        }
      }

      this.publish("view", "update");
    }
  }

  setHighscore(initials: string, score: number): void {
    if (this.highscores[initials] >= score) return;

    this.highscores[initials] = score;
    this.publish("view", "update");
    this.publish("view", "new-highscore", { initials, score });
  }

  getPlayer(viewId: string): PlayerModel | undefined {
    return this.players.get(viewId);
  }

  getGameState() {
    return {
      started: this.started,
      timeLeft: this.timeLeft,
      timeLimit: this.timeLimit,
      theme: this.theme,
      sentenceLength: this.sentenceLength,
      maxPlayers: this.maxPlayers,
      playerCount: this.players.size,
      words: this.words,
      highscores: this.highscores,
      roomSettingsInitialized: this.roomSettingsInitialized,
      countdownActive: this.countdownActive,
      countdown: this.countdown,
      chatMessages: this.chatMessages,
    };
  }

  // Keep all other methods exactly the same
  generateWords(length: number, theme: string): string[] {
    const wordLibrary = {
      tech: [
        "blockchain",
        "decentralized",
        "smart",
        "contract",
        "crypto",
        "wallet",
        "DAO",
        "NFT",
        "dApp",
        "token",
        "ledger",
        "protocol",
        "consensus",
        "mining",
        "staking",
      ],
      multisynq: [
        "multisynq",
        "sync",
        "real",
        "time",
        "multi",
        "player",
        "react",
        "model",
        "view",
        "event",
        "publish",
        "subscribe",
        "session",
        "client",
        "server",
        "network",
        "peer",
        "node",
        "distributed",
      ],

      monad: [
        "monad",
        "evm",
        "layer1",
        "block",
        "finality",
        "parallel",
        "tps",
        "transaction",
        "validator",
        "state",
        "consensus",
        "execution",
        "decentralized",
        "security",
        "ethereum",
        "storage",
      ],
      web3: [
        "web3",
        "wallet",
        "smart",
        "contract",
        "dapp",
        "eth",
        "crypto",
        "address",
        "gas",
        "token",
        "sign",
        "dao",
        "blockchain",
        "open",
        "ledger",
        "decentralized",
        "identity",
        "metamask",
        "key",
      ],
      general: [
        "quick",
        "brown",
        "fox",
        "jumps",
        "over",
        "lazy",
        "dog",
        "pack",
        "type",
        "fast",
        "speed",
        "word",
        "text",
        "key",
        "board",
        "finger",
      ],
    };

    const words =
      wordLibrary[theme as keyof typeof wordLibrary] || wordLibrary.general;
    const result = [];
    for (let i = 0; i < length; i++) {
      result.push(words[i % words.length]); // Cycle through available words
    }

    return result;
  }

  shuffle(arr: string[]): void {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
}

TypingModel.register("TypingModel");