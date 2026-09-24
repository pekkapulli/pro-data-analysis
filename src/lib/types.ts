export interface Row {
	Teoksen_numero: string;
	Teoksen_nimi: string;
	Tilityksen_lahde: string;
	Tilityksen_ID: string;
	Tilityksen_nimi: string;
	Tilityksen_pvm: string;
	Oikeudenhaltijan_IPI_numero: string;
	Oikeudenhaltijan_nimi: string;
	Oikeudenhaltijan_rooli: string;
	Oikeudenhaltijan_osuus: string;
	Tilityksen_paakategoria: string;
	Tilityksen_valikategoria: string;
	Tilityksen_alakategoria: string;
	Alkuperainen_palvelun_toimijan_nimi: string;
	Ohjelman_nimi: string;
	Esityspaikan_nimi: string;
	Esiintyjan_nimi: string;
	Esitysajankohta_alku: string;
	Esitysajankohta_loppu: string;
	Esitysmaa: string;
	ISWC: string;
	ISRC: string;
	Oikeustyyppi: string;
	Kerrat: string;
	Summa: string;
}

export type ParsedRow = Omit<
	Row,
	| 'Kerrat'
	| 'Summa'
	| 'Tilityksen_ID'
	| 'Esitysajankohta_alku'
	| 'Esitysajankohta_loppu'
	| 'Tilityksen_pvm'
> & {
	Kerrat: number | null;
	Summa: number | null;
	Tilityksen_ID: number | null;
	Esitysajankohta_alku: Date | null;
	Esitysajankohta_loppu: Date | null;
	Tilityksen_pvm: Date | null;
	Kuukaudet_esitys_tilitys: number | null;
};

export type OptionType = {
	label: string;
	value: string;
	count?: number;
};
