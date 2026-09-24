<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<div
	class="min-h-screen bg-[radial-gradient(circle_at_90%_0%,#f7fbef_0%,#f2f1ec_46%,#ecebe5_100%)]"
>
	{@render children()}
	<footer class="px-4 pt-2 pb-6 text-center text-[11px] text-slate-500/80">
		Euros photo by
		<a
			href="https://unsplash.com/@dentistozkanguner?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText"
			target="_blank"
			rel="noreferrer"
			class="underline decoration-slate-400 underline-offset-2 hover:text-slate-700"
		>
			Ozkan Guner
		</a>
		on
		<a
			href="https://unsplash.com/photos/a-pile-of-50-euro-bills-sitting-on-top-of-each-other-84PyehBYlMk?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText"
			target="_blank"
			rel="noreferrer"
			class="underline decoration-slate-400 underline-offset-2 hover:text-slate-700"
		>
			Unsplash
		</a>
		<span aria-hidden="true"> · </span>
		<a
			href="/privacy"
			class="underline decoration-slate-400 underline-offset-2 hover:text-slate-700"
			>Tietosuojaseloste</a
		>
	</footer>
</div>
