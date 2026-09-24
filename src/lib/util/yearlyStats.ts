import type { ParsedRow } from '$lib/types';
import { analyzeStatistics } from './statistics';

export interface YearlyStats {
	year: number;
	totalRows: number;
	sumSumma: number;
	kuukaudetStats: {
		mean: number;
		median: number;
	};
	summaStats: {
		mean: number;
		median: number;
	};
}

export function calculateYearlyStats(rows: ParsedRow[]): YearlyStats[] {
	const byYear: Record<number, ParsedRow[]> = {};

	for (const row of rows) {
		const year =
			row.Tilityksen_pvm instanceof Date && !isNaN(row.Tilityksen_pvm.getTime())
				? row.Tilityksen_pvm.getFullYear()
				: null;
		if (!year) continue;
		if (!byYear[year]) byYear[year] = [];
		byYear[year].push(row);
	}

	return Object.entries(byYear)
		.map(([yearStr, yearRows]) => {
			const year = Number(yearStr);
			const kuukaudet = yearRows
				.map((r) => r.Kuukaudet_esitys_tilitys)
				.filter((v): v is number => v !== null && !isNaN(v));
			const summa = yearRows
				.map((r) => r.Summa)
				.filter((v): v is number => v !== null && !isNaN(v));
			const totalRows = yearRows.length;
			const sumSumma = summa.reduce((a, b) => a + b, 0);
			const kuukaudetStats = {
				mean: kuukaudet.length ? kuukaudet.reduce((a, b) => a + b, 0) / kuukaudet.length : 0,
				median: kuukaudet.length ? analyzeStatistics(kuukaudet).median : 0
			};
			const summaStats = {
				mean: summa.length ? summa.reduce((a, b) => a + b, 0) / summa.length : 0,
				median: summa.length ? analyzeStatistics(summa).median : 0
			};
			return { year, totalRows, sumSumma, kuukaudetStats, summaStats };
		})
		.sort((a, b) => a.year - b.year);
}
