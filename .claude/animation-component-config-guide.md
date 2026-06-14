# Animation 组件配置指南

## 🎯 快速配置步骤

### 玩家角色配置

1. **打开场景**
   - 在 Cocos Creator 中打开 `TrainingRoom.scene`

2. **找到玩家节点**
   - 在层级管理器中找到玩家角色节点
   - （通常包含 PlayerController 组件的节点）

3. **配置 Animation 组件**
   - 选中玩家角色节点
   - 在属性检查器中找到 **Animation** 组件
   - 点击 **Clips** 右边的 **+** 号，添加 8 个动画：
     - player_idle
     - player_run
     - player_attack_1
     - player_attack_2
     - player_attack_3
     - player_skill_slash_wave
     - player_hit
     - player_dead
   - 将 **Default Clip** 设置为 `player_idle`

4. **调整缩放**
   - 由于精灵图尺寸较大（约 1700-2000px），需要缩小
   - 找到 `facingVisualRoot` 节点（如果有）或玩家节点
   - 设置 **Scale** 为：**X: 0.1, Y: 0.1** （或 0.05-0.15 之间）

---

### 史莱姆敌人配置

1. **找到史莱姆节点**
   - 在场景或预制体中找到史莱姆敌人节点

2. **配置 Animation 组件**
   - 添加 5 个动画：
     - enemy_idle
     - enemy_walk
     - enemy_attack
     - enemy_hit
     - enemy_dead
   - 设置 **Default Clip** 为 `enemy_idle`

3. **调整缩放**
   - 设置 **Scale** 为：**X: 0.08, Y: 0.08** （或 0.05-0.12 之间）

---

## ⚡ 快速测试

配置完成后：
1. **点击编辑器顶部的运行按钮**
2. 观察角色的待机动画是否正常播放
3. 测试移动、攻击等动作

---

## 🔧 调整建议

**如果角色太大或太小**：
- 调整 Scale 值
- 玩家推荐范围：0.08 - 0.15
- 史莱姆推荐范围：0.06 - 0.12

**如果动画速度不合适**：
- 在 Animation 组件中调整 **PlayOnLoad** 选项
- 或在动画文件中修改 Sample 值

---

## ✅ 配置完成标志

- ✅ 角色显示正常，尺寸合适
- ✅ 待机动画自动播放
- ✅ 移动时播放跑步动画
- ✅ 攻击时播放攻击动画

配置完成后告诉我，我会帮你验证和优化！
