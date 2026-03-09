<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'

const props = withDefaults(
	defineProps<{
		squareSize?: number
		gridGap?: number
		flickerChance?: number
		color?: string
		maxOpacity?: number
		text?: string
		fontSize?: number
		fontWeight?: number | string
	}>(),
	{
		squareSize: 3,
		gridGap: 3,
		flickerChance: 0.2,
		color: '#6B7280',
		maxOpacity: 0.3,
		text: '',
		fontSize: 90,
		fontWeight: 600,
	},
)

const containerRef = ref<HTMLDivElement>()
const canvasRef = ref<HTMLCanvasElement>()
const canvasWidth = ref(0)
const canvasHeight = ref(0)

function hexToRgba(hex: string, opacity: number): string {
	const h = hex.replace('#', '')
	const r = parseInt(h.substring(0, 2), 16)
	const g = parseInt(h.substring(2, 4), 16)
	const b = parseInt(h.substring(4, 6), 16)
	return `rgba(${r},${g},${b},${opacity})`
}

const rgbBase = computed(() => {
	const h = props.color.replace('#', '')
	const r = parseInt(h.substring(0, 2), 16)
	const g = parseInt(h.substring(2, 4), 16)
	const b = parseInt(h.substring(4, 6), 16)
	return { r, g, b }
})

let animationId = 0
let squares: Float32Array
let cols = 0
let rows = 0
let dpr = 1
let isInView = false

function setup() {
	const canvas = canvasRef.value
	const container = containerRef.value
	if (!canvas || !container) return

	const w = container.clientWidth
	const h = container.clientHeight
	dpr = window.devicePixelRatio || 1

	canvas.width = w * dpr
	canvas.height = h * dpr
	canvasWidth.value = w
	canvasHeight.value = h

	cols = Math.ceil(w / (props.squareSize + props.gridGap))
	rows = Math.ceil(h / (props.squareSize + props.gridGap))

	squares = new Float32Array(cols * rows)
	for (let i = 0; i < squares.length; i++) {
		squares[i] = Math.random() * props.maxOpacity
	}
}

function draw(ctx: CanvasRenderingContext2D) {
	const canvas = canvasRef.value
	if (!canvas) return

	const w = canvas.width
	const h = canvas.height

	ctx.clearRect(0, 0, w, h)

	let maskCanvas: HTMLCanvasElement | null = null
	let maskCtx: CanvasRenderingContext2D | null = null

	if (props.text) {
		maskCanvas = document.createElement('canvas')
		maskCanvas.width = w
		maskCanvas.height = h
		maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true })
		if (maskCtx) {
			maskCtx.save()
			maskCtx.scale(dpr, dpr)
			maskCtx.fillStyle = 'white'
			maskCtx.font = `${props.fontWeight} ${props.fontSize}px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
			maskCtx.textAlign = 'center'
			maskCtx.textBaseline = 'middle'
			maskCtx.fillText(props.text, w / (2 * dpr), h / (2 * dpr))
			maskCtx.restore()
		}
	}

	const { r, g, b } = rgbBase.value
	const sqDpr = props.squareSize * dpr
	const stepDpr = (props.squareSize + props.gridGap) * dpr

	for (let i = 0; i < cols; i++) {
		for (let j = 0; j < rows; j++) {
			const x = i * stepDpr
			const y = j * stepDpr

			let opacity = squares[i * rows + j]

			if (maskCtx) {
				const data = maskCtx.getImageData(x, y, sqDpr, sqDpr).data
				let hasText = false
				for (let k = 0; k < data.length; k += 4) {
					if (data[k] > 0) {
						hasText = true
						break
					}
				}
				if (hasText) {
					opacity = Math.min(1, opacity * 3 + 0.4)
				}
			}

			ctx.fillStyle = `rgba(${r},${g},${b},${opacity})`
			ctx.fillRect(x, y, sqDpr, sqDpr)
		}
	}
}

function animate(ctx: CanvasRenderingContext2D, lastTime: number) {
	if (!isInView) return

	const now = performance.now()
	const dt = (now - lastTime) / 1000

	for (let i = 0; i < squares.length; i++) {
		if (Math.random() < props.flickerChance * dt) {
			squares[i] = Math.random() * props.maxOpacity
		}
	}

	draw(ctx)
	animationId = requestAnimationFrame(() => animate(ctx, now))
}

let resizeObserver: ResizeObserver | null = null
let intersectionObserver: IntersectionObserver | null = null

onMounted(() => {
	const canvas = canvasRef.value
	const container = containerRef.value
	if (!canvas || !container) return

	const ctx = canvas.getContext('2d')
	if (!ctx) return

	setup()

	resizeObserver = new ResizeObserver(() => {
		setup()
		draw(ctx)
	})
	resizeObserver.observe(container)

	intersectionObserver = new IntersectionObserver(
		([entry]) => {
			isInView = entry.isIntersecting
			if (isInView) {
				animationId = requestAnimationFrame(() =>
					animate(ctx, performance.now()),
				)
			}
		},
		{ threshold: 0 },
	)
	intersectionObserver.observe(canvas)
})

onUnmounted(() => {
	cancelAnimationFrame(animationId)
	resizeObserver?.disconnect()
	intersectionObserver?.disconnect()
})
</script>

<template>
	<div ref="containerRef" class="flickering-grid">
		<canvas
			ref="canvasRef"
			class="flickering-canvas"
			:style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
		/>
	</div>
</template>

<style scoped>
.flickering-grid {
	width: 100%;
	height: 100%;
}

.flickering-canvas {
	pointer-events: none;
}
</style>
