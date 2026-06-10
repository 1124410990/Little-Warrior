import {
  _decorator,
  BoxCollider2D,
  Camera,
  Canvas,
  Color,
  Component,
  ERigidBody2DType,
  Graphics,
  Label,
  Node,
  PhysicsSystem2D,
  ProgressBar,
  RigidBody2D,
  Size,
  UITransform,
  Vec2,
  Vec3,
} from 'cc';
import { PlayerController } from '../characters/PlayerController';
import { EnemyAI } from '../characters/EnemyAI';
import { HitBox } from '../combat/HitBox';
import { HurtBox } from '../combat/HurtBox';
import { DungeonRoomManager } from './DungeonRoomManager';
import { SkillComponent } from '../skills/SkillComponent';
import { CombatHud } from '../ui/CombatHud';
import { EnemyHealthHud } from '../ui/EnemyHealthHud';
import {
  PLAYER_PIXEL_PARTS,
  SLIME_PIXEL_PARTS,
  getPixelArtBounds,
  type PixelColor,
  type PixelPart,
} from './PixelArtBlueprint';

const { ccclass, property } = _decorator;

@ccclass('TrainingRoomBootstrap')
export class TrainingRoomBootstrap extends Component {
  @property
  rebuildOnStart = true;

  start(): void {
    if (!this.rebuildOnStart || this.node.getChildByName('Canvas')) {
      return;
    }

    this.setupPhysics();

    const room = this.node.addComponent(DungeonRoomManager);
    const canvas = this.createCanvas();
    this.createCamera();
    this.createGround(canvas);

    const player = this.createPlayer(canvas);
    const hud = this.createHud(canvas, player.controller, player.skills);

    room.player = player.node;
    room.messageLabel = hud.messageLabel;
    this.createEnemies(canvas, room, player.node);
  }

  private setupPhysics(): void {
    const physics = PhysicsSystem2D.instance;
    physics.enable = true;
    physics.gravity = new Vec3(0, 0, 0);
    physics.debugDrawFlags = 0;
  }

  private createCamera(): void {
    const cameraNode = new Node('Camera');
    cameraNode.setPosition(0, 0, 1000);
    const camera = cameraNode.addComponent(Camera);
    camera.orthoHeight = 360;
    this.node.addChild(cameraNode);
  }

  private createCanvas(): Node {
    const canvasNode = new Node('Canvas');
    canvasNode.addComponent(Canvas);
    canvasNode.addComponent(UITransform).setContentSize(960, 640);
    this.node.addChild(canvasNode);
    return canvasNode;
  }

  private createGround(parent: Node): void {
    const backWall = this.createRectNode('BackWall', 1100, 320, new Color(31, 39, 55, 255));
    backWall.setPosition(0, -120, 0);
    parent.addChild(backWall);

    const floor = this.createRectNode('StoneFloor', 1100, 96, new Color(43, 50, 62, 255));
    floor.setPosition(0, -230, 0);
    parent.addChild(floor);

    const horizon = this.createRectNode('HorizonGlow', 1100, 10, new Color(83, 102, 132, 255));
    horizon.setPosition(0, -176, 0);
    parent.addChild(horizon);

    const floorLines = new Node('FloorPixelLines');
    const graphics = floorLines.addComponent(Graphics);
    graphics.fillColor = new Color(27, 34, 46, 255);
    for (let x = -520; x <= 520; x += 80) {
      graphics.rect(x, -276, 4, 92);
      graphics.fill();
    }
    for (let y = -260; y <= -200; y += 24) {
      graphics.rect(-550, y, 1100, 3);
      graphics.fill();
    }
    parent.addChild(floorLines);
  }

  private createPlayer(parent: Node): { node: Node; controller: PlayerController; skills: SkillComponent } {
    const playerActor = this.createActorNode('Player', PLAYER_PIXEL_PARTS);
    const player = playerActor.root;
    player.setPosition(-360, -100, 0);
    parent.addChild(player);

    const controller = player.addComponent(PlayerController);
    controller.facingVisualRoot = playerActor.visual;
    controller.characterId = 'player_warrior';
    controller.displayName = '小勇士';
    controller.maxHp = 320;
    controller.attack = 36;
    controller.defense = 8;
    controller.moveSpeed = 260;
    controller.hitStun = 0.22;
    controller.invulnerableTime = 0.12;

    this.addBodyCollider(player, new Size(48, 90), new Vec2(0, 0), false);

    const skills = player.addComponent(SkillComponent);
    const hitBoxRoot = new Node('HitBoxRoot');
    hitBoxRoot.setPosition(70, 0, 0);
    player.addChild(hitBoxRoot);

    const hitBoxNode = this.createSlashEffectNode('HitBox');
    hitBoxRoot.addChild(hitBoxNode);
    const hitBox = hitBoxNode.addComponent(HitBox);
    hitBox.owner = player;

    const hitCollider = hitBoxNode.addComponent(BoxCollider2D);
    hitCollider.size = new Size(132, 84);
    hitCollider.sensor = true;
    hitCollider.enabled = false;
    hitBoxNode.active = false;

    skills.hitBox = hitBox;
    skills.hitBoxRoot = hitBoxRoot;
    controller.skillComponent = skills;

    return { node: player, controller, skills };
  }

  private createEnemies(parent: Node, room: DungeonRoomManager, player: Node): void {
    const spawnPoints = [
      new Vec3(-120, -80, 0),
      new Vec3(80, -140, 0),
      new Vec3(280, -100, 0),
    ];

    spawnPoints.forEach((position, index) => {
      const enemyActor = this.createActorNode(`Enemy_Slime_${index + 1}`, SLIME_PIXEL_PARTS);
      const enemy = enemyActor.root;
      enemy.setPosition(position);
      parent.addChild(enemy);
      this.addBodyCollider(enemy, new Size(52, 70), new Vec2(0, 0), true);

      const ai = enemy.addComponent(EnemyAI);
      ai.facingVisualRoot = enemyActor.visual;
      ai.characterId = 'enemy_slime';
      ai.displayName = '训练史莱姆';
      ai.maxHp = 120;
      ai.attack = 18;
      ai.defense = 3;
      ai.moveSpeed = 85;
      ai.hitStun = 0.2;
      ai.invulnerableTime = 0.08;
      ai.aggroRange = 360;
      ai.attackRange = 96;
      ai.attackCooldown = 1.35;
      ai.attackWindup = 0.28;
      ai.attackDamageMoment = 0.22;
      ai.attackLockDuration = 0.55;
      ai.target = player;
      enemy.addComponent(HurtBox).owner = ai;
      enemy.addComponent(EnemyHealthHud);
      room.registerEnemy(ai);
    });
  }

  private createHud(canvasNode: Node, player: PlayerController, skills: SkillComponent): { messageLabel: Label } {
    const hpLabel = this.createLabel('HpLabel', '320 / 320', 24);
    hpLabel.node.setPosition(-320, 275, 0);
    canvasNode.addChild(hpLabel.node);

    const messageLabel = this.createLabel('MessageLabel', '击败所有怪物', 28);
    messageLabel.node.setPosition(0, 275, 0);
    canvasNode.addChild(messageLabel.node);

    const hpBar = this.createProgressBar('HpBar', -430, 275);
    canvasNode.addChild(hpBar.node);

    const skillBar = this.createProgressBar('SkillCooldownBar', -430, 235);
    canvasNode.addChild(skillBar.node);

    const controlsLabel = this.createLabel('ControlsLabel', '方向键移动  |  X 普攻  |  Z 破风斩', 18);
    controlsLabel.node.setPosition(0, -292, 0);
    canvasNode.addChild(controlsLabel.node);

    const hud = canvasNode.addComponent(CombatHud);
    hud.player = player;
    hud.skills = skills;
    hud.hpLabel = hpLabel;
    hud.hpBar = hpBar;
    hud.skillCooldownBar = skillBar;

    return { messageLabel };
  }

  private createProgressBar(name: string, x: number, y: number): ProgressBar {
    const node = this.createRectNode(name, 180, 18, new Color(88, 96, 116, 255));
    node.setPosition(x, y, 0);
    const progress = node.addComponent(ProgressBar);
    progress.progress = 1;
    return progress;
  }

  private createLabel(name: string, text: string, fontSize: number): Label {
    const node = new Node(name);
    node.addComponent(UITransform).setContentSize(260, 40);
    const label = node.addComponent(Label);
    label.string = text;
    label.fontSize = fontSize;
    label.color = Color.WHITE;
    return label;
  }

  private createRectNode(name: string, width: number, height: number, color: Color): Node {
    const node = new Node(name);
    node.addComponent(UITransform).setContentSize(width, height);
    const graphics = node.addComponent(Graphics);
    graphics.fillColor = color;
    graphics.rect(-width / 2, -height / 2, width, height);
    graphics.fill();
    return node;
  }

  private createPixelArtNode(name: string, parts: readonly PixelPart[]): Node {
    const node = new Node(name);
    const bounds = getPixelArtBounds(parts);
    node.addComponent(UITransform).setContentSize(bounds.width, bounds.height);
    const graphics = node.addComponent(Graphics);
    parts.forEach((part) => {
      graphics.fillColor = this.toColor(part.color);
      graphics.rect(part.x, part.y, part.width, part.height);
      graphics.fill();
    });
    return node;
  }

  private createActorNode(name: string, parts: readonly PixelPart[]): { root: Node; visual: Node } {
    const root = new Node(name);
    const bounds = getPixelArtBounds(parts);
    root.addComponent(UITransform).setContentSize(bounds.width, bounds.height);
    const visual = this.createPixelArtNode(`${name}Visual`, parts);
    root.addChild(visual);
    return { root, visual };
  }

  private createSlashEffectNode(name: string): Node {
    const node = new Node(name);
    node.addComponent(UITransform).setContentSize(132, 84);
    const graphics = node.addComponent(Graphics);
    graphics.fillColor = new Color(255, 236, 130, 140);
    graphics.rect(-52, -24, 104, 48);
    graphics.fill();
    graphics.fillColor = new Color(255, 255, 245, 210);
    graphics.rect(-36, -10, 92, 18);
    graphics.fill();
    graphics.fillColor = new Color(86, 183, 255, 170);
    graphics.rect(28, -32, 22, 64);
    graphics.fill();
    graphics.fillColor = new Color(31, 39, 55, 255);
    graphics.rect(-66, 28, 28, 10);
    graphics.fill();
    graphics.rect(-66, -38, 28, 10);
    graphics.fill();
    return node;
  }

  private toColor(color: PixelColor): Color {
    return new Color(color[0], color[1], color[2], color[3] ?? 255);
  }

  private addBodyCollider(node: Node, size: Size, offset: Vec2, sensor: boolean): void {
    const body = node.addComponent(RigidBody2D);
    body.type = ERigidBody2DType.Kinematic;
    body.gravityScale = 0;

    const collider = node.addComponent(BoxCollider2D);
    collider.size = size;
    collider.offset = offset;
    collider.sensor = sensor;
  }
}
