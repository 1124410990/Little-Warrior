#!/usr/bin/env node

/**
 * 生成 Cocos Creator 动画配置的简化方案
 *
 * 由于 .meta 文件方式不生效，改用创建独立的精灵帧资源和动画配置
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 精灵图配置
const SPRITE_CONFIG = {
  'player_warrior_idle.png': { frames: 4, animName: 'player_idle' },
  'player_warrior_run.png': { frames: 6, animName: 'player_run' },
  'player_warrior_attack_1.png': { frames: 4, animName: 'player_attack_1' },
  'player_warrior_attack_2.png': { frames: 4, animName: 'player_attack_2' },
  'player_warrior_attack_3.png': { frames: 5, animName: 'player_attack_3' },
  'player_warrior_skill.png': { frames: 5, animName: 'player_skill_slash_wave' },
  'player_warrior_hit.png': { frames: 3, animName: 'player_hit' },
  'player_warrior_dead.png': { frames: 5, animName: 'player_dead' },
  'enemy_slime_idle.png': { frames: 3, animName: 'enemy_idle' },
  'enemy_slime_walk.png': { frames: 4, animName: 'enemy_walk' },
  'enemy_slime_attack.png': { frames: 4, animName: 'enemy_attack' },
  'enemy_slime_hit.png': { frames: 2, animName: 'enemy_hit' },
  'enemy_slime_dead.png': { frames: 4, animName: 'enemy_dead' },
};

const GUIDE_PATH = path.join(__dirname, '../.claude/sprite-frames-manual-guide.md');

/**
 * 生成手动操作指南
 */
function generateManualGuide() {
  let content = `# 精灵图手动切分指南

由于脚本修改 .meta 文件未生效，请按照以下步骤手动配置。

---

## 📋 配置清单

`;

  for (const [filename, config] of Object.entries(SPRITE_CONFIG)) {
    const baseName = path.basename(filename, '.png');
    content += `
### ${baseName}
- **文件**: \`${filename}\`
- **帧数**: ${config.frames}
- **动画名**: \`${config.animName}\`
- **操作**: 手动在编辑器中设置 Sprite Type 为 Sliced，然后按 Grid 模式切分成 ${config.frames} 列

`;
  }

  content += `
---

## 🎯 简化方案：直接使用单帧 SpriteFrame

由于当前的高分辨率图片已经是完整的精灵表，我们可以：

1. **保持当前的单个 SpriteFrame 配置**
2. **在代码中动态切分纹理显示**
3. **调整角色缩放比例**

这样可以避免复杂的编辑器配置，直接在代码层面处理。

---

## 下一步：实现代码层面的精灵帧切换

我会创建一个组件来动态切换精灵表的显示区域，实现动画效果。
`;

  fs.writeFileSync(GUIDE_PATH, content, 'utf-8');
  console.log(`✅ 手动指南已生成: ${GUIDE_PATH}`);
}

generateManualGuide();
console.log('\n💡 建议：使用代码方式动态切换精灵帧，无需手动配置编辑器！');
