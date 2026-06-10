import { _decorator, Component, Label, Node, Prefab, instantiate } from 'cc';
import { EnemyAI } from '../characters/EnemyAI';

const { ccclass, property } = _decorator;

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

  private readonly enemies: EnemyAI[] = [];
  private cleared = false;

  start(): void {
    if (this.enemies.length === 0) {
      this.spawnWave();
    }
    this.showMessage('击败所有怪物');
  }

  update(): void {
    if (this.cleared) {
      return;
    }

    const aliveEnemies = this.enemies.filter((enemy) => enemy?.isValid && !enemy.isDefeated());
    if (this.enemies.length > 0 && aliveEnemies.length === 0) {
      this.cleared = true;
      this.showMessage('通关！');
    }
  }

  spawnWave(): void {
    if (!this.enemyPrefab) {
      this.showMessage('请在编辑器中绑定 enemyPrefab');
      return;
    }

    this.spawnPoints.forEach((spawnPoint) => {
      const enemyNode = instantiate(this.enemyPrefab!);
      enemyNode.setParent(this.node);
      enemyNode.setWorldPosition(spawnPoint.worldPosition);
      const enemyAI = enemyNode.getComponent(EnemyAI);
      if (enemyAI) {
        enemyAI.target = this.player;
        this.enemies.push(enemyAI);
      }
    });
  }

  registerEnemy(enemy: EnemyAI): void {
    enemy.target = this.player;
    this.enemies.push(enemy);
  }

  showMessage(message: string): void {
    if (this.messageLabel) {
      this.messageLabel.string = message;
    }
  }
}
