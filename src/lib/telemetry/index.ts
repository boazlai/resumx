import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { randomUUID } from 'node:crypto'
import type { TelemetryEvent } from './events.js'

const CONFIG_DIR = join(homedir(), '.resumx')
const CONFIG_PATH = join(CONFIG_DIR, 'config.json')
const POSTHOG_API_KEY = 'phc_yTkSNETOjQk03UnKHMpKZtZakCTYlewMbqffql6wuNA'
const POSTHOG_HOST = 'https://us.i.posthog.com'

interface TelemetryConfig {
	noticeShown?: boolean
	anonymousId?: string
}

function isDisabled(): boolean {
	return (
		process.env['RESUMX_TELEMETRY'] === '0'
		|| process.env['DO_NOT_TRACK'] === '1'
		|| process.env['CI'] === 'true'
		|| process.env['CI'] === '1'
	)
}

function readConfig(): TelemetryConfig {
	try {
		if (existsSync(CONFIG_PATH)) {
			return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8')) as TelemetryConfig
		}
	} catch {
		// Corrupt config, start fresh
	}
	return {}
}

function writeConfig(config: TelemetryConfig): void {
	try {
		if (!existsSync(CONFIG_DIR)) {
			mkdirSync(CONFIG_DIR, { recursive: true })
		}
		writeFileSync(CONFIG_PATH, JSON.stringify(config, null, '\t') + '\n')
	} catch {
		// Non-critical, ignore write failures
	}
}

function getAnonymousId(config: TelemetryConfig): string {
	if (config.anonymousId) return config.anonymousId
	const id = randomUUID()
	config.anonymousId = id
	writeConfig(config)
	return id
}

export function showNoticeIfNeeded(): void {
	if (isDisabled()) return

	const config = readConfig()
	if (config.noticeShown) return

	process.stderr.write(
		'\nResumx collects anonymous usage data to improve the tool.\n'
			+ 'Opt out: set RESUMX_TELEMETRY=0\n'
			+ 'Learn more: https://resumx.dev/guide/telemetry\n\n',
	)

	config.noticeShown = true
	writeConfig(config)
}

let posthogClient: {
	capture: (msg: {
		distinctId: string
		event: string
		properties: Record<string, unknown>
	}) => void
	flush: () => Promise<void>
} | null = null

async function getClient(): Promise<typeof posthogClient> {
	if (posthogClient) return posthogClient
	if (isDisabled()) return null

	try {
		const { PostHog } = await import('posthog-node')
		posthogClient = new PostHog(POSTHOG_API_KEY, {
			host: POSTHOG_HOST,
			flushAt: 1,
			flushInterval: 0,
		})
		return posthogClient
	} catch {
		return null
	}
}

export async function capture(telemetryEvent: TelemetryEvent): Promise<void> {
	if (isDisabled()) return

	const client = await getClient()
	if (!client) return

	const config = readConfig()
	const distinctId = getAnonymousId(config)

	client.capture({
		distinctId,
		event: telemetryEvent.event,
		properties: { ...telemetryEvent.properties },
	})
}

export async function shutdown(): Promise<void> {
	if (!posthogClient) return
	try {
		await posthogClient.flush()
	} catch {
		// Non-critical, ignore flush failures
	}
	posthogClient = null
}
