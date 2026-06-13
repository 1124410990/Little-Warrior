# 角色精灵图生成指南

本文档提供使用 GPT-Image2 生成 LittleWarrior 项目角色精灵图的详细规格和 Prompt 模板。

## 生成策略

采用**完整精灵表**生成方式：每个动作生成一张完整的精灵表（Sprite Sheet），所有帧横向排列。

## 通用要求

- **格式**：PNG，透明背景
- **风格**：16-bit 像素艺术（Pixel Art）
- **排列**：水平排列（horizontal layout）
- **视角**：侧面视角（side view）
- **边界**：每帧紧密排列，无额外边距

---

## 玩家战士角色（Player Warrior）

### 基础设定
- **外观**：详见 [character-appearance-spec.md](character-appearance-spec.md)
- **尺寸**：每帧 64x64 像素（严格要求）
- **朝向**：右侧朝向（代码会自动水平翻转）

**⚠️ 重要：所有玩家图片必须使用完全一致的外观描述！**

---

### 1. 待机动作（player_idle）

**文件名**：`player_warrior_idle.png`  
**帧数**：4 帧  
**总尺寸**：256x64 像素（严格要求）

**Prompt**：
```
pixel art sprite sheet, exactly 64x64 pixels per frame, 4 frames horizontal layout, total size 256x64 pixels,
warrior character idle animation with slight breathing motion,

Character appearance (MUST match all other frames):
medium brown messy short hair with bangs, small dark brown dot eyes,
fair peachy skin with round friendly face and slight chubby cheeks,
royal blue metal armor with bright gold trim on all edges,
round shoulder pads with gold borders and gold rivets,
simple gold cross emblem at center of chest plate,
flowing crimson red cape with round gold clasp at shoulders and dark red inner lining,
bright silver longsword with metallic sheen,
ornate gold crossguard with decorative engravings and small sapphire blue gem at center,
gold hilt wrapped with dark brown leather grip,
dark brown leather high boots reaching knees,

side view facing right, transparent background,
16-bit pixel art style similar to Final Fantasy Tactics, clean pixel outlines,
very small character size fitting in 64x64 pixels, simple but recognizable details
```

---

### 2. 奔跑动作（player_run）

**文件名**：`player_warrior_run.png`  
**帧数**：6 帧  
**总尺寸**：384x64 像素（严格要求）

**Prompt**：
```
pixel art sprite sheet, exactly 64x64 pixels per frame, 6 frames horizontal layout, total size 384x64 pixels,
warrior character running animation with dynamic leg motion cycle,

Character appearance (MUST match all other frames):
medium brown messy short hair with bangs, small dark brown dot eyes,
fair peachy skin with round friendly face and slight chubby cheeks,
royal blue metal armor with bright gold trim on all edges,
round shoulder pads with gold borders and gold rivets,
simple gold cross emblem at center of chest plate,
flowing crimson red cape billowing behind with round gold clasp and dark red inner lining,
bright silver longsword with metallic sheen held while running,
ornate gold crossguard with decorative engravings and small sapphire blue gem at center,
gold hilt wrapped with dark brown leather grip,
dark brown leather high boots reaching knees,

side view facing right, transparent background,
16-bit pixel art style similar to Final Fantasy Tactics, smooth running cycle animation,
very small character size fitting in 64x64 pixels
```

---

### 3. 攻击动作1（player_attack_1）

**文件名**：`player_warrior_attack_1.png`  
**帧数**：4 帧  
**总尺寸**：256x64 像素（严格要求）

**Prompt**：
```
pixel art sprite sheet, exactly 64x64 pixels per frame, 4 frames horizontal layout, total size 256x64 pixels,
warrior character horizontal slash attack, sequence: ready stance -> wind up -> slash -> follow through,

Character appearance (MUST match all other frames):
medium brown messy short hair with bangs, small dark brown dot eyes,
fair peachy skin with round friendly face and slight chubby cheeks,
royal blue metal armor with bright gold trim on all edges,
round shoulder pads with gold borders and gold rivets,
simple gold cross emblem at center of chest plate,
flowing crimson red cape swinging with motion, round gold clasp and dark red inner lining,
bright silver longsword with metallic sheen, slash motion from right to left with sword trail effect,
ornate gold crossguard with decorative engravings and small sapphire blue gem at center,
gold hilt wrapped with dark brown leather grip,
dark brown leather high boots reaching knees,

side view facing right, transparent background,
16-bit pixel art style similar to Final Fantasy Tactics,
very small character size fitting in 64x64 pixels
```

---

### 4. 攻击动作2（player_attack_2）

**文件名**：`player_warrior_attack_2.png`  
**帧数**：4 帧  
**总尺寸**：256x64 像素（严格要求）

**Prompt**：
```
pixel art sprite sheet, exactly 64x64 pixels per frame, 4 frames horizontal layout, total size 256x64 pixels,
warrior character diagonal slash attack, sequence: ready stance -> wind up -> diagonal slash -> recovery,

Character appearance (MUST match all other frames):
medium brown messy short hair with bangs, small dark brown dot eyes,
fair peachy skin with round friendly face and slight chubby cheeks,
royal blue metal armor with bright gold trim on all edges,
round shoulder pads with gold borders and gold rivets,
simple gold cross emblem at center of chest plate,
flowing crimson red cape flowing with slash motion, round gold clasp and dark red inner lining,
bright silver longsword with metallic sheen, diagonal slash from upper left to lower right with sword trail effect,
ornate gold crossguard with decorative engravings and small sapphire blue gem at center,
gold hilt wrapped with dark brown leather grip,
dark brown leather high boots reaching knees,

side view facing right, transparent background,
16-bit pixel art style similar to Final Fantasy Tactics,
very small character size fitting in 64x64 pixels
```

---

### 5. 攻击动作3（player_attack_3）

**文件名**：`player_warrior_attack_3.png`  
**帧数**：5 帧  
**总尺寸**：320x64 像素（严格要求）

**Prompt**：
```
pixel art sprite sheet, exactly 64x64 pixels per frame, 5 frames horizontal layout, total size 320x64 pixels,
warrior character spinning slash attack, sequence: ready -> spin start -> full spin -> slash circle -> recovery,

Character appearance (MUST match all other frames):
medium brown messy short hair with bangs, small dark brown dot eyes,
fair peachy skin with round friendly face and slight chubby cheeks,
royal blue metal armor with bright gold trim on all edges,
round shoulder pads with gold borders and gold rivets,
simple gold cross emblem at center of chest plate,
flowing crimson red cape swirling dramatically during 360 degree spin, round gold clasp and dark red inner lining,
bright silver longsword with metallic sheen creating circular slash effect,
ornate gold crossguard with decorative engravings and small sapphire blue gem at center,
gold hilt wrapped with dark brown leather grip,
dark brown leather high boots reaching knees,

side view facing right, transparent background,
16-bit pixel art style similar to Final Fantasy Tactics,
very small character size fitting in 64x64 pixels
```

---

### 6. 技能动作（player_skill_slash_wave）

**文件名**：`player_warrior_skill.png`  
**帧数**：5 帧  
**总尺寸**：320x64 像素（严格要求）

**Prompt**：
```
pixel art sprite sheet, exactly 64x64 pixels per frame, 5 frames horizontal layout, total size 320x64 pixels,
warrior character skill attack, sequence: charge stance -> thrust forward -> energy release -> sword glow -> recovery,

Character appearance (MUST match all other frames):
medium brown messy short hair with bangs, small dark brown dot eyes,
fair peachy skin with round friendly face and slight chubby cheeks,
royal blue metal armor with bright gold trim on all edges,
round shoulder pads with gold borders and gold rivets,
simple gold cross emblem at center of chest plate,
flowing crimson red cape billowing with thrust motion, round gold clasp and dark red inner lining,
bright silver longsword with metallic sheen glowing with blue energy,
forward thrust releasing sapphire blue energy wave,
ornate gold crossguard with decorative engravings and small sapphire blue gem at center glowing brightly,
gold hilt wrapped with dark brown leather grip,
dark brown leather high boots reaching knees,

side view facing right, transparent background,
16-bit pixel art style similar to Final Fantasy Tactics,
very small character size fitting in 64x64 pixels
```

---

### 7. 受击动作（player_hit）

**文件名**：`player_warrior_hit.png`  
**帧数**：3 帧  
**总尺寸**：192x64 像素（严格要求）

**Prompt**：
```
pixel art sprite sheet, exactly 64x64 pixels per frame, 3 frames horizontal layout, total size 192x64 pixels,
warrior character hit reaction, sequence: impact moment -> recoil back -> recover stance,

Character appearance (MUST match all other frames):
medium brown messy short hair with bangs, small dark brown dot eyes,
fair peachy skin with round friendly face and slight chubby cheeks,
royal blue metal armor with bright gold trim on all edges,
round shoulder pads with gold borders and gold rivets,
simple gold cross emblem at center of chest plate,
flowing crimson red cape jerking backward from impact, round gold clasp and dark red inner lining,
bright silver longsword with metallic sheen, body recoiling backward with slight shake effect,
ornate gold crossguard with decorative engravings and small sapphire blue gem at center,
gold hilt wrapped with dark brown leather grip,
dark brown leather high boots reaching knees,

side view facing right, transparent background,
16-bit pixel art style similar to Final Fantasy Tactics,
very small character size fitting in 64x64 pixels
```

---

### 8. 死亡动作（player_dead）

**文件名**：`player_warrior_dead.png`  
**帧数**：5 帧  
**总尺寸**：320x64 像素（严格要求）

**Prompt**：
```
pixel art sprite sheet, exactly 64x64 pixels per frame, 5 frames horizontal layout, total size 320x64 pixels,
warrior character death animation, sequence: stagger -> knee down -> fall forward -> hit ground -> lying still with cape covering,

Character appearance (MUST match all other frames):
medium brown messy short hair with bangs, small dark brown dot eyes,
fair peachy skin with round friendly face and slight chubby cheeks,
royal blue metal armor with bright gold trim on all edges,
round shoulder pads with gold borders and gold rivets,
simple gold cross emblem at center of chest plate,
flowing crimson red cape draping over falling body, round gold clasp and dark red inner lining,
bright silver longsword with metallic sheen dropping from hand during collapse,
ornate gold crossguard with decorative engravings and small sapphire blue gem at center,
gold hilt wrapped with dark brown leather grip,
dark brown leather high boots reaching knees,

side view facing right, transparent background,
16-bit pixel art style similar to Final Fantasy Tactics,
very small character size fitting in 64x64 pixels
```

---

## 史莱姆敌人（Enemy Slime）

### 基础设定
- **外观**：详见 [character-appearance-spec.md](character-appearance-spec.md)
- **尺寸**：每帧 48x48 像素（严格要求）
- **朝向**：右侧朝向（代码会自动水平翻转）

**⚠️ 重要：所有史莱姆图片必须使用完全一致的外观描述！**

---

### 9. 待机动作（enemy_idle）

**文件名**：`enemy_slime_idle.png`  
**帧数**：3 帧  
**总尺寸**：144x48 像素（严格要求）

**Prompt**：
```
pixel art sprite sheet, exactly 48x48 pixels per frame, 3 frames horizontal layout, total size 144x48 pixels,
cute slime enemy idle animation with gentle bouncing motion and squash and stretch effect,

Slime appearance (MUST match all other frames):
bright lime green translucent jelly body with glossy finish,
light green shine area at top of body showing reflection,
dark green shading at bottom of body for depth,
two small pure black round dot eyes symmetrically placed,
tiny white dot at upper right of each eye for liveliness,
round bouncy blob shape with smooth curved edges,

side view facing right, transparent background,
16-bit pixel art retro game style, kawaii slime character,
very small size fitting in 48x48 pixels, simple recognizable features
```

---

### 10. 移动动作（enemy_walk）

**文件名**：`enemy_slime_walk.png`  
**帧数**：4 帧  
**总尺寸**：192x48 像素（严格要求）

**Prompt**：
```
pixel art sprite sheet, exactly 48x48 pixels per frame, 4 frames horizontal layout, total size 192x48 pixels,
cute slime enemy walking animation with hopping forward motion cycle,
sequence: compress -> jump -> stretch in air -> land compress,

Slime appearance (MUST match all other frames):
bright lime green translucent jelly body with glossy finish,
light green shine area at top of body showing reflection,
dark green shading at bottom of body for depth,
two small pure black round dot eyes symmetrically placed,
tiny white dot at upper right of each eye for liveliness,
round bouncy blob shape with smooth curved edges,

side view facing right, transparent background,
16-bit pixel art retro game style, kawaii slime character,
very small size fitting in 48x48 pixels
```

---

### 11. 攻击动作（enemy_attack）

**文件名**：`enemy_slime_attack.png`  
**帧数**：4 帧  
**总尺寸**：192x48 像素（严格要求）

**Prompt**：
```
pixel art sprite sheet, exactly 48x48 pixels per frame, 4 frames horizontal layout, total size 192x48 pixels,
cute slime enemy attack animation with aggressive lunge forward attack motion,
sequence: wind up compress -> stretch lunge -> hit moment -> recoil back,

Slime appearance (MUST match all other frames):
bright lime green translucent jelly body with glossy finish,
light green shine area at top of body showing reflection,
dark green shading at bottom of body for depth,
two small pure black round dot eyes symmetrically placed,
tiny white dot at upper right of each eye for liveliness,
round bouncy blob shape with smooth curved edges,

side view facing right, transparent background,
16-bit pixel art retro game style, kawaii slime character,
very small size fitting in 48x48 pixels
```

---

### 12. 受击动作（enemy_hit）

**文件名**：`enemy_slime_hit.png`  
**帧数**：2 帧  
**总尺寸**：96x48 像素（严格要求）

**Prompt**：
```
pixel art sprite sheet, exactly 48x48 pixels per frame, 2 frames horizontal layout, total size 96x48 pixels,
cute slime enemy hit reaction animation with wobbling shake effect from impact,
sequence: impact wobble left -> wobble right recovery,

Slime appearance (MUST match all other frames):
bright lime green translucent jelly body with glossy finish,
light green shine area at top of body showing reflection,
dark green shading at bottom of body for depth,
two small pure black round dot eyes symmetrically placed and squinting from pain,
tiny white dot at upper right of each eye for liveliness,
round bouncy blob shape with smooth curved edges,

side view facing right, transparent background,
16-bit pixel art retro game style, kawaii slime character,
very small size fitting in 48x48 pixels
```

---

### 13. 死亡动作（enemy_dead）

**文件名**：`enemy_slime_dead.png`  
**帧数**：4 帧  
**总尺寸**：192x48 像素（严格要求）

**Prompt**：
```
pixel art sprite sheet, exactly 48x48 pixels per frame, 4 frames horizontal layout, total size 192x48 pixels,
cute slime enemy death animation with melting and dissolving motion,
sequence: deflate lose shape -> flatten puddle -> melt spreading -> disappear fade out,

Slime appearance (MUST match all other frames):
bright lime green translucent jelly body with glossy finish gradually fading,
light green shine area at top of body showing reflection,
dark green shading at bottom of body for depth,
two small pure black round dot eyes gradually fading away,
tiny white dot at upper right of each eye for liveliness,
round bouncy blob shape melting into flat puddle,

side view facing right, transparent background,
16-bit pixel art retro game style, kawaii slime character,
very small size fitting in 48x48 pixels
```

---

## 生成顺序建议

### 阶段1：测试生成（1张）
先生成 `player_warrior_idle.png` 测试效果，严格检查：
- [ ] 帧数是否正确（4帧）
- [ ] 总尺寸是否为 256x64 像素
- [ ] 每帧尺寸是否为 64x64 像素
- [ ] 角色外观是否符合详细规格（参考 character-appearance-spec.md）
- [ ] 是否有透明背景
- [ ] 像素艺术风格是否清晰（无模糊）
- [ ] 所有颜色是否与规格一致

### 阶段2：批量生成玩家战士（7张）
确认测试通过后，按顺序生成剩余7张玩家精灵表：
1. `player_warrior_run.png` (384x64)
2. `player_warrior_attack_1.png` (256x64)
3. `player_warrior_attack_2.png` (256x64)
4. `player_warrior_attack_3.png` (320x64)
5. `player_warrior_skill.png` (320x64)
6. `player_warrior_hit.png` (192x64)
7. `player_warrior_dead.png` (320x64)

**⚠️ 每生成一张，立即对比第一张确保外观一致！**

### 阶段3：批量生成史莱姆（5张）
生成所有5张史莱姆精灵表：
1. `enemy_slime_idle.png` (144x48)
2. `enemy_slime_walk.png` (192x48)
3. `enemy_slime_attack.png` (192x48)
4. `enemy_slime_hit.png` (96x48)
5. `enemy_slime_dead.png` (192x48)

**⚠️ 史莱姆所有图片必须使用相同的绿色色调和眼睛样式！**

---

## 质量检查清单

生成完成后，每张图片都需要严格检查：

### 通用检查项
- [ ] **尺寸精确**：总宽度 = 帧数 × 帧宽，高度准确（玩家64px，史莱姆48px）
- [ ] **帧数正确**：与指南规定的帧数完全一致
- [ ] **透明背景**：无白边、无灰边、完全透明
- [ ] **像素风格**：清晰锐利的像素艺术，无模糊或抗锯齿
- [ ] **朝向一致**：所有角色都面向右侧

### 玩家战士专项检查
- [ ] **头发颜色**：Medium brown (#8B6F47)，凌乱短发带刘海
- [ ] **眼睛颜色**：Dark brown (#3C2415)，小圆点眼睛
- [ ] **盔甲颜色**：Royal blue (#1E3A8A)，金色边饰
- [ ] **胸甲纹章**：金色十字纹章清晰可见
- [ ] **披风颜色**：Crimson red (#DC143C)，金色扣环
- [ ] **武器宝石**：护手中央有蓝宝石 (#1E40AF)
- [ ] **外观一致**：8张图片的角色外观完全相同

### 史莱姆专项检查
- [ ] **身体颜色**：Lime green (#32CD32)，半透明质感
- [ ] **眼睛颜色**：Pure black (#000000)，两个对称小点
- [ ] **高光效果**：顶部有浅绿色高光
- [ ] **眼睛高光**：每个眼睛右上角有白色小点
- [ ] **外观一致**：5张图片的史莱姆外观完全相同

---

## 生成完成后

将所有 13 张符合规格的图片（严格按照尺寸要求）放置到项目目录：
```
D:\MyCode\PrivateProject\LittleWarrior\assets\textures\characters\
```

放置完成后告诉 AI 助手，我会：
1. 验证图片尺寸和质量
2. 在 Cocos Creator 中配置精灵帧切分
3. 创建动画配置文件（.anim）
4. 集成到现有角色组件
5. 提供测试验证脚本

---

## 📋 重要提醒

### 尺寸要求（必须严格遵守）
- **玩家战士**：每帧 64x64 像素（总高度必须是 64px）
- **史莱姆**：每帧 48x48 像素（总高度必须是 48px）

### 外观一致性（必须严格遵守）
- 同一角色的所有动作图片必须使用**完全相同**的外观描述
- 参考 [character-appearance-spec.md](character-appearance-spec.md) 中的详细规格
- 每生成一张新图，立即与第一张对比确保一致

### 生成技巧
- 在 Prompt 中明确标注 `exactly 64x64 pixels per frame` 或 `exactly 48x48 pixels per frame`
- 强调 `total size [宽度]x[高度] pixels` 以确保精确尺寸
- 使用 `very small character size fitting in 64x64 pixels` 确保角色不会超出边界

---

生成时间：2026-06-13  
项目：LittleWarrior  
版本：v2.0（详细规格版，严格尺寸要求）
