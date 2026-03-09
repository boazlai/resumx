<script setup lang="ts">
interface Props {
	gap?: number
	duration?: number
	reverse?: boolean
}

withDefaults(defineProps<Props>(), {
	gap: 16,
	duration: 25,
	reverse: false,
})
</script>

<template>
	<div class="infinite-slider">
		<div
			class="infinite-slider-track"
			:class="{ 'infinite-slider-track--reverse': reverse }"
			:style="{
				animationDuration: `${duration}s`,
			}"
		>
			<div
				class="infinite-slider-copy"
				:style="{ gap: `${gap}px`, paddingRight: `${gap}px` }"
			>
				<slot />
			</div>
			<div
				class="infinite-slider-copy"
				aria-hidden="true"
				:style="{ gap: `${gap}px`, paddingRight: `${gap}px` }"
			>
				<slot />
			</div>
		</div>
	</div>
</template>

<style scoped>
.infinite-slider {
	overflow: hidden;
}

.infinite-slider-track {
	display: flex;
	width: max-content;
	animation: scroll linear infinite;
}

.infinite-slider-track--reverse {
	animation-direction: reverse;
}

.infinite-slider-copy {
	display: flex;
	flex-shrink: 0;
}

@keyframes scroll {
	from {
		transform: translateX(0);
	}
	to {
		transform: translateX(-50%);
	}
}
</style>
