<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		visible: boolean;
		x: number;
		y: number;
		maxX?: number;
		minY?: number;
		maxWidth?: number;
		showBottomArrow?: boolean;
		bottomArrowX?: number;
		children?: Snippet;
	}

	const {
		visible,
		x,
		y,
		maxX = Number.POSITIVE_INFINITY,
		minY = 0,
		maxWidth = 170,
		showBottomArrow = false,
		bottomArrowX = 0,
		children
	}: Props = $props();

	const clampedX = $derived(Math.min(x, maxX));
	const clampedY = $derived(Math.max(y, minY));
</script>

{#if visible}
	<div
		class="chart-tooltip"
		class:chart-tooltip-with-bottom-arrow={showBottomArrow}
		style={`left: ${clampedX}px; top: ${clampedY}px; max-width: ${maxWidth}px; --bottom-arrow-x: ${bottomArrowX}px;`}
	>
		{@render children?.()}
	</div>
{/if}

<style>
	.chart-tooltip {
		position: absolute;
		pointer-events: none;
		z-index: 10;
		padding: 0.5rem 0.6rem;
		border-radius: 6px;
		font-size: 12px;
		line-height: 1.3;
		color: #111;
		background: #f8f9fb;
		border: 1px solid #cfd4dc;
		box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
	}

	.chart-tooltip-with-bottom-arrow::before,
	.chart-tooltip-with-bottom-arrow::after {
		content: '';
		position: absolute;
		left: var(--bottom-arrow-x);
		transform: translateX(-50%);
		border-right: 7px solid transparent;
		border-left: 7px solid transparent;
	}

	.chart-tooltip-with-bottom-arrow::before {
		bottom: -7px;
		border-top: 7px solid #cfd4dc;
	}

	.chart-tooltip-with-bottom-arrow::after {
		bottom: -6px;
		border-top: 7px solid #f8f9fb;
	}
</style>
