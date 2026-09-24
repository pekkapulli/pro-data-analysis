<script lang="ts">
	import { scaleLinear, scaleBand } from 'd3-scale';
	import { formatInteger, formatOneDecimal, formatTwoDecimals } from '$lib/util/format.js';
	import type { DistributionBin } from '$lib/util/statistics';
	import ChartTooltip from './ChartTooltip.svelte';

	interface Props {
		data: DistributionBin[];
		title?: string;
		height?: number;
		width?: number;
		orientation?: 'vertical' | 'horizontal';
		valueLabel?: string;
		showPercentage?: boolean;
		summaryStats?: {
			mean: number;
			median: number;
			max: number;
		} | null;
	}

	const {
		data = [],
		title,
		height = 300,
		width = 600,
		orientation = 'vertical',
		valueLabel = 'Count',
		showPercentage = true,
		summaryStats = null
	}: Props = $props();

	let containerWidth = $state(0);
	let containerHeight = $state(0);

	const svgWidth = $derived(containerWidth > 0 ? containerWidth : width);
	const svgHeight = $derived(containerHeight > 0 ? containerHeight : height);

	const isHorizontal = $derived(orientation === 'horizontal');
	const margin = $derived(
		isHorizontal
			? { top: 24, right: 20, bottom: 40, left: 180 }
			: { top: 24, right: 20, bottom: 40, left: 50 }
	);
	const chartWidth = $derived(Math.max(svgWidth - margin.left - margin.right, 0));
	const chartHeight = $derived(Math.max(svgHeight - margin.top - margin.bottom, 0));
	const maxCount = $derived(Math.max(...data.map((d) => d.count), 0));

	const verticalYScale = $derived(scaleLinear().domain([0, maxCount]).range([chartHeight, 0]));
	const verticalXScale = $derived(
		scaleBand()
			.domain(data.map((_, i) => i.toString()))
			.range([0, chartWidth])
			.padding(0.1)
	);

	const horizontalXScale = $derived(scaleLinear().domain([0, maxCount]).range([0, chartWidth]));
	const horizontalYScale = $derived(
		scaleBand()
			.domain(data.map((_, i) => i.toString()))
			.range([0, chartHeight])
			.padding(0.1)
	);

	const verticalBarWidth = $derived(verticalXScale.bandwidth());
	const horizontalBarHeight = $derived(horizontalYScale.bandwidth());
	const chartValues = $derived(data.map((bin) => bin.count).filter((value) => !isNaN(value)));
	const summaryMean = $derived(
		chartValues.length === 0
			? 0
			: chartValues.reduce((sum, value) => sum + value, 0) / chartValues.length
	);
	const summaryMedian = $derived.by(() => {
		if (chartValues.length === 0) return 0;
		const sorted = [...chartValues].sort((a, b) => a - b);
		const mid = Math.floor(sorted.length / 2);
		return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
	});
	const summaryMax = $derived(chartValues.length === 0 ? 0 : Math.max(...chartValues));
	const effectiveSummary = $derived.by(() => {
		if (summaryStats) return summaryStats;
		if (chartValues.length === 0) return null;
		return {
			mean: summaryMean,
			median: summaryMedian,
			max: summaryMax
		};
	});

	let hoveredIndex = $state<number | null>(null);
	let tooltipX = $state(0);
	let tooltipY = $state(0);

	const hoveredBin = $derived(
		hoveredIndex === null || hoveredIndex >= data.length ? null : data[hoveredIndex]
	);

	function updateTooltipPosition(event: PointerEvent): void {
		const svgElement = (event.currentTarget as SVGRectElement).ownerSVGElement;
		if (!svgElement) return;

		const svgBounds = svgElement.getBoundingClientRect();
		tooltipX = event.clientX - svgBounds.left + 12;
		tooltipY = event.clientY - svgBounds.top - 12;
	}

	function handleBarEnter(event: PointerEvent, index: number): void {
		hoveredIndex = index;
		updateTooltipPosition(event);
	}

	function handleBarMove(event: PointerEvent): void {
		if (hoveredIndex === null) return;
		updateTooltipPosition(event);
	}

	function handleBarLeave(): void {
		hoveredIndex = null;
	}
</script>

<div class="chart-container">
	{#if title}
		<h3>{title}</h3>
	{/if}

	{#if effectiveSummary}
		<p class="chart-summary">
			Keskiarvo: {formatTwoDecimals(effectiveSummary.mean)} | Mediaani:
			{formatTwoDecimals(effectiveSummary.median)} | Maksimi: {formatTwoDecimals(
				effectiveSummary.max
			)}
		</p>
	{/if}

	<div
		class="chart-area"
		bind:clientWidth={containerWidth}
		bind:clientHeight={containerHeight}
		style:height={`${height}px`}
	>
		<svg width={svgWidth} height={svgHeight}>
			{#if isHorizontal}
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

				<!-- X axis labels -->
				{#each [0, 0.25, 0.5, 0.75, 1] as tick (tick)}
					{@const count = maxCount * tick}
					{@const x = horizontalXScale(count)}
					<text
						x={margin.left + x}
						y={svgHeight - margin.bottom + 20}
						text-anchor="middle"
						font-size="12"
					>
						{formatOneDecimal(count)}
					</text>
					<line
						x1={margin.left + x}
						y1={svgHeight - margin.bottom}
						x2={margin.left + x}
						y2={svgHeight - margin.bottom + 5}
						stroke="black"
						stroke-width="1"
					/>
				{/each}

				<!-- Bars -->
				{#each data as bin, i (i)}
					{@const y = horizontalYScale(i.toString()) ?? 0}
					<g>
						<rect
							x={margin.left}
							y={margin.top + y}
							width={horizontalXScale(bin.count)}
							height={horizontalBarHeight}
							role="img"
							aria-label={`${bin.label ?? `${formatTwoDecimals(bin.min)} - ${formatTwoDecimals(bin.max)}`}, ${formatTwoDecimals(bin.count)} riviä, osuus ${formatOneDecimal(bin.percentage)} prosenttia${typeof bin.rowCount === 'number' ? `, rivit ${formatInteger(bin.rowCount)}` : ''}`}
							fill="var(--money-green)"
							opacity={hoveredIndex === null || hoveredIndex === i ? 0.9 : 0.45}
							stroke={hoveredIndex === i ? '#1f2937' : 'none'}
							stroke-width={hoveredIndex === i ? 2 : 0}
							style="cursor: pointer;"
							onpointerenter={(event) => handleBarEnter(event, i)}
							onpointermove={handleBarMove}
							onpointerleave={handleBarLeave}
						/>
					</g>
				{/each}

				<!-- Y axis labels -->
				{#each data as bin, i (i)}
					{@const y = horizontalYScale(i.toString()) ?? 0}
					<text
						x={margin.left - 8}
						y={margin.top + y + horizontalBarHeight / 2}
						text-anchor="end"
						dominant-baseline="middle"
						font-size="11"
					>
						<tspan x={margin.left - 8}>{bin.label ?? formatInteger(bin.min)}</tspan>
						{#if bin.subLabel}
							<tspan x={margin.left - 8} dy="1.1em" font-size="10" fill="#4b5563"
								>{bin.subLabel}</tspan
							>
						{/if}
					</text>
				{/each}

				<text
					x={svgWidth - margin.right}
					y={svgHeight - 8}
					text-anchor="end"
					font-size="12"
					fill="black"
				>
					Value
				</text>
			{:else}
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
				{#each [0, 0.25, 0.5, 0.75, 1] as tick (tick)}
					{@const count = maxCount * tick}
					{@const y = verticalYScale(count)}
					<text
						x={margin.left - 10}
						y={margin.top + y}
						text-anchor="end"
						dominant-baseline="middle"
						font-size="12"
					>
						{formatInteger(Math.round(count))}
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

				<!-- Bars -->
				{#each data as bin, i (i)}
					{@const barHeight = chartHeight - verticalYScale(bin.count)}
					<g>
						<rect
							x={margin.left + (verticalXScale(i.toString()) ?? 0)}
							y={margin.top + verticalYScale(bin.count)}
							width={verticalBarWidth}
							height={barHeight}
							role="img"
							aria-label={`${bin.label ?? `${formatTwoDecimals(bin.min)} - ${formatTwoDecimals(bin.max)}`}, ${formatTwoDecimals(bin.count)}, osuus ${formatOneDecimal(bin.percentage)} prosenttia${typeof bin.rowCount === 'number' ? `, rivit ${formatInteger(bin.rowCount)}` : ''}`}
							fill="var(--money-green)"
							opacity={hoveredIndex === null || hoveredIndex === i ? 0.9 : 0.45}
							stroke={hoveredIndex === i ? '#1f2937' : 'none'}
							stroke-width={hoveredIndex === i ? 2 : 0}
							style="cursor: pointer;"
							onpointerenter={(event) => handleBarEnter(event, i)}
							onpointermove={handleBarMove}
							onpointerleave={handleBarLeave}
						/>
					</g>
				{/each}

				<!-- X axis labels -->
				{#each data as bin, i (i)}
					<text
						x={margin.left + (verticalXScale(i.toString()) ?? 0) + verticalBarWidth / 2}
						y={svgHeight - margin.bottom + 20}
						text-anchor="middle"
						font-size="11"
					>
						{bin.label ?? formatInteger(bin.min)}
					</text>
				{/each}

				<!-- Y axis label -->
				<text
					x={margin.left + 3}
					y={margin.top - 10}
					text-anchor="start"
					font-size="12"
					fill="black"
				>
					Count
				</text>
			{/if}
		</svg>
	</div>

	<ChartTooltip
		visible={hoveredBin !== null}
		x={tooltipX}
		y={tooltipY}
		maxX={svgWidth - 180}
		minY={8}
		maxWidth={170}
	>
		{#if hoveredBin}
			<div class="tooltip-title">
				{hoveredBin.label ??
					`${formatTwoDecimals(hoveredBin.min)} - ${formatTwoDecimals(hoveredBin.max)}`}
			</div>
			{#if hoveredBin.subLabel}
				<div>{hoveredBin.subLabel}</div>
			{/if}
			<div>{valueLabel}: {formatInteger(hoveredBin.count)}</div>
			{#if typeof hoveredBin.rowCount === 'number'}
				<div>Rivejä: {formatInteger(hoveredBin.rowCount)}</div>
			{/if}
			{#if showPercentage}
				<div>Osuus: {formatOneDecimal(hoveredBin.percentage)}%</div>
			{/if}
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

	.chart-summary {
		margin: 0 0 0.75rem 0;
		font-size: 0.875rem;
		color: #4b5563;
	}

	svg {
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
