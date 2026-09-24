<script lang="ts">
	import { formatInteger } from '$lib/util/format.js';

	let {
		options = [],
		placeholder = 'Select an option',
		value = $bindable(),
		onchange = undefined
	} = $props();
</script>

<select
	{value}
	onchange={(e) => {
		const target = e.currentTarget as HTMLSelectElement;
		value = target.value || undefined;
		onchange?.(value);
	}}
>
	<option value="">{placeholder}</option>
	{#each options as option (option.value)}
		<option value={option.value}
			>{option.label}
			{option.count !== undefined ? `(${formatInteger(option.count)} riviä)` : ''}</option
		>
	{/each}
</select>

<style>
	select {
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 1rem;
	}
</style>
