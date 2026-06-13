import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const errors = [];

function readJson(relativePath) {
  const absolutePath = resolve(rootDir, relativePath);
  const text = readFileSync(absolutePath, 'utf8').replace(/^\uFEFF/, '');
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${relativePath} 不是合法 JSON: ${error.message}`);
  }
}

function assertCheck(condition, message) {
  if (!condition) {
    errors.push(message);
  }
}

function compressCocosUuid(uuid, reservedHeadLength = 5) {
  const hex = uuid.replace(/-/g, '');
  let compressed = hex.slice(0, reservedHeadLength);
  for (let index = reservedHeadLength; index < hex.length; index += 3) {
    const value = Number.parseInt(hex.slice(index, index + 3), 16);
    compressed += base64Chars[(value >> 6) & 0x3f] + base64Chars[value & 0x3f];
  }
  return compressed;
}

function hasConfigEntry(configMap, id) {
  return Object.hasOwn(configMap, id)
    || Object.values(configMap).some((entry) => entry?.id === id);
}

function findSceneNode(sceneItems, name) {
  return sceneItems.find((item) => item?.__type__ === 'cc.Node' && item._name === name) ?? null;
}

function resolveComponents(sceneItems, node) {
  return (node?._components ?? [])
    .map((reference) => sceneItems[reference.__id__])
    .filter(Boolean);
}

const scene = readJson('assets/scenes/TrainingRoom.scene');
const bootstrapMeta = readJson('assets/scripts/dungeon/TrainingRoomBootstrap.ts.meta');
const characters = readJson('assets/resources/config/characters.json');
const skills = readJson('assets/resources/config/skills.json');
const room = readJson('assets/resources/config/room_training_01.json');

assertCheck(Array.isArray(scene), 'TrainingRoom.scene 应为 Cocos Creator JSON 数组');

const trainingRoomNode = Array.isArray(scene) ? findSceneNode(scene, 'TrainingRoom') : null;
assertCheck(Boolean(trainingRoomNode), 'TrainingRoom.scene 缺少名为 TrainingRoom 的节点');

const expectedBootstrapType = compressCocosUuid(bootstrapMeta.uuid);
const trainingRoomComponents = Array.isArray(scene) ? resolveComponents(scene, trainingRoomNode) : [];
const bootstrapComponent = trainingRoomComponents.find((component) => (
  component.__type__ === expectedBootstrapType
  || component.__type__ === bootstrapMeta.uuid
));

assertCheck(
  Boolean(bootstrapComponent),
  `TrainingRoom 节点未挂载 TrainingRoomBootstrap 组件类型 ${expectedBootstrapType}`,
);
assertCheck(
  bootstrapComponent?.rebuildOnStart === true,
  'TrainingRoomBootstrap.rebuildOnStart 应为 true',
);

assertCheck(hasConfigEntry(characters, 'player_warrior'), 'characters.json 缺少 player_warrior');
assertCheck(hasConfigEntry(characters, 'enemy_slime'), 'characters.json 缺少 enemy_slime');

['basic_1', 'basic_2', 'basic_3', 'slash_wave'].forEach((skillId) => {
  assertCheck(hasConfigEntry(skills, skillId), `skills.json 缺少 ${skillId}`);
});

assertCheck(room.enemyPrefab === 'enemy_slime', 'room_training_01.json 的 enemyPrefab 应为 enemy_slime');
assertCheck(Array.isArray(room.spawnPoints), 'room_training_01.json 的 spawnPoints 应为数组');
assertCheck((room.spawnPoints?.length ?? 0) >= 3, 'room_training_01.json 至少需要 3 个刷怪点');

if (errors.length > 0) {
  console.error('[verify-training-room] 校验失败:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log('[verify-training-room] OK: 场景挂载和训练房配置一致');
}
