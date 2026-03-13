<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { data as playgroundData } from './playground.data'

const DEFAULT_CONTENT = playgroundData.markdown

const A4_WIDTH_PX = 794
const A4_HEIGHT_PX = 1123

const markdown = ref(DEFAULT_CONTENT)
const previewHtml = ref('')
const warnings = ref<string[]>([])
const error = ref('')
const loading = ref(false)
const iframeRef = ref<HTMLIFrameElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
const scale = ref(1)
const iframeHeight = ref(A4_HEIGHT_PX)
const highlightedCode = ref('')

interface ShikiHighlighter {
	codeToHtml(
		code: string,
		options: {
			lang: string
			themes: { light: string; dark: string }
		},
	): string
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null
let pendingRender = false
let rendering = false
let resizeObserver: ResizeObserver | null = null
let highlighter: ShikiHighlighter | null = null

function updateHighlight(): void {
	if (!highlighter) return
	highlightedCode.value = highlighter.codeToHtml(markdown.value, {
		lang: 'markdown',
		themes: { light: 'github-light', dark: 'github-dark-dimmed' },
	})
}

function updateScale(): void {
	const container = containerRef.value
	if (!container) return
	const { height } = container.getBoundingClientRect()
	scale.value = Math.min(1, height / iframeHeight.value)
}

const previewColWidth = computed(() => Math.ceil(A4_WIDTH_PX * scale.value) + 2)

function measureContentHeight(): void {
	const iframe = iframeRef.value
	if (!iframe) return
	const doc = iframe.contentDocument
	if (!doc) return
	const contentH = doc.documentElement.scrollHeight
	iframeHeight.value = Math.max(contentH, A4_HEIGHT_PX)
}

function applyPreview(html: string, warns: string[]): void {
	previewHtml.value = html
	warnings.value = warns
	writeToIframe(html)
	measureContentHeight()
	updateScale()
}

async function renderPreview(): Promise<void> {
	if (rendering) {
		pendingRender = true
		return
	}

	if (markdown.value === DEFAULT_CONTENT && playgroundData.html) {
		applyPreview(playgroundData.html, [])
		return
	}

	rendering = true
	loading.value = true
	error.value = ''

	try {
		const res = await fetch('/api/preview', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ markdown: markdown.value }),
		})

		const data = (await res.json()) as {
			html?: string
			error?: string
			warnings?: string[]
		}

		if (!res.ok) {
			error.value = data.error ?? 'Preview failed'
			return
		}

		await nextTick()
		applyPreview(data.html ?? '', data.warnings ?? [])
	} catch {
		error.value = 'Failed to connect to preview server'
	} finally {
		loading.value = false
		rendering = false
		if (pendingRender) {
			pendingRender = false
			renderPreview()
		}
	}
}

function writeToIframe(html: string): void {
	const iframe = iframeRef.value
	if (!iframe) return
	const doc = iframe.contentDocument
	if (!doc) return
	doc.open()
	doc.write(html)
	doc.close()
}

function onInput(): void {
	updateHighlight()
	if (debounceTimer) clearTimeout(debounceTimer)
	debounceTimer = setTimeout(renderPreview, 150)
}

function handleTab(e: KeyboardEvent): void {
	if (e.key !== 'Tab') return
	e.preventDefault()
	const textarea = e.target as HTMLTextAreaElement
	const start = textarea.selectionStart
	const end = textarea.selectionEnd
	markdown.value =
		markdown.value.substring(0, start) + '  ' + markdown.value.substring(end)
	nextTick(() => {
		textarea.selectionStart = textarea.selectionEnd = start + 2
	})
}

function downloadMarkdown(): void {
	const blob = new Blob([markdown.value], { type: 'text/markdown' })
	const url = URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.href = url
	a.download = 'resume.md'
	a.click()
	URL.revokeObjectURL(url)
}

function reset(): void {
	markdown.value = DEFAULT_CONTENT
	updateHighlight()
	renderPreview()
}

onMounted(() => {
	resizeObserver = new ResizeObserver(() => updateScale())
	if (containerRef.value) resizeObserver.observe(containerRef.value)
	updateScale()
	renderPreview()
})

onUnmounted(() => {
	resizeObserver?.disconnect()
})
</script>

<template>
	<div class="playground">
		<div class="playground-header">
			<div class="header-left">
				<h1>Playground</h1>
				<p>
					Write Markdown, see your resume rendered live.
					<span class="hint-cli">
						For PDF export and page fitting,
						<a href="/guide/quick-start">install the CLI</a>.
					</span>
				</p>
			</div>
		<div class="header-actions">
			<button
				class="action-btn"
				@click="downloadMarkdown"
				title="Download as resume.md"
			>
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
					<polyline points="7 10 12 15 17 10" />
					<line x1="12" y1="15" x2="12" y2="3" />
				</svg>
				Download
			</button>
			<button class="action-btn" @click="reset" title="Reset to default">
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
					<path d="M3 3v5h5" />
				</svg>
				Reset
			</button>
		</div>
		</div>

		<div v-if="warnings.length > 0" class="warnings">
			<span v-for="(w, i) in warnings" :key="i" class="warning-item">{{
				w
			}}</span>
		</div>

		<div v-if="error" class="error-bar">{{ error }}</div>

		<div
			class="editor-layout"
			:style="{ '--preview-w': previewColWidth + 'px' }"
		>
			<div class="editor-pane">
				<div class="pane-label">
					<span>Markdown</span>
					<span v-if="loading" class="loading-dot" />
				</div>
				<textarea
					v-model="markdown"
					class="editor-textarea"
					spellcheck="false"
					autocomplete="off"
					autocorrect="off"
					autocapitalize="off"
					@input="onInput"
					@keydown="handleTab"
				/>
			</div>

			<div class="preview-pane">
				<div class="pane-label">Preview</div>
				<div ref="containerRef" class="preview-container">
					<div
						class="preview-page"
						:style="{
							width: A4_WIDTH_PX * scale + 'px',
							height: iframeHeight * scale + 'px',
						}"
					>
						<iframe
							ref="iframeRef"
							class="preview-iframe"
							:style="{
								width: A4_WIDTH_PX + 'px',
								height: iframeHeight + 'px',
								transform: `scale(${scale})`,
							}"
							sandbox="allow-same-origin allow-scripts"
							title="Resume preview"
						/>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
.playground {
	margin: 0 auto;
	padding: 24px 12px;
	max-width: 1400px;
	width: calc(100% - 38px);
}

.playground-header {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 16px;
	margin-bottom: 16px;
}

.header-left h1 {
	font-size: 1.5rem;
	font-weight: 600;
	margin: 0 0 4px;
	line-height: 1.3;
}

.header-left p {
	margin: 0;
	font-size: 0.9rem;
	color: var(--vp-c-text-2);
}

.hint-cli a {
	color: var(--vp-c-brand-1) !important;
	text-decoration: none !important;
}

.hint-cli a:hover {
	text-decoration: underline !important;
}

.header-actions {
	display: flex;
	gap: 8px;
	flex-shrink: 0;
}

.action-btn {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 6px 14px;
	font-size: 13px;
	font-weight: 500;
	color: var(--vp-c-text-2);
	background: var(--vp-c-bg-soft);
	border: 1px solid var(--vp-c-divider);
	border-radius: 6px;
	cursor: pointer;
	flex-shrink: 0;
	transition: all 0.15s;
}

.action-btn:hover {
	color: var(--vp-c-text-1);
	border-color: var(--vp-c-text-3);
}

.warnings {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	margin-bottom: 12px;
}

.warning-item {
	font-size: 12px;
	color: var(--vp-c-yellow-1);
	background: var(--vp-c-yellow-soft);
	padding: 4px 10px;
	border-radius: 4px;
}

.error-bar {
	font-size: 13px;
	color: var(--vp-c-red-1);
	background: var(--vp-c-red-soft);
	padding: 8px 12px;
	border-radius: 6px;
	margin-bottom: 12px;
}

.editor-layout {
	display: grid;
	grid-template-columns: 1fr var(--preview-w, 1fr);
	gap: 16px;
	height: calc(100vh - 200px);
	min-height: 500px;
}

.editor-pane,
.preview-pane {
	display: flex;
	flex-direction: column;
	min-height: 0;
}

.pane-label {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 12px;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	color: var(--vp-c-text-3);
	padding: 0 2px 8px;
}

.loading-dot {
	width: 6px;
	height: 6px;
	border-radius: 50%;
	background: var(--vp-c-brand-1);
	animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
	0%,
	100% {
		opacity: 0.3;
	}
	50% {
		opacity: 1;
	}
}

.editor-textarea {
	flex: 1;
	width: 100%;
	resize: none;
	font-family: var(--vp-font-family-mono);
	font-size: 13px;
	line-height: 1.65;
	tab-size: 2;
	color: var(--vp-c-text-1);
	background: var(--vp-code-block-bg);
	border: 1px solid var(--vp-c-divider);
	border-radius: 8px;
	padding: 16px 18px;
	outline: none;
	transition: border-color 0.15s;
}

.preview-container {
	flex: 1;
	min-height: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	border: 1px solid var(--vp-c-divider);
	border-radius: 8px;
	overflow: hidden;
	background: var(--vp-c-bg-soft);
}

.preview-page {
	overflow: hidden;
}

.preview-iframe {
	border: none;
	background: #fff;
	display: block;
	transform-origin: top left;
}

@media (max-width: 1024px) {
	.editor-layout {
		grid-template-columns: 1fr;
		height: auto;
	}

	.editor-pane {
		height: 45vh;
		min-height: 300px;
	}

	.preview-pane {
		height: 50vh;
		min-height: 350px;
	}
}
</style>
