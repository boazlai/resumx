/**
 * Parse CLI --var flags: ["key=value"] -> { key: "value" }
 */
export function parseVarFlags(flags: string[]): Record<string, string> {
	const result: Record<string, string> = {}

	for (const flag of flags) {
		const eq = flag.indexOf('=')
		if (eq === -1) {
			throw new Error(`Invalid --var format: '${flag}'. Expected name=value`)
		}
		const key = flag.slice(0, eq)
		if (!key) {
			throw new Error('Variable name is empty')
		}
		result[key] = flag.slice(eq + 1)
	}

	return result
}
