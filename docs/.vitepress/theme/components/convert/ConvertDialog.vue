<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import DropZone from './DropZone.vue'
import MarkdownPreview from './MarkdownPreview.vue'

const PROCESSING_MESSAGES = [
	'Convincing your bullet points to use dashes…',
	'Teaching your resume to speak Markdown…',
	'Your resume called, it wants to be a .md file…',
	'Performing resume surgery, please stand by…',
	'Negotiating with your PDF to let the text go…',
	'Asking your resume nicely to undress from PDF…',
	'Bribing the fonts to stay in line…',
	'Smuggling your achievements out of PDF land…',
	'Explaining to your tables that they are just pipes now…',
	'Giving your headings a promotion to ##…',
	'Whispering sweet nothings to your page breaks…',
	'Telling your bold text it can finally use **asterisks**…',
	'Filing a missing persons report for your margins…',
	'Confiscating the drop shadows, you won\'t need those…',
]

const PROCESSING_TICK_MS = 2600
/** Number of ticks before switching to "taking a while" messages. */
const PROCESSING_SLOW_AFTER_TICKS = 4

const PROCESSING_MESSAGES_SLOW = [
	'Your resume is putting up a fight, but we are winning…',
	'The PDF is being dramatic about letting go…',
	'Your career is longer than expected, in a good way…',
	'Not stuck, just savoring your accomplishments…',
	'The AI stopped to admire your work history…',
	'Turns out "quick read" was an understatement…',
	'Your resume is making us work for it…',
	'Still here, your experience just has a lot of pages…',
]

const props = defineProps<{
	open: boolean
}>()

const emit = defineEmits<{
	close: []
}>()

type DialogState = 'drop' | 'processing' | 'preview' | 'error'

const STORAGE_KEY = 'resumx-import-result'

function loadCached(): string {
	try {
		return localStorage.getItem(STORAGE_KEY) ?? ''
	} catch {
		return ''
	}
}

function saveCached(md: string) {
	try {
		localStorage.setItem(STORAGE_KEY, md)
	} catch { /* quota exceeded or private mode */ }
}

function clearCached() {
	try {
		localStorage.removeItem(STORAGE_KEY)
	} catch { /* ignore */ }
}

const cached = loadCached()
const state = ref<DialogState>(cached ? 'preview' : 'drop')
const markdown = ref(cached)
const errorMessage = ref('')
const dialogRef = ref<HTMLDialogElement>()
const processingMessageIndex = ref(0)
const processingMessages = ref<readonly string[]>(PROCESSING_MESSAGES)
let processingInterval: ReturnType<typeof setInterval> | null = null
let processingTickCount = 0

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as
	| string
	| undefined
const turnstileRef = ref<HTMLElement>()
const turnstileToken = ref('')
let turnstileWidgetId: string | undefined

function loadTurnstileScript(): Promise<void> {
	if (window.turnstile) return Promise.resolve()
	return new Promise((resolve, reject) => {
		const script = document.createElement('script')
		script.src =
			'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
		script.async = true
		script.onload = () => resolve()
		script.onerror = () => reject(new Error('Failed to load Turnstile'))
		document.head.appendChild(script)
	})
}

async function initTurnstile() {
	if (!TURNSTILE_SITE_KEY || !turnstileRef.value || turnstileWidgetId) return
	try {
		await loadTurnstileScript()
		if (!window.turnstile || !turnstileRef.value) return
		turnstileWidgetId = window.turnstile.render(turnstileRef.value, {
			sitekey: TURNSTILE_SITE_KEY,
			appearance: 'interaction-only',
			callback: (token: string) => {
				turnstileToken.value = token
			},
			'error-callback': () => {
				turnstileToken.value = ''
			},
			'expired-callback': () => {
				turnstileToken.value = ''
			},
		})
	} catch (e) {
		console.warn('Turnstile init failed:', e)
	}
}

function resetTurnstile() {
	if (turnstileWidgetId && window.turnstile) {
		window.turnstile.reset(turnstileWidgetId)
		turnstileToken.value = ''
	}
}

watch(
	() => props.open,
	(isOpen) => {
		if (isOpen) {
			dialogRef.value?.showModal()
			nextTick(() => initTurnstile())
		} else {
			dialogRef.value?.close()
		}
	},
)

function randomMessageIndex(messages: readonly string[]): number {
	return Math.floor(Math.random() * messages.length)
}

watch(state, (next) => {
	if (next === 'processing') {
		processingTickCount = 0
		processingMessages.value = PROCESSING_MESSAGES
		processingMessageIndex.value = randomMessageIndex(PROCESSING_MESSAGES)
		processingInterval = setInterval(() => {
			processingTickCount++
			if (processingTickCount === PROCESSING_SLOW_AFTER_TICKS) {
				processingMessages.value = PROCESSING_MESSAGES_SLOW
			}
			const msgs = processingMessages.value
			const current = processingMessageIndex.value
			let next = Math.floor(Math.random() * msgs.length)
			if (msgs.length > 1 && next === current) {
				next = (next + 1) % msgs.length
			}
			processingMessageIndex.value = next
		}, PROCESSING_TICK_MS)
	} else {
		if (processingInterval) {
			clearInterval(processingInterval)
			processingInterval = null
		}
	}
})

function handleClose() {
	state.value = markdown.value ? 'preview' : 'drop'
	errorMessage.value = ''
	emit('close')
}

function handleDialogClose() {
	handleClose()
}

function handleKeydown(e: KeyboardEvent) {
	if (e.key === 'Escape' && props.open) {
		handleClose()
	}
}

onMounted(() => {
	document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
	document.removeEventListener('keydown', handleKeydown)
	if (turnstileWidgetId && window.turnstile) {
		window.turnstile.remove(turnstileWidgetId)
		turnstileWidgetId = undefined
	}
})

async function fileToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = () => {
			const result = reader.result as string
			resolve(result.split(',')[1] ?? '')
		}
		reader.onerror = reject
		reader.readAsDataURL(file)
	})
}

async function handleFileDrop(file: File) {
	state.value = 'processing'
	errorMessage.value = ''

	try {
		const base64 = await fileToBase64(file)

		const res = await fetch('/api/convert', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				file: base64,
				filename: file.name,
				turnstileToken: turnstileToken.value || undefined,
			}),
		})

		resetTurnstile()

		const contentType = res.headers.get('content-type') ?? ''
		if (!contentType.includes('application/json')) {
			throw new Error(
				res.status === 404
					? 'Conversion API not available. Run `vercel dev` for local testing.'
					: `Unexpected response (${res.status})`,
			)
		}

		const data = (await res.json()) as {
			markdown?: string
			error?: string
		}

		if (!res.ok || data.error) {
			throw new Error(data.error ?? `Server error (${res.status})`)
		}

		if (!data.markdown) {
			throw new Error('No markdown returned')
		}

		markdown.value = data.markdown
		saveCached(data.markdown)
		state.value = 'preview'
	} catch (err) {
		errorMessage.value =
			err instanceof Error ? err.message : 'Something went wrong'
		state.value = 'error'
	}
}

function handleBack() {
	state.value = 'drop'
	markdown.value = ''
	clearCached()
}

function handleRejected(fileName: string) {
	const ext = fileName.includes('.') ? fileName.slice(fileName.lastIndexOf('.')) : '(none)'
	errorMessage.value = `"${fileName}" is not a supported format (${ext}). Accepted: PDF, DOCX, LaTeX, JSON Resume, RenderCV YAML.`
	state.value = 'error'
}

function handleRetry() {
	state.value = 'drop'
	errorMessage.value = ''
	nextTick(() => initTurnstile())
}
</script>

<template>
	<Teleport to="body">
		<dialog ref="dialogRef" class="convert-dialog" @close="handleDialogClose">
			<div class="convert-dialog-inner">
			<div class="convert-dialog-header">
				<h2 class="convert-dialog-title">Import your resume</h2>
				<button
					class="convert-dialog-close"
					aria-label="Close"
					@click="handleClose"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M18 6 6 18" />
						<path d="m6 6 12 12" />
					</svg>
				</button>
			</div>

			<div class="convert-dialog-body">
				<DropZone v-if="state === 'drop'" @drop="handleFileDrop" @rejected="handleRejected" />

				<div v-else-if="state === 'processing'" class="convert-processing">
					<div class="convert-spinner" />
					<p
						:key="processingMessageIndex"
						class="convert-processing-text"
					>
						{{ processingMessages[processingMessageIndex] }}
					</p>
				</div>

				<MarkdownPreview
					v-else-if="state === 'preview'"
					:markdown="markdown"
					@back="handleBack"
				/>

				<div v-else-if="state === 'error'" class="convert-error">
					<div class="convert-error-icon">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="48"
							height="48"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<circle cx="12" cy="12" r="10" />
							<line x1="12" y1="8" x2="12" y2="12" />
							<line x1="12" y1="16" x2="12.01" y2="16" />
						</svg>
					</div>
					<p class="convert-error-message">{{ errorMessage }}</p>
					<button class="convert-retry-btn" @click="handleRetry">
						Try again
					</button>
				</div>
				<div v-show="state === 'drop'" ref="turnstileRef" class="turnstile-container" />
			</div>
			</div>
		</dialog>
	</Teleport>
</template>

<style>
.convert-dialog {
	position: fixed;
	inset: 0;
	z-index: 100;
	width: 100%;
	max-width: 680px;
	max-height: min(90vh, 720px);
	margin: auto;
	padding: 0;
	border: 1px solid var(--vp-c-divider);
	border-radius: 12px;
	background-color: var(--vp-c-bg);
	color: var(--vp-c-text-1);
	box-shadow:
		0 25px 50px -12px rgba(0, 0, 0, 0.25),
		0 0 0 1px rgba(0, 0, 0, 0.05);
}

.convert-dialog::backdrop {
	background: rgba(0, 0, 0, 0.5);
	backdrop-filter: blur(4px);
}

.convert-dialog[open] {
	display: flex;
	flex-direction: column;
	animation: dialog-in 0.2s ease-out;
}

@keyframes dialog-in {
	from {
		opacity: 0;
		transform: scale(0.96) translateY(8px);
	}
	to {
		opacity: 1;
		transform: scale(1) translateY(0);
	}
}

.convert-dialog-inner {
	display: flex;
	flex-direction: column;
}

.convert-dialog-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0.25rem 1rem;
	border-bottom: 1px solid var(--vp-c-divider);
	flex-shrink: 0;
}

.convert-dialog-title {
	margin: 0;
	font-size: 0.9rem;
	font-weight: 600;
	color: var(--vp-c-text-1);
	border: none !important;
}

.convert-dialog-close {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	border: none;
	border-radius: 16px;
	background: transparent;
	color: var(--vp-c-text-2);
	cursor: pointer;
	transition: all 0.15s ease;
}

.convert-dialog-close:hover {
	background-color: var(--vp-c-bg-soft);
	color: var(--vp-c-text-1);
}

.convert-dialog-body {
	flex: 1;
	min-height: 0;
	padding: 1.15rem;
	overflow: auto;
}

.turnstile-container {
	display: flex;
	justify-content: center;
	min-height: 0;
}

/* Processing state */
.convert-processing {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 1.25rem;
	min-height: 280px;
}

.convert-spinner {
	width: 40px;
	height: 40px;
	border: 3px solid var(--vp-c-divider);
	border-top-color: var(--vp-c-text-1);
	border-radius: 50%;
	animation: spin 0.8s linear infinite;
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}

.convert-processing-text {
	margin: 0;
	min-height: 1.5em;
	font-size: 0.9375rem;
	color: var(--vp-c-text-2);
	animation: convert-fade-in-up 0.5s ease-out;
}

@keyframes convert-fade-in-up {
	from {
		opacity: 0;
		transform: translateY(10px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

/* Error state */
.convert-error {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 1rem;
	min-height: 280px;
	text-align: center;
}

.convert-error-icon {
	color: var(--vp-c-danger-1, #e53e3e);
}

.convert-error-message {
	margin: 0;
	font-size: 0.9375rem;
	color: var(--vp-c-text-2);
	max-width: 400px;
}

.convert-retry-btn {
	display: inline-flex;
	align-items: center;
	gap: 0.375rem;
	padding: 0.5rem 1.25rem;
	border: 1px solid var(--vp-c-divider);
	border-radius: 8px;
	background-color: var(--vp-c-bg-soft);
	color: var(--vp-c-text-1);
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.15s ease;
}

.convert-retry-btn:hover {
	background-color: var(--vp-c-bg-mute);
}

@media (max-width: 640px) {
	.convert-dialog {
		max-width: calc(100% - 1rem);
		max-height: calc(100vh - 2rem);
	}

	.convert-dialog-body {
		padding: 1rem;
	}
}
</style>
