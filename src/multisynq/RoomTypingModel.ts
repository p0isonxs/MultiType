// ✅ UPDATED - File: src/multisynq/RoomTypingModel.ts
import { TypingModel } from './TypingModel';

export class RoomTypingModel extends TypingModel {
  private settingsInitialized = false;

  // ✅ Static approach for room settings
  static roomSettings: any = null;


  static setRoomSettings(settings: any): void {
    RoomTypingModel.roomSettings = settings;


  }

  init(options: any = {}): void {
    // Subscribe to settings broadcast BEFORE calling super.init
    this.subscribe("room", "sync-settings", this.syncRoomSettings);

    super.init(options);

    if (this.settingsInitialized) {
      return;
    }

    // ✅ Use static settings for initial setup
    let roomSettings = {};

    if (RoomTypingModel.roomSettings) {
      roomSettings = RoomTypingModel.roomSettings;

      // Host: Apply settings immediately and broadcast
      this.applyRoomSettings(roomSettings);
      this.settingsInitialized = true;

      // Broadcast to other players after a short delay
      this.future(1000).broadcastRoomSettings(roomSettings);

    } else {

      // Guest: Use defaults temporarily, wait for host broadcast
      roomSettings = {
        sentenceLength: 30,
        timeLimit: 60,
        maxPlayers: 4,
        theme: 'random',
        words: []
      };
      this.applyRoomSettings(roomSettings);
    }
  }

  // ✅ Host broadcasts settings to all players
  broadcastRoomSettings(settings: any): void {

    this.publish("room", "sync-settings", settings);
    this.publish("view", "update"); // Trigger UI update
  }

  syncRoomSettings(settings: any): void {
    if (!settings || this.settingsInitialized) return;

    // ✅ CRITICAL: Apply exact same words array, don't regenerate


    this.theme = settings.theme;
    this.sentenceLength = settings.sentenceLength;
    this.timeLimit = settings.timeLimit;
    this.maxPlayers = settings.maxPlayers;
    this.words = [...settings.words]; // Use exact same words





    this.timeLeft = settings.timeLimit;

    this.settingsInitialized = true;
    RoomTypingModel.roomSettings = settings;


    this.publish("view", "update");
  }

  // ✅ OVERRIDE: When new player joins, host re-broadcasts settings
  handleViewJoin(viewId: string): void {
    super.handleViewJoin(viewId);

    // If we're host (have settings) and someone joins, re-broadcast
    if (RoomTypingModel.roomSettings && this.players.size > 1) {
      this.future(500).broadcastRoomSettings(RoomTypingModel.roomSettings);

    }
  }
}

RoomTypingModel.register('RoomTypingModel');