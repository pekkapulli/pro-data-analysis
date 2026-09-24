<script lang="ts">
	import { scaleLinear } from 'd3-scale';
	import { line } from 'd3-shape';
	import { formatAmount, formatInteger } from '$lib/util/format.js';
	import type { YearlyEntityTableItem, YearlyPoint } from '$lib/util/yearlyEntityTable.js';
	import ChartTooltip from './ChartTooltip.svelte';

	type SortKey = 'item' | 'totalRows' | 'totalSum';
	type SortDirection = 'asc' | 'desc';
	type SparklineKey = 'rows' | 'sum';

	const sparklineWidth = 120;
	const sparklineHeight = 32;
	const sparklineVerticalPadding = 2;

	interface Props {
		items: YearlyEntityTableItem[];
		itemLabel?: string;
		itemLabelPlural?: string;
		itemLabelGenitive?: string;
		emptyMessage?: string;
	}

	const {
		items = [],
		itemLabel = 'Kappale',
		itemLabelPlural = 'Kappaleet',
		itemLabelGenitive = 'Kappaleen',
		emptyMessage = 'Kappaletta ei löytynyt.'
	}: Props = $props();

	let itemNameFilter = $state('');
	let sortKey = $state<SortKey>('totalRows');
	let sortDirection = $state<SortDirection>('desc');
	let hoveredSparkline = $state<{ item: string; key: SparklineKey; point: YearlyPoint } | null>(
		null
	);
	let tooltipX = $state(0);
	let tooltipY = $state(0);
	let tooltipMaxX = $state(0);
	let tooltipBottomArrowX = $state(0);

	const normalizedFilter = $derived(itemNameFilter.trim().toLocaleLowerCase());

	const filteredAndSortedItems = $derived.by(() => {
		const filtered = normalizedFilter
			? items.filter((item) => item.item.toLocaleLowerCase().includes(normalizedFilter))
			: items;

		const direction = sortDirection === 'asc' ? 1 : -1;

		return [...filtered].sort((a, b) => {
			if (sortKey === 'item') {
				return a.item.localeCompare(b.item) * direction;
			}
			if (sortKey === 'totalRows') {
				return (a.totalRows - b.totalRows) * direction;
			}
			return (a.totalSum - b.totalSum) * direction;
		});
	});

	function toggleSort(column: SortKey): void {
		if (sortKey === column) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
			return;
		}

		sortKey = column;
		sortDirection = column === 'item' ? 'asc' : 'desc';
	}

	function sortIndicator(column: SortKey): string {
		if (sortKey !== column) return '';
		return sortDirection === 'asc' ? ' ▲' : ' ▼';
	}

	function sparklineXScale(points: YearlyPoint[]) {
		const years = points.map((point) => point.year);
		return scaleLinear()
			.domain([Math.min(...years), Math.max(...years)])
			.range([0, sparklineWidth]);
	}

	function sparklinePath(points: YearlyPoint[], key: SparklineKey): string {
		if (points.length === 0) return '';

		return (
			line<YearlyPoint>()
				.x((point) => sparklineXScale(points)(point.year))
				.y((point) => sparklineYScale(points, key)(point[key]))(points) ?? ''
		);
	}

	function sparklineYScale(points: YearlyPoint[], key: SparklineKey) {
		const values = points.map((point) => point[key]);
		return scaleLinear()
			.domain([Math.min(...values), Math.max(...values)])
			.range([sparklineHeight - sparklineVerticalPadding, sparklineVerticalPadding]);
	}

	function handleSparklineMove(
		event: PointerEvent,
		item: string,
		points: YearlyPoint[],
		key: SparklineKey
	): void {
		if (points.length === 0) return;

		const svgElement = event.currentTarget as SVGRectElement;
		const svgBounds = svgElement.ownerSVGElement?.getBoundingClientRect();
		if (!svgBounds) return;

		const pointerX = event.clientX - svgBounds.left;
		const sparklinePointerX = (pointerX / svgBounds.width) * sparklineWidth;
		const hoveredYear = sparklineXScale(points).invert(sparklinePointerX);
		const closestPoint = points.reduce((closest, point) =>
			Math.abs(point.year - hoveredYear) < Math.abs(closest.year - hoveredYear) ? point : closest
		);

		hoveredSparkline = { item, key, point: closestPoint };
		tooltipMaxX = Math.max(0, svgBounds.width - 130);
		tooltipX = Math.min(Math.max(0, pointerX - 12), tooltipMaxX);
		tooltipY = event.clientY - svgBounds.top - 58;
		tooltipBottomArrowX = pointerX - tooltipX;
	}

	function clearSparklineTooltip(): void {
		hoveredSparkline = null;
	}
</script>

<section class="mt-6 rounded-lg border border-gray-200 bg-white p-4">
	<h3 class="text-xl font-semibold">{itemLabelPlural} - tilastot vuosittain</h3>
	<p class="text-sm text-gray-600">
		Jokainen rivi edustaa yhtä {itemLabel.toLowerCase()}a ({formatInteger(items.length)} yhteensä). Viivakuvaajat
		näyttävät vuosittaiset trendit rivien määrästä ja summasta.
	</p>

	<div class="mt-3 flex flex-wrap items-center gap-2">
		<label for="track-name-filter" class="text-sm font-medium"
			>Suodata {itemLabelGenitive.toLowerCase()} nimen perusteella</label
		>
		<input
			id="track-name-filter"
			type="text"
			class="rounded border border-gray-300 px-3 py-1.5 text-sm"
			placeholder={`Kirjoita osa ${itemLabelGenitive.toLowerCase()} nimestä`}
			bind:value={itemNameFilter}
		/>
		<span class="text-sm text-gray-600">
			Näytetään {formatInteger(filteredAndSortedItems.length)} / {formatInteger(items.length)}
		</span>
	</div>

	<div class="mt-4">
		<table class="w-full table-fixed border-collapse border border-gray-300">
			<thead>
				<tr class="bg-gray-100">
					<th class="w-[28%] border border-gray-300 px-4 py-2 text-left">
						<button
							type="button"
							class="font-semibold hover:underline"
							onclick={() => toggleSort('item')}
						>
							{itemLabel}{sortIndicator('item')}
						</button>
					</th>
					<th class="w-[12%] border border-gray-300 px-4 py-2 text-right">
						<button
							type="button"
							class="font-semibold hover:underline"
							onclick={() => toggleSort('totalRows')}
						>
							Yhteensä rivejä{sortIndicator('totalRows')}
						</button>
					</th>
					<th class="w-[14%] border border-gray-300 px-4 py-2 text-right">
						<button
							type="button"
							class="font-semibold hover:underline"
							onclick={() => toggleSort('totalSum')}
						>
							Yhteensä summa (EUR){sortIndicator('totalSum')}
						</button>
					</th>
					<th class="w-[12%] border border-gray-300 px-4 py-2 text-center">Vuosittaiset rivit</th>
					<th class="w-[12%] border border-gray-300 px-4 py-2 text-center"
						>Vuosittaiset summat (EUR)</th
					>
				</tr>
			</thead>
			<tbody>
				{#each filteredAndSortedItems as item (item.item)}
					{@const rowPath = sparklinePath(item.yearly, 'rows')}
					{@const sumPath = sparklinePath(item.yearly, 'sum')}
					{@const rowHoveredPoint =
						hoveredSparkline?.item === item.item && hoveredSparkline.key === 'rows'
							? hoveredSparkline.point
							: null}
					{@const sumHoveredPoint =
						hoveredSparkline?.item === item.item && hoveredSparkline.key === 'sum'
							? hoveredSparkline.point
							: null}
					<tr>
						<td class="max-w-0 border border-gray-300 px-4 py-2 font-medium" title={item.item}>
							<span class="block truncate">{item.item}</span>
						</td>
						<td class="border border-gray-300 px-4 py-2 text-right whitespace-nowrap">
							{formatInteger(item.totalRows)}
						</td>
						<td class="border border-gray-300 px-4 py-2 text-right whitespace-nowrap">
							{formatAmount(item.totalSum)}
						</td>
						<td class="border border-gray-300 px-4 py-2">
							<div class="relative">
								<svg
									class="block w-full"
									width="100%"
									height={sparklineHeight}
									viewBox={`0 0 ${sparklineWidth} ${sparklineHeight}`}
									role="img"
									aria-label={`Yearly rows trend for ${item.item}`}
								>
									<path d={rowPath} fill="none" stroke="var(--money-green)" stroke-width="2" />
									{#if rowHoveredPoint}
										<circle
											cx={sparklineXScale(item.yearly)(rowHoveredPoint.year)}
											cy={sparklineYScale(item.yearly, 'rows')(rowHoveredPoint.rows)}
											r="3"
											fill="var(--money-green)"
										/>
									{/if}
									<rect
										width={sparklineWidth}
										height={sparklineHeight}
										fill="transparent"
										role="presentation"
										style="cursor: crosshair;"
										onpointermove={(event) =>
											handleSparklineMove(event, item.item, item.yearly, 'rows')}
										onpointerleave={clearSparklineTooltip}
									/>
								</svg>
								<ChartTooltip
									visible={hoveredSparkline?.item === item.item && hoveredSparkline.key === 'rows'}
									x={tooltipX}
									y={tooltipY}
									maxX={tooltipMaxX}
									minY={Number.NEGATIVE_INFINITY}
									maxWidth={120}
									showBottomArrow={true}
									bottomArrowX={tooltipBottomArrowX}
								>
									{#if hoveredSparkline}
										<div>{hoveredSparkline.point.year}</div>
										<div>Rivejä: {formatInteger(hoveredSparkline.point.rows)}</div>
									{/if}
								</ChartTooltip>
							</div>
						</td>
						<td class="border border-gray-300 px-4 py-2">
							<div class="relative">
								<svg
									class="block w-full"
									width="100%"
									height={sparklineHeight}
									viewBox={`0 0 ${sparklineWidth} ${sparklineHeight}`}
									role="img"
									aria-label={`Yearly sum trend for ${item.item}`}
								>
									<path d={sumPath} fill="none" stroke="#1d4ed8" stroke-width="2" />
									{#if sumHoveredPoint}
										<circle
											cx={sparklineXScale(item.yearly)(sumHoveredPoint.year)}
											cy={sparklineYScale(item.yearly, 'sum')(sumHoveredPoint.sum)}
											r="3"
											fill="#1d4ed8"
										/>
									{/if}
									<rect
										width={sparklineWidth}
										height={sparklineHeight}
										fill="transparent"
										role="presentation"
										style="cursor: crosshair;"
										onpointermove={(event) =>
											handleSparklineMove(event, item.item, item.yearly, 'sum')}
										onpointerleave={clearSparklineTooltip}
									/>
								</svg>
								<ChartTooltip
									visible={hoveredSparkline?.item === item.item && hoveredSparkline.key === 'sum'}
									x={tooltipX}
									y={tooltipY}
									maxX={tooltipMaxX}
									minY={Number.NEGATIVE_INFINITY}
									maxWidth={120}
									showBottomArrow={true}
									bottomArrowX={tooltipBottomArrowX}
								>
									{#if hoveredSparkline}
										<div>{hoveredSparkline.point.year}</div>
										<div>
											Summa: {formatAmount(hoveredSparkline.point.sum)} €
										</div>
									{/if}
								</ChartTooltip>
							</div>
						</td>
					</tr>
				{/each}
				{#if filteredAndSortedItems.length === 0}
					<tr>
						<td class="border border-gray-300 px-4 py-4 text-center text-gray-600" colspan="7">
							{emptyMessage}
						</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>
</section>
