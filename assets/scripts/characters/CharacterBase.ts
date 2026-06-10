import { _decorator, Component, Node, Vec3 } from 'cc';
import { CharacterStats } from '../core/GameTypes';
import { canHitTarget, calculateDamage, DamageInput } from '../combat/CombatMath';
import { getFacingFromHorizontalInput, normalizeMoveVector, type MoveVector } from '../input/KeyboardMapping';

const { ccclass, property } = _decorator;

export interface DamageResult {
  accepted: boolean;
  damage: number;
  remainingHp: number;
  defeated: boolean;
}

@ccclass('CharacterBase')
export class CharacterBase extends Component {
  @property
  characterId = '';

  @property
  displayName = '角色';

  @property
  maxHp = 100;

  @property
  attack = 20;

  @property
  defense = 5;

  @property
  moveSpeed = 220;

  @property
  hitStun = 0.25;

  @property
  invulnerableTime = 0.1;

  @property(Node)
  facingVisualRoot: Node | null = null;

  protected hp = 100;
  protected facing = 1;
  protected invulnerableUntil = 0;
  protected hitStunRemaining = 0;
  protected elapsedTime = 0;

  start(): void {
    this.hp = this.maxHp;
  }

  update(deltaTime: number): void {
    this.elapsedTime += deltaTime;
    this.hitStunRemaining = Math.max(0, this.hitStunRemaining - deltaTime);
  }

  applyStats(stats: CharacterStats): void {
    this.characterId = stats.id;
    this.displayName = stats.displayName;
    this.maxHp = stats.maxHp;
    this.attack = stats.attack;
    this.defense = stats.defense;
    this.moveSpeed = stats.moveSpeed;
    this.hitStun = stats.hitStun;
    this.invulnerableTime = stats.invulnerableTime;
    this.hp = stats.maxHp;
  }

  takeDamage(input: DamageInput, stunSeconds = this.hitStun): DamageResult {
    if (!canHitTarget({ hp: this.hp, invulnerableUntil: this.invulnerableUntil }, this.elapsedTime)) {
      return { accepted: false, damage: 0, remainingHp: this.hp, defeated: this.isDefeated() };
    }

    const damage = calculateDamage({ ...input, defense: this.defense });
    this.hp = Math.max(0, this.hp - damage);
    this.hitStunRemaining = stunSeconds;
    this.invulnerableUntil = this.elapsedTime + this.invulnerableTime;
    return { accepted: true, damage, remainingHp: this.hp, defeated: this.isDefeated() };
  }

  moveHorizontal(axis: number, deltaTime: number): void {
    this.movePlane({ x: axis, y: 0 }, deltaTime);
  }

  movePlane(move: MoveVector, deltaTime: number): void {
    if (this.isDefeated() || this.isInHitStun()) {
      return;
    }

    const normalizedMove = normalizeMoveVector(move);
    this.facing = getFacingFromHorizontalInput(normalizedMove, this.facing);

    const position = this.node.position.clone();
    position.x += normalizedMove.x * this.moveSpeed * deltaTime;
    position.y += normalizedMove.y * this.moveSpeed * deltaTime;
    this.node.setPosition(position);
    this.updateFacingScale();
  }

  knockback(distance: number, source: Node): void {
    const direction = this.node.worldPosition.x >= source.worldPosition.x ? 1 : -1;
    const position = this.node.position.clone();
    position.x += direction * Math.max(0, distance);
    this.node.setPosition(position);
  }

  getHp(): number {
    return this.hp;
  }

  getHpRatio(): number {
    return this.maxHp <= 0 ? 0 : this.hp / this.maxHp;
  }

  getFacing(): number {
    return this.facing;
  }

  faceHorizontal(direction: number): void {
    if (direction === 0) {
      return;
    }

    this.facing = direction > 0 ? 1 : -1;
    this.updateFacingScale();
  }

  isDefeated(): boolean {
    return this.hp <= 0;
  }

  isInHitStun(): boolean {
    return this.hitStunRemaining > 0;
  }

  protected updateFacingScale(): void {
    const visualNode = this.facingVisualRoot ?? this.node;
    const scale = visualNode.scale.clone();
    visualNode.setScale(new Vec3(Math.abs(scale.x) * this.facing, scale.y, scale.z));
  }
}
