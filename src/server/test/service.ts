import { Service, OnStart } from '@flamework/core';
import { RunService } from '@rbxts/services';
import { DataManager } from 'shared/data/state';
import { PlayerStateService } from 'server/players';

@Service({})
export class TestService implements OnStart {
  public constructor(private readonly playerService: PlayerStateService) {}

  public onStart(): void {
    if (!RunService.IsStudio()) return;
    this.playerService.onPlayerLoaded((player) => this.onPlayerLoaded(player));
  }

  private onPlayerLoaded(player: Player): void {
    const { UserId: id, Name: name } = player;

    // 1. Log initial data after load (loginStreak/lastLogin already applied by this point)
    const initial = DataManager.getData(id);
    print(`[Test:Data] ${name} loaded`);
    print(`  timePlayed:   ${initial.profile.timePlayed}`);
    print(`  loginStreak:  ${initial.profile.loginStreak}`);
    print(`  lastLogin:    ${initial.profile.lastLogin}`);

    // 2. After 3s, mutate timePlayed and verify the atom + replication picks it up
    task.delay(3, () => {
      print(`[Test:Data] ${name} — applying updateData...`);

      DataManager.updateData(id, (data) => {
        data.profile.timePlayed += 999;
      });

      const updated = DataManager.getData(id);
      print(`[Test:Data] ${name} after mutation:`);
      print(`\ttimePlayed: ${updated.profile.timePlayed} (expected +999)`);
      print(`\tloginStreak: ${updated.profile.loginStreak} (expected unchanged)`);
      print(`\tlastLogin: ${updated.profile.lastLogin} (expected unchanged)`);
    });
  }
}
