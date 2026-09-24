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
		buildYearlyEntityTable(rows, (row) => row.Tilityksen_alakategoria)
	);
</script>

<TrackStatsTable
	{items}
	itemLabel="Kanava"
	itemLabelPlural="Kanavat"
	itemLabelGenitive="Kanavan"
	emptyMessage="Kanavaa ei löytynyt."
/>
