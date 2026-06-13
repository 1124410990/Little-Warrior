import { _decorator, Component, Label, ProgressBar } from 'cc';
import { CharacterBase } from '../characters/CharacterBase';
import { SkillComponent } from '../skills/SkillComponent';

const { ccclass, property } = _decorator;

/*
 * 玩家 HUD 只做状态展示，不缓存战斗数值，避免显示层与角色组件出现双数据源。
 */
@ccclass('CombatHud')
export class CombatHud extends Component {
  @property(CharacterBase)
  player: CharacterBase | null = null;

  @property(SkillComponent)
  skills: SkillComponent | null = null;

  @property(ProgressBar)
  hpBar: ProgressBar | null = null;

  @property(ProgressBar)
  skillCooldownBar: ProgressBar | null = null;

  @property(Label)
  hpLabel: Label | null = null;

  /*
   * 原型期每帧刷新足够简单稳定；后续 UI 增多时可改为订阅角色事件降低开销。
   */
  update(): void {
    if (this.player && this.hpBar) {
      this.hpBar.progress = this.player.getHpRatio();
    }

    if (this.player && this.hpLabel) {
      this.hpLabel.string = `${this.player.getHp()} / ${this.player.maxHp}`;
    }

    if (this.skills && this.skillCooldownBar) {
      this.skillCooldownBar.progress = 1 - this.skills.getCooldownRatio('slash_wave');
    }
  }
}
