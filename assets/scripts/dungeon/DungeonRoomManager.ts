import { _decorator, Component, Label, Node, Prefab, instantiate } from 'cc';
import { EnemyAI } from '../characters/EnemyAI';
import { resolveSeparationOffset } from '../combat/CombatMath';
import { HurtBox } from '../combat/HurtBox';
import { EnemyHealthHud } from '../ui/EnemyHealthHud';

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

  @property
  minEnemySpacing = 58;

  @property
  enemySeparationStrength = 0.45;

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
    this.separateAliveEnemies(aliveEnemies);
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
        this.prepareEnemyFeedback(enemyAI);
        enemyAI.target = this.player;
        this.enemies.push(enemyAI);
      }
    });
  }

  registerEnemy(enemy: EnemyAI): void {
    this.prepareEnemyFeedback(enemy);
    enemy.target = this.player;
    this.enemies.push(enemy);
  }

  showMessage(message: string): void {
    if (this.messageLabel) {
      this.messageLabel.string = message;
    }
  }

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

  private prepareEnemyFeedback(enemy: EnemyAI): void {
    const hurtBox = enemy.node.getComponent(HurtBox) ?? enemy.node.addComponent(HurtBox);
    hurtBox.owner = enemy;
    if (!enemy.node.getComponent(EnemyHealthHud)) {
      enemy.node.addComponent(EnemyHealthHud);
    }
  }
}
