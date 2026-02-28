import { describe, it, expect } from 'vitest'
import { resolveTagSet } from './target-composition.js'

describe('resolveTagSet', () => {
	describe('when target has no composition', () => {
		it('returns a set containing only the target itself', () => {
			const result = resolveTagSet('frontend', {})
			expect(result).toEqual(new Set(['frontend']))
		})

		it('returns a set containing only the target when map has unrelated entries', () => {
			const result = resolveTagSet('frontend', {
				fullstack: ['backend', 'devops'],
			})
			expect(result).toEqual(new Set(['frontend']))
		})
	})

	describe('when target is a simple composition', () => {
		it('expands to constituents plus itself', () => {
			const result = resolveTagSet('fullstack', {
				fullstack: ['frontend', 'backend'],
			})
			expect(result).toEqual(new Set(['fullstack', 'frontend', 'backend']))
		})

		it('expands single-constituent composition', () => {
			const result = resolveTagSet('senior', {
				senior: ['backend'],
			})
			expect(result).toEqual(new Set(['senior', 'backend']))
		})
	})

	describe('when target has recursive composition', () => {
		it('expands transitively through nested compositions', () => {
			const result = resolveTagSet('startup-cto', {
				fullstack: ['frontend', 'backend'],
				'startup-cto': ['fullstack', 'leadership'],
			})
			expect(result).toEqual(
				new Set([
					'startup-cto',
					'fullstack',
					'frontend',
					'backend',
					'leadership',
				]),
			)
		})

		it('expands three levels deep', () => {
			const result = resolveTagSet('mega', {
				base: ['core'],
				mid: ['base', 'extra'],
				mega: ['mid', 'top'],
			})
			expect(result).toEqual(
				new Set(['mega', 'mid', 'base', 'core', 'extra', 'top']),
			)
		})
	})

	describe('when composition has duplicate constituents', () => {
		it('deduplicates across branches', () => {
			const result = resolveTagSet('combined', {
				a: ['shared', 'unique-a'],
				b: ['shared', 'unique-b'],
				combined: ['a', 'b'],
			})
			expect(result).toEqual(
				new Set(['combined', 'a', 'shared', 'unique-a', 'b', 'unique-b']),
			)
		})
	})

	describe('when composition has cycles', () => {
		it('throws on direct self-reference', () => {
			expect(() => resolveTagSet('a', { a: ['a'] })).toThrow(/circular/i)
		})

		it('throws on two-node cycle', () => {
			expect(() => resolveTagSet('a', { a: ['b'], b: ['a'] })).toThrow(
				/circular/i,
			)
		})

		it('throws on three-node cycle', () => {
			expect(() =>
				resolveTagSet('a', { a: ['b'], b: ['c'], c: ['a'] }),
			).toThrow(/circular/i)
		})

		it('includes the cycle path in the error message', () => {
			expect(() => resolveTagSet('a', { a: ['b'], b: ['a'] })).toThrow('a')
		})
	})

	describe('declaration order independence', () => {
		it('produces the same result regardless of map key order', () => {
			const map1 = {
				'startup-cto': ['fullstack', 'leadership'],
				fullstack: ['frontend', 'backend'],
			}
			const map2 = {
				fullstack: ['frontend', 'backend'],
				'startup-cto': ['fullstack', 'leadership'],
			}
			expect(resolveTagSet('startup-cto', map1)).toEqual(
				resolveTagSet('startup-cto', map2),
			)
		})
	})
})
