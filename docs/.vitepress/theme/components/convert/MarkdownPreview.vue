<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
	markdown: string
}>()

const emit = defineEmits<{
	back: []
}>()

const copied = ref(false)

async function copyToClipboard() {
	await navigator.clipboard.writeText(props.markdown)
	copied.value = true
	setTimeout(() => {
		copied.value = false
	}, 2000)
}

function downloadMarkdown() {
	const blob = new Blob([props.markdown], { type: 'text/markdown' })
	const url = URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.href = url
	a.download = 'resume.md'
	a.click()
	URL.revokeObjectURL(url)
}
</script>

<template>
	<div class="preview">
		<div class="preview-actions">
			<button class="preview-btn preview-btn--back" @click="emit('back')">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="m12 19-7-7 7-7" />
					<path d="M19 12H5" />
				</svg>
				Back
			</button>
			<div class="preview-actions-right">
				<button class="preview-btn" @click="copyToClipboard">
					{{ copied ? 'Copied!' : 'Copy' }}
				</button>
				<button class="preview-btn" @click="downloadMarkdown">
					Download .md
				</button>
			</div>
		</div>
		<pre class="preview-code"><code>{{ markdown }}</code></pre>
		<p class="preview-next">
			What's next?
			<a href="/guide/quick-start">Get started with Resumx</a>
		</p>
	</div>
</template>

<style scoped>
.preview {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.preview-actions {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.5rem;
	flex-wrap: wrap;
}

.preview-actions-right {
	display: flex;
	gap: 0.5rem;
}

.preview-btn {
	display: inline-flex;
	align-items: center;
	gap: 0.375rem;
	padding: 0.4375rem 1rem;
	border: 1px solid var(--vp-c-divider);
	border-radius: 8px;
	background-color: var(--vp-c-bg-soft);
	color: var(--vp-c-text-1);
	font-size: 0.8125rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.15s ease;
}

.preview-btn:hover {
	background-color: var(--vp-c-bg-mute);
}

.preview-btn--back {
	padding-left: 0.625rem;
}

.preview-code {
	margin: 0;
	padding: 1.25rem;
	border-radius: 8px;
	background-color: var(--vp-c-bg-soft);
	border: 1px solid var(--vp-c-divider);
	font-size: 0.8125rem;
	line-height: 1.7;
	overflow-x: auto;
	white-space: pre-wrap;
	word-break: break-word;
	max-height: 400px;
	overflow-y: auto;
}

.preview-next {
	margin: 0;
	font-size: 0.8125rem;
	color: var(--vp-c-text-3);
	text-align: center;
}

.preview-next a {
	color: var(--vp-c-brand-1);
	text-decoration: underline;
	text-underline-offset: 2px;
}

.preview-next a:hover {
	color: var(--vp-c-brand-2);
}
</style>
