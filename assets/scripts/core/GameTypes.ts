export interface CharacterStats {
  id: string;
  displayName: string;
  maxHp: number;
  attack: number;
  defense: number;
  moveSpeed: number;
  hitStun: number;
  invulnerableTime: number;
}

export interface SkillConfig {
  id: string;
  displayName: string;
  animationName: string;
  attack: number;
  skillPower: number;
  cooldown: number;
  activeStart: number;
  activeEnd: number;
  knockback: number;
  hitStun: number;
}

export interface EnemyConfig extends CharacterStats {
  aggroRange: number;
  attackRange: number;
  attackCooldown: number;
}
