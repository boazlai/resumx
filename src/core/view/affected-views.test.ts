import { describe, it, expect } from 'vitest'
import { computeAffectedViews } from './affected-views.js'
import { resolveView } from './resolve.js'
import type { NamedView } from './plan.js'

function namedView(name: string, selects: string[]): NamedView {
	return { name, view: resolveView([{ selects }]) }
}

describe('computeAffectedViews', () => {
	it('returns the view whose tag directly changed', () => {
		const views: NamedView[] = [
			namedView('frontend', ['frontend']),
			namedView('backend', ['backend']),
		]

		const affected = computeAffectedViews(['frontend'], {}, views)

		expect(affected).toEqual(new Set(['frontend']))
	})

	it('returns views that transitively depend on a changed composition', () => {
		const tagMap = { fullstack: ['frontend', 'backend'] }
		const views: NamedView[] = [
			namedView('fullstack', ['fullstack']),
			namedView('frontend', ['frontend']),
			namedView('backend', ['backend']),
		]

		const affected = computeAffectedViews(['fullstack'], tagMap, views)

		expect(affected).toEqual(new Set(['fullstack']))
	})

	it('affects composed views when a constituent tag changes', () => {
		const tagMap = { fullstack: ['frontend', 'backend'] }
		const views: NamedView[] = [
			namedView('fullstack', ['fullstack']),
			namedView('frontend', ['frontend']),
		]

		const affected = computeAffectedViews(['frontend'], tagMap, views)

		expect(affected).toEqual(new Set(['fullstack', 'frontend']))
	})

	it('tracks deep transitive dependencies through compositions', () => {
		const tagMap = {
			fullstack: ['frontend', 'backend'],
			'startup-cto': ['fullstack', 'leadership'],
		}
		const views: NamedView[] = [
			namedView('startup-cto', ['startup-cto']),
			namedView('fullstack', ['fullstack']),
			namedView('frontend', ['frontend']),
		]

		const affected = computeAffectedViews(['frontend'], tagMap, views)

		expect(affected).toEqual(new Set(['startup-cto', 'fullstack', 'frontend']))
	})

	it('does not affect unrelated views', () => {
		const tagMap = { fullstack: ['frontend', 'backend'] }
		const views: NamedView[] = [
			namedView('fullstack', ['fullstack']),
			namedView('devops', ['devops']),
		]

		const affected = computeAffectedViews(['frontend'], tagMap, views)

		expect(affected).toEqual(new Set(['fullstack']))
	})

	it('handles custom views with selects referencing a changed tag', () => {
		const tagMap = { fullstack: ['frontend', 'backend'] }
		const views: NamedView[] = [
			namedView('stripe-swe', ['fullstack']),
			namedView('devops', ['devops']),
		]

		const affected = computeAffectedViews(['frontend'], tagMap, views)

		expect(affected).toEqual(new Set(['stripe-swe']))
	})

	it('returns empty set when no views match', () => {
		const views: NamedView[] = [
			namedView('frontend', ['frontend']),
			namedView('backend', ['backend']),
		]

		const affected = computeAffectedViews(['devops'], {}, views)

		expect(affected).toEqual(new Set())
	})

	it('skips unnamed views', () => {
		const views: NamedView[] = [
			{ name: undefined, view: resolveView([]) },
			namedView('frontend', ['frontend']),
		]

		const affected = computeAffectedViews(['frontend'], {}, views)

		expect(affected).toEqual(new Set(['frontend']))
	})

	it('skips named views with null selects', () => {
		const views: NamedView[] = [
			{ name: 'default', view: resolveView([]) },
			namedView('frontend', ['frontend']),
		]

		const affected = computeAffectedViews(['frontend'], {}, views)

		expect(affected).toEqual(new Set(['frontend']))
	})

	it('handles multiple changed tags at once', () => {
		const views: NamedView[] = [
			namedView('frontend', ['frontend']),
			namedView('backend', ['backend']),
			namedView('devops', ['devops']),
		]

		const affected = computeAffectedViews(['frontend', 'backend'], {}, views)

		expect(affected).toEqual(new Set(['frontend', 'backend']))
	})

	it('matches a view with multiple selects when any select is affected', () => {
		const views: NamedView[] = [
			namedView('generalist', ['frontend', 'devops']),
			namedView('backend', ['backend']),
		]

		const affected = computeAffectedViews(['devops'], {}, views)

		expect(affected).toEqual(new Set(['generalist']))
	})

	it('deduplicates when a view is reachable via multiple changed tags', () => {
		const tagMap = { fullstack: ['frontend', 'backend'] }
		const views: NamedView[] = [namedView('fullstack', ['fullstack'])]

		const affected = computeAffectedViews(
			['frontend', 'backend'],
			tagMap,
			views,
		)

		expect(affected).toEqual(new Set(['fullstack']))
		expect(affected.size).toBe(1)
	})

	it('fans out to multiple compositions sharing the same leaf tag', () => {
		const tagMap = {
			fullstack: ['frontend', 'backend'],
			'web-dev': ['frontend', 'design'],
		}
		const views: NamedView[] = [
			namedView('fullstack', ['fullstack']),
			namedView('web-dev', ['web-dev']),
		]

		const affected = computeAffectedViews(['frontend'], tagMap, views)

		expect(affected).toEqual(new Set(['fullstack', 'web-dev']))
	})

	it('returns empty set for empty changedTags', () => {
		const views: NamedView[] = [namedView('frontend', ['frontend'])]

		const affected = computeAffectedViews([], {}, views)

		expect(affected).toEqual(new Set())
	})

	it('returns empty set for empty namedViews', () => {
		const affected = computeAffectedViews(['frontend'], {}, [])

		expect(affected).toEqual(new Set())
	})
})
