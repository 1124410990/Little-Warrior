import { _decorator, Component, Node, Vec3 } from 'cc';
import { SkillConfig } from '../core/GameTypes';
import { HitBox } from '../combat/HitBox';
import { resolveAttackBoxOffset } from '../combat/CombatMath';
import { CharacterBase } from '../characters/CharacterBase';
import type { SkillConfigMap } from '../core/GameConfig';
import { getSkillConfig } from '../core/GameConfig';
import { loadSkillConfigs } from '../core/RuntimeGameConfig';

const { ccclass, property } = _decorator;

interface ActiveSkillWindow {
  skill: SkillConfig;
  elapsed: number;
  activated: boolean;
}

/*
 * SkillComponent 负责冷却、判定窗口和攻击框朝向，具体命中结果由 HitBox 处理。
 */
@ccclass('SkillComponent')
export class SkillComponent extends Component {
  @property(HitBox)
  hitBox: HitBox | null = null;

  @property(Node)
  hitBoxRoot: Node | null = null;

  @property
  autoLoadConfig = true;

  private readonly cooldowns = new Map<string, number>();
  private activeWindow: ActiveSkillWindow | null = null;
  private skills: SkillConfigMap = {};

  start(): void {
    if (this.autoLoadConfig) {
      void this.loadSkillsFromConfig();
    }
  }

  applySkills(skills: SkillConfigMap): void {
    this.skills = { ...skills };
  }

  async loadSkillsFromConfig(): Promise<void> {
    try {
      this.applySkills(await loadSkillConfigs());
    } catch (error) {
      console.warn('[SkillComponent] 读取技能配置失败，保留当前技能表', error);
    }
  }

  /*
   * 技能窗口按 activeStart/activeEnd 开关 HitBox，让动画前摇、命中帧和收招可以独立配置。
   */
  tick(deltaTime: number): void {
    this.cooldowns.forEach((value, key) => this.cooldowns.set(key, Math.max(0, value - deltaTime)));

    if (!this.activeWindow) {
      return;
    }

    this.activeWindow.elapsed += deltaTime;
    const { skill, elapsed } = this.activeWindow;
    if (!this.activeWindow.activated && elapsed >= skill.activeStart) {
      this.hitBox?.activate(skill);
      this.activeWindow.activated = true;
    }

    if (elapsed >= skill.activeEnd) {
      this.hitBox?.deactivate();
      this.activeWindow = null;
    }
  }

  canCast(skillId: string): boolean {
    if ((this.cooldowns.get(skillId) ?? 0) > 0) {
      return false;
    }

    try {
      getSkillConfig(this.skills, skillId);
      return true;
    } catch {
      return false;
    }
  }

  /*
   * 释放技能时同步攻击框位置和镜像，保证角色朝向、visual root 翻转与判定方向一致。
   */
  cast(skillId: string, facing: number): boolean {
    if (!this.canCast(skillId)) {
      return false;
    }

    const skill = getSkillConfig(this.skills, skillId);
    this.cooldowns.set(skillId, skill.cooldown);
    this.activeWindow = { skill, elapsed: 0, activated: false };
    if (this.hitBoxRoot) {
      const ownerCharacter = this.getComponent(CharacterBase);
      const position = this.hitBoxRoot.position.clone();
      position.x = resolveAttackBoxOffset(position.x, facing, Boolean(ownerCharacter?.facingVisualRoot));
      this.hitBoxRoot.setPosition(position);
      this.hitBoxRoot.setScale(new Vec3(facing >= 0 ? 1 : -1, 1, 1));
    }
    this.hitBox?.preview(skill);
    return true;
  }

  getCooldownRatio(skillId: string): number {
    let skill: SkillConfig;
    try {
      skill = getSkillConfig(this.skills, skillId);
    } catch {
      return 0;
    }

    return Math.min(1, (this.cooldowns.get(skillId) ?? 0) / skill.cooldown);
  }
}
