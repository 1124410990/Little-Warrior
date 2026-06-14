import { _decorator, Component, Sprite, UITransform } from 'cc';

const { ccclass, property } = _decorator;

/**
 * 精灵表动画播放组件
 * 用于播放横向排列的精灵表动画（无需切分成多个SpriteFrame）
 */
@ccclass('SpriteSheetAnimator')
export class SpriteSheetAnimator extends Component {
  @property(Sprite)
  sprite: Sprite | null = null;

  @property
  frameCount = 4;

  @property
  fps = 10;

  @property
  loop = true;

  private currentFrame = 0;
  private timer = 0;
  private frameInterval = 0;
  private originalTexture: any = null;
  private frameWidth = 0;

  start(): void {
    this.frameInterval = 1 / this.fps;
    if (this.sprite?.spriteFrame?.texture) {
      this.originalTexture = this.sprite.spriteFrame.texture;
      const width = this.originalTexture.width;
      this.frameWidth = width / this.frameCount;
    }
  }

  update(deltaTime: number): void {
    this.timer += deltaTime;
    if (this.timer >= this.frameInterval) {
      this.timer -= this.frameInterval;
      this.updateFrame();
    }
  }

  private updateFrame(): void {
    this.currentFrame++;
    if (this.currentFrame >= this.frameCount) {
      if (this.loop) {
        this.currentFrame = 0;
      } else {
        this.currentFrame = this.frameCount - 1;
        return;
      }
    }

    if (this.sprite?.spriteFrame) {
      const rect = this.sprite.spriteFrame.rect;
      rect.x = this.currentFrame * this.frameWidth;
      rect.width = this.frameWidth;
      this.sprite.spriteFrame.rect = rect;
    }
  }

  playFromStart(): void {
    this.currentFrame = 0;
    this.timer = 0;
  }
}
