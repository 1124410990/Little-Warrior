import type {
  CharacterStats,
  EnemyConfig,
  RoomConfig,
  SkillConfig,
} from './GameTypes';

export type CharacterConfigMap = Record<string, CharacterStats | EnemyConfig>;
export type SkillConfigMap = Record<string, SkillConfig>;

export interface RuntimeSpawnPosition {
  x: number;
  y: number;
  z: number;
}

export function getCharacterConfig(configs: CharacterConfigMap, characterId: string): CharacterStats {
  const config = findConfigById(configs, characterId);
  if (!config) {
    throw new Error(`缺少角色配置: ${characterId}`);
  }

  return config;
}

export function getEnemyConfig(configs: CharacterConfigMap, enemyId: string): EnemyConfig {
  const config = findConfigById(configs, enemyId);
  if (!config || !isEnemyConfig(config)) {
    throw new Error(`缺少敌人配置: ${enemyId}`);
  }

  return config;
}

export function getSkillConfig(configs: SkillConfigMap, skillId: string): SkillConfig {
  const config = configs[skillId] ?? Object.values(configs).find((skill) => skill.id === skillId);
  if (!config) {
    throw new Error(`缺少技能配置: ${skillId}`);
  }

  return config;
}

export function resolveRoomSpawnPositions(roomConfig: RoomConfig): RuntimeSpawnPosition[] {
  return roomConfig.spawnPoints.map((point) => ({
    x: point.x,
    y: point.y,
    z: point.z ?? 0,
  }));
}

export function isEnemyConfig(config: CharacterStats | EnemyConfig): config is EnemyConfig {
  return 'aggroRange' in config && 'attackRange' in config && 'attackCooldown' in config;
}

function findConfigById(configs: CharacterConfigMap, id: string): CharacterStats | EnemyConfig | null {
  return configs[id] ?? Object.values(configs).find((config) => config.id === id) ?? null;
}
