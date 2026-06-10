export interface DamageInput {
  attack: number;
  defense: number;
  skillPower?: number;
  criticalMultiplier?: number;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface HitTargetState {
  hp: number;
  invulnerableUntil: number;
}

export function calculateDamage(input: DamageInput): number {
  const skillPower = input.skillPower ?? 1;
  const criticalMultiplier = input.criticalMultiplier ?? 1;
  const baseDamage = Math.max(1, input.attack - Math.max(0, input.defense));
  return Math.max(1, Math.round(baseDamage * skillPower * criticalMultiplier));
}

export function applyKnockback(target: Point2D, attacker: Point2D, distance: number): Point2D {
  const direction = target.x >= attacker.x ? 1 : -1;
  return { x: target.x + direction * Math.max(0, distance), y: target.y };
}

export function resolveSeparationOffset(
  current: Point2D,
  others: readonly Point2D[],
  minDistance: number,
  fallbackSign = 1,
): Point2D {
  const requiredDistance = Math.max(0, minDistance);
  if (requiredDistance === 0) {
    return { x: 0, y: 0 };
  }

  return others.reduce<Point2D>((offset, other) => {
    const deltaX = current.x - other.x;
    const deltaY = current.y - other.y;
    const distance = Math.hypot(deltaX, deltaY);
    if (distance >= requiredDistance) {
      return offset;
    }

    if (distance === 0) {
      return {
        x: offset.x + (fallbackSign >= 0 ? 1 : -1) * (requiredDistance / 2),
        y: offset.y,
      };
    }

    const pushDistance = (requiredDistance - distance) / 2;
    return {
      x: offset.x + (deltaX / distance) * pushDistance,
      y: offset.y + (deltaY / distance) * pushDistance,
    };
  }, { x: 0, y: 0 });
}

export function getChaseVector(source: Point2D, target: Point2D): Point2D {
  const deltaX = target.x - source.x;
  const deltaY = target.y - source.y;
  const distance = Math.hypot(deltaX, deltaY);

  if (distance === 0) {
    return { x: 0, y: 0 };
  }

  return {
    x: deltaX / distance,
    y: deltaY / distance,
  };
}

export function resolveFacingOffset(baseOffsetX: number, facing: number): number {
  return Math.abs(baseOffsetX) * (facing >= 0 ? 1 : -1);
}

export function resolveAttackBoxOffset(baseOffsetX: number, facing: number, usesSeparateVisualRoot: boolean): number {
  if (!usesSeparateVisualRoot) {
    return Math.abs(baseOffsetX);
  }

  return resolveFacingOffset(baseOffsetX, facing);
}

export function shouldHoldMeleeRange(distance: number, attackRange: number): boolean {
  return distance <= attackRange;
}

export function shouldChaseTarget(distance: number, aggroRange: number, attackRange: number): boolean {
  return distance <= aggroRange && !shouldHoldMeleeRange(distance, attackRange);
}

export function shouldApplyTimedAttackDamage(
  elapsed: number,
  damageMoment: number,
  damageApplied: boolean,
  windup = 0,
): boolean {
  if (damageApplied) {
    return false;
  }

  return elapsed >= Math.max(0, damageMoment, windup);
}

export function canHitTarget(target: HitTargetState, currentTime: number): boolean {
  return target.hp > 0 && currentTime >= target.invulnerableUntil;
}
