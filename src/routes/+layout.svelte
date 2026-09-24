<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { resolve } from '$app/paths';

	let { children } = $props();
</script>

<svelte:head>
	<title>Rojaltit.net | Analysoi Teosto-datasi</title>
	<meta
		name="description"
		content="Tutki tilitystietojasi maittain, kappaleittain ja esitystavoittain. Kaikki käsittely tapahtuu selaimessasi."
	/>
	<meta property="og:title" content="Rojaltit.net | Analysoi Teosto-datasi" />
	<meta
		property="og:description"
		content="Tutki tilitystietojasi maittain, kappaleittain ja esitystavoittain."
	/>
	<meta property="og:type" content="website" />
	<meta property="og:image" content="/share.jpg" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Rojaltit.net | Teosto-datan analyysi" />
	<meta
		name="twitter:description"
		content="Tutki tilitystietojasi maittain, kappaleittain ja esitystavoittain."
	/>
	<meta name="twitter:image" content="/share.jpg" />
	<link rel="icon" href={favicon} />
</svelte:head>
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
			href={resolve('/privacy')}
			class="underline decoration-slate-400 underline-offset-2 hover:text-slate-700"
			>Tietosuojaseloste</a
		>
	</footer>
</div>
