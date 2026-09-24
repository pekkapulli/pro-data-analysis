import { csvParse } from 'd3-dsv';
import type { Row, ParsedRow } from '$lib/types';

export class CsvParseError extends Error {
	constructor(
		message: string,
		public fileName: string | null = null,
		public rowNumber: number | null = null,
		public columnName: string | null = null
	) {
		super(message);
		this.name = 'CsvParseError';
	}

	getDetailedMessage(): string {
		let msg = this.message;
		if (this.fileName) {
			msg += ` (tiedosto: ${this.fileName})`;
		}
		if (this.rowNumber !== null) {
			msg += ` (rivi: ${this.rowNumber})`;
		}
		if (this.columnName) {
			msg += ` (sarake: ${this.columnName})`;
		}
		return msg;
	}
}

const columnMap: Record<string, keyof Row> = {
	'Teoksen numero': 'Teoksen_numero',
	'Teoksen nimi': 'Teoksen_nimi',
	'Tilityksen lähde': 'Tilityksen_lahde',
	'Tilityksen ID': 'Tilityksen_ID',
	'Tilityksen nimi': 'Tilityksen_nimi',
	'Tilityksen pvm': 'Tilityksen_pvm',
	'Oikeudenhaltijan IPI-numero': 'Oikeudenhaltijan_IPI_numero',
	'Oikeudenhaltijan nimi': 'Oikeudenhaltijan_nimi',
	'Oikeudenhaltijan rooli': 'Oikeudenhaltijan_rooli',
	'Oikeudenhaltijan osuus (%)': 'Oikeudenhaltijan_osuus',
	'Tilityksen pääkategoria': 'Tilityksen_paakategoria',
	'Tilityksen välikategoria': 'Tilityksen_valikategoria',
	'Tilityksen alakategoria': 'Tilityksen_alakategoria',
	'Alkuperäinen palvelun/toimijan nimi': 'Alkuperainen_palvelun_toimijan_nimi',
	'Ohjelman nimi': 'Ohjelman_nimi',
	'Esityspaikan nimi': 'Esityspaikan_nimi',
	'Esiintyjän nimi': 'Esiintyjan_nimi',
	'Esitysajankohta (alku)': 'Esitysajankohta_alku',
	'Esitysajankohta (loppu)': 'Esitysajankohta_loppu',
	Esitysmaa: 'Esitysmaa',
	ISWC: 'ISWC',
	ISRC: 'ISRC',
	Oikeustyyppi: 'Oikeustyyppi',
	Kerrat: 'Kerrat',
	'Summa (€)': 'Summa'
};

function parseDate(str: string): Date | null {
	if (!str || str.trim() === '') return null;
	const date = new Date(str);
	return isNaN(date.getTime()) ? null : date;
}

function parseNumber(str: string): number | null {
	if (!str || str.trim() === '') return null;
	const parsed = parseFloat(str.replace(',', '.'));
	return isNaN(parsed) ? null : parsed;
}

function calculateMonthsBetween(startDate: Date | null, endDate: Date | null): number | null {
	if (!startDate || !endDate) return null;
	const months =
		(endDate.getFullYear() - startDate.getFullYear()) * 12 +
		(endDate.getMonth() - startDate.getMonth());
	return months >= 0 ? months : null;
}

const filterByNegativeSumma = (row: ParsedRow) => {
	return row.Summa !== null && row.Summa >= 0;
};

export function parseTeostoCsvContent(content: string, fileName?: string): ParsedRow[] {
	if (!content || !content.trim()) {
		throw new CsvParseError('CSV-tiedosto on tyhjä', fileName);
	}

	let parsed: Array<Record<string, string>>;
	try {
		parsed = csvParse(content);
	} catch (error) {
		throw new CsvParseError(
			`CSV-tiedoston jäsentäminen epäonnistui: ${error instanceof Error ? error.message : 'Tuntematon virhe'}`,
			fileName
		);
	}

	if (parsed.length === 0) {
		throw new CsvParseError('CSV-tiedostossa ei ole data-rivejä', fileName);
	}

	// Validate that all required columns are present
	const firstRow = parsed[0];
	const missingColumns: string[] = [];
	for (const csvCol of Object.keys(columnMap)) {
		if (!(csvCol in firstRow)) {
			missingColumns.push(csvCol);
		}
	}

	if (missingColumns.length > 0) {
		throw new CsvParseError(`Puuttuvia sarakkeita: ${missingColumns.join(', ')}`, fileName);
	}

	// Parse rows with error tracking
	const parsedRows: ParsedRow[] = [];
	for (let i = 0; i < parsed.length; i++) {
		try {
			const d = parsed[i];
			const row: Partial<Row> = {};
			for (const [csvCol, typeKey] of Object.entries(columnMap)) {
				row[typeKey] = (d[csvCol] ?? '') as never;
			}

			const rawRow = row as Row;
			const parsedRow: ParsedRow = {
				...rawRow,
				Kerrat: parseNumber(rawRow.Kerrat),
				Summa: parseNumber(rawRow.Summa),
				Tilityksen_ID: parseNumber(rawRow.Tilityksen_ID),
				Esitysajankohta_alku: parseDate(rawRow.Esitysajankohta_alku),
				Esitysajankohta_loppu: parseDate(rawRow.Esitysajankohta_loppu),
				Tilityksen_pvm: parseDate(rawRow.Tilityksen_pvm),
				Kuukaudet_esitys_tilitys: calculateMonthsBetween(
					parseDate(rawRow.Esitysajankohta_loppu),
					parseDate(rawRow.Tilityksen_pvm)
				)
			};

			if (filterByNegativeSumma(parsedRow)) {
				parsedRows.push(parsedRow);
			}
		} catch (error) {
			throw new CsvParseError(
				`Rivin jäsentäminen epäonnistui: ${error instanceof Error ? error.message : 'Tuntematon virhe'}`,
				fileName,
				i + 2 // +2 because row 1 is header, and arrays are 0-indexed
			);
		}
	}

	return parsedRows;
}

export function parseTeostoCsvContents(contents: string[], fileNames?: string[]): ParsedRow[] {
	const allRows: ParsedRow[] = [];

	for (let i = 0; i < contents.length; i++) {
		const content = contents[i];
		const fileName = fileNames?.[i];
		try {
			allRows.push(...parseTeostoCsvContent(content, fileName));
		} catch (error) {
			if (error instanceof CsvParseError) {
				throw error;
			}
			throw new CsvParseError(`Tiedoston käsittely epäonnistui`, fileName);
		}
	}

	return allRows;
}

export async function parseTeostoCsvFilesFromGlob(
	rawFiles: Record<string, () => Promise<unknown>>
): Promise<ParsedRow[]> {
	const allRows: ParsedRow[] = [];

	for (const path in rawFiles) {
		try {
			const content = (await rawFiles[path]()) as string;
			allRows.push(...parseTeostoCsvContent(content, path));
		} catch (error) {
			if (error instanceof CsvParseError) {
				throw error;
			}
			throw new CsvParseError(`Tiedoston käsittely epäonnistui`, path);
		}
	}

	return allRows;
}
