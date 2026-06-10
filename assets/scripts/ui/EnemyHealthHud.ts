import {
  _decorator,
  Color,
  Component,
  Graphics,
  Label,
  Node,
  tween,
  UIOpacity,
  UITransform,
  Vec3,
} from 'cc';
import {
  CharacterBase,
  CHARACTER_DAMAGED_EVENT,
  type CharacterDamagedEvent,
} from '../characters/CharacterBase';

const { ccclass, property } = _decorator;

@ccclass('EnemyHealthHud')
export class EnemyHealthHud extends Component {
  @property
  offsetY = 58;

  @property
  barWidth = 76;

  @property
  barHeight = 10;

  private owner: CharacterBase | null = null;
  private barGraphics: Graphics | null = null;
  private hpLabel: Label | null = null;

  onLoad(): void {
    this.owner = this.getComponent(CharacterBase);
    this.node.on(CHARACTER_DAMAGED_EVENT, this.onDamaged, this);
    this.ensureHudNodes();
  }

  start(): void {
    this.render();
  }

  onDestroy(): void {
    this.node.off(CHARACTER_DAMAGED_EVENT, this.onDamaged, this);
  }

  update(): void {
    this.render();
  }

  private ensureHudNodes(): void {
    const barNode = new Node('EnemyHealthBar');
    barNode.setPosition(0, this.offsetY, 0);
    barNode.addComponent(UITransform).setContentSize(this.barWidth, 26);
    this.barGraphics = barNode.addComponent(Graphics);
    this.node.addChild(barNode);

    const labelNode = new Node('EnemyHealthValue');
    labelNode.setPosition(0, -2, 0);
    labelNode.addComponent(UITransform).setContentSize(this.barWidth, 18);
    this.hpLabel = labelNode.addComponent(Label);
    this.hpLabel.fontSize = 12;
    this.hpLabel.color = Color.WHITE;
    barNode.addChild(labelNode);
  }

  private render(): void {
    if (!this.owner || !this.barGraphics || !this.hpLabel) {
      return;
    }

    const ratio = this.owner.getHpRatio();
    const width = this.barWidth;
    const height = this.barHeight;
    this.barGraphics.clear();
    this.barGraphics.fillColor = new Color(35, 18, 22, 220);
    this.barGraphics.rect(-width / 2, -height / 2, width, height);
    this.barGraphics.fill();
    this.barGraphics.fillColor = new Color(220, 42, 42, 255);
    this.barGraphics.rect(-width / 2, -height / 2, width * ratio, height);
    this.barGraphics.fill();

    this.hpLabel.string = `${this.owner.getHp()} / ${this.owner.maxHp}`;
  }

  private onDamaged(event: CharacterDamagedEvent): void {
    this.render();
    this.showFloatingDamage(event.damage);
  }

  private showFloatingDamage(damage: number): void {
    const floatNode = new Node('FloatingDamage');
    floatNode.setPosition(0, this.offsetY + 20, 0);
    floatNode.addComponent(UITransform).setContentSize(80, 28);
    const opacity = floatNode.addComponent(UIOpacity);
    const label = floatNode.addComponent(Label);
    label.string = `-${damage}`;
    label.fontSize = 22;
    label.color = new Color(255, 54, 54, 255);
    this.node.addChild(floatNode);

    tween(floatNode)
      .by(0.45, { position: new Vec3(0, 34, 0) })
      .call(() => floatNode.destroy())
      .start();
    tween(opacity)
      .to(0.45, { opacity: 0 })
      .start();
  }
}
