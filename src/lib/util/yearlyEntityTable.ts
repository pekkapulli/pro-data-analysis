import type { ParsedRow } from '$lib/types';

export type YearlyPoint = {
	year: number;
	rows: number;
	sum: number;
};

export type YearlyEntityTableItem = {
	item: string;
	totalRows: number;
	totalSum: number;
	yearly: YearlyPoint[];
};

export function buildYearlyEntityTable(
	rows: ParsedRow[],
	getEntityName: (row: ParsedRow) => string | null | undefined
): YearlyEntityTableItem[] {
	const yearlyByEntity: Record<string, Record<number, { rows: number; sum: number }>> = {};

	for (const row of rows) {
		const item = getEntityName(row)?.trim();
		const year = row.Tilityksen_pvm?.getFullYear();
		if (!item || !year) continue;

		const yearlyMap = yearlyByEntity[item] ?? {};
		const yearlyValue = yearlyMap[year] ?? { rows: 0, sum: 0 };

		yearlyValue.rows += 1;
		yearlyValue.sum += row.Summa ?? 0;

		yearlyMap[year] = yearlyValue;
		yearlyByEntity[item] = yearlyMap;
	}

	return Object.entries(yearlyByEntity)
		.map(([item, yearlyMap]) => {
			const yearly = Object.entries(yearlyMap)
				.map(([year, values]) => ({
					year: Number(year),
					rows: values.rows,
					sum: values.sum
				}))
				.sort((a, b) => a.year - b.year);

			const totalRows = yearly.reduce((acc, point) => acc + point.rows, 0);
			const totalSum = yearly.reduce((acc, point) => acc + point.sum, 0);

			return {
				item,
				totalRows,
				totalSum,
				yearly
			};
		})
		.sort((a, b) => {
			if (b.totalRows !== a.totalRows) return b.totalRows - a.totalRows;
			return b.totalSum - a.totalSum;
		});
}
