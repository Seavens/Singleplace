import { Service, OnStart } from '@flamework/core';
import { PlayerStateService } from './state';
import { Clock, DataManager } from 'shared';

@Service({})
export class SessionTimeService implements OnStart {
  private readonly sessionStartTimes = new Map<number, number>();
  private readonly saveTimer = new Clock(60);

  public constructor(private readonly playerService: PlayerStateService) {}

  public onStart(): void {
    this.playerService.onPlayerLoaded((player) => {
      this.sessionStartTimes.set(player.UserId, os.time());
    });

    this.playerService.onPlayerRemoving((player) => {
      this.saveSessionTime(player.UserId);
      this.sessionStartTimes.delete(player.UserId);
    });

    this.saveTimer.on(() => this.saveAllSessionTimes());
  }

  private saveSessionTime(userId: number): void {
    const startTime = this.sessionStartTimes.get(userId);
    if (startTime === undefined) {
      return;
    }

    const sessionDuration = os.time() - startTime;
    if (sessionDuration <= 0) {
      return;
    }

    DataManager.updateData(userId, (data) => {
      data.profile.timePlayed += sessionDuration;
    });

    this.sessionStartTimes.set(userId, os.time());
  }

  private saveAllSessionTimes(): void {
    for (const player of this.playerService.getLoadedPlayers()) {
      this.saveSessionTime(player.UserId);
    }
  }
}
