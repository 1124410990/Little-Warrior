# 精灵图集成快速参考

## 📊 精灵图帧数速查表

### 玩家战士
- idle: 4帧 | run: 6帧 | attack_1: 4帧 | attack_2: 4帧
- attack_3: 5帧 | skill: 5帧 | hit: 3帧 | dead: 5帧

### 史莱姆
- idle: 3帧 | walk: 4帧 | attack: 4帧 | hit: 2帧 | dead: 4帧

## 🎯 关键配置参数

**缩放比例（Scale）：**
- 玩家战士：0.1 - 0.15
- 史莱姆：0.08 - 0.12

**动画帧率（FPS）：**
- 待机/受击：8 FPS
- 移动/攻击：10-12 FPS

**动画名称映射：**
```typescript
player_idle          → player_warrior_idle.png
player_run           → player_warrior_run.png
player_attack_1      → player_warrior_attack_1.png
player_attack_2      → player_warrior_attack_2.png
player_attack_3      → player_warrior_attack_3.png
player_skill_slash_wave → player_warrior_skill.png
player_hit           → player_warrior_hit.png
player_dead          → player_warrior_dead.png

enemy_idle           → enemy_slime_idle.png
enemy_walk           → enemy_slime_walk.png
enemy_attack         → enemy_slime_attack.png
enemy_hit            → enemy_slime_hit.png
enemy_dead           → enemy_slime_dead.png
```

## ⚡ 3步快速集成

### 1. 精灵图切分
选中图片 → Type: Sprite Frame → Edit → Grid模式 → 填写帧数 → Apply

### 2. 创建动画
创建Animation Clip → 添加cc.Sprite.spriteFrame轨道 → 拖入精灵帧 → 调整帧率

### 3. 配置组件
角色节点 → Animation组件 → 添加所有Clips → 设置Default Clip → 调整Scale

---

详细步骤参考：[cocos-sprite-integration-guide.md](cocos-sprite-integration-guide.md)
