import { env } from '$env/dynamic/private';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { buildSendgridPseudonymizedMailPayload } from '$lib/util/sendPseudonymizedEmail';

const EMAIL_VALIDATION = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const actions: Actions = {
	sendPseudonymizedEmail: async ({ request }) => {
		const formData = await request.formData();
		const targetEmail = env.SENDGRID_TARGET_EMAIL?.trim();
		const senderEmail = env.SENDGRID_SENDER_EMAIL?.trim();
		const csv = ((formData.get('csv') as string | null) ?? '').trim();
		const fileName =
			((formData.get('fileName') as string | null) ?? 'teosto-pseudonymized.csv').trim() ||
			'teosto-pseudonymized.csv';
		const saltFingerprint = ((formData.get('saltFingerprint') as string | null) ?? '').trim();
		const hasResearchConsent = formData.get('researchConsent') === 'yes';

		const base = { email: targetEmail ?? '', fileName, saltFingerprint, error: '' };

		if (!targetEmail || !EMAIL_VALIDATION.test(targetEmail)) {
			console.error('SENDGRID_TARGET_EMAIL is not configured or invalid');
			return fail(500, {
				...base,
				error: 'Email service is not configured. Please contact the site administrator directly.'
			});
		}

		if (!senderEmail || !EMAIL_VALIDATION.test(senderEmail)) {
			console.error('SENDGRID_SENDER_EMAIL is not configured or invalid');
			return fail(500, {
				...base,
				error: 'Email service is not configured. Please contact the site administrator directly.'
			});
		}

		if (!csv) {
			return fail(400, { ...base, error: 'No pseudonymized CSV data was provided.' });
		}

		if (!hasResearchConsent) {
			return fail(400, {
				...base,
				error: 'Tietosuojaselosteen hyväksyminen ja suostumus ovat pakollisia ennen lähetystä.'
			});
		}

		const apiKey = env.SENDGRID_API_KEY?.trim();
		if (!apiKey) {
			console.error('SENDGRID_API_KEY is not configured');
			return fail(500, {
				...base,
				error: `Email service is not configured. Please email ${targetEmail} directly.`
			});
		}

		const submittedAt = new Date().toISOString();
		const payload = buildSendgridPseudonymizedMailPayload({
			to: targetEmail,
			csv,
			fileName,
			saltFingerprint,
			senderEmail,
			consentConfirmedAt: submittedAt
		});

		let response: Response;
		try {
			response = await fetch('https://api.sendgrid.com/v3/mail/send', {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${apiKey}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(payload)
			});
		} catch (err) {
			console.error('SendGrid fetch error:', err);
			return fail(500, {
				...base,
				error: `Could not send your message. Please try again or email ${targetEmail} directly.`
			});
		}

		const responseText = await response.text().catch(() => '(unreadable)');
		console.log('[sendgrid] status', response.status, response.statusText);
		console.log('[sendgrid] headers', Object.fromEntries(response.headers.entries()));
		console.log('[sendgrid] body', responseText);

		if (!response.ok) {
			console.error(`SendGrid error: ${response.status} ${response.statusText}`, responseText);
			return fail(500, {
				...base,
				error: `Could not send your message. Please try again or email ${targetEmail} directly.`
			});
		}

		return { success: true, fileName, saltFingerprint, submittedAt };
	}
};
