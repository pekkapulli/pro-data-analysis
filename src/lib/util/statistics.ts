import min from 'lodash/min';
import max from 'lodash/max';
import mean from 'lodash/mean';
import { formatMaxTwoDecimals } from './format';

export interface DistributionBin {
	min: number;
	max: number;
	count: number;
	percentage: number;
	label?: string;
	subLabel?: string;
	rowCount?: number;
}

export interface StatisticalAnalysis {
	mean: number;
	median: number;
	min: number;
	max: number;
	count: number;
	sum: number;
	standardDeviation: number;
	distribution: DistributionBin[];
}

export interface AnalyzeStatisticsOptions {
	topBinMin?: number;
	overflowTopLimit?: number;
}

function formatBinRange(min: number, max: number): string {
	return `${formatMaxTwoDecimals(min)} - ${formatMaxTwoDecimals(max)}`;
}

function calculateMedian(values: number[]): number {
	if (values.length === 0) return 0;
	const sorted = [...values].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function analyzeStatistics(
	values: number[],
	binCount: number = 10,
	options?: AnalyzeStatisticsOptions
): StatisticalAnalysis {
	if (values.length === 0) {
		return {
			mean: 0,
			median: 0,
			min: 0,
			max: 0,
			count: 0,
			sum: 0,
			standardDeviation: 0,
			distribution: []
		};
	}

	const filteredValues = values.filter((v) => typeof v === 'number' && !isNaN(v));

	if (filteredValues.length === 0) {
		return {
			mean: 0,
			median: 0,
			min: 0,
			max: 0,
			count: 0,
			sum: 0,
			standardDeviation: 0,
			distribution: []
		};
	}

	const meanValue = mean(filteredValues);
	const medianValue = calculateMedian(filteredValues);
	const minValue = min(filteredValues) || 0;
	const maxValue = max(filteredValues) || 0;
	const sum = filteredValues.reduce((a, b) => a + b, 0);

	// Calculate standard deviation
	const variance =
		filteredValues.reduce((sum, val) => sum + Math.pow(val - meanValue, 2), 0) /
		filteredValues.length;
	const standardDeviation = Math.sqrt(variance);

	// Create distribution bins. If overflowTopLimit is provided, the last bin is labeled N+.
	const distribution: DistributionBin[] = [];
	const hasOverflowTopLimit =
		typeof options?.overflowTopLimit === 'number' &&
		!isNaN(options.overflowTopLimit) &&
		options.overflowTopLimit > minValue &&
		options.overflowTopLimit < maxValue;
	const hasForcedTopBinMin =
		typeof options?.topBinMin === 'number' &&
		!isNaN(options.topBinMin) &&
		options.topBinMin > minValue &&
		options.topBinMin < maxValue &&
		!hasOverflowTopLimit;

	if (hasOverflowTopLimit) {
		const overflowTopLimit = options!.overflowTopLimit as number;
		const regularBins = Math.max(binCount - 1, 1);
		const regularBinWidth = (overflowTopLimit - minValue) / regularBins;

		for (let i = 0; i < regularBins; i++) {
			const binMin = minValue + i * regularBinWidth;
			const binMax =
				i === regularBins - 1 ? overflowTopLimit : minValue + (i + 1) * regularBinWidth;
			const count = filteredValues.filter((v) => v >= binMin && v < binMax).length;
			const percentage = (count / filteredValues.length) * 100;

			distribution.push({
				min: binMin,
				max: binMax,
				count,
				percentage,
				label: formatBinRange(binMin, binMax)
			});
		}

		const topBinCount = filteredValues.filter((v) => v >= overflowTopLimit).length;
		distribution.push({
			min: overflowTopLimit,
			max: maxValue,
			count: topBinCount,
			percentage: (topBinCount / filteredValues.length) * 100,
			label: formatBinRange(overflowTopLimit, maxValue)
		});
	} else if (hasForcedTopBinMin) {
		const topBinMin = options!.topBinMin as number;
		const regularBins = Math.max(binCount - 1, 1);
		const regularBinWidth = (topBinMin - minValue) / regularBins;

		for (let i = 0; i < regularBins; i++) {
			const binMin = minValue + i * regularBinWidth;
			const binMax = i === regularBins - 1 ? topBinMin : minValue + (i + 1) * regularBinWidth;
			const count = filteredValues.filter((v) => v >= binMin && v < binMax).length;
			const percentage = (count / filteredValues.length) * 100;

			distribution.push({
				min: binMin,
				max: binMax,
				count,
				percentage,
				label: formatBinRange(binMin, binMax)
			});
		}

		const topBinCount = filteredValues.filter((v) => v >= topBinMin && v <= maxValue).length;
		distribution.push({
			min: topBinMin,
			max: maxValue,
			count: topBinCount,
			percentage: (topBinCount / filteredValues.length) * 100,
			label: formatBinRange(topBinMin, maxValue)
		});
	} else {
		const binWidth = (maxValue - minValue) / binCount;

		for (let i = 0; i < binCount; i++) {
			const binMin = minValue + i * binWidth;
			const binMax = i === binCount - 1 ? maxValue : minValue + (i + 1) * binWidth;
			const count =
				i === binCount - 1
					? filteredValues.filter((v) => v >= binMin && v <= binMax).length
					: filteredValues.filter((v) => v >= binMin && v < binMax).length;
			const percentage = (count / filteredValues.length) * 100;

			distribution.push({
				min: binMin,
				max: binMax,
				count,
				percentage,
				label: formatBinRange(binMin, binMax)
			});
		}
	}

	return {
		mean: meanValue,
		median: medianValue,
		min: minValue,
		max: maxValue,
		count: filteredValues.length,
		sum,
		standardDeviation,
		distribution
	};
}
