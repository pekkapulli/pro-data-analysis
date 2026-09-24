import { csvFormat } from 'd3-dsv';
import type { ParsedRow } from '$lib/types';

export type PseudonymizationAction = 'poista' | 'säilytä' | 'salaa' | 'kuukausi-vuosi';

export type PseudonymizationRule = {
	field: string;
	action: PseudonymizationAction;
	details: string;
};

export const PSEUDONYMIZATION_RULES: PseudonymizationRule[] = [
	{ field: 'Teoksen numero', action: 'poista', details: 'Poistetaan.' },
	{
		field: 'Teoksen nimi',
		action: 'salaa',
		details: 'SHA-256 hash lisäsuolauksella.'
	},
	{ field: 'Tilityksen lähde', action: 'säilytä', details: 'Säilytetään sellaisenaan.' },
	{ field: 'Tilityksen ID', action: 'poista', details: 'Poistetaan.' },
	{ field: 'Tilityksen nimi', action: 'säilytä', details: 'Säilytetään sellaisenaan.' },
	{
		field: 'Tilityksen pvm',
		action: 'kuukausi-vuosi',
		details: 'Muunnetaan muotoon KK/VVVV, päivä poistetaan.'
	},
	{
		field: 'Oikeudenhaltijan IPI-numero',
		action: 'poista',
		details: 'Poistetaan.'
	},
	{
		field: 'Oikeudenhaltijan nimi',
		action: 'salaa',
		details: 'SHA-256 hash lisäsuolauksella.'
	},
	{ field: 'Oikeudenhaltijan rooli', action: 'säilytä', details: 'Säilytetään sellaisenaan.' },
	{ field: 'Oikeudenhaltijan osuus (%)', action: 'säilytä', details: 'Säilytetään sellaisenaan.' },
	{ field: 'Tilityksen pääkategoria', action: 'säilytä', details: 'Säilytetään sellaisenaan.' },
	{ field: 'Tilityksen välikategoria', action: 'säilytä', details: 'Säilytetään sellaisenaan.' },
	{ field: 'Tilityksen alakategoria', action: 'säilytä', details: 'Säilytetään sellaisenaan.' },
	{
		field: 'Alkuperäinen palvelun/toimijan nimi',
		action: 'poista',
		details: 'Poistetaan.'
	},
	{ field: 'Ohjelman nimi', action: 'poista', details: 'Poistetaan.' },
	{ field: 'Esityspaikan nimi', action: 'poista', details: 'Poistetaan.' },
	{
		field: 'Esiintyjän nimi',
		action: 'salaa',
		details: 'SHA-256 hash lisäsuolauksella.'
	},
	{
		field: 'Esitysajankohta (alku)',
		action: 'kuukausi-vuosi',
		details: 'Muunnetaan muotoon KK/VVVV, päivä poistetaan.'
	},
	{
		field: 'Esitysajankohta (loppu)',
		action: 'kuukausi-vuosi',
		details: 'Muunnetaan muotoon KK/VVVV, päivä poistetaan.'
	},
	{ field: 'Esitysmaa', action: 'säilytä', details: 'Säilytetään sellaisenaan.' },
	{ field: 'ISWC', action: 'poista', details: 'Poistetaan.' },
	{ field: 'ISRC', action: 'poista', details: 'Poistetaan.' },
	{ field: 'Oikeustyyppi', action: 'säilytä', details: 'Säilytetään sellaisenaan.' },
	{ field: 'Kerrat', action: 'säilytä', details: 'Säilytetään sellaisenaan.' },
	{ field: 'Summa (€)', action: 'säilytä', details: 'Säilytetään sellaisenaan.' }
];

type ExportRow = {
	'Teoksen nimi': string;
	'Tilityksen lähde': string;
	'Tilityksen nimi': string;
	'Tilityksen pvm': string;
	'Oikeudenhaltijan nimi': string;
	'Oikeudenhaltijan rooli': string;
	'Oikeudenhaltijan osuus (%)': string;
	'Tilityksen pääkategoria': string;
	'Tilityksen välikategoria': string;
	'Tilityksen alakategoria': string;
	'Esiintyjän nimi': string;
	'Esitysajankohta (alku)': string;
	'Esitysajankohta (loppu)': string;
	Esitysmaa: string;
	Oikeustyyppi: string;
	Kerrat: string;
	'Summa (€)': string;
};

export type PseudonymizedExport = {
	csv: string;
	fileName: string;
	saltFingerprint: string;
};

function createSalt(bytes = 16): string {
	const randomValues = crypto.getRandomValues(new Uint8Array(bytes));
	return Array.from(randomValues, (value) => value.toString(16).padStart(2, '0')).join('');
}

function normalizeForHashing(value: string): string {
	return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

async function sha256Hex(value: string): Promise<string> {
	const encoded = new TextEncoder().encode(value);
	const digest = await crypto.subtle.digest('SHA-256', encoded);
	const bytes = new Uint8Array(digest);
	return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hashValue(value: string, salt: string): Promise<string> {
	if (!value.trim()) return '';
	return sha256Hex(`${salt}:${normalizeForHashing(value)}`);
}

function formatMonthYear(value: Date | null): string {
	if (!value) return '';
	const month = String(value.getMonth() + 1).padStart(2, '0');
	return `${month}/${value.getFullYear()}`;
}

function formatKerrat(value: number | null): string {
	if (value === null || Number.isNaN(value)) return '';
	return Number.isInteger(value) ? String(value) : value.toString();
}

function buildFileName(): string {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	return `teosto-pseudonymized-${year}-${month}-${day}.csv`;
}

export async function buildPseudonymizedCsvExport(rows: ParsedRow[]): Promise<PseudonymizedExport> {
	const salt = createSalt();
	const exportRows = await Promise.all(
		rows.map(async (row): Promise<ExportRow> => {
			return {
				'Teoksen nimi': await hashValue(row.Teoksen_nimi, salt),
				'Tilityksen lähde': row.Tilityksen_lahde,
				'Tilityksen nimi': row.Tilityksen_nimi,
				'Tilityksen pvm': formatMonthYear(row.Tilityksen_pvm),
				'Oikeudenhaltijan nimi': await hashValue(row.Oikeudenhaltijan_nimi, salt),
				'Oikeudenhaltijan rooli': row.Oikeudenhaltijan_rooli,
				'Oikeudenhaltijan osuus (%)': row.Oikeudenhaltijan_osuus,
				'Tilityksen pääkategoria': row.Tilityksen_paakategoria,
				'Tilityksen välikategoria': row.Tilityksen_valikategoria,
				'Tilityksen alakategoria': row.Tilityksen_alakategoria,
				'Esiintyjän nimi': await hashValue(row.Esiintyjan_nimi, salt),
				'Esitysajankohta (alku)': formatMonthYear(row.Esitysajankohta_alku),
				'Esitysajankohta (loppu)': formatMonthYear(row.Esitysajankohta_loppu),
				Esitysmaa: row.Esitysmaa,
				Oikeustyyppi: row.Oikeustyyppi,
				Kerrat: formatKerrat(row.Kerrat),
				'Summa (€)': row.Summa !== null && !Number.isNaN(row.Summa) ? row.Summa.toString() : ''
			};
		})
	);

	return {
		csv: csvFormat(exportRows),
		fileName: buildFileName(),
		saltFingerprint: salt.slice(0, 8)
	};
}
