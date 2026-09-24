<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import {
		ALL_SOURCES_OPTION_VALUE,
		ALL_COUNTRIES_OPTION_VALUE,
		FOREIGN_COUNTRIES_OPTION_VALUE,
		getCountryOptionsFromData,
		getSourceOptionsFromData,
		NON_ONLINE_SOURCE_OPTION_VALUE,
		ONLINE_SOURCE_VALUE
	} from '$lib/util/analysis.js';
	import { clearUploadedSession, readUploadedSession } from '$lib/util/uploadSession';
	import StatisticsTab from '$lib/components/analysis/StatisticsTab.svelte';
	import TracksTab from '$lib/components/analysis/TracksTab.svelte';
	import ChannelsTab from '$lib/components/analysis/ChannelsTab.svelte';
	import DownloadPseudonymizedCsvButton from '$lib/components/DownloadPseudonymizedCsvButton.svelte';
	import type { ParsedRow } from '$lib/types';
	import Selector from '$lib/components/Selector.svelte';

	let selectedCountry = $state<string>(ALL_COUNTRIES_OPTION_VALUE);
	let selectedSource = $state<string>(ALL_SOURCES_OPTION_VALUE);
	let activeTab = $state<'statistics' | 'tracks' | 'channels'>('tracks');
	let uploadedRows = $state<ParsedRow[] | null>(null);
	let uploadedFileNames = $state<string[]>([]);
	let overflowTopLimit = $state(24);

	// Load session data asynchronously
	$effect(() => {
		(async () => {
			const session = await readUploadedSession();
			if (session) {
				uploadedRows = session.rows;
				uploadedFileNames = session.fileNames;
			}
		})();
	});

	const activeRows = $derived(uploadedRows ?? []);

	const countryOptions = $derived(getCountryOptionsFromData(activeRows));

	const countryFilteredRows = $derived.by(() => {
		if (selectedCountry === ALL_COUNTRIES_OPTION_VALUE) return activeRows;
		if (selectedCountry === FOREIGN_COUNTRIES_OPTION_VALUE) {
			return activeRows.filter((row) => row.Esitysmaa && row.Esitysmaa !== 'Suomi');
		}
		return activeRows.filter((row) => row.Esitysmaa === selectedCountry);
	});

	const sourceOptions = $derived(getSourceOptionsFromData(countryFilteredRows));

	$effect(() => {
		if (!countryOptions.some((option) => option.value === selectedCountry)) {
			selectedCountry = ALL_COUNTRIES_OPTION_VALUE;
		}
	});

	$effect(() => {
		if (!sourceOptions.some((option) => option.value === selectedSource)) {
			selectedSource = ALL_SOURCES_OPTION_VALUE;
		}
	});

	const filteredData = $derived.by(() => {
		let rows = countryFilteredRows;

		if (selectedSource === NON_ONLINE_SOURCE_OPTION_VALUE) {
			rows = rows.filter((row) => row.Tilityksen_paakategoria !== ONLINE_SOURCE_VALUE);
		} else if (selectedSource !== ALL_SOURCES_OPTION_VALUE) {
			rows = rows.filter((row) => row.Tilityksen_paakategoria === selectedSource);
		}

		return rows;
	});

	const selectedCountryLabel = $derived.by(
		() => countryOptions.find((option) => option.value === selectedCountry)?.label ?? 'Kaikki'
	);

	const selectedSourceLabel = $derived.by(
		() => sourceOptions.find((option) => option.value === selectedSource)?.label ?? 'Kaikki lähteet'
	);

	async function clearDataAndReturnHome() {
		await clearUploadedSession();
		uploadedRows = null;
		uploadedFileNames = [];
		selectedCountry = ALL_COUNTRIES_OPTION_VALUE;
		selectedSource = ALL_SOURCES_OPTION_VALUE;
		activeTab = 'statistics';
		overflowTopLimit = 24;
		goto(resolve('/'));
	}
</script>

<section class="mx-auto max-w-6xl px-6 pt-16 pb-24">
	<header class="mb-10">
		<h1 class="max-w-3xl text-3xl leading-tight font-semibold text-slate-900 md:text-5xl">
			Aineiston analyysi
		</h1>
	</header>

	{#if uploadedRows && uploadedRows.length > 0}
		<section class="mb-8 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
			<p>
				{uploadedRows.length} riviä {uploadedFileNames.length} tiedostosta.
			</p>
			<button
				type="button"
				class="rounded-full bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-700"
				onclick={clearDataAndReturnHome}
			>
				Analysoi uusi aineisto
			</button>
		</section>
		<section class="mb-8 rounded-2xl bg-slate-50 p-6">
			<h2 class="mb-2 text-sm font-semibold text-slate-900">Osallistu tutkimukseen</h2>
			<p class="mb-4 text-sm text-slate-700">
				Voit osallistua tutkimukseen lähettämällä meille pseudonymisoidun version aineistostasi.
				Lähetä aineisto vain kerran.
			</p>
			<DownloadPseudonymizedCsvButton rows={uploadedRows} disabled={false} />
		</section>

		<div class="mb-6 flex flex-wrap items-center gap-3">
			<Selector options={countryOptions} bind:value={selectedCountry} placeholder="Valitse maa" />
			<Selector options={sourceOptions} bind:value={selectedSource} placeholder="Valitse lähde" />
		</div>

		<h2 class="mb-8 text-lg font-medium text-slate-700 md:text-xl">
			{selectedCountryLabel} / {selectedSourceLabel}: {filteredData.length} riviä
		</h2>

		<div class="mb-8 flex flex-wrap gap-2" role="tablist" aria-label="Analyysin välilehdet">
			<button
				type="button"
				role="tab"
				aria-selected={activeTab === 'tracks'}
				aria-controls="analysis-tracks-panel"
				id="analysis-tracks-tab"
				class={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === 'tracks' ? 'bg-money-green text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
				onclick={() => (activeTab = 'tracks')}
			>
				Kappaleet
			</button>
			<button
				type="button"
				role="tab"
				aria-selected={activeTab === 'channels'}
				aria-controls="analysis-channels-panel"
				id="analysis-channels-tab"
				class={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === 'channels' ? 'bg-money-green text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
				onclick={() => (activeTab = 'channels')}
			>
				Kanavat
			</button>
			<button
				type="button"
				role="tab"
				aria-selected={activeTab === 'statistics'}
				aria-controls="analysis-statistics-panel"
				id="analysis-statistics-tab"
				class={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === 'statistics' ? 'bg-money-green text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
				onclick={() => (activeTab = 'statistics')}
			>
				Tilastot
			</button>
		</div>

		<div>
			{#if activeTab === 'statistics'}
				<div
					id="analysis-statistics-panel"
					role="tabpanel"
					aria-labelledby="analysis-statistics-tab"
				>
					<StatisticsTab rows={filteredData} {selectedCountryLabel} bind:overflowTopLimit />
				</div>
			{:else if activeTab === 'tracks'}
				<div id="analysis-tracks-panel" role="tabpanel" aria-labelledby="analysis-tracks-tab">
					<TracksTab rows={filteredData} />
				</div>
			{:else}
				<div id="analysis-channels-panel" role="tabpanel" aria-labelledby="analysis-channels-tab">
					<ChannelsTab rows={filteredData} />
				</div>
			{/if}
		</div>
	{:else}
		<section class="max-w-3xl rounded-3xl bg-white/70 p-10 text-slate-700 shadow-sm">
			<h2 class="mb-4 text-2xl font-semibold text-slate-900">Aineistoa ei ole ladattu</h2>
			<p class="mb-6">Palaa etusivulle ladataksesi CSV-tiedostoja analyysiin.</p>
			<a
				href={resolve('/')}
				class="inline-flex items-center rounded-full bg-money-green px-5 py-2.5 font-semibold text-white transition hover:opacity-90"
			>
				Siirry etusivulle
			</a>
		</section>
	{/if}
</section>
