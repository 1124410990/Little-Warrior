import {
  _decorator,
  Collider2D,
  Color,
  Component,
  Contact2DType,
  Graphics,
  IPhysics2DContact,
  Node,
  PhysicsSystem2D,
  tween,
  UITransform,
  Vec3,
} from 'cc';
import { SkillConfig } from '../core/GameTypes';
import { CharacterBase } from '../characters/CharacterBase';
import { HurtBox } from './HurtBox';
import { shouldDrawSkillAreaEffect } from './CombatMath';

const { ccclass, property } = _decorator;

/*
 * HitBox 管理技能判定窗口、同一技能的去重命中，以及与命中反馈特效的最小耦合。
 */
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

  update(): void {
    this.scanOverlappingTargets();
  }

  /*
   * 激活时立即扫描一次重叠目标，补偿 BEGIN_CONTACT 在动态开关 collider 时可能丢帧的问题。
   */
  activate(skill: SkillConfig): void {
    this.skill = skill;
    this.hitTargets.clear();
    this.drawSkillEffect(skill, true);
    this.setActive(true, shouldDrawSkillAreaEffect(skill.id));
    this.scanOverlappingTargets();
  }

  /*
   * 预览只显示需要提示的技能区域，不开启碰撞，避免技能前摇阶段提前造成伤害。
   */
  preview(skill: SkillConfig): void {
    this.skill = skill;
    this.hitTargets.clear();
    this.drawSkillEffect(skill, false);
    this.setActive(false, shouldDrawSkillAreaEffect(skill.id));
  }

  deactivate(): void {
    this.setActive(false);
    this.hitTargets.clear();
  }

  private setActive(active: boolean, visible = active): void {
    this.active = active;
    this.node.active = active || visible;
    const collider = this.getComponent(Collider2D);
    if (collider) {
      collider.enabled = active;
    }
  }

  /*
   * slash_wave 画成窄长剑形残影，避免普攻和技能表现退化成大矩形色块。
   */
  private drawSkillEffect(skill: SkillConfig, active: boolean): void {
    const graphics = this.getComponent(Graphics);
    if (!graphics) {
      return;
    }

    const isWave = skill.id === 'slash_wave';
    graphics.clear();
    if (!isWave) {
      return;
    }

    graphics.fillColor = new Color(255, 223, 104, active ? 92 : 52);
    graphics.moveTo(-58, 24);
    graphics.lineTo(40, 18);
    graphics.lineTo(68, 0);
    graphics.lineTo(40, -18);
    graphics.lineTo(-58, -24);
    graphics.close();
    graphics.fill();
    graphics.fillColor = new Color(255, 255, 238, active ? 205 : 120);
    graphics.moveTo(-44, 8);
    graphics.lineTo(42, 7);
    graphics.lineTo(64, 0);
    graphics.lineTo(42, -7);
    graphics.lineTo(-44, -8);
    graphics.close();
    graphics.fill();
    graphics.fillColor = new Color(104, 202, 255, active ? 150 : 80);
    graphics.moveTo(-16, 18);
    graphics.lineTo(58, 7);
    graphics.lineTo(70, 0);
    graphics.lineTo(58, -7);
    graphics.lineTo(-16, -18);
    graphics.close();
    graphics.fill();
    graphics.fillColor = new Color(255, 255, 255, active ? 230 : 130);
    graphics.moveTo(-24, 3);
    graphics.lineTo(54, 2);
    graphics.lineTo(66, 0);
    graphics.lineTo(54, -2);
    graphics.lineTo(-24, -3);
    graphics.close();
    graphics.fill();
  }

  private onBeginContact(self: Collider2D, other: Collider2D, contact: IPhysics2DContact | null): void {
    if (!this.active || !this.skill) {
      return;
    }

    this.tryHitTarget(other);
  }

  /*
   * 每帧 AABB 补扫用于兜底高速位移或同帧启用碰撞时漏掉的目标。
   */
  private scanOverlappingTargets(): void {
    if (!this.active || !this.skill) {
      return;
    }

    const collider = this.getComponent(Collider2D);
    if (!collider?.enabled) {
      return;
    }

    PhysicsSystem2D.instance.testAABB(collider.worldAABB).forEach((other) => {
      if (other !== collider) {
        this.tryHitTarget(other);
      }
    });
  }

  /*
   * 同一个技能窗口内每个目标只命中一次，伤害、击退和受击火花保持原子化处理。
   */
  private tryHitTarget(other: Collider2D): void {
    if (!this.skill) {
      return;
    }

    const skill = this.skill;
    const target = this.resolveTarget(other.node);
    const ownerCharacter = this.owner?.getComponent(CharacterBase);
    if (!target || !ownerCharacter || target === ownerCharacter || this.hitTargets.has(target.node)) {
      return;
    }

    const result = target.takeDamage({ attack: skill.attack, defense: target.defense, skillPower: skill.skillPower }, skill.hitStun, this.owner ?? undefined);
    if (result.accepted) {
      target.knockback(skill.knockback, this.owner!);
      this.spawnHitImpact(target);
      this.hitTargets.add(target.node);
    }
  }

  /*
   * 命中火花挂在受击者节点上，随目标一起移动，避免世界坐标残留导致反馈错位。
   */
  private spawnHitImpact(target: CharacterBase): void {
    const effect = new Node('HitImpact');
    effect.addComponent(UITransform).setContentSize(56, 48);
    const graphics = effect.addComponent(Graphics);
    const ownerX = this.owner?.worldPosition.x ?? target.node.worldPosition.x;
    const direction = ownerX <= target.node.worldPosition.x ? -1 : 1;

    graphics.fillColor = new Color(255, 246, 180, 235);
    graphics.moveTo(0, 16);
    graphics.lineTo(10, 2);
    graphics.lineTo(0, -12);
    graphics.lineTo(-10, 2);
    graphics.close();
    graphics.fill();
    graphics.fillColor = new Color(255, 196, 74, 210);
    graphics.rect(-26, 6, 18, 5);
    graphics.rect(8, -16, 24, 5);
    graphics.fill();
    graphics.fillColor = new Color(120, 210, 255, 190);
    graphics.rect(-4, -22, 7, 18);
    graphics.rect(14, 10, 8, 20);
    graphics.fill();

    target.node.addChild(effect);
    effect.setPosition(24 * direction, 8, 0);
    effect.setScale(new Vec3(0.65, 0.65, 1));
    tween(effect)
      .to(0.08, { scale: new Vec3(1.2, 1.2, 1) })
      .to(0.06, { scale: new Vec3(0.85, 0.85, 1) })
      .call(() => effect.destroy())
      .start();
  }

  /*
   * 兼容 HurtBox 子节点、角色根节点和父节点三种场景搭建方式，降低编辑器绑定成本。
   */
  private resolveTarget(node: Node): CharacterBase | null {
    return node.getComponent(HurtBox)?.owner
      ?? node.getComponent(CharacterBase)
      ?? node.parent?.getComponent(CharacterBase)
      ?? null;
  }
}
