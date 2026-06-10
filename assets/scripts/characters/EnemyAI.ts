import { _decorator, Animation, Collider2D, Node, Vec3 } from 'cc';
import { StateMachine } from '../core/StateMachine';
import { CharacterBase } from './CharacterBase';
import { getChaseVector, shouldChaseTarget, shouldHoldMeleeRange } from '../combat/CombatMath';

const { ccclass, property } = _decorator;
type EnemyState = 'idle' | 'patrol' | 'chase' | 'attack' | 'hit' | 'dead';

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
  attackLockDuration = 0.36;

  @property
  deathCleanupDelay = 0.45;

  private stateMachine!: StateMachine<EnemyState, EnemyAI>;
  private attackTimer = 0;
  private attackLockTimer = 0;
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

  override update(deltaTime: number): void {
    super.update(deltaTime);
    this.attackTimer = Math.max(0, this.attackTimer - deltaTime);
    this.attackLockTimer = Math.max(0, this.attackLockTimer - deltaTime);

    if (this.isDefeated()) {
      this.stateMachine.transitionTo('dead');
      this.handleDefeated();
      return;
    }

    if (this.isInHitStun()) {
      this.stateMachine.transitionTo('hit');
      return;
    }

    if (this.attackLockTimer > 0) {
      return;
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

  private patrol(deltaTime: number): void {
    this.stateMachine.transitionTo('patrol');
    this.moveHorizontal(this.patrolDirection * 0.35, deltaTime);
  }

  private playAttack(): void {
    this.attackTimer = this.attackCooldown;
    this.attackLockTimer = this.attackLockDuration;
    this.faceTarget();
    this.playAnimation('enemy_attack');
    if (!this.target) {
      return;
    }

    const targetCharacter = this.target.getComponent(CharacterBase);
    const distance = this.getTargetDistance();
    if (targetCharacter && distance <= this.attackRange) {
      targetCharacter.takeDamage({ attack: this.attack, defense: targetCharacter.defense, skillPower: 1 }, this.hitStun);
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

  private handleDefeated(): void {
    if (this.defeatedHandled) {
      return;
    }

    this.defeatedHandled = true;
    this.attackLockTimer = 0;
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

  private playAnimation(name: string): void {
    if (this.animation?.clips.some((clip) => clip.name === name)) {
      this.animation.play(name);
    }
  }
}
