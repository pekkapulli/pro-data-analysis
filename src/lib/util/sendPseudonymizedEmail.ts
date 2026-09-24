export type SendgridPseudonymizedMailInput = {
	to: string;
	csv: string;
	fileName: string;
	saltFingerprint?: string;
	senderEmail: string;
	consentConfirmedAt?: string;
};

export function buildSendgridPseudonymizedMailPayload({
	to,
	csv,
	fileName,
	saltFingerprint = '',
	senderEmail,
	consentConfirmedAt = ''
}: SendgridPseudonymizedMailInput) {
	const attachmentContent = Buffer.from(csv, 'utf-8').toString('base64');
	const resolvedSenderEmail = senderEmail.trim();
	if (!resolvedSenderEmail) {
		throw new Error('SENDGRID_SENDER_EMAIL is not configured');
	}
	const messageLines = [
		'Pseudonymized Teosto export attached.',
		'',
		`File: ${fileName}`,
		saltFingerprint ? `Salt fingerprint: ${saltFingerprint}` : '',
		consentConfirmedAt ? `Research consent confirmed at: ${consentConfirmedAt}` : '',
		'',
		'This CSV was generated from the pseudonymized export in the Teosto analysis tool.'
	].filter(Boolean);

	return {
		personalizations: [{ to: [{ email: to }] }],
		from: { email: resolvedSenderEmail, name: 'The Sharpest Note' },
		reply_to: { email: resolvedSenderEmail, name: 'The Sharpest Note' },
		subject: `Pseudonymized Teosto export: ${fileName}`,
		content: [{ type: 'text/plain', value: messageLines.join('\n') }],
		attachments: [
			{
				content: attachmentContent,
				filename: fileName,
				type: 'text/csv',
				disposition: 'attachment'
			}
		]
	};
}
