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

/*
 * 伤害公式保留最小 1 点伤害，避免高防御目标把命中反馈完全吞掉。
 */
export function calculateDamage(input: DamageInput): number {
  const skillPower = input.skillPower ?? 1;
  const criticalMultiplier = input.criticalMultiplier ?? 1;
  const baseDamage = Math.max(1, input.attack - Math.max(0, input.defense));
  return Math.max(1, Math.round(baseDamage * skillPower * criticalMultiplier));
}

/*
 * 击退方向只参考 X 轴相对位置，服务横版战斗的前后关系判断。
 */
export function applyKnockback(target: Point2D, attacker: Point2D, distance: number): Point2D {
  const direction = target.x >= attacker.x ? 1 : -1;
  return { x: target.x + direction * Math.max(0, distance), y: target.y };
}

/*
 * 多个怪物重叠时返回一个温和分离偏移；完全重合时用 fallbackSign 打破方向对称。
 */
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

/*
 * 追击向量归一化后再交给角色移动，保证不同距离下追击速度一致。
 */
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

/*
 * 有独立 visual root 的角色需要在本地坐标下镜像攻击框，避免视觉翻转后判定仍在旧方向。
 */
export function resolveAttackBoxOffset(baseOffsetX: number, facing: number, usesSeparateVisualRoot: boolean): number {
  if (!usesSeparateVisualRoot) {
    return Math.abs(baseOffsetX);
  }

  return resolveFacingOffset(baseOffsetX, facing);
}

export interface WeaponSlashPose {
  angle: number;
  x: number;
  y: number;
}

export interface MeleeLungePose {
  scaleX: number;
  scaleY: number;
  x: number;
}

/*
 * 普攻武器采用起手、命中、收刀三段关键帧，便于在无 Cocos 运行时下验证轨迹。
 */
export function resolveWeaponSlashPose(progress: number, facing: number): WeaponSlashPose {
  const clampedProgress = clamp01(progress);
  const pose = interpolateKeyframes(
    { angle: 68, x: 18, y: 22 },
    { angle: -4, x: 34, y: 4 },
    { angle: -76, x: 18, y: -20 },
    clampedProgress,
  );
  const direction = facing >= 0 ? 1 : -1;

  return {
    angle: Math.round(pose.angle * direction),
    x: Math.round(pose.x * direction),
    y: Math.round(pose.y),
  };
}

/*
 * Z 技能轨迹使用前刺关键帧，强调武器沿朝向快速探出再回收。
 */
export function resolveWeaponThrustPose(progress: number, facing: number): WeaponSlashPose {
  const clampedProgress = clamp01(progress);
  const pose = interpolateKeyframes(
    { angle: -86, x: 12, y: -6 },
    { angle: -90, x: 58, y: -2 },
    { angle: -86, x: 24, y: -14 },
    clampedProgress,
  );
  const direction = facing >= 0 ? 1 : -1;

  return {
    angle: Math.round(pose.angle * direction),
    x: Math.round(pose.x * direction),
    y: Math.round(pose.y),
  };
}

/*
 * 敌人近战前扑通过缩放和局部位移模拟发力，不改变角色根节点的碰撞位置。
 */
export function resolveMeleeLungePose(progress: number, facing: number): MeleeLungePose {
  const clampedProgress = clamp01(progress);
  const peakProgress = 0.35;
  const direction = facing >= 0 ? 1 : -1;
  const normalized = clampedProgress <= peakProgress
    ? clampedProgress / peakProgress
    : 1 - ((clampedProgress - peakProgress) / (1 - peakProgress));
  const eased = easeOutQuad(clamp01(normalized));

  return {
    scaleX: roundTo(1 + 0.18 * eased, 2),
    scaleY: roundTo(1 - 0.18 * eased, 2),
    x: normalizeZero(Math.round(15 * eased * direction)),
  };
}

/*
 * 只有需要范围提示的技能才绘制区域特效，普攻避免回到大色块占位效果。
 */
export function shouldDrawSkillAreaEffect(skillId: string): boolean {
  return skillId === 'slash_wave';
}

export function shouldHoldMeleeRange(distance: number, attackRange: number): boolean {
  return distance <= attackRange;
}

export function shouldChaseTarget(distance: number, aggroRange: number, attackRange: number): boolean {
  return distance <= aggroRange && !shouldHoldMeleeRange(distance, attackRange);
}

/*
 * 攻击判定以“最晚的前摇/伤害时点”为准，保证调大 windup 不会提前出伤。
 */
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

/*
 * 命中门槛集中在生命值和无敌时间，方便 HitBox 与直接攻击共用同一套规则。
 */
export function canHitTarget(target: HitTargetState, currentTime: number): boolean {
  return target.hp > 0 && currentTime >= target.invulnerableUntil;
}

function interpolateKeyframes(
  start: WeaponSlashPose,
  middle: WeaponSlashPose,
  end: WeaponSlashPose,
  progress: number,
): WeaponSlashPose {
  const from = progress <= 0.5 ? start : middle;
  const to = progress <= 0.5 ? middle : end;
  const localProgress = progress <= 0.5 ? progress / 0.5 : (progress - 0.5) / 0.5;

  return {
    angle: lerp(from.angle, to.angle, localProgress),
    x: lerp(from.x, to.x, localProgress),
    y: lerp(from.y, to.y, localProgress),
  };
}

function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

function easeOutQuad(progress: number): number {
  return 1 - (1 - progress) * (1 - progress);
}

function roundTo(value: number, digits: number): number {
  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function normalizeZero(value: number): number {
  return Object.is(value, -0) ? 0 : value;
}
