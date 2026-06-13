# TrainingRoom 最小可预览完整手册

本文档用于把 `TrainingRoom` 训练房间稳定落地到 Cocos Creator 里。当前推荐路径是：保留场景根节点上的 `TrainingRoomBootstrap` 自动组装组件，先确保能预览战斗闭环；后续需要精细调参、替换美术或沉淀预制体时，再按本文的等价节点契约手动复刻。

## 目标

- 打开 `assets/scenes/TrainingRoom.scene` 后能直接预览训练房。
- 验证方向键移动、`X` 三段普攻、`Z` 疾风刺、怪物追击攻击、血条和通关提示。
- 让自动组装、手动搭建、未来预制体化使用同一套节点命名和组件绑定规则。
- 不手工编辑 `.scene` 文件结构；场景资源修改优先在 Cocos Creator 编辑器内完成。

## 最快预览路径

1. 用 Cocos Creator `3.8.8+` 打开仓库根目录。
2. 打开 `assets/scenes/TrainingRoom.scene`。
3. 选中场景里的 `TrainingRoom` 节点。
4. 确认挂载 `TrainingRoomBootstrap`，并勾选 `rebuildOnStart`。
5. 点击预览。

当前最小场景只需要保留这棵树：

```text
TrainingRoom.scene
├─ Main Light
├─ Main Camera
└─ TrainingRoom
   └─ TrainingRoomBootstrap
      └─ rebuildOnStart = true
```

预览启动后，`TrainingRoomBootstrap` 会运行时生成相机、背景、玩家、怪物、攻击框和 HUD。只要场景里已经存在 `Canvas`，Bootstrap 会跳过自动重建，避免覆盖手动搭建内容。

## Bootstrap 运行时节点契约

自动组装生成的结构应等价于下列节点树。手动搭建或拆预制体时，优先保持这些节点名不变，减少脚本绑定和排查成本。

```text
TrainingRoom
├─ Camera
├─ Canvas
│  ├─ BackWall
│  ├─ StoneFloor
│  ├─ HorizonGlow
│  ├─ FloorPixelLines
│  ├─ Player
│  │  ├─ PlayerVisual
│  │  ├─ WeaponPivot
│  │  │  └─ SwordVisual
│  │  └─ HitBoxRoot
│  │     └─ HitBox
│  ├─ Enemy_Slime_1
│  │  └─ Enemy_Slime_1Visual
│  ├─ Enemy_Slime_2
│  │  └─ Enemy_Slime_2Visual
│  ├─ Enemy_Slime_3
│  │  └─ Enemy_Slime_3Visual
│  ├─ HpBar
│  ├─ SkillCooldownBar
│  ├─ HpLabel
│  ├─ MessageLabel
│  └─ ControlsLabel
```

关键默认位置：

| 节点 | 推荐位置 | 说明 |
| --- | --- | --- |
| `Player` | `(-360, -100, 0)` | 玩家初始点，靠左方便验证怪物追击 |
| `HitBoxRoot` | `(70, 0, 0)` | 攻击框朝向基准，脚本会按角色朝向镜像 |
| `WeaponPivot` | `(24, -14, 0)` | 武器待机轴心，普攻和疾风刺动画都依赖它 |
| `Enemy_Slime_1` | `(360, -80, 0)` | 对齐 `room_training_01.json` 第 1 个刷怪点 |
| `Enemy_Slime_2` | `(560, -140, 0)` | 错开纵深，便于验证上下走位 |
| `Enemy_Slime_3` | `(760, -100, 0)` | 对齐第 3 个刷怪点 |

## 组件绑定表

### 场景根节点

| 节点 | 组件 | 关键字段 |
| --- | --- | --- |
| `TrainingRoom` | `TrainingRoomBootstrap` | `rebuildOnStart=true` |

Bootstrap 路径不需要手动绑定 `DungeonRoomManager`、玩家、怪物或 HUD。它会读取 `assets/resources/config` 下的运行时 JSON，并在预览时完成绑定。

### 玩家

| 节点 | 组件 | 关键字段 |
| --- | --- | --- |
| `Player` | `PlayerController` | `characterId=player_warrior`，`skillComponent` 指向自身 `SkillComponent`，`facingVisualRoot=PlayerVisual`，`weaponPivot=WeaponPivot` |
| `Player` | `SkillComponent` | `hitBox=HitBox`，`hitBoxRoot=HitBoxRoot` |
| `Player` | `RigidBody2D` | `type=Kinematic`，`gravityScale=0` |
| `Player` | `BoxCollider2D` | 推荐尺寸 `48 x 90`，`sensor=false` |
| `HitBox` | `HitBox` | `owner=Player` |
| `HitBox` | `BoxCollider2D` | 推荐尺寸 `132 x 84`，`sensor=true`，初始 `enabled=false` |
| `HitBox` | `Graphics` | 用于绘制 `slash_wave` 剑形残影 |

`PlayerVisual` 只承担身体朝向镜像；`WeaponPivot` 单独承载武器动画，避免身体翻转和武器前刺互相污染。

### 怪物

| 节点 | 组件 | 关键字段 |
| --- | --- | --- |
| `Enemy_Slime_*` | `EnemyAI` | `characterId=enemy_slime`，`target=Player`，`facingVisualRoot=*Visual` |
| `Enemy_Slime_*` | `HurtBox` | `owner` 指向同节点 `EnemyAI` |
| `Enemy_Slime_*` | `EnemyHealthHud` | 默认自动生成怪物血条和伤害数字 |
| `Enemy_Slime_*` | `RigidBody2D` | `type=Kinematic`，`gravityScale=0` |
| `Enemy_Slime_*` | `BoxCollider2D` | 推荐尺寸 `52 x 70`，`sensor=true` |

怪物近战攻击会移动 `facingVisualRoot` 做前探表现，不应直接 tween 怪物根节点，否则会干扰碰撞和追击位置。

### HUD

| 节点 | 组件 | 关键字段 |
| --- | --- | --- |
| `Canvas` | `CombatHud` | `player=PlayerController`，`skills=SkillComponent`，`hpBar=HpBar`，`skillCooldownBar=SkillCooldownBar`，`hpLabel=HpLabel` |
| `HpBar` | `ProgressBar` | 显示玩家血量比例 |
| `SkillCooldownBar` | `ProgressBar` | 显示 `slash_wave` 冷却恢复 |
| `HpLabel` | `Label` | 显示玩家血量数字 |
| `MessageLabel` | `Label` | 显示目标和通关提示 |
| `ControlsLabel` | `Label` | 显示默认操作提示 |

### 手动或预制体路径

如果你不使用 Bootstrap，而是手动搭建完整场景，需要在 `TrainingRoom` 或房间管理节点上挂载 `DungeonRoomManager`：

| 字段 | 绑定 |
| --- | --- |
| `player` | `Player` |
| `enemyPrefab` | `Enemy_Slime.prefab` |
| `spawnPoints` | `SpawnPoint_01`、`SpawnPoint_02`、`SpawnPoint_03` |
| `messageLabel` | `MessageLabel` |

手动路径推荐保留 `autoLoadConfig=true`，让房间、角色和技能数值继续由 JSON 驱动。

## 占位资源命名约定

- 场景节点：`TrainingRoom`、`Canvas`、`Camera`、`Player`、`PlayerVisual`、`WeaponPivot`、`SwordVisual`、`HitBoxRoot`、`HitBox`。
- 怪物实例：`Enemy_Slime_1`、`Enemy_Slime_2`、`Enemy_Slime_3`。
- 怪物预制体：后续沉淀为 `Enemy_Slime.prefab`，根节点继续挂 `EnemyAI`、`HurtBox`、`EnemyHealthHud`。
- 刷怪点：`SpawnPoint_01`、`SpawnPoint_02`、`SpawnPoint_03`，默认坐标对齐 `room_training_01.json`。
- HUD：`HpBar`、`SkillCooldownBar`、`HpLabel`、`MessageLabel`、`ControlsLabel`。
- 玩家动画剪辑：`player_idle`、`player_run`、`player_attack_1`、`player_attack_2`、`player_attack_3`、`player_skill_slash_wave`、`player_hit`、`player_dead`。
- 怪物动画剪辑：`enemy_idle`、`enemy_walk`、`enemy_attack`、`enemy_hit`、`enemy_dead`。
- 配置 ID：玩家 `player_warrior`，怪物 `enemy_slime`，技能 `basic_1`、`basic_2`、`basic_3`、`slash_wave`。

## 运行时配置关系

| 文件 | 关键内容 | 影响 |
| --- | --- | --- |
| `assets/resources/config/characters.json` | `player_warrior`、`enemy_slime` | 血量、攻击、防御、移动速度、怪物索敌和攻击范围 |
| `assets/resources/config/skills.json` | `basic_1/2/3`、`slash_wave` | 伤害、冷却、命中窗口、击退和硬直 |
| `assets/resources/config/room_training_01.json` | `enemyPrefab=enemy_slime`、3 个 `spawnPoints` | 训练房怪物种类、出生点和通关提示 |
| `assets/resources/config/input.json` | 默认按键说明 | 当前脚本键位解析以 `KeyboardMapping.ts` 常量为准 |

修改配置字段时，需要同步检查 `assets/scripts/core/GameTypes.ts` 和 `assets/scripts/core/GameConfig.ts`，避免 JSON 与类型定义漂移。

## 预制体化迁移建议

1. 先保持 Bootstrap 路径可预览，把它作为回归基准。
2. 把 `Enemy_Slime_*` 的共同结构沉淀为 `Enemy_Slime.prefab`，确认根节点组件绑定不变。
3. 在手动场景中增加 `SpawnPoint_01..03`，由 `DungeonRoomManager` 通过 `enemyPrefab` 刷怪。
4. 再考虑拆 `Player.prefab` 和 `CombatHud.prefab`，但字段名与节点名保持本文约定。
5. 替换正式美术时，优先替换 `PlayerVisual`、`SwordVisual`、`Enemy_Slime_*Visual` 下的表现节点，不改变根节点组件职责。

## 验证步骤

命令行验证：

```powershell
npm.cmd test
npm.cmd run verify:training-room
```

编辑器预览验证：

- 方向键能进行左右和上下走位，斜向移动不会明显变快。
- `X` 能触发三段普攻，武器围绕 `WeaponPivot` 挥砍。
- `Z` 能触发 `slash_wave`，表现为武器前刺和窄长剑形残影。
- 3 只训练史莱姆会生成、追击、近战攻击并显示血条。
- 命中后有伤害数字和命中火花，击败全部怪物后 `MessageLabel` 显示 `通关！`。

命令行测试只覆盖纯逻辑和资源一致性，不能替代 Cocos Creator 内的场景绑定、碰撞和动画验证。
