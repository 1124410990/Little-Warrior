import {
  _decorator,
  Animation,
  AnimationClip,
  BoxCollider2D,
  Camera,
  Canvas,
  Color,
  Component,
  ERigidBody2DType,
  Graphics,
  ImageAsset,
  Label,
  Node,
  PhysicsSystem2D,
  ProgressBar,
  Rect,
  resources,
  RigidBody2D,
  Size,
  Sprite,
  SpriteFrame,
  Texture2D,
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
import { getCharacterConfig, getEnemyConfig, resolveRoomSpawnPositions } from '../core/GameConfig';
import { loadRuntimeGameConfig, type RuntimeGameConfig } from '../core/RuntimeGameConfig';

const { ccclass, property } = _decorator;

/*
 * 绮剧伒鍔ㄧ敾瑙勬牸锛歝lip 鍚嶅繀椤讳笌 PlayerController/EnemyAI 閲?animation.play(name) 瀹屽叏涓€鑷达紝
 * fps/loop 鍙栬嚜 .claude/character-sprite-integration-guide.md锛屼笌 scripts/slice-character-sheets.mjs 鍚屾簮銆?
 * dir 涓?resources 涓嬬浉瀵硅矾寰勶紙涓嶅惈鎵╁睍鍚嶇洰褰曪級锛岀敱鍒囩墖鑴氭湰浜у嚭銆?
 */
interface ClipSpec {
  name: string;
  dir: string;
  fps: number;
  loop: boolean;
  frameOrder?: readonly number[];
}

const PLAYER_CLIP_SPECS: readonly ClipSpec[] = [
  { name: 'player_idle', dir: 'textures/characters/player_idle', fps: 10, loop: true },
  { name: 'player_run', dir: 'textures/characters/player_run', fps: 12, loop: true },
  { name: 'player_attack_1', dir: 'textures/characters/player_attack_1', fps: 11, loop: false },
  { name: 'player_attack_2', dir: 'textures/characters/player_attack_2', fps: 11, loop: false },
  { name: 'player_attack_3', dir: 'textures/characters/player_attack_3', fps: 11, loop: false, frameOrder: [0, 1, 2, 4, 4] },
  { name: 'player_skill_slash_wave', dir: 'textures/characters/player_skill_slash_wave', fps: 9, loop: false },
  { name: 'player_hit', dir: 'textures/characters/player_hit', fps: 10, loop: false },
  { name: 'player_dead', dir: 'textures/characters/player_dead', fps: 8, loop: false },
];

const ENEMY_CLIP_SPECS: readonly ClipSpec[] = [
  { name: 'enemy_idle', dir: 'textures/characters/enemy_idle', fps: 10, loop: true },
  { name: 'enemy_walk', dir: 'textures/characters/enemy_walk', fps: 10, loop: true },
  { name: 'enemy_attack', dir: 'textures/characters/enemy_attack', fps: 10, loop: false },
  { name: 'enemy_hit', dir: 'textures/characters/enemy_hit', fps: 10, loop: false },
  { name: 'enemy_dead', dir: 'textures/characters/enemy_dead', fps: 9, loop: false },
];

// 绮剧伒鏄剧ず楂樺害锛堝儚绱狅級锛屼笌涓嬫柟纰版挒浣撳壀褰卞拰鐩告満 orthoHeight=360 鍗忚皟銆?
const PLAYER_DISPLAY_HEIGHT = 190;
const ENEMY_DISPLAY_HEIGHT = 96;

/*
 * 绮剧伒娓叉煋鍚庤鑹茬殑瀹為檯鍓奖锛堟寜鏄剧ず楂樺害缂╂斁銆佸簳閮ㄥ榻?alpha 鎵弿瀹炴祴锛夛紝纰版挒浣撴嵁姝ゅ尮閰嶃€?
 * root 鍘熺偣鍦ㄨ妭鐐逛腑蹇冿紝visual 鑴氬簳钀藉湪 root 涓嬫柟 displayHeight/2锛屾晠鍓奖绔栫洿涓績鐩稿 root 涓鸿礋锛?
 * 鐢?offset.y 鎶婂彈鍑绘/鏀诲嚮妗嗗帇鍒扮湡姝ｇ殑韬綋涓婏紝鑰屼笉鏄棭鏈熷崰浣嶈壊鍧楁椂浠ｇ殑 y=0 灞呬腑銆?
 * 鍗犱綅鍥惧洖閫€鍒嗘敮浠嶇敤鏃х殑灞呬腑鍊硷紙瑙?createPlayerActorNode/createActorNode 鐨勯潪缂╂斁缁樺埗锛夈€?
 */
const PLAYER_SPRITE_BODY = { size: new Size(96, 156), offset: new Vec2(0, -6) };
const ENEMY_SPRITE_BODY = { size: new Size(76, 40), offset: new Vec2(0, -26) };
// 鐜╁鏀诲嚮妗嗙珫鐩村榻愬埌韬綋涓績锛屼娇鍏惰鐩栨洿浣庣殑鍙茶幈濮嗗彈鍑绘銆?
const PLAYER_SPRITE_HITBOX_Y = -6;
const PLAYER_PLACEHOLDER_BODY = { size: new Size(48, 90), offset: new Vec2(0, 0) };
const ENEMY_PLACEHOLDER_BODY = { size: new Size(52, 70), offset: new Vec2(0, 0) };

/*
 * 璁粌鎴垮惎鍔ㄥ櫒鍦ㄧ┖鍦烘櫙涓▼搴忓寲鎼缓鎴樻枟闂幆锛岄檷浣庢棭鏈熸墜鎰熼獙璇佸棰勫埗浣撹祫婧愮殑渚濊禆銆?
 */
@ccclass('TrainingRoomBootstrap')
export class TrainingRoomBootstrap extends Component {
  @property
  rebuildOnStart = true;

  private runtimeConfig: RuntimeGameConfig | null = null;

  /*
   * 宸插瓨鍦?Canvas 鏃惰烦杩囬噸寤猴紝閬垮厤缂栬緫鍣ㄦ墜宸ユ惌寤哄唴瀹瑰湪棰勮鍚姩鏃惰閲嶅鍒涘缓銆?
   */
  start(): void {
    void this.bootstrapRoom();
  }

  private async bootstrapRoom(): Promise<void> {
    if (!this.rebuildOnStart || this.node.getChildByName('Canvas')) {
      return;
    }

    this.setupPhysics();
    await this.loadRuntimeConfig();

    const room = this.node.addComponent(DungeonRoomManager);
    const canvas = this.createCanvas();
    this.createCamera();
    this.createGround(canvas);

    const player = await this.createPlayer(canvas);
    const hud = this.createHud(canvas, player.controller, player.skills);

    room.player = player.node;
    room.messageLabel = hud.messageLabel;
    if (this.runtimeConfig) {
      const enemyConfig = getEnemyConfig(this.runtimeConfig.characters, this.runtimeConfig.room.enemyPrefab);
      room.autoLoadConfig = false;
      room.applyRoomConfig(this.runtimeConfig.room);
      room.applyEnemyConfig(enemyConfig);
    }
    await this.createEnemies(canvas, room, player.node);
  }

  private async loadRuntimeConfig(): Promise<void> {
    try {
      this.runtimeConfig = await loadRuntimeGameConfig();
    } catch (error) {
      console.warn('[TrainingRoomBootstrap] 读取运行时配置失败，保留组件默认值', error);
    }
  }

  /*
   * 璁粌鍦轰娇鐢?2D 鐗╃悊浣嗗叧闂噸鍔涳紝瑙掕壊浣嶇Щ瀹屽叏鐢辨帶鍒跺櫒鍜?AI 椹卞姩銆?
   */
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

  /*
   * 鑳屾櫙鍜屽湴闈㈤兘鐢?Graphics 缁樺埗锛屼繚璇佹病鏈夊閮ㄨ创鍥炬椂涔熻兘蹇€熼瑙堝叧鍗″眰娆°€?
   */
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

  /*
   * 鐜╁鑺傜偣浼樺厛浣跨敤鍒囩墖绮剧伒鍔ㄧ敾锛涘姞杞藉け璐ユ椂鍥為€€鍒扮▼搴忓寲鑹插潡鍗犱綅鍥撅紝淇濊瘉璁粌鎴垮缁堝彲杩愯銆?
   */
  private async createPlayer(parent: Node): Promise<{ node: Node; controller: PlayerController; skills: SkillComponent }> {
    const spriteActor = await this.createSpriteActorNode('Player', PLAYER_CLIP_SPECS, 'player_idle', PLAYER_DISPLAY_HEIGHT);
    const playerActor = spriteActor ?? this.createPlayerActorNode('Player');
    const player = playerActor.root;
    player.setPosition(-360, -100, 0);
    parent.addChild(player);

    const controller = player.addComponent(PlayerController);
    controller.facingVisualRoot = playerActor.visual;
    // 绮剧伒宸叉妸鍓戠敾杩涘抚閲岋紝绂佺敤绋嬪簭鍖栨尌鍓戦伩鍏嶉噸褰憋紱鍗犱綅鍥惧垎鏀墠闇€瑕?weaponPivot銆?
    controller.weaponPivot = spriteActor ? null : (playerActor as { weaponPivot?: Node }).weaponPivot ?? null;
    if (spriteActor) {
      controller.animation = spriteActor.animation;
    }
    controller.characterId = 'player_warrior';
    if (this.runtimeConfig) {
      controller.autoLoadConfig = false;
      controller.applyStats(getCharacterConfig(this.runtimeConfig.characters, controller.characterId));
    }

    const playerBody = spriteActor ? PLAYER_SPRITE_BODY : PLAYER_PLACEHOLDER_BODY;
    this.addBodyCollider(player, playerBody.size, playerBody.offset, false);

    const skills = player.addComponent(SkillComponent);
    const hitBoxRoot = new Node('HitBoxRoot');
    hitBoxRoot.setPosition(spriteActor ? 46 : 70, spriteActor ? PLAYER_SPRITE_HITBOX_Y : 0, 0);
    player.addChild(hitBoxRoot);

    const hitBoxNode = this.createSlashEffectNode('HitBox');
    hitBoxRoot.addChild(hitBoxNode);
    const hitBox = hitBoxNode.addComponent(HitBox);
    hitBox.owner = player;

    const hitCollider = hitBoxNode.addComponent(BoxCollider2D);
    hitCollider.size = spriteActor ? new Size(92, 106) : new Size(132, 84);
    hitCollider.sensor = true;
    hitCollider.enabled = false;
    hitBoxNode.active = false;

    skills.hitBox = hitBox;
    skills.hitBoxRoot = hitBoxRoot;
    if (this.runtimeConfig) {
      skills.autoLoadConfig = false;
      skills.applySkills(this.runtimeConfig.skills);
    }
    controller.skillComponent = skills;

    return { node: player, controller, skills };
  }

  /*
   * 绋嬪簭鍖栨晫浜虹敤浜庤缁冩埧鍥哄畾娉㈡锛屾墍鏈夋€墿閮芥寚鍚戝悓涓€涓帺瀹剁洰鏍囥€?
   * 浼樺厛浣跨敤鍒囩墖绮剧伒鍔ㄧ敾锛屽姞杞藉け璐ユ椂鍥為€€鍒拌壊鍧楀崰浣嶅浘銆?
   */
  private async createEnemies(parent: Node, room: DungeonRoomManager, player: Node): Promise<void> {
    const spawnPoints = this.runtimeConfig
      ? resolveRoomSpawnPositions(this.runtimeConfig.room).map((point) => new Vec3(point.x, point.y, point.z))
      : [
        new Vec3(-120, -80, 0),
        new Vec3(80, -140, 0),
        new Vec3(280, -100, 0),
      ];
    const enemyId = this.runtimeConfig?.room.enemyPrefab ?? 'enemy_slime';
    const enemyConfig = this.runtimeConfig
      ? getEnemyConfig(this.runtimeConfig.characters, enemyId)
      : null;

    for (let index = 0; index < spawnPoints.length; index += 1) {
      const position = spawnPoints[index];
      const name = `Enemy_Slime_${index + 1}`;
      const spriteActor = await this.createSpriteActorNode(name, ENEMY_CLIP_SPECS, 'enemy_idle', ENEMY_DISPLAY_HEIGHT);
      const enemyActor = spriteActor ?? this.createActorNode(name, SLIME_PIXEL_PARTS);
      const enemy = enemyActor.root;
      enemy.setPosition(position);
      parent.addChild(enemy);
      const enemyBody = spriteActor ? ENEMY_SPRITE_BODY : ENEMY_PLACEHOLDER_BODY;
      this.addBodyCollider(enemy, enemyBody.size, enemyBody.offset, true);

      const ai = enemy.addComponent(EnemyAI);
      ai.facingVisualRoot = enemyActor.visual;
      if (spriteActor) {
        ai.animation = spriteActor.animation;
      }
      ai.characterId = enemyId;
      if (enemyConfig) {
        ai.autoLoadConfig = false;
        ai.applyStats(enemyConfig);
      }
      ai.attackWindup = 0.28;
      ai.attackDamageMoment = 0.22;
      ai.attackLockDuration = 0.55;
      ai.target = player;
      enemy.addComponent(HurtBox).owner = ai;
      enemy.addComponent(EnemyHealthHud);
      room.registerEnemy(ai);
    }
  }

  /*
   * HUD 鍙粦瀹氬彲瑙傚療鐨勮鑹插拰鎶€鑳界粍浠讹紝鏄剧ず閫昏緫鐢?CombatHud 姣忓抚璇诲彇褰撳墠鐘舵€併€?
   */
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

    const controlsLabel = this.createLabel('ControlsLabel', '方向键移动  |  X 普攻  |  Z 疾风刺', 18);
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

  /*
   * 鍍忕礌鍧楁寜钃濆浘缁樺埗鍒板崟涓?Graphics锛岄€傚悎鍘熷瀷鏈熷揩閫熻凯浠ｈ鑹插壀褰卞拰纰版挒鍙傝€冦€?
   */
  private createPixelArtNode(name: string, parts: readonly PixelPart[], offset = new Vec2(0, 0)): Node {
    const node = new Node(name);
    const bounds = getPixelArtBounds(parts);
    node.addComponent(UITransform).setContentSize(bounds.width, bounds.height);
    const graphics = node.addComponent(Graphics);
    parts.forEach((part) => {
      graphics.fillColor = this.toColor(part.color);
      graphics.rect(part.x - offset.x, part.y - offset.y, part.width, part.height);
      graphics.fill();
    });
    return node;
  }

  /*
   * 鐜╁姝﹀櫒鍗曠嫭鎸傚湪 WeaponPivot 涓嬶紝閬垮厤韬綋缈昏浆鍜屾鍣ㄥ姩鐢讳簰鐩告薄鏌撱€?
   */
  private createPlayerActorNode(name: string): { root: Node; visual: Node; weaponPivot: Node } {
    const weaponNames = new Set(['Sword', 'SwordCore', 'SwordGuard']);
    const bodyParts = PLAYER_PIXEL_PARTS.filter((part) => !weaponNames.has(part.name));
    const weaponParts = PLAYER_PIXEL_PARTS.filter((part) => weaponNames.has(part.name));
    const root = new Node(name);
    const bounds = getPixelArtBounds(PLAYER_PIXEL_PARTS);
    root.addComponent(UITransform).setContentSize(bounds.width, bounds.height);

    const visual = this.createPixelArtNode(`${name}Visual`, bodyParts);
    root.addChild(visual);

    const weaponPivot = new Node('WeaponPivot');
    weaponPivot.setPosition(24, -14, 0);
    const weapon = this.createPixelArtNode('SwordVisual', weaponParts, new Vec2(24, -14));
    weaponPivot.addChild(weapon);
    root.addChild(weaponPivot);
    return { root, visual, weaponPivot };
  }

  private createActorNode(name: string, parts: readonly PixelPart[]): { root: Node; visual: Node } {
    const root = new Node(name);
    const bounds = getPixelArtBounds(parts);
    root.addComponent(UITransform).setContentSize(bounds.width, bounds.height);
    const visual = this.createPixelArtNode(`${name}Visual`, parts);
    root.addChild(visual);
    return { root, visual };
  }

  /*
   * 浠?resources 鐩綍鍔犺浇涓€涓姩浣滅殑鍏ㄩ儴甯э紝鎸夋枃浠跺悕鎺掑簭淇濊瘉甯у簭锛堝垏鐗囪剼鏈緭鍑?00.png銆?1.png鈥︼級銆?
   * 鍚岀粍鍚勫姩浣滅殑瑙掕壊澶у皬宸茬敱鍒囩墖鑴氭湰缁熶竴锛堟寜鍔ㄤ綔鍐呭楂樺害褰掍竴鍒颁竴鑷寸洰鏍囬珮 + 缁熶竴鐢诲竷锛夛紝
   * 鏁呭悇甯?originalSize 涓€鑷达紝娓叉煋鏃朵笉浼氬拷澶у拷灏忋€?
   */
  private loadImages(dir: string): Promise<ImageAsset[]> {
    return new Promise((resolve_, reject) => {
      resources.loadDir(dir, ImageAsset, (error, images) => {
        if (error || !images || images.length === 0) {
          reject(error ?? new Error(`目录无可用 ImageAsset: ${dir}`));
          return;
        }
        const sorted = [...images].sort((a, b) => a.name.localeCompare(b.name));
        resolve_(sorted);
      });
    });
  }

  private createUntrimmedFrame(image: ImageAsset): SpriteFrame {
    const texture = new Texture2D();
    texture.image = image;

    const frame = new SpriteFrame();
    frame.texture = texture;
    frame.rect = new Rect(0, 0, image.width, image.height);
    frame.originalSize = new Size(image.width, image.height);
    frame.offset = new Vec2(0, 0);
    frame.name = image.name;
    return frame;
  }

  /*
   * 鐢ㄦ瘡涓姩浣滅殑甯у簭鍒楁瀯寤?AnimationClip 骞舵寕鍒拌妭鐐圭殑 Animation 缁勪欢銆?
   * createWithSpriteFrames 鐨勮建閬撴寚鍚戠粍浠舵墍鍦ㄨ妭鐐圭殑 cc.Sprite.spriteFrame锛?
   * 鏁?Sprite 涓?Animation 蹇呴』鎸傚湪鍚屼竴鑺傜偣锛堣繖閲岄兘鎸傚湪 visual 涓婏級銆?
   */
  private buildAnimation(node: Node, clips: readonly { spec: ClipSpec; frames: SpriteFrame[] }[], defaultClip: string): Animation {
    const animation = node.addComponent(Animation);
    const created = clips.map(({ spec, frames }) => {
      const clipFrames = spec.frameOrder?.map((index) => frames[index]).filter((frame): frame is SpriteFrame => Boolean(frame)) ?? frames;
      const clip = AnimationClip.createWithSpriteFrames(clipFrames, spec.fps);
      clip.name = spec.name;
      // createWithSpriteFrames 榛樿 sample=frames.length 鏃舵椂闀?甯ф暟/閲囨牱锛涚敤 fps 瀵归綈璁捐甯х巼銆?
      clip.sample = spec.fps;
      clip.wrapMode = spec.loop ? AnimationClip.WrapMode.Loop : AnimationClip.WrapMode.Normal;
      return clip;
    });
    animation.clips = created;
    const fallback = created.find((clip) => clip.name === defaultClip) ?? created[0];
    if (fallback) {
      animation.defaultClip = fallback;
    }
    return animation;
  }

  /*
   * 鏋勫缓甯︾簿鐏靛姩鐢荤殑瑙掕壊鑺傜偣锛歳oot 涓嬫寕 visual 鑺傜偣锛圫prite + Animation 鍚岃妭鐐癸級銆?
   * visual 浣滀负 facingVisualRoot锛屾部鐢?scale.x 缈昏浆鏈濆悜涓庢晫浜哄墠鎺㈢缉鏀撅紝鍩哄噯 scale 鐢辨樉绀洪珮搴﹀喅瀹氥€?
   * 浠讳竴鍔ㄤ綔甯у姞杞藉け璐ュ垯鏁翠綋杩斿洖 null锛岃皟鐢ㄦ柟鍥為€€鍒扮▼搴忓寲鍗犱綅鍥撅紙澶у０澶辫触锛屼笉闈欓粯娈嬬己锛夈€?
   */
  private async createSpriteActorNode(
    name: string,
    specs: readonly ClipSpec[],
    defaultClip: string,
    displayHeight: number,
  ): Promise<{ root: Node; visual: Node; animation: Animation } | null> {
    try {
      const loaded = await Promise.all(
        specs.map(async (spec) => ({
          spec,
          frames: (await this.loadImages(spec.dir)).map((image) => this.createUntrimmedFrame(image)),
        })),
      );

      const root = new Node(name);
      root.addComponent(UITransform).setContentSize(displayHeight, displayHeight);

      const visual = new Node(`${name}Visual`);
      const firstFrame = loaded[0].frames[0];
      const frameH = firstFrame.originalSize.height || firstFrame.rect.height;
      const frameW = firstFrame.originalSize.width || firstFrame.rect.width;
      const visibleFrameH = firstFrame.rect.height || frameH;
      const transform = visual.addComponent(UITransform);
      transform.setContentSize(frameW, frameH);
      // 閿氱偣搴曢儴灞呬腑锛氫笌鍒囩墖鈥滃簳閮ㄥ榻愨€濅竴鑷达紝鑴氬簳璐村湪 visual 鍘熺偣涓娿€?
      transform.setAnchorPoint(0.5, 0);

      const sprite = visual.addComponent(Sprite);
      sprite.spriteFrame = firstFrame;
      sprite.sizeMode = Sprite.SizeMode.CUSTOM;
      // 鍏抽棴 trim锛屼繚鐣欏垏鐗囨椂鐨勭粺涓€鐢诲竷灏哄锛岄伩鍏嶅悇甯у洜鑷姩瑁佸壀鑰屾姈鍔ㄣ€?
      sprite.trim = false;

      // displayHeight 对齐角色可见高度；切帧脚本已统一画布和脚底锚点，透明边距不参与缩放。
      const scale = displayHeight / visibleFrameH;
      visual.setScale(new Vec3(scale, scale, 1));
      visual.setPosition(0, -displayHeight / 2, 0);
      root.addChild(visual);

      const animation = this.buildAnimation(visual, loaded, defaultClip);
      return { root, visual, animation };
    } catch (error) {
      console.warn(`[TrainingRoomBootstrap] 精灵动画加载失败，回退占位图: ${name}`, error);
      return null;
    }
  }

  /*
   * 鏀诲嚮妗嗚妭鐐瑰彧浣滀负纰版挒鍒ゅ畾瀹瑰櫒锛氫笉鎸?Graphics锛屾晠 HitBox.drawSkillEffect 鍙栦笉鍒扮敾甯冭€岃烦杩囩粯鍒讹紝
   * slash_wave 鐨勫墤姘旀畫褰辫绉婚櫎锛屼絾鍒ゅ畾绐楀彛涓庝激瀹抽€昏緫淇濇寔涓嶅彉銆?
   */
  private createSlashEffectNode(name: string): Node {
    const node = new Node(name);
    node.addComponent(UITransform).setContentSize(92, 106);
    return node;
  }

  private toColor(color: PixelColor): Color {
    return new Color(color[0], color[1], color[2], color[3] ?? 255);
  }

  /*
   * 瑙掕壊韬綋浣跨敤 Kinematic 鍒氫綋锛岄伩鍏嶇墿鐞嗙郴缁熸帴绠＄Щ鍔紝鍚屾椂淇濈暀瑙﹀彂鍣ㄦ娴嬭兘鍔涖€?
   */
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
