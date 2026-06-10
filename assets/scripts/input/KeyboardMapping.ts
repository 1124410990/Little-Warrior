export interface MoveVector {
  x: number;
  y: number;
}

export interface InputBindings {
  up: string;
  down: string;
  left: string;
  right: string;
  basicAttack: string;
  smallSkill: string;
}

export type CombatAction = 'basicAttack' | 'smallSkill';

export const DEFAULT_INPUT_BINDINGS: InputBindings = {
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
  basicAttack: 'KeyX',
  smallSkill: 'KeyZ',
};

export function resolveMoveVector(
  pressedCodes: ReadonlySet<string>,
  bindings: InputBindings = DEFAULT_INPUT_BINDINGS,
): MoveVector {
  const left = pressedCodes.has(bindings.left);
  const right = pressedCodes.has(bindings.right);
  const up = pressedCodes.has(bindings.up);
  const down = pressedCodes.has(bindings.down);

  return {
    x: Number(right) - Number(left),
    y: Number(up) - Number(down),
  };
}

export function getFacingFromHorizontalInput(move: MoveVector, currentFacing: number): number {
  if (move.x > 0) {
    return 1;
  }

  if (move.x < 0) {
    return -1;
  }

  return currentFacing >= 0 ? 1 : -1;
}

export function normalizeMoveVector(move: MoveVector): MoveVector {
  const length = Math.hypot(move.x, move.y);
  if (length === 0) {
    return { x: 0, y: 0 };
  }

  return {
    x: move.x / length,
    y: move.y / length,
  };
}

export function isBasicAttack(code: string, bindings: InputBindings = DEFAULT_INPUT_BINDINGS): boolean {
  return code === bindings.basicAttack;
}

export function isSmallSkill(code: string, bindings: InputBindings = DEFAULT_INPUT_BINDINGS): boolean {
  return code === bindings.smallSkill;
}

export function getCombatActionFromInput(
  code: string,
  bindings: InputBindings = DEFAULT_INPUT_BINDINGS,
): CombatAction | null {
  if (isBasicAttack(code, bindings)) {
    return 'basicAttack';
  }

  if (isSmallSkill(code, bindings)) {
    return 'smallSkill';
  }

  return null;
}
