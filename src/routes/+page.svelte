<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { parseTeostoCsvContents, CsvParseError } from '$lib/util/teostoCsv.js';
	import { saveUploadedSession } from '$lib/util/uploadSession';

	import hero from '$lib/assets/haro.jpg';
	import logo from '$lib/assets/logo.svg';

	let isProcessingUpload = $state(false);
	let uploadError = $state<string | null>(null);

	function onDragOver(event: DragEvent) {
		event.preventDefault();
	}

	function onDragLeave(event: DragEvent) {
		event.preventDefault();
	}

	async function processUploadedFiles(files: FileList | File[]) {
		const fileArray = Array.from(files);
		if (fileArray.length === 0) return;

		isProcessingUpload = true;
		uploadError = null;

		try {
			// Read file contents with error handling per file
			const fileReadPromises = fileArray.map(async (file) => {
				try {
					const content = await file.text();
					return { content, fileName: file.name };
				} catch (error) {
					throw new CsvParseError(
						`Tiedoston lukeminen epäonnistui: ${error instanceof Error ? error.message : 'Tuntematon virhe'}`,
						file.name
					);
				}
			});

			const fileData = await Promise.all(fileReadPromises);
			const contents = fileData.map((f) => f.content);
			const fileNames = fileData.map((f) => f.fileName);

			const parsedRows = parseTeostoCsvContents(contents, fileNames);
			await saveUploadedSession(parsedRows, fileNames);
			await goto(resolve('/analysis'));
		} catch (error) {
			if (error instanceof CsvParseError) {
				uploadError = error.getDetailedMessage();
			} else if (error instanceof Error) {
				// Handle storage quota exceeded errors
				if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
					uploadError =
						'Tiedosto on liian suuri tallennettavaksi. Yritä pienemmällä tiedostolla tai tyhjennä selaimen välimuisti.';
				} else {
					uploadError = `Virhe: ${error.message}`;
				}
			} else {
				uploadError =
					'CSV-tiedostojen lukeminen ei onnistunut. Tarkista, että tiedostot ovat Teoston CSV-muodossa.';
			}
		} finally {
			isProcessingUpload = false;
		}
	}

	async function onDrop(event: DragEvent) {
		event.preventDefault();
		const files = event.dataTransfer?.files;
		if (files && files.length > 0) {
			await processUploadedFiles(files);
		}
	}

	async function onFileInputChange(event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		const files = target.files;
		if (files && files.length > 0) {
			await processUploadedFiles(files);
			target.value = '';
		}
	}
</script>

<main class="relative overflow-hidden">
	<div class="relative mx-auto mb-4 w-full overflow-hidden shadow-sm">
		<div
			class="absolute inset-0 bg-cover bg-center"
			style={`background-image: url('${hero}')`}
		></div>
		<div class="absolute inset-0 bg-slate-900/20"></div>
		<img
			src={logo}
			alt="Rojaltit.net"
			class="relative z-10 mx-auto block w-full max-w-4xl px-4 py-10 sm:py-14"
		/>
	</div>
	<section class="mx-auto max-w-xl px-6 pt-20 pb-16 md:pt-28">
		<header class="mb-12 max-w-4xl">
			<h1 class="mb-4 text-4xl leading-tight font-semibold text-slate-900 md:text-6xl">
				Analysoi teostodatasi
			</h1>
			<p class="max-w-2xl text-lg leading-relaxed text-slate-700">
				Tuo Teosto-datasi työkaluun ja tarkastele korvauksiasi maittain, biiseittäin,
				esitystavoittain tai ajanjaksoittain. Kaikki käsittely tapahtuu selaimessasi, eikä dataasi
				lähetetä palvelimelle.
			</p>
		</header>

		<section
			class="max-w-2xl border border-dashed border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur"
			aria-label="CSV-latausalue"
			ondragover={onDragOver}
			ondragleave={onDragLeave}
			ondrop={onDrop}
		>
			<p class="mb-6 leading-relaxed text-slate-700">
				Vedä Teosto CSV -tiedostot tähän tai valitse ne koneeltasi.
			</p>

			<label
				class="inline-flex cursor-pointer items-center rounded-full bg-money-green px-5 py-2.5 font-semibold text-white transition hover:opacity-90"
				for="csv-upload"
			>
				Valitse CSV-tiedostot
			</label>
			<input
				id="csv-upload"
				class="hidden"
				type="file"
				accept=".csv,text/csv"
				multiple
				onchange={onFileInputChange}
			/>

			{#if isProcessingUpload}
				<p class="mt-4 text-sm text-blue-700">Luetaan tiedostoja ja valmistellaan analyysia...</p>
			{/if}

			{#if uploadError}
				<p class="mt-4 text-sm text-red-700">{uploadError}</p>
			{/if}
		</section>

		<section class="mt-10 max-w-xl text-slate-700" aria-label="CSV-latausohjeet">
			<h2 class="mb-4 text-2xl font-semibold text-slate-900">Näin lataat tilitysdatasi</h2>
			<p class="mb-4 leading-relaxed">
				Aloita lataamalla yksi tai useampi CSV-muotoinen tilitystiedosto Teosto-tililtäsi.
			</p>
			<ol class="list-inside list-decimal space-y-2 leading-relaxed">
				<li>Kirjaudu Teosto-tilillesi.</li>
				<li>Siirry kohtaan <strong>Korvaukset</strong>.</li>
				<li>Valitse välilehti <strong>Kertyneet tilitykset</strong>.</li>
				<li>Valitse välilehti <strong>Vuosittain</strong>.</li>
				<li>Valitse <strong>Lataa tilitysdata Exceliin</strong>.</li>
				<li>
					Lataa CSV-tiedostot haluamiltasi ajajaksoilta. Tässä voi kestää hetki, joten kahvikuppi
					voi olla hyvä idea.
				</li>
				<li>Tuo lataamasi CSV-tiedosto(t) Rojaltit.netiin ja aloita analyysi.</li>
			</ol>
			<p class="mt-4 leading-relaxed">
				Tilitysdata käsitellään kokonaan selaimessasi, eikä sitä lähetetä palvelimelle. Emme käytä
				seurantakeksejä emmekä kerää henkilötietoja. Datasi pysyy sinulla ellet halua jakaa sitä
				itse.
			</p>
		</section>
	</section>
	<section class="mx-auto max-w-xl px-6 pb-24 text-slate-700">
		<article>
			<h2 class="text-md mb-2 font-bold tracking-[0.12em] uppercase">Tietoja</h2>
			<p>
				Rojaltit.net on riippumaton työkalu, jonka ovat rakentaneet säveltäjä ja data-asiantuntija
				Pekka Pulli sekä säveltäjä Arttu Silvast.
			</p>
			<p>
				Tekijänoikeuskorvaukset muodostavat monelle musiikintekijälle merkittävän osan
				toimeentulosta. Omien tilitysten kokonaiskuvan hahmottaminen voi silti olla vaikeaa.
			</p>
			<p>
				Kuinka kauan musiikin käytöstä korvauksen maksamiseen kuluu? Ovatko tilitysajat muuttuneet
				vuosien aikana? Miten eri maat ja tilitysalueet eroavat toisistaan? Kuinka paljon vanhoihin
				käyttöjaksoihin liittyviä korvauksia maksetaan vielä vuosia myöhemmin?
			</p>
			<p>
				Rakensimme Rojaltit.netin, jotta musiikintekijät voivat tutkia omia tilitystietojaan
				helposti ja muodostaa kokonaiskuvan korvaustensa määrästä, rakenteesta ja ajoituksesta.
			</p>
			<p>
				Samalla haluamme tutkia laajemman aineiston avulla, miten tilitysajat ja niiden vaihtelu
				ovat kehittyneet eri tilitysalueilla, maissa ja vuosina.
			</p>
			<h3>Mitä omasta tilitysdatasta voidaan tietää?</h3>
			<p>
				Rojaltit.net analysoi oikeudenhaltijalle hänen omista tilityksistään toimitettua dataa.
				Tällä hetkellä työkalu tukee Teoston CSV-muotoista tilitysdataa.
			</p>
			<p>
				Työkalu näyttää sen, mitä datasta voidaan todentaa – eikä päättele sellaista, mihin
				lähdedata ei anna vastausta.
			</p>
			<p>
				Tilitysdatasta voidaan nähdä esimerkiksi maksetut korvaukset, niihin liittyvät käyttöjaksot
				ja tilitysalueet sekä maksamisen ajankohta. Näiden tietojen perusteella voidaan mitata
				käytön ja maksamisen välistä aikaa, vertailla eri maita ja tilitysalueita sekä tarkastella,
				kuinka paljon vanhoihin käyttöjaksoihin liittyviä korvauksia maksetaan myöhemmin.
			</p>
			<p>
				Kaikki korvauksen elinkaaren arvioimiseksi tarvittavat tiedot eivät kuitenkaan sisälly
				oikeudenhaltijalle toimitettavaan tilitysdataan. Pelkän tilitysdatan perusteella ei
				välttämättä voida vastata esimerkiksi seuraaviin kysymyksiin:
			</p>
			<ul>
				<li>Milloin korvaus alun perin kerättiin tai vastaanotettiin?</li>
				<li>Missä tilitysprosessin vaiheessa mahdollinen pitkä käsittelyaika syntyi?</li>
				<li>
					Mikä korvauksen määrä oli ennen hallinnointipalkkioita ja muita vähennyksiä, ja mitä siitä
					vähennettiin?
				</li>
				<li>
					Onko korvaus maksettu yhteishallinnointilain mukaisessa määräajassa ja, jos määräaika
					ylittyi, mikä oli viiveen objektiivinen syy?
				</li>
				<li>Onko oikeudenhaltijalle kohdennettu korvauksia, joita ei ole vielä maksettu?</li>
				<li>
					Miten voidaan varmistua siitä, että kaikki oikeudenhaltijalle kuuluvat korvaukset on
					tunnistettu, kohdistettu ja tilitetty?
				</li>
			</ul>
			<p>
				Myöskään viimeiseen kysymykseen ei voida vastata pelkän tilitysdatan perusteella. Se
				edellyttäisi lisäksi tietoa musiikin käytöstä ja siitä, mitä käyttöä kotimaisille tai
				ulkomaisille tekijänoikeusjärjestöille on raportoitu.
			</p>
			<h3>Yhteinen tutkimusaineisto</h3>
			<p>
				Voit käyttää Rojaltit.netiä pelkästään omien tilitystesi analysointiin. Tällöin tilitysdata
				käsitellään selaimessasi eikä sitä lähetetä palvelimelle.
			</p>
			<p>
				Halutessasi voit erikseen osallistua yhteisen tutkimusaineiston muodostamiseen. Tällöin
				palvelimelle lähetettävästä aineistosta poistetaan suorat tunnistetiedot, aineisto
				pseudonymisoidaan ja lähetettävät tiedot rajataan tutkimuksen kannalta tarpeellisiin
				tietoihin.
			</p>
			<p>
				Mitä enemmän vertailukelpoista aineistoa kertyy, sitä paremmin voimme tutkia esimerkiksi:
			</p>
			<ul>
				<li>tilitysaikojen jakaumia</li>
				<li>eri tilitysalueiden ja maiden välisiä eroja</li>
				<li>vanhoihin käyttöjaksoihin liittyvien myöhempien tilitysten määrää</li>
				<li>tilitysaikojen muutoksia eri vuosina.</li>
			</ul>
			<p>
				Ennen aineiston lähettämistä näet, mitä tietoja aineistosta poistetaan ja mitä tietoja
				yhteiseen tutkimusaineistoon lähetetään. Aineiston lähettäminen tulee mahdolliseksi vasta,
				kun olet ladannut tilitysdatasi selaimelle.
			</p>
			<p>
				Kysymyksissä ja lisätietoja varten voit olla suoraan yhteydessä:
				<a class="underline" href="mailto:arttu@arttusilvast.com">arttu@arttusilvast.com</a> tai
				<a class="underline" href="mailto:hello@pekkapulli.com">hello@pekkapulli.com</a>.
			</p>

			<p class="mt-6">
				Sivua hallinnoi
				<a
					href="https://www.pekkapulli.com"
					target="_blank"
					rel="noreferrer"
					class="underline decoration-slate-400 underline-offset-2 hover:decoration-slate-700"
				>
					Pekka Pulli
				</a>. Lähdekoodi on saatavilla
				<a
					href="https://github.com/pekkapulli/pro-data-analysis"
					target="_blank"
					rel="noreferrer"
					class="underline decoration-slate-400 underline-offset-2 hover:decoration-slate-700"
					>GitHubissa</a
				>.
			</p>
		</article>
	</section>
</main>

<style>
	p {
		line-height: 1.6;
		margin-bottom: 1rem;
	}

	ul {
		list-style-type: disc;
		margin-left: 1.5rem;
		margin-bottom: 1rem;
	}
</style>
