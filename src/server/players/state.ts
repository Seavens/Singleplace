import type { OnStart } from '@flamework/core';

import { Service } from '@flamework/core';
import { Signal } from '@rbxts/beacon';
import { Players } from '@rbxts/services';
import { DataManager } from 'shared';
import { applyLoginStreak } from './streak';

@Service({})
export class PlayerStateService implements OnStart {
  private readonly players = new Set<Player>();
  private readonly loadedPlayers = new Set<Player>();

  private readonly playerAdded = new Signal<[player: Player]>();
  private readonly playerLoaded = new Signal<[player: Player]>();
  private readonly playerRemoving = new Signal<[player: Player]>();

  public onStart(): void {
    Players.PlayerAdded.Connect((player) => this.handlePlayerAdded(player));
    Players.PlayerRemoving.Connect((player) => this.handlePlayerRemoving(player));

    for (const player of Players.GetPlayers()) {
      this.handlePlayerAdded(player);
    }
  }

  public onPlayerAdded(callback: (player: Player) => void): RBXScriptConnection {
    for (const player of this.players) {
      task.spawn(callback, player);
    }
    return this.playerAdded.Connect(callback);
  }

  public onPlayerLoaded(callback: (player: Player) => void): RBXScriptConnection {
    for (const player of this.loadedPlayers) {
      task.spawn(callback, player);
    }
    return this.playerLoaded.Connect(callback);
  }

  public onPlayerRemoving(callback: (player: Player) => void): RBXScriptConnection {
    return this.playerRemoving.Connect(callback);
  }

  public getPlayers(): ReadonlyArray<Player> {
    return [...this.players];
  }

  public getLoadedPlayers(): ReadonlyArray<Player> {
    return [...this.loadedPlayers];
  }

  public getPlayerByUserId(userId: number): Player | undefined {
    for (const player of this.players) {
      if (player.UserId === userId) {
        return player;
      }
    }
    return undefined;
  }

  public isPlayerLoaded(userId: number): boolean {
    for (const player of this.loadedPlayers) {
      if (player.UserId === userId) {
        return true;
      }
    }
    return false;
  }

  public markPlayerLoaded(player: Player): void {
    if (!this.players.has(player) || this.loadedPlayers.has(player)) {
      return;
    }

    this.loadedPlayers.add(player);

    DataManager.updateData(player.UserId, (data) => {
      const streakUpdate = applyLoginStreak(data.profile, DateTime.now());
      data.profile.loginStreak = streakUpdate.loginStreak;
      data.profile.lastLogin = streakUpdate.lastLogin;
    });

    this.playerLoaded.Fire(player);
  }

  private handlePlayerAdded(player: Player): void {
    if (this.players.has(player)) {
      return;
    }

    this.players.add(player);
    this.playerAdded.Fire(player);
  }

  private handlePlayerRemoving(player: Player): void {
    if (!this.players.has(player)) {
      return;
    }

    this.players.delete(player);
    this.loadedPlayers.delete(player);
    this.playerRemoving.Fire(player);
  }
}
