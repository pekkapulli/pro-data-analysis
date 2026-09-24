<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { ParsedRow } from '$lib/types';
	import { buildPseudonymizedCsvExport, PSEUDONYMIZATION_RULES } from '$lib/util/pseudonymizedCsv';

	interface Props {
		rows: ParsedRow[];
		disabled?: boolean;
	}

	let { rows = [], disabled = false }: Props = $props();

	let isDownloading = $state(false);
	let isSending = $state(false);
	let isConfirmDialogOpen = $state(false);
	let errorMessage = $state<string | null>(null);
	let successMessage = $state<string | null>(null);
	let csvContent = $state('');
	let fileName = $state('');
	let saltFingerprint = $state('');
	let hasResearchConsent = $state(false);
	let submissionReceipt = $state<{
		fileName: string;
		saltFingerprint: string;
		submittedAt: string;
	} | null>(null);

	function openConfirmationDialog(): void {
		if (disabled || rows.length === 0 || isDownloading || isSending) return;
		errorMessage = null;
		successMessage = null;
		submissionReceipt = null;
		hasResearchConsent = false;
		isConfirmDialogOpen = true;
	}

	async function prepareCsvExport(): Promise<void> {
		if (disabled || rows.length === 0 || isDownloading || isSending) return;

		isDownloading = true;
		errorMessage = null;
		successMessage = null;

		try {
			const result = await buildPseudonymizedCsvExport(rows);
			csvContent = result.csv;
			fileName = result.fileName;
			saltFingerprint = result.saltFingerprint;

			const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' });
			const objectUrl = URL.createObjectURL(blob);

			const link = document.createElement('a');
			link.href = objectUrl;
			link.download = result.fileName;
			link.style.display = 'none';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(objectUrl);
		} catch {
			errorMessage = 'Failed to create pseudonymized export. Please try again.';
		} finally {
			isDownloading = false;
		}
	}

	async function ensureCsvForEmail(): Promise<boolean> {
		if (csvContent && fileName) return true;

		try {
			const result = await buildPseudonymizedCsvExport(rows);
			csvContent = result.csv;
			fileName = result.fileName;
			saltFingerprint = result.saltFingerprint;
			return true;
		} catch {
			errorMessage = 'Failed to prepare the pseudonymized export.';
			return false;
		}
	}

	const rulesSummary = $derived(
		PSEUDONYMIZATION_RULES.map((rule) => `${rule.field}: ${rule.details}`)
	);
</script>

<div class="mt-3 flex flex-col gap-3">
	<div class="flex flex-wrap gap-2">
		<button
			type="button"
			class="hover:bg-money-green-dark w-fit cursor-pointer rounded bg-money-green px-4 py-2 font-semibold text-white transition hover:shadow-lg disabled:cursor-not-allowed"
			disabled={disabled || rows.length === 0 || isDownloading || isSending}
			onclick={prepareCsvExport}
		>
			{isDownloading
				? 'Valmistellaan pseudonymisoitua aineistoa...'
				: 'Lataa pseudonymisoitu aineisto (CSV)'}
		</button>

		<button
			type="button"
			class="w-fit cursor-pointer rounded bg-slate-900 px-4 py-2 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
			disabled={disabled || rows.length === 0 || isSending}
			onclick={openConfirmationDialog}
		>
			Lähetä tutkimukseen
		</button>
	</div>

	{#if isConfirmDialogOpen}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
			<div class="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
				<h3 class="text-lg font-semibold text-slate-900">Lähetä tutkimukseen</h3>
				<p class="mt-2 text-sm text-slate-600">
					Aineisto pseudonymisoidaan ennen lähetystä, mutta se voi silti olla henkilötietoa. Suorat
					tunnistetiedot poistetaan tai hajautetaan.
				</p>

				<form
					method="POST"
					action="?/sendPseudonymizedEmail"
					class="mt-4 space-y-4"
					use:enhance={async ({ formData }) => {
						if (!hasResearchConsent) {
							errorMessage = 'Hyväksy tietosuojaseloste ja anna suostumus ennen lähetystä.';
							return;
						}

						if (!(await ensureCsvForEmail())) {
							return;
						}

						formData.set('csv', csvContent);
						formData.set('fileName', fileName);
						formData.set('saltFingerprint', saltFingerprint);

						isSending = true;
						errorMessage = null;
						successMessage = null;

						return async ({ result, update }) => {
							isSending = false;
							isConfirmDialogOpen = false;
							if (result.type === 'failure') {
								const payload = result.data as { error?: string } | undefined;
								errorMessage = payload?.error ?? 'Lähetys epäonnistui.';
								return;
							}
							if (result.type === 'success') {
								const payload = result.data as {
									fileName: string;
									saltFingerprint: string;
									submittedAt: string;
								};
								successMessage = 'Pseudonymisoitu aineisto on lähetetty tutkimukseen.';
								submissionReceipt = payload;
								csvContent = '';
								fileName = '';
								saltFingerprint = '';
							}
							await update();
						};
					}}
				>
					<label class="flex items-start gap-3 text-sm text-slate-700">
						<input
							class="mt-1 size-4 accent-money-green"
							type="checkbox"
							name="researchConsent"
							value="yes"
							required
							bind:checked={hasResearchConsent}
						/>
						<span>
							Olen lukenut
							<a class="underline" href={resolve('/privacy')} target="_blank" rel="noreferrer">
								tietosuojaselosteen
							</a>
							ja annan vapaaehtoisen suostumukseni pseudonymisoidun aineistoni käyttöön Teoston tilityskäytäntöjä
							koskevassa tutkimuksessa.
						</span>
					</label>
					<div class="flex justify-end gap-2 pt-2">
						<button
							type="button"
							class="rounded border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
							onclick={() => (isConfirmDialogOpen = false)}
						>
							Peruuta
						</button>
						<button
							type="submit"
							class="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
							disabled={isSending || !hasResearchConsent}
						>
							{isSending ? 'Lähetetään...' : 'Vahvista lähetys'}
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<p class="text-sm text-gray-600">
		{rows.length.toLocaleString('fi-FI')} riviä yhdessä CSV-tiedostossa.
	</p>

	{#if errorMessage}
		<p class="text-sm text-red-600">{errorMessage}</p>
	{/if}

	{#if successMessage}
		<p class="text-sm text-green-700">{successMessage}</p>
	{/if}

	{#if submissionReceipt}
		<section
			class="rounded border border-green-200 bg-green-50 p-4 text-sm text-slate-700"
			aria-live="polite"
		>
			<h3 class="font-semibold text-slate-900">Säilytä lähetyskuitti</h3>
			<p class="mt-1">Tarvitset nämä tiedot, jos haluat myöhemmin pyytää aineiston poistamista.</p>
			<dl class="mt-3 grid gap-2 sm:grid-cols-[10rem_1fr]">
				<dt class="font-medium">Tiedosto</dt>
				<dd class="break-all">{submissionReceipt.fileName}</dd>
				<dt class="font-medium">Suolan sormenjälki</dt>
				<dd class="font-mono">{submissionReceipt.saltFingerprint}</dd>
				<dt class="font-medium">Lähetysaika</dt>
				<dd>{new Date(submissionReceipt.submittedAt).toLocaleString('fi-FI')}</dd>
			</dl>
		</section>
	{/if}

	<details class="rounded border border-gray-200 bg-gray-50 p-3">
		<summary class="cursor-pointer font-semibold">Tietoa tutkimuksesta</summary>
		<div class="mt-2 space-y-2 text-sm text-gray-700">
			<p>
				Voit käyttää työkalua pelkästään omien tilitystesi analysointiin tai halutessasi lähettää
				pseudonymisoidun datasi yhteiseen tutkimusaineistoon.
			</p>
			<p>
				Mitä enemmän aineistoa kertyy, sitä paremmin pystymme arvioimaan Teoston palvelutasoa
				kokonaisuutena ja tuottamaan faktapohjaista tietoa musiikintekijöiden käyttöön.
			</p>
			<p>
				Dataa luovutetaan eteenpäin esim. medialle vain täysin anonymisoituna ja sekoitettuna, ja
				vain jos säveltäjiä on mukana ainakin 20.
			</p>
			<p>Tutkimuksen tuottavat Pekka Pulli ja Arttu Silvast.</p>
			<p>
				Kysymysten tai lisäselvitysten osalta voit olla suoraan yhteydessä:
				<a class="underline" href="mailto:hello@pekkapulli.com">hello@pekkapulli.com</a> tai
				<a class="underline" href="mailto:arttu@arttusilvast.com">arttu@arttusilvast.com</a>
			</p>
		</div>
	</details>

	<details class="rounded border border-gray-200 bg-gray-50 p-3">
		<summary class="cursor-pointer font-semibold">Pseudonymisaation periaatteet</summary>
		<ul class="mt-2 list-disc pl-5 text-sm text-gray-700">
			{#each rulesSummary as rule (rule)}
				<li>{rule}</li>
			{/each}
		</ul>
	</details>
</div>
