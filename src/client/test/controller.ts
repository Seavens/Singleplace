import { Controller, OnStart } from '@flamework/core';
import { effect } from '@rbxts/charm';
import { Players, RunService } from '@rbxts/services';
import { DataManager } from 'shared';

@Controller({})
export class TestController implements OnStart {
  public onStart(): void {
    if (!RunService.IsStudio()) return;
    const userId = Players.LocalPlayer.UserId;

    const selectMyData = DataManager.selectData(userId);

    effect(() => {
      const data = selectMyData();
      print(`[Test:Data] received update for local player (${userId})`);
      print(`\ttimePlayed:   ${data.profile.timePlayed}`);
      print(`\tloginStreak:  ${data.profile.loginStreak}`);
      print(`\tlastLogin:    ${data.profile.lastLogin}`);
    });
  }
}
