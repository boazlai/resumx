<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

type LineType = 'prompt' | 'output' | 'success' | 'blank' | 'check' | 'done'

interface TermLine {
	type: LineType
	text: string
	delay: number
	/** Role names to highlight in prompt (after --for). */
	roles?: string[]
	/** Single role to highlight in check line (inside brackets). */
	role?: string
}

function lineSegments(line: TermLine): { text: string; highlight: boolean }[] {
	if (line.type === 'prompt' && line.roles?.length) {
		const parts: { text: string; highlight: boolean }[] = []
		let rest = line.text
		for (let i = 0; i < line.roles.length; i++) {
			const r = line.roles[i]
			const idx = rest.indexOf(r)
			if (idx === -1) continue
			if (idx > 0) parts.push({ text: rest.slice(0, idx), highlight: false })
			parts.push({ text: r, highlight: true })
			rest = rest.slice(idx + r.length)
		}
		if (rest) parts.push({ text: rest, highlight: false })
		return parts.length ? parts : [{ text: line.text, highlight: false }]
	}
	if (line.type === 'check' && line.role) {
		const before = line.text.slice(0, line.text.indexOf(line.role))
		const after = line.text.slice(line.text.indexOf(line.role) + line.role.length)
		return [
			{ text: before, highlight: false },
			{ text: line.role, highlight: true },
			{ text: after, highlight: false },
		]
	}
	return [{ text: line.text, highlight: false }]
}

const phases: TermLine[][] = [
	[
		{
			type: 'prompt',
			text: '> resumx resume.md --for stripe-infra,vercel-swe,startup-cto',
			delay: 0,
			roles: ['stripe-infra', 'vercel-swe', 'startup-cto'],
		},
		{ type: 'success', text: 'No issues found', delay: 180 },
		{ type: 'output', text: 'Building resume from: resume.md', delay: 320 },
		{ type: 'blank', text: '', delay: 360 },
		{
			type: 'check',
			text: '    [stripe-infra] PDF \u2713',
			delay: 520,
			role: 'stripe-infra',
		},
		{
			type: 'check',
			text: '    [vercel-swe]   PDF \u2713',
			delay: 720,
			role: 'vercel-swe',
		},
		{
			type: 'check',
			text: '    [startup-cto]  PDF \u2713',
			delay: 920,
			role: 'startup-cto',
		},
		{ type: 'blank', text: '', delay: 960 },
		{
			type: 'done',
			text: 'Done! 3 files \u2192 output/ (Time: 1.05s)',
			delay: 1080,
		},
		{ type: 'prompt', text: '>', delay: 1280 },
	],
	[
		{
			type: 'prompt',
			text: '> resumx resume.md --for vercel-swe',
			delay: 0,
			roles: ['vercel-swe'],
		},
		{ type: 'success', text: 'No issues found', delay: 180 },
		{ type: 'output', text: 'Building resume from: resume.md', delay: 320 },
		{ type: 'blank', text: '', delay: 360 },
		{
			type: 'check',
			text: '    [vercel-swe] PDF \u2713',
			delay: 520,
			role: 'vercel-swe',
		},
		{ type: 'blank', text: '', delay: 560 },
		{
			type: 'done',
			text: 'Done! 1 file \u2192 output/ (Time: 879ms)',
			delay: 680,
		},
		{ type: 'prompt', text: '>', delay: 880 },
	],
	[
		{
			type: 'prompt',
			text: '> resumx resume.md --for stripe-infra,startup-cto',
			delay: 0,
			roles: ['stripe-infra', 'startup-cto'],
		},
		{ type: 'success', text: 'No issues found', delay: 180 },
		{ type: 'output', text: 'Building resume from: resume.md', delay: 320 },
		{ type: 'blank', text: '', delay: 360 },
		{
			type: 'check',
			text: '    [stripe-infra] PDF \u2713',
			delay: 520,
			role: 'stripe-infra',
		},
		{
			type: 'check',
			text: '    [startup-cto]  PDF \u2713',
			delay: 720,
			role: 'startup-cto',
		},
		{ type: 'blank', text: '', delay: 760 },
		{
			type: 'done',
			text: 'Done! 2 files \u2192 output/ (Time: 1.32s)',
			delay: 880,
		},
		{ type: 'prompt', text: '>', delay: 1080 },
	],
]

const PHASE_MS = 3500
const active = ref(0)
let flipId: ReturnType<typeof setInterval> | null = null

onMounted(() => {
	flipId = setInterval(() => {
		active.value = (active.value + 1) % phases.length
	}, PHASE_MS)
})

onUnmounted(() => {
	if (flipId != null) clearInterval(flipId)
})
</script>

<template>
	<div class="multi-target-demo">
		<div class="mt-terminal">
			<div class="mt-chrome">
				<span class="mt-dot mt-dot--red" />
				<span class="mt-dot mt-dot--yellow" />
				<span class="mt-dot mt-dot--green" />
			</div>
			<div class="mt-body">
				<div
					v-for="(phase, pi) in phases"
					:key="pi"
					class="mt-frame"
					:class="{ 'mt-frame--active': pi === active }"
				>
					<div
						v-for="(line, li) in phase"
						:key="li"
						class="mt-line"
						:class="`mt-line--${line.type}`"
						:style="{
							transitionDelay:
								pi === active ? `${line.delay}ms` : '0ms',
						}"
					>
						<template
							v-for="(seg, si) in lineSegments(line)"
							:key="si"
						>
							<span
								v-if="seg.highlight"
								class="mt-role"
								>{{ seg.text }}</span
							>
							<template v-else>{{ seg.text }}</template>
						</template>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
.multi-target-demo {
	max-width: 40rem;
	height: 100%;
	display: flex;
	flex-direction: column;
}

/* ---- Terminal chrome ---- */
.mt-terminal {
	border-radius: 10px;
	border: 1px solid var(--vp-c-divider);
	overflow: hidden;
	background: var(--vp-code-block-bg);
	flex: 1;
	display: flex;
	flex-direction: column;
}

.mt-chrome {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 10px 14px;
	border-bottom: 1px solid var(--vp-c-divider);
}

.mt-dot {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	flex-shrink: 0;
}

.mt-dot--red {
	background: #ff5f57;
}
.mt-dot--yellow {
	background: #febc2e;
}
.mt-dot--green {
	background: #28c840;
}

/* ---- Terminal body ---- */
.mt-body {
	position: relative;
	font-family: var(--vp-font-family-mono);
	font-size: 0.8125rem;
	line-height: 1.7;
	min-height: 16rem;
	flex: 1;
	overflow: hidden;
}

/* ---- Crossfade frames ---- */
.mt-frame {
	position: absolute;
	inset: 0;
	padding: 14px;
	opacity: 0;
	transition: opacity 0.4s ease;
	pointer-events: none;
}

.mt-frame--active {
	opacity: 1;
	pointer-events: auto;
}

/* ---- Line reveal (staggered via inline transition-delay) ---- */
.mt-line {
	white-space: nowrap;
	opacity: 0;
	transform: translateY(2px);
	transition:
		opacity 0.25s ease,
		transform 0.25s ease;
}

.mt-frame--active .mt-line {
	opacity: 1;
	transform: translateY(0);
}

/* ---- Line colors ---- */
.mt-line--prompt {
	color: var(--vp-c-text-1);
}

.mt-line--output {
	color: var(--vp-c-text-2);
}

.mt-line--success {
	color: #0f766e;
}

.mt-line--check {
	color: var(--vp-c-text-1);
}

.mt-role {
	color: var(--vp-c-brand-1);
	background: var(--vp-c-brand-soft);
	border-radius: 3px;
	padding: 0 2px;
	font-weight: 500;
}

.mt-line--done {
	color: #0f766e;
	font-weight: 600;
}

.mt-line--blank {
	height: 1.7em;
}

/* ---- Dark mode overrides ---- */
.dark .mt-line--success {
	color: #2dd4bf;
}

.dark .mt-line--done {
	color: #2dd4bf;
}
</style>
