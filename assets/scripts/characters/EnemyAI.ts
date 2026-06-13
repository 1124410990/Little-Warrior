import { _decorator, Animation, Collider2D, Node, Tween, tween, Vec3 } from 'cc';
import { StateMachine } from '../core/StateMachine';
import { CharacterBase } from './CharacterBase';
import type { CharacterStats } from '../core/GameTypes';
import { isEnemyConfig } from '../core/GameConfig';
import {
  getChaseVector,
  resolveMeleeLungePose,
  shouldApplyTimedAttackDamage,
  shouldChaseTarget,
  shouldHoldMeleeRange,
} from '../combat/CombatMath';

const { ccclass, property } = _decorator;
type EnemyState = 'idle' | 'patrol' | 'chase' | 'attack' | 'hit' | 'dead';

/*
 * 怪物 AI 负责把“感知距离、攻击距离、硬直、死亡”这些战斗状态转成动画和位移行为。
 */
@ccclass('EnemyAI')
export class EnemyAI extends CharacterBase {
  @property(Node)
  target: Node | null = null;

  @property(Animation)
  animation: Animation | null = null;

  @property
  aggroRange = 360;

  @property
  attackRange = 72;

  @property
  attackCooldown = 1.2;

  @property
  attackWindup = 0.28;

  @property
  attackDamageMoment = 0.22;

  @property
  attackLockDuration = 0.55;

  @property
  deathCleanupDelay = 0.45;

  private stateMachine!: StateMachine<EnemyState, EnemyAI>;
  private attackTimer = 0;
  private attackLockTimer = 0;
  private attackElapsed = 0;
  private attackDamageApplied = false;
  private attackTween: Tween<Node> | null = null;
  private patrolDirection = -1;
  private defeatedHandled = false;

  override start(): void {
    super.start();
    this.stateMachine = new StateMachine<EnemyState, EnemyAI>(this, {
      idle: { enter: (ctx) => ctx.playAnimation('enemy_idle') },
      patrol: { enter: (ctx) => ctx.playAnimation('enemy_walk') },
      chase: { enter: (ctx) => ctx.playAnimation('enemy_walk') },
      attack: { enter: (ctx) => ctx.playAttack() },
      hit: { enter: (ctx) => ctx.playAnimation('enemy_hit') },
      dead: { enter: (ctx) => ctx.playAnimation('enemy_dead') },
    }, 'idle');
  }

  override applyStats(stats: CharacterStats): void {
    super.applyStats(stats);
    if (!isEnemyConfig(stats)) {
      return;
    }

    this.aggroRange = stats.aggroRange;
    this.attackRange = stats.attackRange;
    this.attackCooldown = stats.attackCooldown;
  }

  protected onDestroy(): void {
    this.attackTween?.stop();
  }

  /*
   * 状态优先级从高到低为死亡、硬直、攻击锁定、索敌追击、巡逻，防止同一帧出现行为互相覆盖。
   */
  override update(deltaTime: number): void {
    super.update(deltaTime);
    const wasAttacking = this.attackLockTimer > 0;
    this.attackTimer = Math.max(0, this.attackTimer - deltaTime);
    this.attackLockTimer = Math.max(0, this.attackLockTimer - deltaTime);

    if (this.isDefeated()) {
      this.stateMachine.transitionTo('dead');
      this.handleDefeated();
      return;
    }

    if (this.isInHitStun()) {
      this.stateMachine.transitionTo('hit');
      this.cancelAttack();
      return;
    }

    if (wasAttacking) {
      this.attackElapsed += deltaTime;
      this.faceTarget();
      this.tryApplyAttackDamage();
      if (this.attackLockTimer > 0) {
        return;
      }
    }

    if (!this.target) {
      this.patrol(deltaTime);
      return;
    }

    const distance = this.getTargetDistance();
    if (shouldHoldMeleeRange(distance, this.attackRange)) {
      this.faceTarget();
      if (this.attackTimer <= 0) {
        this.stateMachine.transitionTo('attack', { reenter: true });
      } else {
        this.stateMachine.transitionTo('idle');
      }
      return;
    }

    if (shouldChaseTarget(distance, this.aggroRange, this.attackRange)) {
      this.stateMachine.transitionTo('chase');
      const move = getChaseVector(this.node.worldPosition, this.target.worldPosition);
      this.movePlane(move, deltaTime);
      return;
    }

    this.patrol(deltaTime);
  }

  /*
   * 当前巡逻只承担无目标时的占位行为，后续接入路径点时应保持与追击逻辑解耦。
   */
  private patrol(deltaTime: number): void {
    this.stateMachine.transitionTo('patrol');
    this.moveHorizontal(this.patrolDirection * 0.35, deltaTime);
  }

  /*
   * 攻击进入锁定窗口后，位移和伤害时点都由计时器驱动，保证动画表现与判定帧可独立调参。
   */
  private playAttack(): void {
    this.attackTimer = this.attackCooldown;
    this.attackLockTimer = this.attackLockDuration;
    this.attackElapsed = 0;
    this.attackDamageApplied = false;
    this.faceTarget();
    this.playAnimation('enemy_attack');
    this.playAttackMotion();
  }

  /*
   * 伤害只在指定时点触发一次；若目标已经离开近战范围，则本次挥击落空。
   */
  private tryApplyAttackDamage(): void {
    if (!this.target) {
      return;
    }

    if (!shouldApplyTimedAttackDamage(
      this.attackElapsed,
      this.attackDamageMoment,
      this.attackDamageApplied,
      this.attackWindup,
    )) {
      return;
    }

    this.attackDamageApplied = true;
    const targetCharacter = this.target.getComponent(CharacterBase);
    const distance = this.getTargetDistance();
    if (targetCharacter && distance <= this.attackRange) {
      targetCharacter.takeDamage({ attack: this.attack, defense: targetCharacter.defense, skillPower: 1 }, this.hitStun, this.node);
      targetCharacter.knockback(24, this.node);
    }
  }

  private faceTarget(): void {
    if (!this.target) {
      return;
    }

    const deltaX = this.target.worldPosition.x - this.node.worldPosition.x;
    this.faceHorizontal(deltaX);
  }

  /*
   * 死亡只处理一次：停止攻击表现、关闭碰撞，并延迟隐藏节点给死亡动画留出播放时间。
   */
  private handleDefeated(): void {
    if (this.defeatedHandled) {
      return;
    }

    this.defeatedHandled = true;
    this.attackLockTimer = 0;
    this.attackElapsed = 0;
    this.attackDamageApplied = true;
    this.stopAttackMotion();
    this.node.getComponents(Collider2D).forEach((collider) => {
      collider.enabled = false;
    });
    this.scheduleOnce(() => {
      if (this.node?.isValid) {
        this.node.active = false;
      }
    }, this.deathCleanupDelay);
  }

  private getTargetDistance(): number {
    if (!this.target) {
      return Number.POSITIVE_INFINITY;
    }

    return Vec3.distance(this.node.worldPosition, this.target.worldPosition);
  }

  private cancelAttack(): void {
    this.attackLockTimer = 0;
    this.attackElapsed = 0;
    this.attackDamageApplied = true;
    this.stopAttackMotion();
  }

  private playAnimation(name: string): void {
    if (this.animation?.clips.some((clip) => clip.name === name)) {
      this.animation.play(name);
    }
  }

  /*
   * 敌人近战表现使用 visual root 前探和压缩缩放，避免直接移动碰撞根节点造成判定抖动。
   */
  private playAttackMotion(): void {
    const visual = this.facingVisualRoot;
    if (!visual) {
      return;
    }

    const facing = this.getFacing();
    const start = resolveMeleeLungePose(0, facing);
    const peak = resolveMeleeLungePose(0.35, facing);
    const end = resolveMeleeLungePose(1, facing);
    this.attackTween?.stop();
    visual.setPosition(start.x, 0, 0);
    visual.setScale(new Vec3(facing * start.scaleX, start.scaleY, 1));
    this.attackTween = tween(visual)
      .to(0.12, { position: new Vec3(peak.x, 0, 0), scale: new Vec3(facing * peak.scaleX, peak.scaleY, 1) })
      .to(0.2, { position: new Vec3(end.x, 0, 0), scale: new Vec3(facing * end.scaleX, end.scaleY, 1) })
      .call(() => {
        this.attackTween = null;
        this.resetAttackMotion();
      })
      .start();
  }

  private stopAttackMotion(): void {
    this.attackTween?.stop();
    this.attackTween = null;
    this.resetAttackMotion();
  }

  private resetAttackMotion(): void {
    const visual = this.facingVisualRoot;
    if (!visual) {
      return;
    }

    visual.setPosition(0, 0, 0);
    visual.setScale(new Vec3(this.getFacing(), 1, 1));
  }
}
