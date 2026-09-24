<script lang="ts">
	import TrackStatsTable from '$lib/components/TrackStatsTable.svelte';
	import type { ParsedRow } from '$lib/types';
	import {
		buildYearlyEntityTable,
		type YearlyEntityTableItem
	} from '$lib/util/yearlyEntityTable.js';

	interface Props {
		rows: ParsedRow[];
	}

	let { rows = [] }: Props = $props();

	const items: YearlyEntityTableItem[] = $derived(
		buildYearlyEntityTable(rows, (row) => row.Teoksen_nimi)
	);
</script>

<TrackStatsTable
	{items}
	itemLabel="Kappale"
	itemLabelPlural="Kappaleet"
	itemLabelGenitive="Kappaleen"
	emptyMessage="Kappaletta ei löytynyt."
/>
