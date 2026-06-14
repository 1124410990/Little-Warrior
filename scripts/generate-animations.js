#!/usr/bin/env node

/**
 * Cocos Creator 动画配置文件生成脚本
 * 自动为切分好的精灵帧创建动画配置
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 动画配置表
const ANIM_CONFIG = {
  // 玩家战士
  player_idle: { sprite: 'player_warrior_idle.png', frames: 4, fps: 8, loop: true },
  player_run: { sprite: 'player_warrior_run.png', frames: 6, fps: 12, loop: true },
  player_attack_1: { sprite: 'player_warrior_attack_1.png', frames: 4, fps: 12, loop: false },
  player_attack_2: { sprite: 'player_warrior_attack_2.png', frames: 4, fps: 12, loop: false },
  player_attack_3: { sprite: 'player_warrior_attack_3.png', frames: 5, fps: 12, loop: false },
  player_skill_slash_wave: { sprite: 'player_warrior_skill.png', frames: 5, fps: 10, loop: false },
  player_hit: { sprite: 'player_warrior_hit.png', frames: 3, fps: 10, loop: false },
  player_dead: { sprite: 'player_warrior_dead.png', frames: 5, fps: 8, loop: false },

  // 史莱姆
  enemy_idle: { sprite: 'enemy_slime_idle.png', frames: 3, fps: 8, loop: true },
  enemy_walk: { sprite: 'enemy_slime_walk.png', frames: 4, fps: 10, loop: true },
  enemy_attack: { sprite: 'enemy_slime_attack.png', frames: 4, fps: 12, loop: false },
  enemy_hit: { sprite: 'enemy_slime_hit.png', frames: 2, fps: 10, loop: false },
  enemy_dead: { sprite: 'enemy_slime_dead.png', frames: 4, fps: 8, loop: false },
};

const TEXTURES_DIR = path.join(__dirname, '../assets/textures/characters');
const PLAYER_ANIM_DIR = path.join(__dirname, '../assets/animations/player');
const ENEMY_ANIM_DIR = path.join(__dirname, '../assets/animations/enemy');

/**
 * 读取精灵帧 UUID
 */
function getSpriteFrameUUIDs(imageName) {
  const metaPath = path.join(TEXTURES_DIR, `${imageName}.meta`);

  if (!fs.existsSync(metaPath)) {
    console.error(`Meta 文件不存在: ${imageName}.meta`);
    return [];
  }

  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  const spriteFrames = [];

  // 提取所有 spriteFrame 的 UUID
  for (const [key, value] of Object.entries(meta.subMetas)) {
    if (value.importer === 'sprite-frame' && value.name && value.name.startsWith('spriteFrame_')) {
      const frameIndex = parseInt(value.name.replace('spriteFrame_', ''));
      spriteFrames.push({ index: frameIndex, uuid: value.uuid });
    }
  }

  // 按索引排序
  spriteFrames.sort((a, b) => a.index - b.index);
  return spriteFrames.map(f => f.uuid);
}

/**
 * 生成动画配置文件
 */
function generateAnimationClip(animName, config) {
  const uuids = getSpriteFrameUUIDs(config.sprite);

  if (uuids.length === 0) {
    console.error(`❌ 未找到精灵帧: ${config.sprite}`);
    return null;
  }

  if (uuids.length !== config.frames) {
    console.warn(`⚠️  ${animName}: 预期${config.frames}帧，实际找到${uuids.length}帧`);
  }

  const duration = uuids.length / config.fps;
  const keys = uuids.map((uuid, index) => ({
    frame: index / config.fps,
    value: {
      __uuid__: uuid
    }
  }));

  const animClip = {
    __type__: 'cc.AnimationClip',
    _name: animName,
    _objFlags: 0,
    _native: '',
    _duration: duration,
    sample: config.fps,
    speed: 1,
    wrapMode: config.loop ? 2 : 1, // 2=Loop, 1=Normal
    enableTrsBlending: false,
    _keys: [
      [
        {
          frame: 0,
          value: 0
        }
      ]
    ],
    _tracks: [
      {
        path: new Array(1).fill(''),
        proxy: null,
        channels: [
          {
            keys: keys
          }
        ]
      }
    ],
    _exoticAnimation: null,
    _events: []
  };

  return animClip;
}

/**
 * 创建目录
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ 创建目录: ${path.relative(process.cwd(), dir)}`);
  }
}

/**
 * 主函数
 */
function main() {
  console.log('开始生成动画配置文件...\n');

  // 创建动画目录
  ensureDir(PLAYER_ANIM_DIR);
  ensureDir(ENEMY_ANIM_DIR);

  let successCount = 0;
  let failCount = 0;

  for (const [animName, config] of Object.entries(ANIM_CONFIG)) {
    const animClip = generateAnimationClip(animName, config);

    if (!animClip) {
      failCount++;
      continue;
    }

    // 确定保存路径
    const isPlayer = animName.startsWith('player_');
    const animDir = isPlayer ? PLAYER_ANIM_DIR : ENEMY_ANIM_DIR;
    const animPath = path.join(animDir, `${animName}.anim`);

    // 保存动画文件
    fs.writeFileSync(animPath, JSON.stringify(animClip, null, 2), 'utf-8');

    const loopStr = config.loop ? '循环' : '不循环';
    console.log(`✅ ${animName}: ${config.frames}帧, ${config.fps}fps, ${loopStr}`);
    successCount++;
  }

  console.log('\n' + '='.repeat(50));
  console.log(`处理完成！成功: ${successCount}, 失败: ${failCount}`);
  console.log('\n📂 动画文件已保存到:');
  console.log(`   - ${path.relative(process.cwd(), PLAYER_ANIM_DIR)}/`);
  console.log(`   - ${path.relative(process.cwd(), ENEMY_ANIM_DIR)}/`);
  console.log('\n⚠️  请在 Cocos Creator 中刷新资源（Ctrl+R）以加载新动画');
}

main();
