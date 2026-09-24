<script lang="ts">
	import { scaleLinear } from 'd3-scale';
	import { formatTwoDecimals } from '$lib/util/format.js';
	import ChartTooltip from './ChartTooltip.svelte';

	export interface LineChartPoint {
		label: string;
		value: number;
	}

	interface Props {
		data: LineChartPoint[];
		title?: string;
		height?: number;
		width?: number;
		valueLabel?: string;
		lineColor?: string;
	}

	const {
		data = [],
		title,
		height = 280,
		width = 600,
		valueLabel = 'Value',
		lineColor = 'var(--money-green)'
	}: Props = $props();

	let containerWidth = $state(0);
	let containerHeight = $state(0);
	let hoveredIndex = $state<number | null>(null);
	let tooltipX = $state(0);
	let tooltipY = $state(0);

	const svgWidth = $derived(containerWidth > 0 ? containerWidth : width);
	const svgHeight = $derived(containerHeight > 0 ? containerHeight : height);
	const margin = { top: 20, right: 20, bottom: 40, left: 60 };
	const chartWidth = $derived(Math.max(svgWidth - margin.left - margin.right, 0));
	const chartHeight = $derived(Math.max(svgHeight - margin.top - margin.bottom, 0));

	const yValues = $derived(data.map((point) => point.value).filter((value) => !isNaN(value)));
	const yMinRaw = $derived(yValues.length === 0 ? 0 : Math.min(...yValues));
	const yMaxRaw = $derived(yValues.length === 0 ? 0 : Math.max(...yValues));
	const yPadding = $derived(yMaxRaw === yMinRaw ? 1 : (yMaxRaw - yMinRaw) * 0.08);
	const yMin = $derived(Math.max(0, yMinRaw - yPadding));
	const yMax = $derived(yMaxRaw + yPadding);

	const xScale = $derived(
		scaleLinear()
			.domain([0, Math.max(data.length - 1, 1)])
			.range([0, chartWidth])
	);
	const yScale = $derived(scaleLinear().domain([yMin, yMax]).nice().range([chartHeight, 0]));

	const points = $derived(
		data.map((point, i) => ({
			...point,
			x: margin.left + xScale(i),
			y: margin.top + yScale(point.value)
		}))
	);

	const linePath = $derived(
		points.length === 0
			? ''
			: points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ')
	);

	const yTicks = $derived(yScale.ticks(5));
	const hoveredPoint = $derived(
		hoveredIndex === null || hoveredIndex >= points.length ? null : points[hoveredIndex]
	);

	function handleChartPointerMove(event: PointerEvent): void {
		if (data.length === 0) return;

		const svgElement = (event.currentTarget as SVGRectElement).ownerSVGElement;
		if (!svgElement) return;

		const svgBounds = svgElement.getBoundingClientRect();
		const pointerX = ((event.clientX - svgBounds.left) / svgBounds.width) * svgWidth;
		const closestIndex = Math.min(
			data.length - 1,
			Math.max(0, Math.round(xScale.invert(pointerX - margin.left)))
		);

		hoveredIndex = closestIndex;
		tooltipX = event.clientX - svgBounds.left + 12;
		tooltipY = event.clientY - svgBounds.top - 12;
	}

	function handleChartPointerLeave(): void {
		hoveredIndex = null;
	}
</script>

<div class="chart-container">
	{#if title}
		<h3>{title}</h3>
	{/if}

	<div
		class="chart-area"
		bind:clientWidth={containerWidth}
		bind:clientHeight={containerHeight}
		style:height={`${height}px`}
	>
		<svg width={svgWidth} height={svgHeight}>
			<!-- Y axis -->
			<line
				x1={margin.left}
				y1={margin.top}
				x2={margin.left}
				y2={svgHeight - margin.bottom}
				stroke="black"
				stroke-width="1"
			/>

			<!-- X axis -->
			<line
				x1={margin.left}
				y1={svgHeight - margin.bottom}
				x2={svgWidth - margin.right}
				y2={svgHeight - margin.bottom}
				stroke="black"
				stroke-width="1"
			/>

			<!-- Y axis labels -->
			{#each yTicks as tick (tick)}
				{@const y = yScale(tick)}
				<text
					x={margin.left - 10}
					y={margin.top + y}
					text-anchor="end"
					dominant-baseline="middle"
					font-size="12"
				>
					{formatTwoDecimals(tick)}
				</text>
				<line
					x1={margin.left - 5}
					y1={margin.top + y}
					x2={margin.left}
					y2={margin.top + y}
					stroke="black"
					stroke-width="1"
				/>
			{/each}

			<!-- X axis labels -->
			{#each data as point, i (i)}
				<text
					x={margin.left + xScale(i)}
					y={svgHeight - margin.bottom + 20}
					text-anchor="middle"
					font-size="11"
				>
					{point.label}
				</text>
			{/each}

			{#if linePath}
				<path d={linePath} fill="none" stroke={lineColor} stroke-width="2.5" />
			{/if}

			{#each points as point, i (i)}
				<circle
					cx={point.x}
					cy={point.y}
					r="4"
					fill={lineColor}
					stroke="white"
					stroke-width="1.5"
					style="cursor: pointer;"
					role="img"
					aria-label={`${point.label}, ${valueLabel} ${formatTwoDecimals(point.value)}`}
				/>
			{/each}

			{#if hoveredPoint}
				<circle
					cx={hoveredPoint.x}
					cy={hoveredPoint.y}
					r="8"
					fill="white"
					stroke={lineColor}
					stroke-width="3"
				/>
				<circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="3.5" fill={lineColor} />
			{/if}

			<rect
				x={margin.left}
				y={margin.top}
				width={chartWidth}
				height={chartHeight}
				fill="transparent"
				role="presentation"
				style="cursor: crosshair;"
				onpointermove={handleChartPointerMove}
				onpointerleave={handleChartPointerLeave}
			/>
		</svg>
	</div>

	<ChartTooltip
		visible={hoveredPoint !== null}
		x={tooltipX}
		y={tooltipY}
		maxX={svgWidth - 180}
		minY={8}
		maxWidth={170}
	>
		{#if hoveredPoint}
			<div class="tooltip-title">{hoveredPoint.label}</div>
			<div>{valueLabel}: {formatTwoDecimals(hoveredPoint.value)}</div>
		{/if}
	</ChartTooltip>
</div>

<style>
	.chart-container {
		padding: 1rem;
		position: relative;
	}

	.chart-area {
		width: 100%;
	}

	h3 {
		margin: 0 0 1rem 0;
	}

	svg {
		border: 1px solid #ddd;
		border-radius: 4px;
		display: block;
	}

	text {
		font-family: sans-serif;
	}

	.tooltip-title {
		font-weight: 600;
		margin-bottom: 0.2rem;
	}
</style>
