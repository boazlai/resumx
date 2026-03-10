<script setup lang="ts">
/// <reference types="vite/client" />
import { ref, computed } from 'vue'
import emojiData from 'markdown-it-emoji/lib/data/full.mjs'

const icons = import.meta.glob('../../../assets/icons/*.svg', {
	eager: true,
	import: 'default',
}) as Record<string, string>

const iconEntries = Object.entries(icons)
	.map(([path, url]) => {
		const slug = path
			.split('/')
			.pop()!
			.replace(/\.svg$/, '')
		return { slug, url }
	})
	.sort((a, b) => a.slug.localeCompare(b.slug))

const iconSlugs = new Set(iconEntries.map(e => e.slug))

const emojiEntries = Object.entries(emojiData as Record<string, string>)
	.filter(([name]) => !iconSlugs.has(name))
	.map(([name, char]) => ({ slug: name, char }))
	.sort((a, b) => a.slug.localeCompare(b.slug))

type Tab = 'icons' | 'emoji'
const tab = ref<Tab>('icons')
const search = ref('')
const copied = ref<string | null>(null)

const filteredIcons = computed(() => {
	const q = search.value.toLowerCase().trim()
	if (!q) return iconEntries
	return iconEntries.filter(e => e.slug.includes(q))
})

const filteredEmoji = computed(() => {
	const q = search.value.toLowerCase().trim()
	if (!q) return emojiEntries
	return emojiEntries.filter(e => e.slug.includes(q))
})

const resultCount = computed(() =>
	tab.value === 'icons' ? filteredIcons.value.length : filteredEmoji.value.length,
)

function copy(slug: string) {
	navigator.clipboard.writeText(`:${slug}:`)
	copied.value = slug
	setTimeout(() => {
		if (copied.value === slug) copied.value = null
	}, 1500)
}
</script>

<template>
	<div class="icon-gallery">
		<div class="icon-gallery-search">
			<input
				v-model="search"
				type="text"
				:placeholder="tab === 'icons' ? 'Search icons...' : 'Search emoji...'"
				class="icon-gallery-input"
			/>
			<div class="icon-gallery-toggle">
				<button
					class="icon-gallery-toggle-btn"
					:class="{ active: tab === 'icons' }"
					@click="tab = 'icons'"
				>
					Icons
				</button>
				<button
					class="icon-gallery-toggle-btn"
					:class="{ active: tab === 'emoji' }"
					@click="tab = 'emoji'"
				>
					Emoji
				</button>
			</div>
			<span class="icon-gallery-count">{{ resultCount }} {{ tab === 'icons' ? 'icons' : 'emoji' }}</span>
		</div>
		<div v-if="tab === 'icons'" class="icon-gallery-grid">
			<button
				v-for="icon in filteredIcons"
				:key="icon.slug"
				class="icon-gallery-item"
				:title="`:${icon.slug}: — click to copy`"
				@click="copy(icon.slug)"
			>
				<img :src="icon.url" :alt="icon.slug" class="icon-gallery-img" />
				<span class="icon-gallery-slug">
					{{ copied === icon.slug ? 'Copied!' : `:${icon.slug}:` }}
				</span>
			</button>
		</div>
		<div v-else class="icon-gallery-grid">
			<button
				v-for="emoji in filteredEmoji"
				:key="emoji.slug"
				class="icon-gallery-item"
				:title="`:${emoji.slug}: — click to copy`"
				@click="copy(emoji.slug)"
			>
				<span class="icon-gallery-emoji">{{ emoji.char }}</span>
				<span class="icon-gallery-slug">
					{{ copied === emoji.slug ? 'Copied!' : `:${emoji.slug}:` }}
				</span>
			</button>
		</div>
		<p v-if="resultCount === 0" class="icon-gallery-empty">
			No {{ tab === 'icons' ? 'icons' : 'emoji' }} match "<strong>{{ search }}</strong>"
		</p>
	</div>
</template>

<style scoped>
.icon-gallery {
	margin-top: 16px;
}

.icon-gallery-search {
	display: flex;
	align-items: center;
	gap: 12px;
	margin-bottom: 16px;
}

.icon-gallery-input {
	flex: 1;
	padding: 8px 12px;
	border: 1px solid var(--vp-c-divider);
	border-radius: 8px;
	background: var(--vp-c-bg-soft);
	color: var(--vp-c-text-1);
	font-size: 14px;
	outline: none;
	transition: border-color 0.2s;
}

.icon-gallery-input:focus {
	border-color: var(--vp-c-brand-1);
}

.icon-gallery-input::placeholder {
	color: var(--vp-c-text-3);
}

.icon-gallery-count {
	font-size: 13px;
	color: var(--vp-c-text-3);
	white-space: nowrap;
	min-width: 8ch;
	text-align: right;
}

@media (max-width: 480px) {
	.icon-gallery-count {
		display: none;
	}
}

.icon-gallery-toggle {
	display: flex;
	border: 1px solid var(--vp-c-divider);
	border-radius: 6px;
	overflow: hidden;
}

.icon-gallery-toggle-btn {
	padding: 4px 10px;
	border: none;
	background: none;
	color: var(--vp-c-text-3);
	opacity: 0.5;
	font-size: 12px;
	cursor: pointer;
	transition: all 0.15s;
}

.icon-gallery-toggle-btn:not(:last-child) {
	border-right: 1px solid var(--vp-c-divider);
}

.icon-gallery-toggle-btn:hover {
	color: var(--vp-c-text-1);
	opacity: 0.8;
}

.icon-gallery-toggle-btn.active {
	color: var(--vp-c-text-1);
	opacity: 1;
}

.icon-gallery-grid {
	display: grid;
	grid-template-columns: repeat(6, 1fr);
	gap: 4px;
	max-height: 400px;
	overflow-y: auto;
}

.icon-gallery-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 6px;
	padding: 12px 4px 8px;
	border: 1px solid transparent;
	border-radius: 8px;
	background: none;
	cursor: pointer;
	transition: all 0.15s;
}

.icon-gallery-item:hover {
	background: var(--vp-c-bg-soft);
	border-color: var(--vp-c-divider);
}

.icon-gallery-item:active {
	transform: scale(0.96);
}

.icon-gallery-img {
	max-width: 37px;
	height: 28px;
	object-fit: contain;
}

.icon-gallery-slug {
	font-size: 11px;
	color: var(--vp-c-text-2);
	text-align: center;
	word-break: break-all;
	line-height: 1.3;
}

.icon-gallery-emoji {
	font-size: 24px;
	line-height: 28px;
	height: 28px;
}

.icon-gallery-empty {
	text-align: center;
	color: var(--vp-c-text-3);
	padding: 32px 0;
}
</style>
