import assert from 'node:assert/strict';
import {
  calculateDamage,
  applyKnockback,
  canHitTarget,
  getChaseVector,
  resolveAttackBoxOffset,
  resolveFacingOffset,
  shouldChaseTarget,
  shouldHoldMeleeRange,
} from '../assets/scripts/combat/CombatMath.ts';
import { StateMachine } from '../assets/scripts/core/StateMachine.ts';
import {
  DEFAULT_INPUT_BINDINGS,
  getCombatActionFromInput,
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
assert.deepEqual(getChaseVector({ x: 0, y: 0 }, { x: 30, y: -40 }), { x: 0.6, y: -0.8 });
assert.deepEqual(getChaseVector({ x: 10, y: 4 }, { x: 10, y: 4 }), { x: 0, y: 0 });
assert.equal(resolveFacingOffset(70, 1), 70);
assert.equal(resolveFacingOffset(70, -1), -70);
assert.equal(resolveFacingOffset(-70, 1), 70);
assert.equal(resolveAttackBoxOffset(70, -1, true), -70);
assert.equal(resolveAttackBoxOffset(70, -1, false), 70);
assert.equal(shouldHoldMeleeRange(70, 72), true);
assert.equal(shouldHoldMeleeRange(90, 72), false);
assert.equal(shouldChaseTarget(90, 360, 72), true);
assert.equal(shouldChaseTarget(70, 360, 72), false);
assert.equal(shouldChaseTarget(400, 360, 72), false);

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
