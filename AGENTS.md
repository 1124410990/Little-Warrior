# Repository Guidelines

本文件为 Codex 在 `LittleWarrior` 仓库内工作的项目级约定。默认使用中文交流、中文文档和必要的中文注释；修改前先理解 Cocos Creator 项目结构，避免破坏 `.meta` 与场景资源引用。

## 项目结构与模块组织

- `assets/scripts/`：核心 TypeScript 代码，按职责拆分为 `characters`、`combat`、`core`、`dungeon`、`input`、`skills`、`ui`。
- `assets/resources/config/`：运行时 JSON 配置，包含角色、技能、输入和房间数据；调整字段时同步更新对应类型定义。
- `assets/scenes/`：Cocos 场景与搭建说明，`TrainingRoom.scene` 是当前训练房间主场景。
- `tests/`：不依赖 Cocos 运行时的 Node.js 逻辑测试，当前主要覆盖战斗计算。
- `settings/`、`profiles/`、`.creator/`：Cocos Creator 项目与编辑器配置，除非明确需要，不要随意重排或删除。
- `library/`、`temp/`：Cocos 生成目录，通常不应手工编辑，也不应作为业务逻辑依据。

## 构建、测试与本地运行

- 安装依赖：当前项目没有外部开发依赖，通常无需 `npm install`；若以后新增依赖，优先使用项目既有包管理方式。
- 运行逻辑测试：

  ```powershell
  node .\tests\combat.test.mjs
  ```

- 或使用 npm 脚本：

  ```powershell
  npm test
  ```

- 本地运行：使用 Cocos Creator `3.8+` 打开仓库根目录，在编辑器中打开 `assets/scenes/TrainingRoom.scene` 进行预览。
- Web 构建与真机验证应在 Cocos Creator 编辑器内完成；命令行测试只能证明纯逻辑模块正确，不能替代场景绑定、碰撞与动画验证。

## 代码风格与命名约定

- 语言与模块：业务代码使用 TypeScript + ES Module，遵循 `tsconfig.json` 中的严格类型配置。
- Cocos 组件：使用 `@ccclass` 标注类名，编辑器可配置字段使用 `@property` 暴露。
- 命名规则：类名使用 `PascalCase`，函数和变量使用 `camelCase`，常量事件名可使用全大写或语义化字符串常量。
- 目录职责：战斗纯计算优先放入 `assets/scripts/combat/CombatMath.ts`，输入映射放入 `assets/scripts/input/`，跨模块类型放入 `assets/scripts/core/GameTypes.ts`。
- 注释原则：只在复杂状态机、碰撞时序、配置字段兼容等不易自解释处添加简洁中文注释；避免重复解释代码字面含义。
- `.meta` 文件：新增、移动、删除 Cocos 资源时必须关注对应 `.meta`，避免资源 UUID 丢失导致场景引用断裂。

## 注释规范

- 注释只解释**业务意图、边界条件或非显然约束**；不要写"已完成第几步"、工具署名、过程记录或重复代码字面含义的注释。
- 函数、计算属性、监听属性统一使用以下块注释格式：

  ```ts
  /*
   * xxx
   */
  ```

## 测试规范

- 优先为不依赖 Cocos 运行时的纯函数补充 Node.js 测试，例如伤害计算、追击向量、碰撞判定辅助逻辑。
- 新增测试文件放在 `tests/`，命名建议为 `<模块>.test.mjs`。
- 修改 `CombatMath.ts`、配置解析、输入映射等纯逻辑后，至少运行 `node .\tests\combat.test.mjs`。
- Cocos 组件行为需要补充手工验证说明：验证场景、节点绑定、预期输入、预期动画或碰撞表现。
- 若测试失败，先定位是本次改动引入的问题、现有场景绑定问题，还是 Cocos 运行时外部限制，并在结论中分开说明。

## 提交与 Pull Request

- 提交前检查：运行相关测试，确认没有误改 `library/`、`temp/` 等生成目录。
- 提交信息建议使用简洁中文或约定式提交，例如 `feat: 增加技能冷却配置`、`fix: 修复怪物追击距离判断`。
- PR 描述应包含：变更目的、核心改动、测试结果、Cocos 编辑器验证情况、已知风险。
- 涉及资源、场景、预制体或配置结构的 PR，需要说明是否影响现有 `.meta`、场景绑定和旧配置兼容。
- 避免在同一个 PR 中混合大规模重构、玩法变更和资源替换；优先保持每次变更可验证、可回滚。

## 安全与配置提示

- 不要提交账号、密钥、私有服务地址或本机绝对路径；需要本地配置时使用未入库的本地文件或编辑器本机配置。
- JSON 配置变更要保持字段语义清晰，新增字段应有合理默认值或兼容处理。
- 玩家输入、技能参数、怪物数值属于可被配置驱动的内容，避免把可调数值散落在多个组件硬编码中。
- 编辑 Cocos 配置和场景文件前先确认修改范围；大型自动格式化可能造成难以审查的资源文件 diff。
- 若需要引入第三方库，先评估包体积、浏览器兼容性、Cocos 构建兼容性和长期维护风险。

## 架构要点（供贡献者参考）

- 当前项目目标是验证类 DNF 的 2D 横版动作战斗手感，优先保证移动、连击、技能、受击、击退和怪物 AI 的闭环体验。
- `CharacterBase` 承载角色通用属性、受击和生命值逻辑；`PlayerController` 与 `EnemyAI` 分别负责玩家输入和怪物状态决策。
- `CombatMath` 应保持尽量纯函数化，便于在 Node.js 环境中测试和复用。
- `HitBox` / `HurtBox` 负责攻击判定协作，调整攻击框时需要同时关注 Cocos 碰撞组件、节点朝向和技能配置时间窗。
- `SkillComponent` 与 `assets/resources/config/skills.json` 共同描述技能表现，新增技能时应同步考虑冷却、伤害、击退、硬直和动画名。
- `DungeonRoomManager` 负责房间刷怪与通关流程，后续扩展关卡系统时应避免把单房间逻辑直接耦合到全局流程。
