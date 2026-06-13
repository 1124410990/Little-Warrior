# Little Warrior

`Little Warrior` 是一个基于 Cocos Creator 3.8+ 和 TypeScript 的 2D 横版动作战斗 Demo 骨架，目标是先验证类 DNF 的核心战斗手感。

## 当前版本内容

- 玩家：方向键四向移动、三段普攻、一个主动技能、受击硬直、死亡状态预留。
- 怪物：待机、巡逻、追击、近战攻击、受击、死亡。
- 战斗：`HitBox` / `HurtBox` 判定思路、伤害计算、击退、无敌帧。
- 房间：刷怪点、怪物全灭后通关提示。
- UI：玩家血条、技能冷却条、血量文字。
- 配置：角色、怪物、技能、训练房间 JSON 配置。

## 推荐 Cocos Creator 组装方式

1. 使用 Cocos Creator 3.8+ 打开本目录。
2. 新建主场景 `assets/scenes/TrainingRoom.scene`。
3. 创建玩家节点并挂载：
   - `PlayerController`
   - `SkillComponent`
   - 一个子节点作为攻击框，挂载 `HitBox` 和 2D 碰撞组件
4. 创建怪物预制体并挂载：
   - `EnemyAI`
   - 2D 碰撞组件
5. 创建房间根节点并挂载：
   - `DungeonRoomManager`
   - 绑定玩家节点、怪物预制体和多个刷怪点
6. 创建 Canvas UI 并挂载：
   - `CombatHud`
   - 绑定血条、技能冷却条、血量文本

## 默认操作

- 方向键：上下左右移动
- `X`：普攻，支持三段连击
- `Z`：释放小技能 `疾风刺`
- 默认键位配置见 `assets/resources/config/input.json`，运行时按键语义统一由 `assets/scripts/input/KeyboardMapping.ts` 解析。

## 本地逻辑测试

```powershell
node .\tests\combat.test.mjs
```

说明：当前测试只覆盖不依赖 Cocos 运行时的纯战斗计算逻辑。Cocos 组件需要在 Creator 编辑器内进行场景预览验证。

## 后续优先级

1. 在 Cocos 编辑器中完成 `TrainingRoom` 场景和怪物预制体绑定。
2. 接入临时免费素材，补齐玩家和怪物动画剪辑名称。
3. 打开碰撞调试，校准普攻和技能的攻击框生效时间。
4. 构建 Web 版本，确认浏览器中输入、动画和碰撞表现正常。
5. 再考虑背包、装备、掉落、更多技能等外层系统。
