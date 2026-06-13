import { JsonAsset, resources } from 'cc';
import type { CharacterConfigMap, SkillConfigMap } from './GameConfig';
import type { RoomConfig } from './GameTypes';

export interface RuntimeGameConfig {
  characters: CharacterConfigMap;
  skills: SkillConfigMap;
  room: RoomConfig;
}

let characterConfigCache: Promise<CharacterConfigMap> | null = null;
let skillConfigCache: Promise<SkillConfigMap> | null = null;
let trainingRoomConfigCache: Promise<RoomConfig> | null = null;

export function loadCharacterConfigs(): Promise<CharacterConfigMap> {
  characterConfigCache ??= loadJsonConfig<CharacterConfigMap>('config/characters');
  return characterConfigCache;
}

export function loadSkillConfigs(): Promise<SkillConfigMap> {
  skillConfigCache ??= loadJsonConfig<SkillConfigMap>('config/skills');
  return skillConfigCache;
}

export function loadTrainingRoomConfig(): Promise<RoomConfig> {
  trainingRoomConfigCache ??= loadJsonConfig<RoomConfig>('config/room_training_01');
  return trainingRoomConfigCache;
}

export async function loadRuntimeGameConfig(): Promise<RuntimeGameConfig> {
  const [characters, skills, room] = await Promise.all([
    loadCharacterConfigs(),
    loadSkillConfigs(),
    loadTrainingRoomConfig(),
  ]);

  return { characters, skills, room };
}

function loadJsonConfig<T>(path: string): Promise<T> {
  return new Promise((resolve, reject) => {
    resources.load(path, JsonAsset, (error, asset) => {
      if (error || !asset) {
        reject(error ?? new Error(`无法读取 JSON 配置: ${path}`));
        return;
      }

      resolve(asset.json as T);
    });
  });
}
