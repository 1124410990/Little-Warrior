import { _decorator, Component, Label, Node, Prefab, instantiate } from 'cc';
import { EnemyAI } from '../characters/EnemyAI';
import { resolveSeparationOffset } from '../combat/CombatMath';
import { HurtBox } from '../combat/HurtBox';
import { EnemyHealthHud } from '../ui/EnemyHealthHud';
import { Vec3 } from 'cc';
import type { EnemyConfig, RoomConfig } from '../core/GameTypes';
import { getEnemyConfig, resolveRoomSpawnPositions } from '../core/GameConfig';
import { loadCharacterConfigs, loadTrainingRoomConfig } from '../core/RuntimeGameConfig';

const { ccclass, property } = _decorator;

/*
 * 房间管理器负责刷怪、怪物分散和通关提示，不直接参与单个角色的战斗判定。
 */
@ccclass('DungeonRoomManager')
export class DungeonRoomManager extends Component {
  @property(Node)
  player: Node | null = null;

  @property(Prefab)
  enemyPrefab: Prefab | null = null;

  @property([Node])
  spawnPoints: Node[] = [];

  @property(Label)
  messageLabel: Label | null = null;

  @property
  minEnemySpacing = 58;

  @property
  enemySeparationStrength = 0.45;

  @property
  autoLoadConfig = true;

  private readonly enemies: EnemyAI[] = [];
  private cleared = false;
  private roomConfig: RoomConfig | null = null;
  private enemyConfig: EnemyConfig | null = null;
  private configuredSpawnPositions: Vec3[] = [];
  private clearMessage = '通关！';

  start(): void {
    void this.initializeRoom();
  }

  private async initializeRoom(): Promise<void> {
    if (this.autoLoadConfig) {
      await this.loadRoomRuntimeConfig();
    }

    if (this.enemies.length === 0) {
      this.spawnWave();
    }
    this.showMessage('击败所有怪物');
  }

  /*
   * 每帧只处理存活怪物的队形分散和通关状态，死亡隐藏由 EnemyAI 自己负责。
   */
  update(): void {
    if (this.cleared) {
      return;
    }

    const aliveEnemies = this.enemies.filter((enemy) => enemy?.isValid && !enemy.isDefeated());
    this.separateAliveEnemies(aliveEnemies);
    if (this.enemies.length > 0 && aliveEnemies.length === 0) {
      this.cleared = true;
      this.showMessage(this.clearMessage);
    }
  }

  applyRoomConfig(roomConfig: RoomConfig): void {
    this.roomConfig = roomConfig;
    this.configuredSpawnPositions = resolveRoomSpawnPositions(roomConfig)
      .map((point) => new Vec3(point.x, point.y, point.z));
    this.clearMessage = roomConfig.clearMessage;
  }

  applyEnemyConfig(enemyConfig: EnemyConfig): void {
    this.enemyConfig = enemyConfig;
  }

  /*
   * 编辑器预制体刷怪入口，生成后统一补齐目标、血条和 HurtBox 反馈组件。
   */
  spawnWave(): void {
    if (!this.enemyPrefab) {
      this.showMessage('请在编辑器中绑定 enemyPrefab');
      return;
    }

    const spawnPlan = this.resolveSpawnPlan();
    if (spawnPlan.positions.length === 0) {
      this.showMessage('请配置刷怪点');
      return;
    }

    spawnPlan.positions.forEach((position) => {
      const enemyNode = instantiate(this.enemyPrefab!);
      enemyNode.setParent(this.node);
      if (spawnPlan.useWorldPosition) {
        enemyNode.setWorldPosition(position);
      } else {
        enemyNode.setPosition(position);
      }

      const enemyAI = enemyNode.getComponent(EnemyAI);
      if (enemyAI) {
        this.applyEnemyRuntimeConfig(enemyAI);
        this.prepareEnemyFeedback(enemyAI);
        enemyAI.target = this.player;
        this.enemies.push(enemyAI);
      }
    });
  }

  /*
   * 程序化搭建场景时使用注册入口，避免重复维护预制体和代码生成两套初始化逻辑。
   */
  registerEnemy(enemy: EnemyAI): void {
    this.applyEnemyRuntimeConfig(enemy);
    this.prepareEnemyFeedback(enemy);
    enemy.target = this.player;
    this.enemies.push(enemy);
  }

  showMessage(message: string): void {
    if (this.messageLabel) {
      this.messageLabel.string = message;
    }
  }

  /*
   * 分散逻辑只施加少量位置修正，避免怪物堆叠遮挡，同时不抢走 EnemyAI 的追击控制权。
   */
  private separateAliveEnemies(aliveEnemies: EnemyAI[]): void {
    if (aliveEnemies.length < 2) {
      return;
    }

    aliveEnemies.forEach((enemy, index) => {
      const current = enemy.node.position;
      const others = aliveEnemies
        .filter((_, otherIndex) => otherIndex !== index)
        .map((other) => other.node.position);
      const offset = resolveSeparationOffset(
        current,
        others,
        this.minEnemySpacing,
        index % 2 === 0 ? 1 : -1,
      );
      if (offset.x === 0 && offset.y === 0) {
        return;
      }

      const position = current.clone();
      position.x += offset.x * this.enemySeparationStrength;
      position.y += offset.y * this.enemySeparationStrength;
      enemy.node.setPosition(position);
    });
  }

  private async loadRoomRuntimeConfig(): Promise<void> {
    try {
      const [roomConfig, characterConfigs] = await Promise.all([
        loadTrainingRoomConfig(),
        loadCharacterConfigs(),
      ]);
      this.applyRoomConfig(roomConfig);
      this.applyEnemyConfig(getEnemyConfig(characterConfigs, roomConfig.enemyPrefab));
    } catch (error) {
      console.warn('[DungeonRoomManager] 读取房间配置失败，保留编辑器字段', error);
    }
  }

  private resolveSpawnPlan(): { positions: Vec3[]; useWorldPosition: boolean } {
    if (this.configuredSpawnPositions.length > 0) {
      return { positions: this.configuredSpawnPositions, useWorldPosition: false };
    }

    return {
      positions: this.spawnPoints.map((spawnPoint) => spawnPoint.worldPosition.clone()),
      useWorldPosition: true,
    };
  }

  private applyEnemyRuntimeConfig(enemy: EnemyAI): void {
    if (this.enemyConfig) {
      enemy.autoLoadConfig = false;
      enemy.applyStats(this.enemyConfig);
      return;
    }

    if (this.roomConfig?.enemyPrefab) {
      enemy.characterId = this.roomConfig.enemyPrefab;
    }
  }

  /*
   * 怪物反馈组件采用按需补齐，兼容手工摆放节点和运行时生成节点。
   */
  private prepareEnemyFeedback(enemy: EnemyAI): void {
    const hurtBox = enemy.node.getComponent(HurtBox) ?? enemy.node.addComponent(HurtBox);
    hurtBox.owner = enemy;
    if (!enemy.node.getComponent(EnemyHealthHud)) {
      enemy.node.addComponent(EnemyHealthHud);
    }
  }
}
