import { _decorator, Component } from 'cc';
import { CharacterBase } from '../characters/CharacterBase';

const { ccclass, property } = _decorator;

@ccclass('HurtBox')
export class HurtBox extends Component {
  @property(CharacterBase)
  owner: CharacterBase | null = null;

  isAlive(): boolean {
    return Boolean(this.owner && !this.owner.isDefeated());
  }
}
