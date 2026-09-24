import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildPseudonymizedCsvExport } from '../src/lib/util/pseudonymizedCsv.ts';
import { buildSendgridPseudonymizedMailPayload } from '../src/lib/util/sendPseudonymizedEmail.ts';

describe('buildSendgridPseudonymizedMailPayload', () => {
	it('builds a valid attachment payload for a pseudonymized CSV export', () => {
		const payload = buildSendgridPseudonymizedMailPayload({
			to: 'researcher@example.com',
			csv: 'col1,col2\n1,2\n',
			fileName: 'teosto-pseudonymized.csv',
			saltFingerprint: 'abc12345',
			senderEmail: 'sender@example.com'
		});

		assert.equal(payload.personalizations[0].to[0].email, 'researcher@example.com');
		assert.equal(payload.from.email, 'sender@example.com');
		assert.equal(payload.subject, 'Pseudonymized Teosto export: teosto-pseudonymized.csv');
		assert.equal(payload.attachments?.[0].filename, 'teosto-pseudonymized.csv');
		assert.equal(payload.attachments?.[0].type, 'text/csv');
		assert.equal(payload.content[0].type, 'text/plain');
		assert.match(payload.attachments?.[0].content ?? '', /^[A-Za-z0-9+/=]+$/);
		assert.match(payload.content[0].value, /abc12345/);
	});

	it('keeps the paid amount column in the pseudonymized CSV export', async () => {
		const result = await buildPseudonymizedCsvExport([
			{
				Teoksen_nimi: 'Song A',
				Tilityksen_lahde: 'Streaming',
				Tilityksen_nimi: 'Revenue',
				Tilityksen_pvm: new Date('2024-02-15'),
				Oikeudenhaltijan_nimi: 'Composer One',
				Oikeudenhaltijan_rooli: 'Composer',
				Oikeudenhaltijan_osuus: '100',
				Tilityksen_paakategoria: 'Online',
				Tilityksen_valikategoria: 'Streaming',
				Tilityksen_alakategoria: 'Subscription',
				Esiintyjan_nimi: 'Artist One',
				Esitysajankohta_alku: new Date('2024-01-01'),
				Esitysajankohta_loppu: new Date('2024-01-31'),
				Esitysmaa: 'Finland',
				Oikeustyyppi: 'Mechanical',
				Kerrat: 1,
				Summa: 123.45,
				Tilityksen_ID: 101,
				Teoksen_numero: '1',
				Oikeudenhaltijan_IPI_numero: '123',
				Alkuperainen_palvelun_toimijan_nimi: 'Service',
				Ohjelman_nimi: 'Program',
				Esityspaikan_nimi: 'Venue',
				ISWC: 'T1234567890',
				ISRC: 'US1234567890',
				Kuukaudet_esitys_tilitys: 2
			}
		]);

		assert.match(result.csv, /Summa \(€\)/);
		assert.match(result.csv, /123\.45/);
	});
});
