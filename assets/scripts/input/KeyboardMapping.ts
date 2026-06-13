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

const COCOS_KEY_CODE_TO_INPUT_CODE: Record<number, string> = {
  37: 'ArrowLeft',
  38: 'ArrowUp',
  39: 'ArrowRight',
  40: 'ArrowDown',
  88: 'KeyX',
  90: 'KeyZ',
};

export function getInputCodeFromKeyCode(keyCode: number): string | null {
  return COCOS_KEY_CODE_TO_INPUT_CODE[keyCode] ?? null;
}

/*
 * 输入层只产出轴向意图，不直接移动节点，便于后续替换手柄或自定义键位。
 */
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

/*
 * 只有水平输入会改变朝向，上下移动不应让角色在横版战斗中突然翻面。
 */
export function getFacingFromHorizontalInput(move: MoveVector, currentFacing: number): number {
  if (move.x > 0) {
    return 1;
  }

  if (move.x < 0) {
    return -1;
  }

  return currentFacing >= 0 ? 1 : -1;
}

/*
 * 归一化移动向量用于修正斜向移动速度，避免斜走比水平移动更快。
 */
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

/*
 * 战斗动作解析集中在这里，PlayerController 不需要知道具体键位配置结构。
 */
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
