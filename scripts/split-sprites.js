#!/usr/bin/env node

/**
 * Cocos Creator 精灵图自动切分脚本
 *
 * 功能：
 * 1. 读取精灵图尺寸和帧数配置
 * 2. 修改 .meta 文件，生成多个独立的 SpriteFrame
 * 3. 自动配置每帧的切分区域
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 精灵图配置表
const SPRITE_CONFIG = {
  // 玩家战士
  'player_warrior_idle.png': { frames: 4, animName: 'player_idle' },
  'player_warrior_run.png': { frames: 6, animName: 'player_run' },
  'player_warrior_attack_1.png': { frames: 4, animName: 'player_attack_1' },
  'player_warrior_attack_2.png': { frames: 4, animName: 'player_attack_2' },
  'player_warrior_attack_3.png': { frames: 5, animName: 'player_attack_3' },
  'player_warrior_skill.png': { frames: 5, animName: 'player_skill_slash_wave' },
  'player_warrior_hit.png': { frames: 3, animName: 'player_hit' },
  'player_warrior_dead.png': { frames: 5, animName: 'player_dead' },

  // 史莱姆敌人
  'enemy_slime_idle.png': { frames: 3, animName: 'enemy_idle' },
  'enemy_slime_walk.png': { frames: 4, animName: 'enemy_walk' },
  'enemy_slime_attack.png': { frames: 4, animName: 'enemy_attack' },
  'enemy_slime_hit.png': { frames: 2, animName: 'enemy_hit' },
  'enemy_slime_dead.png': { frames: 4, animName: 'enemy_dead' },
};

const TEXTURES_DIR = path.join(__dirname, '../assets/textures/characters');

/**
 * 获取图片尺寸（使用 file 命令）
 */
function getImageSize(imagePath) {
  try {
    const output = execSync(`file "${imagePath}"`, { encoding: 'utf-8' });
    const match = output.match(/(\d+)\s*x\s*(\d+)/);
    if (match) {
      return { width: parseInt(match[1]), height: parseInt(match[2]) };
    }
  } catch (error) {
    console.error(`获取图片尺寸失败: ${imagePath}`, error.message);
  }
  return null;
}

/**
 * 生成随机 UUID（简化版）
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 生成子精灵帧的 ID（5位随机字符）
 */
function generateSubMetaId() {
  return Math.random().toString(36).substring(2, 7);
}

/**
 * 修改 .meta 文件，添加多个精灵帧切分
 */
function updateMetaFile(imagePath, frames) {
  const metaPath = `${imagePath}.meta`;

  if (!fs.existsSync(metaPath)) {
    console.error(`Meta 文件不存在: ${metaPath}`);
    return false;
  }

  // 读取 meta 文件
  const metaContent = fs.readFileSync(metaPath, 'utf-8');
  const meta = JSON.parse(metaContent);

  // 获取图片尺寸
  const size = getImageSize(imagePath);
  if (!size) {
    console.error(`无法获取图片尺寸: ${imagePath}`);
    return false;
  }

  const { width, height } = size;
  const frameWidth = Math.floor(width / frames);

  console.log(`处理: ${path.basename(imagePath)} (${width}x${height}, ${frames}帧)`);

  // 获取 texture UUID
  const textureId = Object.keys(meta.subMetas).find(key =>
    meta.subMetas[key].importer === 'texture'
  );

  if (!textureId) {
    console.error(`找不到 texture ID: ${imagePath}`);
    return false;
  }

  const textureUUID = meta.subMetas[textureId].uuid;

  // 删除旧的 spriteFrame（如果只有一个）
  const oldSpriteFrameKeys = Object.keys(meta.subMetas).filter(key =>
    meta.subMetas[key].importer === 'sprite-frame'
  );

  oldSpriteFrameKeys.forEach(key => {
    delete meta.subMetas[key];
  });

  // 为每一帧创建独立的 SpriteFrame
  for (let i = 0; i < frames; i++) {
    const frameId = generateSubMetaId();
    const frameX = i * frameWidth;
    const frameUUID = `${meta.uuid}@${frameId}`;

    meta.subMetas[frameId] = {
      importer: 'sprite-frame',
      uuid: frameUUID,
      displayName: `${path.basename(imagePath, '.png')}_${i}`,
      id: frameId,
      name: `spriteFrame_${i}`,
      userData: {
        trimThreshold: 1,
        rotated: false,
        offsetX: frameX + frameWidth / 2 - width / 2,
        offsetY: 0,
        trimX: frameX,
        trimY: 0,
        width: frameWidth,
        height: height,
        rawWidth: width,
        rawHeight: height,
        borderTop: 0,
        borderBottom: 0,
        borderLeft: 0,
        borderRight: 0,
        packable: true,
        pixelsToUnit: 100,
        pivotX: 0.5,
        pivotY: 0.5,
        meshType: 0,
        vertices: {
          rawPosition: [
            -frameWidth / 2, -height / 2, 0,
            frameWidth / 2, -height / 2, 0,
            -frameWidth / 2, height / 2, 0,
            frameWidth / 2, height / 2, 0
          ],
          indexes: [0, 1, 2, 2, 1, 3],
          uv: [
            frameX, height,
            frameX + frameWidth, height,
            frameX, 0,
            frameX + frameWidth, 0
          ],
          nuv: [
            frameX / width, 0,
            (frameX + frameWidth) / width, 0,
            frameX / width, 1,
            (frameX + frameWidth) / width, 1
          ],
          minPos: [-frameWidth / 2, -height / 2, 0],
          maxPos: [frameWidth / 2, height / 2, 0]
        },
        isUuid: true,
        imageUuidOrDatabaseUri: textureUUID,
        atlasUuid: '',
        trimType: 'auto'
      },
      ver: '1.0.12',
      imported: true,
      files: ['.json'],
      subMetas: {}
    };
  }

  // 保存修改后的 meta 文件
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8');
  console.log(`✅ 成功生成 ${frames} 个精灵帧`);

  return true;
}

/**
 * 主函数
 */
function main() {
  console.log('开始处理精灵图切分...\n');

  let successCount = 0;
  let failCount = 0;

  for (const [filename, config] of Object.entries(SPRITE_CONFIG)) {
    const imagePath = path.join(TEXTURES_DIR, filename);

    if (!fs.existsSync(imagePath)) {
      console.error(`❌ 图片不存在: ${filename}`);
      failCount++;
      continue;
    }

    const success = updateMetaFile(imagePath, config.frames);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    console.log('');
  }

  console.log('='.repeat(50));
  console.log(`处理完成！成功: ${successCount}, 失败: ${failCount}`);
  console.log('\n⚠️  请在 Cocos Creator 中刷新资源（Ctrl+R）以加载新配置');
}

// 执行脚本
main();
