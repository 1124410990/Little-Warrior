import assert from 'node:assert/strict';
import {
  calculateDamage,
  applyKnockback,
  canHitTarget,
  getChaseVector,
  resolveSeparationOffset,
  resolveAttackBoxOffset,
  resolveFacingOffset,
  resolveMeleeLungePose,
  resolveWeaponThrustPose,
  resolveWeaponSlashPose,
  shouldDrawSkillAreaEffect,
  shouldApplyTimedAttackDamage,
  shouldChaseTarget,
  shouldHoldMeleeRange,
} from '../assets/scripts/combat/CombatMath.ts';
import { readFileSync } from 'node:fs';
import { StateMachine } from '../assets/scripts/core/StateMachine.ts';
import {
  DEFAULT_INPUT_BINDINGS,
  getCombatActionFromInput,
  getInputCodeFromKeyCode,
  getFacingFromHorizontalInput,
  normalizeMoveVector,
  resolveMoveVector,
} from '../assets/scripts/input/KeyboardMapping.ts';
import {
  PLAYER_PIXEL_PARTS,
  SLIME_PIXEL_PARTS,
  getPixelArtBounds,
} from '../assets/scripts/dungeon/PixelArtBlueprint.ts';

assert.equal(calculateDamage({ attack: 120, defense: 35, skillPower: 1.5, criticalMultiplier: 2 }), 255);
assert.equal(calculateDamage({ attack: 40, defense: 100, skillPower: 1 }), 1);

assert.deepEqual(applyKnockback({ x: 10, y: 4 }, { x: 2, y: 99 }, 18), { x: 28, y: 4 });
assert.deepEqual(applyKnockback({ x: 10, y: 4 }, { x: 30, y: 99 }, 18), { x: -8, y: 4 });
assert.deepEqual(resolveSeparationOffset({ x: 0, y: 0 }, [{ x: 100, y: 0 }], 58), { x: 0, y: 0 });
assert.deepEqual(resolveSeparationOffset({ x: 0, y: 0 }, [{ x: 20, y: 0 }], 58), { x: -19, y: 0 });
assert.deepEqual(resolveSeparationOffset({ x: 0, y: 0 }, [{ x: 0, y: 0 }], 58, 1), { x: 29, y: 0 });
assert.deepEqual(getChaseVector({ x: 0, y: 0 }, { x: 30, y: -40 }), { x: 0.6, y: -0.8 });
assert.deepEqual(getChaseVector({ x: 10, y: 4 }, { x: 10, y: 4 }), { x: 0, y: 0 });
assert.equal(resolveFacingOffset(70, 1), 70);
assert.equal(resolveFacingOffset(70, -1), -70);
assert.equal(resolveFacingOffset(-70, 1), 70);
assert.equal(resolveAttackBoxOffset(70, -1, true), -70);
assert.equal(resolveAttackBoxOffset(70, -1, false), 70);
assert.deepEqual(resolveWeaponSlashPose(0, 1), { angle: 68, x: 18, y: 22 });
assert.deepEqual(resolveWeaponSlashPose(0.5, 1), { angle: -4, x: 34, y: 4 });
assert.deepEqual(resolveWeaponSlashPose(1, -1), { angle: 76, x: -18, y: -20 });
assert.deepEqual(resolveWeaponThrustPose(0, 1), { angle: -86, x: 12, y: -6 });
assert.deepEqual(resolveWeaponThrustPose(0.5, 1), { angle: -90, x: 58, y: -2 });
assert.deepEqual(resolveWeaponThrustPose(1, -1), { angle: 86, x: -24, y: -14 });
assert.deepEqual(resolveMeleeLungePose(0, 1), { scaleX: 1, scaleY: 1, x: 0 });
assert.deepEqual(resolveMeleeLungePose(0.35, 1), { scaleX: 1.18, scaleY: 0.82, x: 15 });
assert.deepEqual(resolveMeleeLungePose(1, -1), { scaleX: 1, scaleY: 1, x: 0 });
assert.equal(shouldDrawSkillAreaEffect('basic_1'), false);
assert.equal(shouldDrawSkillAreaEffect('slash_wave'), true);
assert.equal(shouldHoldMeleeRange(70, 72), true);
assert.equal(shouldHoldMeleeRange(90, 72), false);
assert.equal(shouldChaseTarget(90, 360, 72), true);
assert.equal(shouldChaseTarget(70, 360, 72), false);
assert.equal(shouldChaseTarget(400, 360, 72), false);
assert.equal(shouldApplyTimedAttackDamage(0.21, 0.22, false), false);
assert.equal(shouldApplyTimedAttackDamage(0.22, 0.22, false), true);
assert.equal(shouldApplyTimedAttackDamage(0.4, 0.22, true), false);
assert.equal(shouldApplyTimedAttackDamage(0.27, 0.22, false, 0.28), false);
assert.equal(shouldApplyTimedAttackDamage(0.28, 0.22, false, 0.28), true);

const characterConfigText = readFileSync(new URL('../assets/resources/config/characters.json', import.meta.url), 'utf8').replace(/^\uFEFF/, '');
const characterConfig = JSON.parse(characterConfigText);
assert.equal(characterConfig.enemy_slime.moveSpeed, 85);
assert.equal(characterConfig.enemy_slime.attackRange, 96);
assert.equal(characterConfig.enemy_slime.attackCooldown, 1.35);

assert.equal(canHitTarget({ hp: 10, invulnerableUntil: 0 }, 0.2), true);
assert.equal(canHitTarget({ hp: 0, invulnerableUntil: 0 }, 0.2), false);
assert.equal(canHitTarget({ hp: 10, invulnerableUntil: 0.5 }, 0.2), false);

assert.deepEqual(resolveMoveVector(new Set(['ArrowUp', 'ArrowRight'])), { x: 1, y: 1 });
assert.deepEqual(resolveMoveVector(new Set(['ArrowLeft', 'ArrowRight'])), { x: 0, y: 0 });
assert.deepEqual(resolveMoveVector(new Set(['ArrowUp', 'ArrowDown'])), { x: 0, y: 0 });
assert.deepEqual(normalizeMoveVector({ x: 0, y: 0 }), { x: 0, y: 0 });
assert.deepEqual(normalizeMoveVector({ x: 1, y: 0 }), { x: 1, y: 0 });
assert.equal(Number(normalizeMoveVector({ x: 1, y: 1 }).x.toFixed(3)), 0.707);
assert.equal(Number(normalizeMoveVector({ x: 1, y: 1 }).y.toFixed(3)), 0.707);
assert.equal(getFacingFromHorizontalInput({ x: 0, y: -1 }, -1), -1);
assert.equal(getFacingFromHorizontalInput({ x: 1, y: 0 }, -1), 1);
assert.equal(DEFAULT_INPUT_BINDINGS.basicAttack, 'KeyX');
assert.equal(DEFAULT_INPUT_BINDINGS.smallSkill, 'KeyZ');
assert.equal(getCombatActionFromInput('KeyX'), 'basicAttack');
assert.equal(getCombatActionFromInput('KeyZ'), 'smallSkill');
assert.equal(getCombatActionFromInput('ArrowLeft'), null);
assert.equal(getInputCodeFromKeyCode(38), 'ArrowUp');
assert.equal(getInputCodeFromKeyCode(40), 'ArrowDown');
assert.equal(getInputCodeFromKeyCode(37), 'ArrowLeft');
assert.equal(getInputCodeFromKeyCode(39), 'ArrowRight');
assert.equal(getInputCodeFromKeyCode(88), 'KeyX');
assert.equal(getInputCodeFromKeyCode(90), 'KeyZ');
assert.equal(getInputCodeFromKeyCode(13), null);

assert.equal(PLAYER_PIXEL_PARTS.some((part) => part.name === 'Sword'), true);
assert.equal(PLAYER_PIXEL_PARTS.some((part) => part.name === 'Cape'), true);
assert.equal(SLIME_PIXEL_PARTS.some((part) => part.name === 'EyeLeft'), true);
assert.equal(SLIME_PIXEL_PARTS.some((part) => part.name === 'EyeRight'), true);
assert.deepEqual(getPixelArtBounds(PLAYER_PIXEL_PARTS), { width: 64, height: 96 });
assert.deepEqual(getPixelArtBounds(SLIME_PIXEL_PARTS), { width: 64, height: 56 });

const stateEvents = [];
const stateMachine = new StateMachine({ stateEvents }, {
  attack: { enter: (ctx) => ctx.stateEvents.push('attack') },
  idle: { enter: (ctx) => ctx.stateEvents.push('idle') },
}, 'idle');
assert.equal(stateMachine.transitionTo('attack'), true);
assert.equal(stateMachine.transitionTo('attack', { reenter: true }), true);
assert.deepEqual(stateEvents, ['idle', 'attack', 'attack']);

console.log('combat and input tests passed');
