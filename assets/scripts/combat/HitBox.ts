import { _decorator, Collider2D, Color, Component, Contact2DType, Graphics, IPhysics2DContact, Node } from 'cc';
import { SkillConfig } from '../core/GameTypes';
import { CharacterBase } from '../characters/CharacterBase';

const { ccclass, property } = _decorator;

@ccclass('HitBox')
export class HitBox extends Component {
  @property(Node)
  owner: Node | null = null;

  private skill: SkillConfig | null = null;
  private active = false;
  private readonly hitTargets = new Set<Node>();

  onLoad(): void {
    const collider = this.getComponent(Collider2D);
    collider?.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
    this.setActive(false);
  }

  onDestroy(): void {
    const collider = this.getComponent(Collider2D);
    collider?.off(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
  }

  activate(skill: SkillConfig): void {
    this.skill = skill;
    this.hitTargets.clear();
    this.drawSkillEffect(skill, true);
    this.setActive(true);
  }

  preview(skill: SkillConfig): void {
    this.skill = skill;
    this.hitTargets.clear();
    this.drawSkillEffect(skill, false);
    this.setActive(false, true);
  }

  deactivate(): void {
    this.setActive(false);
    this.hitTargets.clear();
  }

  private setActive(active: boolean, visible = active): void {
    this.active = active;
    this.node.active = visible;
    const collider = this.getComponent(Collider2D);
    if (collider) {
      collider.enabled = active;
    }
  }

  private drawSkillEffect(skill: SkillConfig, active: boolean): void {
    const graphics = this.getComponent(Graphics);
    if (!graphics) {
      return;
    }

    const isWave = skill.id === 'slash_wave';
    graphics.clear();
    graphics.fillColor = new Color(255, 220, 96, active ? 180 : 90);
    graphics.rect(isWave ? -64 : -48, isWave ? -30 : -22, isWave ? 128 : 96, isWave ? 60 : 44);
    graphics.fill();
    graphics.fillColor = new Color(255, 255, 240, active ? 235 : 140);
    graphics.rect(isWave ? -38 : -30, -8, isWave ? 96 : 72, 16);
    graphics.fill();
    graphics.fillColor = new Color(72, 184, 255, active ? 210 : 120);
    graphics.rect(isWave ? 38 : 24, isWave ? -36 : -26, isWave ? 20 : 14, isWave ? 72 : 52);
    graphics.fill();
  }

  private onBeginContact(self: Collider2D, other: Collider2D, contact: IPhysics2DContact | null): void {
    if (!this.active || !this.skill || this.hitTargets.has(other.node)) {
      return;
    }

    const target = other.node.getComponent(CharacterBase);
    const ownerCharacter = this.owner?.getComponent(CharacterBase);
    if (!target || !ownerCharacter || target === ownerCharacter) {
      return;
    }

    const result = target.takeDamage({ attack: this.skill.attack, defense: target.defense, skillPower: this.skill.skillPower }, this.skill.hitStun);
    if (result.accepted) {
      target.knockback(this.skill.knockback, this.owner!);
      this.hitTargets.add(other.node);
    }
  }
}
