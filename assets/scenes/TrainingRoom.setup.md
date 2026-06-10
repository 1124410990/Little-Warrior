# 训练场景组装清单

由于 `.scene` 文件通常由 Cocos Creator 编辑器生成和维护，本项目提供两种组装方式：推荐使用自动组装组件；需要精细调参时再手动搭建节点。

## 最快启动方式（推荐）

项目已提供 `TrainingRoomBootstrap` 自动组装组件。你不需要手动创建玩家、怪物、HUD、攻击框和刷怪点，只需要：

1. 用 Cocos Creator 3.8.8+ 打开 `D:/MyCode/PrivateProject/LittleWarrior`。
2. 在 `assets/scenes` 下新建场景 `TrainingRoom.scene`。
3. 选中场景根节点，在检查器里添加 `TrainingRoomBootstrap` 组件。
4. 确认 `rebuildOnStart` 勾选。
5. 保存场景，点击预览。

运行时会自动生成：

- 摄像机和地面占位图。
- 玩家节点、方向键四向移动、`X` 普攻、`Z` 小技能。
- 玩家攻击框 `HitBoxRoot/HitBox`。
- 3 只训练史莱姆。
- 血条、技能冷却条、血量文本、通关提示。
- 2D 物理和碰撞调试显示。

如果你想手动精细搭建，再参考下面的完整节点结构。

## 节点结构建议

- `TrainingRoom`
  - `Camera`
  - `Ground`
  - `Player`
    - `HitBoxRoot`
      - `HitBox`
  - `SpawnPoint_01`
  - `SpawnPoint_02`
  - `SpawnPoint_03`
  - `Canvas`
    - `HpBar`
    - `SkillCooldownBar`
    - `HpLabel`
    - `MessageLabel`

## 组件绑定

- `Player` 绑定 `PlayerController` 和 `SkillComponent`。
- `HitBox` 绑定 `HitBox` 脚本和 2D 触发器碰撞组件，`owner` 指向 `Player`。
- 怪物预制体根节点绑定 `EnemyAI` 和 2D 碰撞组件。
- `TrainingRoom` 绑定 `DungeonRoomManager`，设置玩家、怪物预制体、刷怪点和提示文本。
- `Canvas` 或 HUD 根节点绑定 `CombatHud`，设置玩家、技能组件、血条和冷却条。

## 默认操作

- 方向键：上下左右移动，其中上下用于房间纵深走位。
- `X`：普攻，支持三段连击。
- `Z`：释放小技能 `疾风刺`。
- 建议将 3 个刷怪点的 `y` 坐标错开，便于验证怪物平面追击和玩家上下走位。

## 动画剪辑命名

- 玩家：`player_idle`、`player_run`、`player_attack_1`、`player_attack_2`、`player_attack_3`、`player_skill_slash_wave`、`player_hit`、`player_dead`
- 怪物：`enemy_idle`、`enemy_walk`、`enemy_attack`、`enemy_hit`、`enemy_dead`
