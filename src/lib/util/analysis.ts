import type { OptionType, ParsedRow } from '$lib/types';

export const ALL_COUNTRIES_OPTION_VALUE = '__all__';
export const FOREIGN_COUNTRIES_OPTION_VALUE = '__ulkomaat__';
export const ALL_SOURCES_OPTION_VALUE = '__all_sources__';
export const NON_ONLINE_SOURCE_OPTION_VALUE = '__non_online__';
export const ONLINE_SOURCE_VALUE = 'Online';

export const getCountryOptionsFromData = (rows: ParsedRow[]): OptionType[] => {
	const countryCounts = new Map<string, number>();
	let totalCount = 0;
	let foreignCount = 0;

	rows.forEach((row) => {
		if (row.Esitysmaa && row.Esitysmaa !== 'Suomi') {
			foreignCount++;
		}

		if (row.Esitysmaa) {
			totalCount++;
			countryCounts.set(row.Esitysmaa, (countryCounts.get(row.Esitysmaa) ?? 0) + 1);
		}
	});

	const suomiCount = countryCounts.get('Suomi') ?? 0;

	return [
		{
			label: 'Kaikki maat',
			value: ALL_COUNTRIES_OPTION_VALUE,
			count: totalCount
		},
		{
			label: 'Suomi',
			value: 'Suomi',
			count: suomiCount
		},
		{
			label: 'Ulkomaat',
			value: FOREIGN_COUNTRIES_OPTION_VALUE,
			count: foreignCount
		},
		...Array.from(countryCounts.entries())
			.filter(([country]) => country !== 'Suomi')
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([country, count]) => ({ label: country, value: country, count }))
	];
};

export const getSourceOptionsFromData = (rows: ParsedRow[]): OptionType[] => {
	const sourceCounts = new Map<string, number>();
	let totalCount = 0;
	let nonOnlineCount = 0;

	rows.forEach((row) => {
		if (!row.Tilityksen_paakategoria) return;

		totalCount++;
		if (row.Tilityksen_paakategoria !== ONLINE_SOURCE_VALUE) {
			nonOnlineCount++;
		}
		sourceCounts.set(
			row.Tilityksen_paakategoria,
			(sourceCounts.get(row.Tilityksen_paakategoria) ?? 0) + 1
		);
	});

	return [
		{
			label: 'Kaikki lähteet',
			value: ALL_SOURCES_OPTION_VALUE,
			count: totalCount
		},
		{
			label: 'Ei online-lähteet',
			value: NON_ONLINE_SOURCE_OPTION_VALUE,
			count: nonOnlineCount
		},
		...Array.from(sourceCounts.entries())
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([source, count]) => ({ label: source, value: source, count }))
	];
};
