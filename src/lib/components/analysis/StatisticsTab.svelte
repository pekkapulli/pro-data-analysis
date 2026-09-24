<script lang="ts">
	import BarChart from '$lib/components/BarChart.svelte';
	import LineChart from '$lib/components/LineChart.svelte';
	import { formatAmount, formatInteger, formatTwoDecimals } from '$lib/util/format.js';
	import { analyzeStatistics } from '$lib/util/statistics.js';
	import { calculateYearlyStats } from '$lib/util/yearlyStats.js';
	import type { ParsedRow } from '$lib/types';

	type DistributionBin = {
		min: number;
		max: number;
		count: number;
		percentage: number;
		label?: string;
		subLabel?: string;
		rowCount?: number;
	};

	type SummaryStats = {
		mean: number;
		median: number;
		max: number;
	} | null;

	interface Props {
		rows: ParsedRow[];
		selectedCountryLabel: string;
		overflowTopLimit?: number;
	}

	let { rows = [], selectedCountryLabel, overflowTopLimit = $bindable(24) }: Props = $props();

	const yearlyStats = $derived(calculateYearlyStats(rows));

	const kuukaudetValues = $derived(
		rows
			.map((row) => row.Kuukaudet_esitys_tilitys)
			.filter((value): value is number => value !== null && !isNaN(value))
	);

	const overflowSliderBounds = $derived.by(() => {
		if (kuukaudetValues.length < 2) return null;

		const stats = analyzeStatistics(kuukaudetValues);
		const min = Math.floor(stats.min) + 1;
		const max = Math.ceil(stats.max) - 1;

		if (min >= max) return null;

		return { min, max };
	});

	$effect(() => {
		if (!overflowSliderBounds) return;
		if (
			overflowTopLimit < overflowSliderBounds.min ||
			overflowTopLimit > overflowSliderBounds.max
		) {
			overflowTopLimit = Math.round((overflowSliderBounds.min + overflowSliderBounds.max) / 2);
		}
	});

	const medianDistribution = $derived.by(() => {
		if (kuukaudetValues.length === 0) return [] as DistributionBin[];

		if (!overflowSliderBounds) {
			return analyzeStatistics(kuukaudetValues, 10).distribution as DistributionBin[];
		}

		return analyzeStatistics(kuukaudetValues, 10, { overflowTopLimit })
			.distribution as DistributionBin[];
	});

	const kuukaudetSummaryStats = $derived.by(() => {
		if (kuukaudetValues.length === 0) return null as SummaryStats;
		const stats = analyzeStatistics(kuukaudetValues);
		return {
			mean: stats.mean,
			median: stats.median,
			max: stats.max
		};
	});

	const topCountryMedians = $derived.by(() => {
		const countryValues: Record<string, number[]> = {};

		for (const row of rows) {
			if (!row.Esitysmaa) continue;
			if (row.Kuukaudet_esitys_tilitys === null || isNaN(row.Kuukaudet_esitys_tilitys)) continue;

			const existing = countryValues[row.Esitysmaa] ?? [];
			existing.push(row.Kuukaudet_esitys_tilitys);
			countryValues[row.Esitysmaa] = existing;
		}

		const entries = Object.entries(countryValues);
		if (entries.length === 0) return [];

		const totalRows = entries.reduce((sum, [, values]) => sum + values.length, 0);

		return entries
			.map(([country, values]) => {
				const median = analyzeStatistics(values).median;
				return {
					country,
					median,
					rows: values.length
				};
			})
			.sort((a, b) => b.rows - a.rows)
			.slice(0, 10)
			.map((item) => ({
				min: item.median,
				max: item.median,
				count: item.median,
				percentage: totalRows === 0 ? 0 : (item.rows / totalRows) * 100,
				label: item.country,
				subLabel: `${formatInteger(item.rows)} riviä`,
				rowCount: item.rows
			}));
	});

	const yearlyTotalRowsSeries = $derived(
		yearlyStats.map((stat) => ({ label: stat.year.toString(), value: stat.totalRows }))
	);
	const yearlySumSeries = $derived(
		yearlyStats.map((stat) => ({ label: stat.year.toString(), value: stat.sumSumma }))
	);
	const yearlyAvgSettlementMonthsSeries = $derived(
		yearlyStats.map((stat) => ({ label: stat.year.toString(), value: stat.kuukaudetStats.mean }))
	);
	const yearlyMedianSettlementMonthsSeries = $derived(
		yearlyStats.map((stat) => ({ label: stat.year.toString(), value: stat.kuukaudetStats.median }))
	);
	const yearlyAvgSumSeries = $derived(
		yearlyStats.map((stat) => ({ label: stat.year.toString(), value: stat.summaStats.mean }))
	);
	const yearlyMedianSumSeries = $derived(
		yearlyStats.map((stat) => ({ label: stat.year.toString(), value: stat.summaStats.median }))
	);
</script>

<section class="rounded-lg border border-gray-200 bg-white p-4">
	<h3 class="text-xl font-semibold">Mediaanijakauma ({selectedCountryLabel})</h3>
	<p class="text-sm text-gray-600">Esityksen ja selvityksen välisten kuukausien jakauma.</p>
	<p class="text-sm text-gray-600">
		Arvot kuvaavat Teoston aineiston rivejä, eivät yksittäisiä kappaleita.
	</p>

	{#if overflowSliderBounds}
		<div class="mt-3 flex flex-wrap items-center gap-3">
			<label for="top-bin-slider" class="font-medium">Yläraja (N+ kuukautta)</label>
			<input
				id="top-bin-slider"
				type="range"
				min={overflowSliderBounds.min}
				max={overflowSliderBounds.max}
				step="1"
				bind:value={overflowTopLimit}
			/>
			<span class="rounded bg-gray-100 px-2 py-1 text-sm font-semibold">{overflowTopLimit}+</span>
		</div>
	{/if}

	<BarChart
		data={medianDistribution}
		orientation="vertical"
		width={900}
		height={320}
		valueLabel="Rivit"
		showPercentage={true}
		summaryStats={kuukaudetSummaryStats}
	/>
</section>

<section class="mt-6 rounded-lg border border-gray-200 bg-white p-4">
	<h3 class="text-xl font-semibold">Vuosittaisten tilastojen trendit</h3>
	<p class="text-sm text-gray-600">
		Viivakuviot vuosittaisista tilastoista vertailtavaksi ajan yli.
	</p>
	<div class="mt-4 grid gap-4">
		<LineChart
			data={yearlyTotalRowsSeries}
			title="Rivit yhteensä"
			valueLabel="Rivit"
			height={240}
		/>
		<LineChart data={yearlySumSeries} title="Summa (€)" valueLabel="Summa (€)" height={240} />
		<LineChart
			data={yearlyAvgSettlementMonthsSeries}
			title="Keskimääräiset selvityskuukaudet"
			valueLabel="Kuukautta"
			height={240}
		/>
		<LineChart
			data={yearlyMedianSettlementMonthsSeries}
			title="Selvityskuukaudet (mediaani)"
			valueLabel="Kuukautta"
			height={240}
		/>
		<LineChart
			data={yearlyAvgSumSeries}
			title="Keskimääräinen summa (€)"
			valueLabel="Keskimääräinen summa (€)"
			height={240}
		/>
		<LineChart
			data={yearlyMedianSumSeries}
			title="Summa (€) (mediaani)"
			valueLabel="Summa (€) (mediaani)"
			height={240}
		/>
	</div>
</section>

<section class="mt-6 rounded-lg border border-gray-200 bg-white p-4">
	<h3 class="mt-6 text-xl font-semibold">Vuosittaiset tilastot</h3>
	<table class="mt-4 w-full table-auto border-collapse border border-gray-300">
		<thead>
			<tr class="bg-gray-100">
				<th class="border border-gray-300 px-4 py-2">Vuosi</th>
				<th class="border border-gray-300 px-4 py-2">Rivit yhteensä</th>
				<th class="border border-gray-300 px-4 py-2">Summa (€)</th>
				<th class="border border-gray-300 px-4 py-2">Keskimääräiset selvityskuukaudet</th>
				<th class="border border-gray-300 px-4 py-2">Mediaani selvityskuukaudet</th>
				<th class="border border-gray-300 px-4 py-2">Keskimääräinen summa (€)</th>
				<th class="border border-gray-300 px-4 py-2">Mediaani summa (€)</th>
			</tr>
		</thead>
		<tbody>
			{#each yearlyStats as stat (stat.year)}
				<tr>
					<td class="border border-gray-300 px-4 py-2 text-center">{formatInteger(stat.year)}</td>
					<td class="border border-gray-300 px-4 py-2 text-right"
						>{formatInteger(stat.totalRows)}</td
					>
					<td class="border border-gray-300 px-4 py-2 text-right">{formatAmount(stat.sumSumma)}</td>
					<td class="border border-gray-300 px-4 py-2 text-right"
						>{formatTwoDecimals(stat.kuukaudetStats.mean)}</td
					>
					<td class="border border-gray-300 px-4 py-2 text-right"
						>{formatTwoDecimals(stat.kuukaudetStats.median)}</td
					>
					<td class="border border-gray-300 px-4 py-2 text-right"
						>{formatTwoDecimals(stat.summaStats.mean)}</td
					>
					<td class="border border-gray-300 px-4 py-2 text-right"
						>{formatTwoDecimals(stat.summaStats.median)}</td
					>
				</tr>
			{/each}
		</tbody>
	</table>
</section>

<section class="mt-6 rounded-lg border border-gray-200 bg-white p-4">
	<h3 class="text-xl font-semibold">Esityksen ja tilityksen väliset kuukaudet maittain</h3>
	<p class="text-sm text-gray-600">
		10 päämaata rivimäärän mukaan, palkin pituus näyttää mediaanikuukaudet esityksen ja tilityksen
		välillä.
	</p>
	<BarChart
		data={topCountryMedians}
		orientation="horizontal"
		width={900}
		height={420}
		valueLabel="Mediaani kuukautta"
		showPercentage={false}
	/>
</section>
