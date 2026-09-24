const integerFormatter = new Intl.NumberFormat('fi-FI');
const oneDecimalFormatter = new Intl.NumberFormat('fi-FI', {
	minimumFractionDigits: 1,
	maximumFractionDigits: 1
});
const twoDecimalFormatter = new Intl.NumberFormat('fi-FI', {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2
});
const maxTwoDecimalFormatter = new Intl.NumberFormat('fi-FI', { maximumFractionDigits: 2 });
const amountFormatter = new Intl.NumberFormat('fi-FI', { maximumFractionDigits: 2 });

export function formatInteger(value: number): string {
	return integerFormatter.format(value);
}

export function formatOneDecimal(value: number): string {
	return oneDecimalFormatter.format(value);
}

export function formatTwoDecimals(value: number): string {
	return twoDecimalFormatter.format(value);
}

export function formatMaxTwoDecimals(value: number): string {
	return maxTwoDecimalFormatter.format(value);
}

export function formatAmount(value: number): string {
	return amountFormatter.format(value);
}
