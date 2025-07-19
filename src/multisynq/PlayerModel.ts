import { ReactModel } from "@multisynq/react";
import type { TypingModel } from "./TypingModel";

interface PlayerInitArgs {
  viewId: string;
  parent: TypingModel;
}

export class PlayerModel extends ReactModel {
  viewId!: string;
  score!: number;
  progress!: number;
  index!: number;
  initials!: string;
  parent!: TypingModel;
  wpm: number = 0;
  avatarUrl!: string;

  init({ viewId, parent }: PlayerInitArgs): void {
    super.init({ viewId, parent });
    this.viewId = viewId;
    this.parent = parent;
    this.score = 0;
    this.progress = 0;
    this.index = 0;
    this.initials = "";
    this.wpm = 0;
    this.avatarUrl = "";

    this.subscribe(this.viewId, "set-avatar", this.setAvatar);
    this.subscribe(this.viewId, "typed-word", this.typedWord);
    this.subscribe(this.viewId, "set-initials", this.setInitials);
  }

  get typingModel(): TypingModel {
    return this.parent;
  }

  setAvatar(url: string): void {
    // ✅ ONLY ADD: Simple check to prevent duplicate updates
    if (this.avatarUrl === url) return;
    
    this.avatarUrl = url;
    this.publish("view", "update");
  }

  typedWord(correct: boolean): void {
    if (!this.typingModel.started) return;

    if (correct) {
      this.score++;
      const newIndex = this.index + 1;

      if (newIndex >= this.typingModel.words.length) {
        this.index = newIndex;
        this.progress = 100;
      } else {
        this.index = newIndex;
        this.progress = Math.min(
          (this.score / this.typingModel.words.length) * 100,
          100
        );
      }
    }

    this.updateWPM();
    this.publish("view", "update");
  }

  updateWPM(): void {
    const timeElapsed = this.typingModel.timeLimit - this.typingModel.timeLeft;
    if (timeElapsed > 0) {
      const minutes = timeElapsed / 60;
      this.wpm = Math.round(this.score / minutes);
    } else {
      this.wpm = 0;
    }
  }

  setInitials(initials: string): void {
    if (!initials) return;

    // ✅ ONLY ADD: Simple check to prevent duplicate updates
    if (this.initials === initials) return;

    // Keep original duplicate name check logic
    for (const p of this.typingModel.players.values()) {
      if (p.initials === initials && p.viewId !== this.viewId) {
        return;
      }
    }

    this.initials = initials;

    const old = this.typingModel.highscores[initials] ?? 0;
    if (this.score > old) {
      this.typingModel.setHighscore(initials, this.score);
    }

    this.publish("view", "update");
  }

  reset(): void {
    this.score = 0;
    this.progress = 0;
    this.index = 0;
    this.wpm = 0;
    this.publish("view", "update");
  }

  // Keep all other methods exactly the same
  isCompleted(): boolean {
    return this.index >= this.typingModel.words.length;
  }

  getCompletionPercentage(): number {
    return Math.round(this.progress);
  }

  getCurrentWord(): string | undefined {
    if (this.index < this.typingModel.words.length) {
      return this.typingModel.words[this.index];
    }
    return undefined;
  }

  getRank(): number {
    const allPlayers = Array.from(this.typingModel.players.values());
    const sortedPlayers = allPlayers.sort((a, b) => {
      const aCompleted = a.progress >= 100 ? 1 : 0;
      const bCompleted = b.progress >= 100 ? 1 : 0;

      if (aCompleted !== bCompleted) {
        return bCompleted - aCompleted;
      }

      return b.score - a.score;
    });

    return sortedPlayers.findIndex((p) => p.viewId === this.viewId) + 1;
  }
}

PlayerModel.register("PlayerModel");