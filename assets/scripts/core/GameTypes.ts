/*
 * 角色基础数值是配置层和组件层的契约，新增字段时需要同步默认值与配置解析。
 */
export interface CharacterStats {
  id: string;
  displayName: string;
  maxHp: number;
  attack: number;
  defense: number;
  moveSpeed: number;
  hitStun: number;
  invulnerableTime: number;
}

/*
 * 技能配置同时描述冷却、判定窗口和受击反馈，便于玩法数值脱离组件硬编码。
 */
export interface SkillConfig {
  id: string;
  displayName: string;
  animationName: string;
  attack: number;
  skillPower: number;
  cooldown: number;
  activeStart: number;
  activeEnd: number;
  knockback: number;
  hitStun: number;
}

/*
 * 怪物配置在角色数值之外补充 AI 感知和近战节奏参数。
 */
export interface EnemyConfig extends CharacterStats {
  aggroRange: number;
  attackRange: number;
  attackCooldown: number;
}

export interface RoomSpawnPointConfig {
  x: number;
  y: number;
  z?: number;
}

export interface RoomConfig {
  roomId: string;
  displayName: string;
  enemyPrefab: string;
  spawnPoints: RoomSpawnPointConfig[];
  clearMessage: string;
}
