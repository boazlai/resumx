<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
	drop: [file: File]
	rejected: [fileName: string]
}>()

const ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.tex', '.json', '.yaml', '.yml']
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement>()

function isAcceptedFile(file: File): boolean {
	const name = file.name.toLowerCase()
	return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext))
}

function handleDragOver(e: DragEvent) {
	e.preventDefault()
	isDragging.value = true
}

function handleDragLeave() {
	isDragging.value = false
}

function handleDrop(e: DragEvent) {
	e.preventDefault()
	isDragging.value = false
	const file = e.dataTransfer?.files[0]
	if (file && isAcceptedFile(file)) {
		emit('drop', file)
	} else if (file) {
		emit('rejected', file.name)
	}
}

function handleFileSelect(e: Event) {
	const input = e.target as HTMLInputElement
	const file = input.files?.[0]
	if (file) {
		emit('drop', file)
	}
	input.value = ''
}

function openFilePicker() {
	fileInput.value?.click()
}
</script>

<template>
	<div
		class="drop-zone"
		:class="{ 'drop-zone--active': isDragging }"
		@dragover="handleDragOver"
		@dragleave="handleDragLeave"
		@drop="handleDrop"
		@click="openFilePicker"
	>
		<input
			ref="fileInput"
			type="file"
			:accept="ACCEPTED_EXTENSIONS.join(',')"
			class="drop-zone-input"
			@change="handleFileSelect"
		/>

		<div class="drop-zone-content">
			<div class="drop-zone-icon">
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
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
					<polyline points="17 8 12 3 7 8" />
					<line x1="12" y1="3" x2="12" y2="15" />
				</svg>
			</div>
			<p class="drop-zone-text">
				<strong>Drop your resume here</strong> or click to browse
			</p>
			<p class="drop-zone-formats">
				PDF, DOCX, LaTeX, JSON Resume, RenderCV YAML
			</p>
		</div>
	</div>
</template>

<style scoped>
.drop-zone {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 280px;
	border: 1px dashed var(--vp-c-divider);
	border-radius: 6px;
	cursor: pointer;
	transition: all 0.2s ease;
}

.drop-zone:hover,
.drop-zone--active {
	border-color: var(--vp-c-default-2);
	background-color: var(--vp-c-default-soft);
}

.drop-zone-input {
	display: none;
}

.drop-zone-content {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.75rem;
	text-align: center;
	padding: 2rem;
}

.drop-zone-icon {
	color: var(--vp-c-text-3);
	transition: color 0.2s ease;
}

.drop-zone:hover .drop-zone-icon,
.drop-zone--active .drop-zone-icon {
	color: var(--vp-c-text-2);
}

.drop-zone-text {
	margin: 0;
	font-size: 0.9375rem;
	color: var(--vp-c-text-2);
}

.drop-zone-formats {
	margin: 0;
	font-size: 0.8125rem;
	color: var(--vp-c-text-3);
}
</style>
