import { _decorator, Component } from 'cc';
import { CharacterBase } from '../characters/CharacterBase';

const { ccclass, property } = _decorator;

/*
 * HurtBox 作为可选受击代理，允许碰撞节点和角色根节点分离，同时仍能回溯到 CharacterBase。
 */
@ccclass('HurtBox')
export class HurtBox extends Component {
  @property(CharacterBase)
  owner: CharacterBase | null = null;

  isAlive(): boolean {
    return Boolean(this.owner && !this.owner.isDefeated());
  }
}
