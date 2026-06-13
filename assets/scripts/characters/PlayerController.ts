import { _decorator, Animation, Component, input, Input, KeyCode, EventKeyboard, Node, Tween, tween, Vec3 } from 'cc';
import { StateMachine } from '../core/StateMachine';
import { CharacterBase } from './CharacterBase';
import { SkillComponent } from '../skills/SkillComponent';
import { resolveWeaponSlashPose, resolveWeaponThrustPose } from '../combat/CombatMath';
import {
  getCombatActionFromInput,
  resolveMoveVector,
  type MoveVector,
} from '../input/KeyboardMapping';

const { ccclass, property } = _decorator;
type PlayerState = 'idle' | 'run' | 'attack' | 'skill' | 'hit' | 'dead';

/*
 * 玩家控制器只负责输入、状态切换和手感表现，实际伤害窗口交给 SkillComponent/HitBox。
 */
@ccclass('PlayerController')
export class PlayerController extends CharacterBase {
  @property(SkillComponent)
  skillComponent: SkillComponent | null = null;

  @property(Animation)
  animation: Animation | null = null;

  @property(Node)
  weaponPivot: Node | null = null;

  private readonly pressedCodes = new Set<string>();
  private comboIndex = 0;
  private comboTimer = 0;
  private attackLock = 0;
  private weaponTween: Tween<Node> | null = null;
  private stateMachine!: StateMachine<PlayerState, PlayerController>;

  override start(): void {
    super.start();
    this.stateMachine = new StateMachine<PlayerState, PlayerController>(this, {
      idle: { enter: (ctx) => ctx.playAnimation('player_idle') },
      run: { enter: (ctx) => ctx.playAnimation('player_run') },
      attack: { enter: (ctx) => ctx.playAttack() },
      skill: { enter: (ctx) => ctx.playSkill() },
      hit: { enter: (ctx) => ctx.playAnimation('player_hit') },
      dead: { enter: (ctx) => ctx.playAnimation('player_dead') },
    }, 'idle');

    input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
  }

  protected onDestroy(): void {
    input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
    this.weaponTween?.stop();
  }

  /*
   * 攻击和技能期间由 attackLock 锁住移动输入，确保动作不会被奔跑状态立即打断。
   */
  override update(deltaTime: number): void {
    super.update(deltaTime);
    this.comboTimer = Math.max(0, this.comboTimer - deltaTime);
    this.attackLock = Math.max(0, this.attackLock - deltaTime);
    this.skillComponent?.tick(deltaTime);

    if (this.isDefeated()) {
      this.stateMachine.transitionTo('dead');
      return;
    }

    if (this.isInHitStun()) {
      this.stateMachine.transitionTo('hit');
      return;
    }

    if (this.attackLock > 0) {
      return;
    }

    const move = this.getMoveVector();
    this.movePlane(move, deltaTime);
    this.updateWeaponRestPose();
    this.stateMachine.transitionTo(move.x === 0 && move.y === 0 ? 'idle' : 'run');
  }

  /*
   * 按键按下时优先处理战斗动作，移动方向则保留在 pressedCodes 中由每帧统一解析。
   */
  private onKeyDown(event: EventKeyboard): void {
    const code = this.toInputCode(event.keyCode);
    if (!code) {
      return;
    }

    this.pressedCodes.add(code);

    const action = getCombatActionFromInput(code);
    if (action === 'basicAttack') {
      this.stateMachine.transitionTo('attack', { reenter: true });
      return;
    }

    if (action === 'smallSkill' && this.skillComponent?.canCast('slash_wave')) {
      this.stateMachine.transitionTo('skill', { reenter: true });
    }
  }

  private onKeyUp(event: EventKeyboard): void {
    const code = this.toInputCode(event.keyCode);
    if (code) {
      this.pressedCodes.delete(code);
    }
  }

  private getMoveVector(): MoveVector {
    return resolveMoveVector(this.pressedCodes);
  }

  private toInputCode(keyCode: KeyCode): string | null {
    switch (keyCode) {
      case KeyCode.ARROW_UP:
        return 'ArrowUp';
      case KeyCode.ARROW_DOWN:
        return 'ArrowDown';
      case KeyCode.ARROW_LEFT:
        return 'ArrowLeft';
      case KeyCode.ARROW_RIGHT:
        return 'ArrowRight';
      case KeyCode.KEY_X:
        return 'KeyX';
      case KeyCode.KEY_Z:
        return 'KeyZ';
      default:
        return null;
    }
  }

  /*
   * 三段普攻由连击计时器衔接；超时后重新从第一段开始，便于独立调整连击节奏。
   */
  private playAttack(): void {
    this.comboIndex = this.comboTimer > 0 ? (this.comboIndex % 3) + 1 : 1;
    this.comboTimer = 0.45;
    this.attackLock = 0.28;
    this.playAnimation(`player_attack_${this.comboIndex}`);
    this.playWeaponSlash();
    this.skillComponent?.cast(`basic_${this.comboIndex}`, this.getFacing());
  }

  /*
   * Z 技能使用武器前刺表现，并通过 slash_wave 的判定窗口产生实际命中。
   */
  private playSkill(): void {
    this.attackLock = 0.55;
    this.playAnimation('player_skill_slash_wave');
    this.playWeaponThrust();
    this.skillComponent?.cast('slash_wave', this.getFacing());
  }

  private playAnimation(name: string): void {
    if (this.animation?.clips.some((clip) => clip.name === name)) {
      this.animation.play(name);
    }
  }

  /*
   * 普攻武器轨迹沿扇形关键帧摆动，和普通攻击框保持“小而贴动作”的视觉语义。
   */
  private playWeaponSlash(): void {
    if (!this.weaponPivot) {
      return;
    }

    const facing = this.getFacing();
    const start = resolveWeaponSlashPose(0, facing);
    const middle = resolveWeaponSlashPose(0.5, facing);
    const end = resolveWeaponSlashPose(1, facing);
    this.weaponTween?.stop();
    this.weaponPivot.setScale(new Vec3(facing, 1, 1));
    this.weaponPivot.setPosition(start.x, start.y, 0);
    this.weaponPivot.angle = start.angle;
    this.weaponTween = tween(this.weaponPivot)
      .to(0.08, { position: new Vec3(middle.x, middle.y, 0), angle: middle.angle })
      .to(0.1, { position: new Vec3(end.x, end.y, 0), angle: end.angle })
      .to(0.1, { position: this.getWeaponRestPosition(), angle: 0 })
      .call(() => {
        this.weaponTween = null;
        this.updateWeaponRestPose();
      })
      .start();
  }

  /*
   * 非攻击状态下持续恢复武器待机位，避免 tween 被打断后武器停在上一帧位置。
   */
  private updateWeaponRestPose(): void {
    if (!this.weaponPivot || this.attackLock > 0) {
      return;
    }

    const facing = this.getFacing();
    this.weaponPivot.setScale(new Vec3(facing, 1, 1));
    this.weaponPivot.setPosition(this.getWeaponRestPosition());
    this.weaponPivot.angle = 0;
  }

  private getWeaponRestPosition(): Vec3 {
    return new Vec3(24 * this.getFacing(), -14, 0);
  }

  /*
   * 技能武器轨迹强调向前刺出，和 slash_wave 的剑形模糊特效方向保持一致。
   */
  private playWeaponThrust(): void {
    if (!this.weaponPivot) {
      return;
    }

    const facing = this.getFacing();
    const start = resolveWeaponThrustPose(0, facing);
    const middle = resolveWeaponThrustPose(0.5, facing);
    const end = resolveWeaponThrustPose(1, facing);
    this.weaponTween?.stop();
    this.weaponPivot.setScale(new Vec3(facing, 1, 1));
    this.weaponPivot.setPosition(start.x, start.y, 0);
    this.weaponPivot.angle = start.angle;
    this.weaponTween = tween(this.weaponPivot)
      .to(0.1, { position: new Vec3(middle.x, middle.y, 0), angle: middle.angle })
      .to(0.16, { position: new Vec3(end.x, end.y, 0), angle: end.angle })
      .call(() => {
        this.weaponTween = null;
        this.updateWeaponRestPose();
      })
      .start();
  }
}
