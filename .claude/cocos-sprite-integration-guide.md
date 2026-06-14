# Cocos Creator 精灵图集成指南

本文档提供将生成的角色精灵图集成到 Cocos Creator 项目的详细步骤。

---

## 📋 精灵图信息表

根据生成指南，各精灵图的帧数信息如下：

### 玩家战士精灵图（8张）

| 动作 | 文件名 | 帧数 | 动画名称 |
|------|--------|------|----------|
| 待机 | player_warrior_idle.png | 4 | player_idle |
| 奔跑 | player_warrior_run.png | 6 | player_run |
| 攻击1 | player_warrior_attack_1.png | 4 | player_attack_1 |
| 攻击2 | player_warrior_attack_2.png | 4 | player_attack_2 |
| 攻击3 | player_warrior_attack_3.png | 5 | player_attack_3 |
| 技能 | player_warrior_skill.png | 5 | player_skill_slash_wave |
| 受击 | player_warrior_hit.png | 3 | player_hit |
| 死亡 | player_warrior_dead.png | 5 | player_dead |

### 史莱姆精灵图（5张）

| 动作 | 文件名 | 帧数 | 动画名称 |
|------|--------|------|----------|
| 待机 | enemy_slime_idle.png | 3 | enemy_idle |
| 移动 | enemy_slime_walk.png | 4 | enemy_walk |
| 攻击 | enemy_slime_attack.png | 4 | enemy_attack |
| 受击 | enemy_slime_hit.png | 2 | enemy_hit |
| 死亡 | enemy_slime_dead.png | 4 | enemy_dead |

---

## 🛠️ Cocos Creator 编辑器操作步骤

### 步骤 1：配置精灵图切分模式

对于每张精灵图，需要在编辑器中配置切分：

1. **选中精灵图**
   - 在 **资源管理器** 中找到 `assets/textures/characters/player_warrior_idle.png`
   - 点击选中该图片

2. **设置切分模式**
   - 在 **属性检查器** 中找到 **Type** 选项
   - 选择 **Sprite Frame**

3. **配置切分参数**
   - 点击 **Edit** 按钮打开精灵帧编辑器
   - 选择 **Grid** 模式（网格切分）
   - 设置切分参数：
     - **帧数**：根据上表填写（例如 player_idle 是 4 帧）
     - **每帧宽度**：图片总宽度 ÷ 帧数
     - **每帧高度**：图片总高度
   - 点击 **Apply** 应用切分

4. **重复步骤**
   - 对所有 13 张精灵图重复上述操作
   - 确保每张图的帧数与表格中的数据一致

---

### 步骤 2：创建动画剪辑（Animation Clip）

为每个动作创建动画剪辑：

1. **创建动画文件夹**
   - 在 `assets` 目录下创建 `animations` 文件夹
   - 创建子文件夹：
     - `assets/animations/player/`
     - `assets/animations/enemy/`

2. **创建动画剪辑**
   - 右键点击 `assets/animations/player/`
   - 选择 **创建 → Animation Clip**
   - 命名为 `player_idle`

3. **编辑动画剪辑**
   - 双击 `player_idle` 打开动画编辑器
   - 点击 **添加属性轨道**
   - 选择 **cc.Sprite.spriteFrame**
   - 从资源管理器拖入切分好的精灵帧（player_warrior_idle 的 4 帧）
   - 按顺序排列，调整帧率（建议 8-12 FPS）

4. **重复创建**
   - 为所有动作创建对应的动画剪辑：
     - 玩家：8 个动画剪辑
     - 史莱姆：5 个动画剪辑

---

### 步骤 3：配置角色节点的 Animation 组件

#### 玩家角色配置

1. **打开场景**
   - 在编辑器中打开包含玩家角色的场景

2. **添加 Sprite 组件**
   - 选中玩家角色节点
   - 确保有 **cc.Sprite** 组件
   - 如果没有，点击 **添加组件 → 2D → Sprite**

3. **配置 Animation 组件**
   - 选中玩家角色节点
   - 在 **属性检查器** 中找到 **Animation** 组件
   - 点击 **Clips** 右边的 **+** 按钮添加动画剪辑
   - 依次添加所有 8 个玩家动画剪辑
   - 设置 **Default Clip** 为 `player_idle`

4. **调整缩放比例**
   - 由于精灵图尺寸较大（700-2000px），需要缩小显示
   - 选中玩家角色节点（或 `facingVisualRoot` 节点）
   - 在 **属性检查器** 中调整 **Scale** 值
   - 建议缩放比例：0.1 - 0.15（根据实际效果调整）

#### 史莱姆配置

1. **找到史莱姆预制体或场景节点**
2. 重复上述步骤，添加 5 个史莱姆动画剪辑
3. 调整缩放比例（建议 0.08 - 0.12）

---

### 步骤 4：验证动画播放

1. **运行场景**
   - 点击编辑器顶部的 **运行** 按钮

2. **测试动画**
   - 检查待机动画是否正常播放
   - 测试移动、攻击等动作是否正常切换
   - 检查角色尺寸是否合适

3. **调整细节**
   - 如果角色太大或太小，调整 Scale 值
   - 如果动画速度不合适，调整动画剪辑的帧率
   - 如果动画不流畅，检查精灵帧切分是否正确

---

## 🔧 自动化脚本方案（可选）

如果你希望通过脚本自动生成动画配置，我可以编写：
1. 精灵帧切分配置脚本
2. 动画剪辑生成脚本
3. 批量配置脚本

这样可以节省手动操作的时间。

---

## 📝 注意事项

1. **精灵图命名必须与代码中的动画名称对应**
   - 代码中调用 `playAnimation('player_idle')`
   - 动画剪辑必须命名为 `player_idle`

2. **帧数必须正确**
   - 切分时的帧数必须与生成指南中的帧数一致
   - 否则动画会错位或不完整

3. **缩放比例统一**
   - 建议在父节点统一设置缩放，避免每个动画单独调整

4. **透明背景**
   - 确保精灵图是 PNG 格式且有透明背景
   - 在 Cocos Creator 中检查 Alpha 通道是否正常

---

生成时间：2026-06-14  
项目：LittleWarrior
