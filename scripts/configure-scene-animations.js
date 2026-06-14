#!/usr/bin/env node

/**
 * 自动配置场景中角色的 Animation 组件
 * 添加动画剪辑并设置缩放
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCENE_PATH = path.join(__dirname, '../assets/scenes/TrainingRoom.scene');
const PLAYER_ANIM_DIR = path.join(__dirname, '../assets/animations/player');
const ENEMY_ANIM_DIR = path.join(__dirname, '../assets/animations/enemy');

// 玩家动画列表
const PLAYER_ANIMS = [
  'player_idle',
  'player_run',
  'player_attack_1',
  'player_attack_2',
  'player_attack_3',
  'player_skill_slash_wave',
  'player_hit',
  'player_dead'
];

// 敌人动画列表
const ENEMY_ANIMS = [
  'enemy_idle',
  'enemy_walk',
  'enemy_attack',
  'enemy_hit',
  'enemy_dead'
];

/**
 * 获取动画文件的 UUID
 */
function getAnimUUID(animName, isPlayer = true) {
  const animDir = isPlayer ? PLAYER_ANIM_DIR : ENEMY_ANIM_DIR;
  const metaPath = path.join(animDir, `${animName}.anim.meta`);

  if (!fs.existsSync(metaPath)) {
    console.warn(`⚠️  未找到: ${animName}.anim.meta`);
    return null;
  }

  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  return meta.uuid;
}

/**
 * 查找包含特定组件的节点
 */
function findNodeWithComponent(sceneData, componentType) {
  for (let i = 0; i < sceneData.length; i++) {
    const node = sceneData[i];
    if (node.__type__ === 'cc.Node' && node._components) {
      for (const compRef of node._components) {
        const compId = compRef.__id__;
        const comp = sceneData[compId];
        if (comp && comp.__type__ === componentType) {
          return { nodeId: i, node };
        }
      }
    }
  }
  return null;
}

/**
 * 查找或创建 Animation 组件
 */
function findOrCreateAnimation(sceneData, nodeId) {
  const node = sceneData[nodeId];

  // 查找现有的 Animation 组件
  for (const compRef of node._components || []) {
    const comp = sceneData[compRef.__id__];
    if (comp && comp.__type__ === 'cc.Animation') {
      return compRef.__id__;
    }
  }

  // 创建新的 Animation 组件
  const newAnimId = sceneData.length;
  sceneData.push({
    __type__: 'cc.Animation',
    _name: '',
    _objFlags: 0,
    __editorExtras__: {},
    node: { __id__: nodeId },
    _enabled: true,
    __prefab: null,
    playOnLoad: true,
    _clips: [],
    _defaultClip: null,
    _crossFades: [],
    _sockets: []
  });

  node._components = node._components || [];
  node._components.push({ __id__: newAnimId });

  return newAnimId;
}

/**
 * 配置角色动画
 */
function configureCharacterAnimation(sceneData, componentType, animNames, isPlayer, scaleFactor) {
  const result = findNodeWithComponent(sceneData, componentType);

  if (!result) {
    console.warn(`⚠️  未找到包含 ${componentType} 的节点`);
    return false;
  }

  const { nodeId, node } = result;
  console.log(`✅ 找到 ${componentType} 节点: ${node._name || 'unnamed'}`);

  // 配置 Animation 组件
  const animId = findOrCreateAnimation(sceneData, nodeId);
  const animComp = sceneData[animId];

  // 添加动画剪辑
  animComp._clips = animNames.map(name => {
    const uuid = getAnimUUID(name, isPlayer);
    return uuid ? { __uuid__: uuid } : null;
  }).filter(Boolean);

  // 设置默认动画
  if (animComp._clips.length > 0) {
    animComp._defaultClip = animComp._clips[0];
  }

  console.log(`✅ 添加了 ${animComp._clips.length} 个动画`);

  // 调整缩放（查找 facingVisualRoot 或直接调整节点）
  let targetNode = node;

  // 尝试查找 facingVisualRoot 子节点
  if (node._children) {
    for (const childRef of node._children) {
      const child = sceneData[childRef.__id__];
      if (child && child._name === 'facingVisualRoot') {
        targetNode = child;
        break;
      }
    }
  }

  // 设置缩放
  targetNode._lscale = {
    __type__: 'cc.Vec3',
    x: scaleFactor,
    y: scaleFactor,
    z: 1
  };

  console.log(`✅ 设置缩放为: ${scaleFactor}`);

  return true;
}

/**
 * 主函数
 */
function main() {
  console.log('开始自动配置场景动画...\n');

  if (!fs.existsSync(SCENE_PATH)) {
    console.error(`❌ 场景文件不存在: ${SCENE_PATH}`);
    return;
  }

  // 读取场景文件
  const sceneData = JSON.parse(fs.readFileSync(SCENE_PATH, 'utf-8'));
  console.log(`📂 读取场景: ${path.basename(SCENE_PATH)}`);
  console.log(`   节点数量: ${sceneData.length}\n`);

  // 配置玩家角色
  console.log('🎮 配置玩家角色...');
  const playerConfigured = configureCharacterAnimation(
    sceneData,
    'PlayerController',
    PLAYER_ANIMS,
    true,
    0.1
  );

  console.log('');

  // 配置敌人
  console.log('👾 配置敌人角色...');
  const enemyConfigured = configureCharacterAnimation(
    sceneData,
    'EnemyAI',
    ENEMY_ANIMS,
    false,
    0.08
  );

  // 保存场景文件
  if (playerConfigured || enemyConfigured) {
    fs.writeFileSync(SCENE_PATH, JSON.stringify(sceneData, null, 2), 'utf-8');
    console.log('\n✅ 场景配置已保存！');
    console.log('\n⚠️  请在 Cocos Creator 中重新加载场景以查看效果');
  } else {
    console.log('\n⚠️  未进行任何配置');
  }
}

main();
