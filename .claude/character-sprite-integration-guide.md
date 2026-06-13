# 角色精灵图集成指南

本文档说明如何将新生成的角色精灵图集成到 LittleWarrior 项目的 Cocos Creator 中。

## 前置准备

### 所需文件清单

确保你已经通过 GPT-Image2 生成了以下 13 张精灵表图片：

**玩家战士（8张）：**
1. `player_warrior_idle.png` (256x64, 4帧)
2. `player_warrior_run.png` (384x64, 6帧)
3. `player_warrior_attack_1.png` (256x64, 4帧)
4. `player_warrior_attack_2.png` (256x64, 4帧)
5. `player_warrior_attack_3.png` (320x64, 5帧)
6. `player_warrior_skill.png` (320x64, 5帧)
7. `player_warrior_hit.png` (192x64, 3帧)
8. `player_warrior_dead.png` (320x64, 5帧)

**史莱姆敌人（5张）：**
9. `enemy_slime_idle.png` (144x48, 3帧)
10. `enemy_slime_walk.png` (192x48, 4帧)
11. `enemy_slime_attack.png` (192x48, 4帧)
12. `enemy_slime_hit.png` (96x48, 2帧)
13. `enemy_slime_dead.png` (192x48, 4帧)

---

## 步骤1：放置图片文件

### 1.1 创建目录结构

在项目中创建以下目录：

```bash
D:\MyCode\PrivateProject\LittleWarrior\assets\textures\characters\player\
D:\MyCode\PrivateProject\LittleWarrior\assets\textures\characters\enemy\
```

### 1.2 放置文件

将生成的图片放置到对应目录：

- 玩家战士图片（8张）→ `assets/textures/characters/player/`
- 史莱姆敌人图片（5张）→ `assets/textures/characters/enemy/`

---

## 步骤2：在 Cocos Creator 中配置精灵图

### 2.1 打开 Cocos Creator 项目

1. 启动 Cocos Creator
2. 打开 `LittleWarrior` 项目
3. 等待资源导入完成

### 2.2 配置精灵表（Sprite Sheet）

对**每一张图片**重复以下操作：

#### 操作步骤：

1. **选中图片**：在 Assets 面板中找到并选中图片
2. **切换到 Sprite 模式**：
   - 在属性检查器（Properties）中
   - 将 `Type` 设置为 `sprite-frame`
3. **设置精灵表类型**：
   - 点击 `Use As` 下拉菜单
   - 选择 `Sprite Frame`
4. **切分精灵帧**：
   - 点击属性检查器右上角的 **"Edit"** 按钮
   - 进入精灵编辑模式
5. **自动切分**：
   - 选择 **"Grid"**（网格切分）模式
   - 设置切分参数：
     - **玩家战士**：`Grid Width: 64`, `Grid Height: 64`
     - **史莱姆敌人**：`Grid Width: 48`, `Grid Height: 48`
   - 点击 **"Slice"** 按钮自动切分
6. **验证帧数**：
   - 检查切分出的帧数是否与预期一致
   - 玩家 idle 应该有 4 帧
   - 史莱姆 idle 应该有 3 帧
7. **保存**：点击右上角的 **"Apply"** 或 **"√"** 按钮

#### 每张图片的切分参数：

| 图片文件 | Grid Width | Grid Height | 预期帧数 |
|---------|-----------|------------|---------|
| player_warrior_idle.png | 64 | 64 | 4 |
| player_warrior_run.png | 64 | 64 | 6 |
| player_warrior_attack_1.png | 64 | 64 | 4 |
| player_warrior_attack_2.png | 64 | 64 | 4 |
| player_warrior_attack_3.png | 64 | 64 | 5 |
| player_warrior_skill.png | 64 | 64 | 5 |
| player_warrior_hit.png | 64 | 64 | 3 |
| player_warrior_dead.png | 64 | 64 | 5 |
| enemy_slime_idle.png | 48 | 48 | 3 |
| enemy_slime_walk.png | 48 | 48 | 4 |
| enemy_slime_attack.png | 48 | 48 | 4 |
| enemy_slime_hit.png | 48 | 48 | 2 |
| enemy_slime_dead.png | 48 | 48 | 4 |

---

## 步骤3：创建动画片段（Animation Clips）

### 3.1 创建动画资源目录

创建目录：`assets/animations/characters/`

### 3.2 创建玩家动画片段

对每个玩家动作创建一个动画片段：

1. **右键点击** `assets/animations/characters/` 目录
2. 选择 **Create → Animation Clip**
3. 命名为对应的动作名称（必须与代码中一致）：
   - `player_idle`
   - `player_run`
   - `player_attack_1`
   - `player_attack_2`
   - `player_attack_3`
   - `player_skill_slash_wave`
   - `player_hit`
   - `player_dead`

### 3.3 创建史莱姆动画片段

同样方式创建史莱姆的动画片段：
   - `enemy_idle`
   - `enemy_walk`
   - `enemy_attack`
   - `enemy_hit`
   - `enemy_dead`

---

## 步骤4：配置动画片段内容

### 4.1 编辑动画片段

对**每个动画片段**重复以下操作：

1. **双击动画片段**：打开动画编辑器
2. **添加 Sprite 属性轨道**：
   - 在左侧节点树中选择目标节点（角色精灵节点）
   - 点击 **"Add Property"**
   - 选择 `cc.Sprite` → `spriteFrame`
3. **添加关键帧**：
   - 将对应的精灵帧拖拽到时间轴上
   - 按顺序排列（frame_0, frame_1, frame_2...）
4. **设置帧率和循环**：
   - **帧率**：建议 10-12 FPS
   - **循环**：
     - `idle`, `run`, `walk` → 勾选 **"Loop"**
     - 其他动作 → 不勾选循环
5. **保存**：Ctrl+S 保存动画

### 4.2 动画时长参考

根据代码中的时间设定，建议的动画时长：

| 动画名称 | 建议时长 | 循环 | 帧率 |
|---------|---------|------|------|
| player_idle | 0.4s | ✓ | 10 FPS |
| player_run | 0.5s | ✓ | 12 FPS |
| player_attack_1 | 0.28s | ✗ | 14 FPS |
| player_attack_2 | 0.28s | ✗ | 14 FPS |
| player_attack_3 | 0.35s | ✗ | 14 FPS |
| player_skill_slash_wave | 0.55s | ✗ | 9 FPS |
| player_hit | 0.3s | ✗ | 10 FPS |
| player_dead | 0.6s | ✗ | 8 FPS |
| enemy_idle | 0.3s | ✓ | 10 FPS |
| enemy_walk | 0.4s | ✓ | 10 FPS |
| enemy_attack | 0.4s | ✗ | 10 FPS |
| enemy_hit | 0.2s | ✗ | 10 FPS |
| enemy_dead | 0.45s | ✗ | 9 FPS |

---

## 步骤5：在场景中配置角色

### 5.1 找到角色预制体（Prefab）

在 Assets 面板中找到：
- 玩家预制体：`assets/prefabs/player.prefab`（或类似路径）
- 敌人预制体：`assets/prefabs/enemy_slime.prefab`（或类似路径）

### 5.2 配置 Animation 组件

**对玩家预制体：**

1. **打开预制体**：双击 `player.prefab`
2. **选中角色根节点**
3. **找到 Animation 组件**（应该已经存在）
4. **配置 Clips 数组**：
   - 点击 `Clips` 数组的 `+` 按钮
   - 将刚才创建的 8 个动画片段拖拽到数组中：
     - player_idle
     - player_run
     - player_attack_1
     - player_attack_2
     - player_attack_3
     - player_skill_slash_wave
     - player_hit
     - player_dead
5. **设置默认动画**：
   - 将 `Default Clip` 设置为 `player_idle`
6. **保存预制体**：Ctrl+S

**对史莱姆预制体：**

重复相同步骤，配置 5 个敌人动画片段。

---

## 步骤6：更新场景中的角色节点

### 6.1 找到使用角色的场景

打开场景文件：
- 训练房场景：`assets/scenes/room_training_01.scene`（或类似路径）

### 6.2 刷新预制体实例

1. 在 Hierarchy 面板中选中场景中的角色节点
2. 如果角色是预制体实例，点击 **"Revert"** 按钮刷新
3. 如果不是预制体，手动配置 Animation 组件的 Clips 数组

---

## 步骤7：测试验证

### 7.1 运行游戏

1. 点击 Cocos Creator 顶部的 **"Play"** 按钮
2. 观察角色动画是否正常播放

### 7.2 验证清单

- [ ] 玩家待机动画循环播放
- [ ] 玩家移动时播放跑步动画
- [ ] 按 J 键触发攻击动画（三段连击）
- [ ] 按 Z 键触发技能动画
- [ ] 玩家受击时播放受击动画
- [ ] 玩家生命归零时播放死亡动画
- [ ] 史莱姆待机动画循环播放
- [ ] 史莱姆追击时播放移动动画
- [ ] 史莱姆攻击时播放攻击动画
- [ ] 史莱姆受击时播放受击动画
- [ ] 史莱姆死亡时播放死亡动画并消失

### 7.3 常见问题排查

**问题：动画不播放**
- 检查 Animation 组件的 Clips 数组是否配置正确
- 检查动画片段名称是否与代码中的名称完全一致（区分大小写）
- 检查 Default Clip 是否设置

**问题：动画播放错误的帧**
- 检查精灵表切分是否正确
- 检查动画片段中的帧顺序是否正确
- 重新切分精灵表并重新配置动画

**问题：动画播放过快或过慢**
- 调整动画片段的帧率（FPS）
- 调整动画片段的总时长

**问题：角色朝向错误**
- 代码中使用 `facingVisualRoot` 的 scale 来控制朝向
- 确保精灵图朝向为右侧
- 检查 `CharacterBase.ts` 中的 `faceHorizontal()` 方法

---

## 备用方案：命令行批量操作

如果需要批量创建动画片段或配置，可以编写自动化脚本。请告知需求，我可以提供相应的脚本。

---

## 后续优化建议

1. **优化精灵图尺寸**：考虑将多个动作打包到一个图集（Atlas）中，减少 DrawCall
2. **添加特效**：在攻击动画中添加剑光、能量波等特效精灵
3. **细化动画**：根据实际手感调整动画时长和帧率
4. **添加音效**：为每个动作添加对应的音效

---

集成完成后，角色的视觉效果应该有明显提升！

生成时间：2026-06-13
项目：LittleWarrior
