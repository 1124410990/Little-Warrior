import { _decorator, Component, Node } from 'cc';
import { SkillConfig } from '../core/GameTypes';
import { HitBox } from '../combat/HitBox';
import { resolveAttackBoxOffset } from '../combat/CombatMath';
import { CharacterBase } from '../characters/CharacterBase';

const { ccclass, property } = _decorator;

const DEFAULT_SKILLS: Record<string, SkillConfig> = {
  basic_1: { id: 'basic_1', displayName: '普攻一段', animationName: 'player_attack_1', attack: 28, skillPower: 1, cooldown: 0.18, activeStart: 0.08, activeEnd: 0.16, knockback: 18, hitStun: 0.18 },
  basic_2: { id: 'basic_2', displayName: '普攻二段', animationName: 'player_attack_2', attack: 32, skillPower: 1.1, cooldown: 0.18, activeStart: 0.08, activeEnd: 0.16, knockback: 22, hitStun: 0.2 },
  basic_3: { id: 'basic_3', displayName: '普攻三段', animationName: 'player_attack_3', attack: 42, skillPower: 1.25, cooldown: 0.3, activeStart: 0.1, activeEnd: 0.2, knockback: 38, hitStun: 0.28 },
  slash_wave: { id: 'slash_wave', displayName: '破风斩', animationName: 'player_skill_slash_wave', attack: 60, skillPower: 1.8, cooldown: 3, activeStart: 0.12, activeEnd: 0.34, knockback: 64, hitStun: 0.38 },
};

interface ActiveSkillWindow {
  skill: SkillConfig;
  elapsed: number;
  activated: boolean;
}

@ccclass('SkillComponent')
export class SkillComponent extends Component {
  @property(HitBox)
  hitBox: HitBox | null = null;

  @property(Node)
  hitBoxRoot: Node | null = null;

  private readonly cooldowns = new Map<string, number>();
  private activeWindow: ActiveSkillWindow | null = null;
  private skills: Record<string, SkillConfig> = DEFAULT_SKILLS;

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
    return (this.cooldowns.get(skillId) ?? 0) <= 0 && Boolean(this.skills[skillId]);
  }

  cast(skillId: string, facing: number): boolean {
    if (!this.canCast(skillId)) {
      return false;
    }

    const skill = this.skills[skillId];
    this.cooldowns.set(skillId, skill.cooldown);
    this.activeWindow = { skill, elapsed: 0, activated: false };
    if (this.hitBoxRoot) {
      const ownerCharacter = this.getComponent(CharacterBase);
      const position = this.hitBoxRoot.position.clone();
      position.x = resolveAttackBoxOffset(position.x, facing, Boolean(ownerCharacter?.facingVisualRoot));
      this.hitBoxRoot.setPosition(position);
    }
    this.hitBox?.preview(skill);
    return true;
  }

  getCooldownRatio(skillId: string): number {
    const skill = this.skills[skillId];
    if (!skill) {
      return 0;
    }
    return Math.min(1, (this.cooldowns.get(skillId) ?? 0) / skill.cooldown);
  }
}
