import { describe, it, expect } from 'vitest'
import { parseVarFlags } from './var-flags.js'

describe('parseVarFlags', () => {
	it('parses single variable', () => {
		const vars = parseVarFlags(['font-family=Arial'])
		expect(vars).toEqual({ 'font-family': 'Arial' })
	})

	it('parses multiple variables', () => {
		const vars = parseVarFlags(['font-family=Arial', 'base-font-size=11pt'])
		expect(vars).toEqual({
			'font-family': 'Arial',
			'base-font-size': '11pt',
		})
	})

	it('handles values with equals signs', () => {
		const vars = parseVarFlags(['color=rgba(0,0,0,0.5)'])
		expect(vars).toEqual({ color: 'rgba(0,0,0,0.5)' })
	})

	it('throws on missing equals', () => {
		expect(() => parseVarFlags(['invalid'])).toThrow(
			"Invalid --var format: 'invalid'",
		)
	})

	it('throws on empty name', () => {
		expect(() => parseVarFlags(['=value'])).toThrow('Variable name is empty')
	})

	it('allows empty value', () => {
		const vars = parseVarFlags(['name='])
		expect(vars).toEqual({ name: '' })
	})
})
