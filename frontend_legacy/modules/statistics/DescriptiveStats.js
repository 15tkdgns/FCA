/**
 * Descriptive Statistics Module
 * 기술 통계 분석 기능을 담당하는 모듈
 */
export class DescriptiveStats {
    constructor() {
        this.stats = {
            mean: null,
            median: null,
            mode: null,
            variance: null,
            standardDeviation: null,
            skewness: null,
            kurtosis: null,
            range: null,
            quartiles: null
        };
    }

    /**
     * 기술통계 계산
     * @param {Array} data - 분석할 데이터 배열
     * @returns {Object} 계산된 통계량들
     */
    calculate(data) {
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error('Invalid data array provided');
        }

        const sortedData = [...data].sort((a, b) => a - b);
        const n = data.length;

        this.stats.mean = this.calculateMean(data);
        this.stats.median = this.calculateMedian(sortedData);
        this.stats.mode = this.calculateMode(data);
        this.stats.variance = this.calculateVariance(data, this.stats.mean);
        this.stats.standardDeviation = Math.sqrt(this.stats.variance);
        this.stats.skewness = this.calculateSkewness(data, this.stats.mean, this.stats.standardDeviation);
        this.stats.kurtosis = this.calculateKurtosis(data, this.stats.mean, this.stats.standardDeviation);
        this.stats.range = this.calculateRange(sortedData);
        this.stats.quartiles = this.calculateQuartiles(sortedData);

        return this.stats;
    }

    calculateMean(data) {
        return data.reduce((sum, value) => sum + value, 0) / data.length;
    }

    calculateMedian(sortedData) {
        const n = sortedData.length;
        if (n % 2 === 0) {
            return (sortedData[n / 2 - 1] + sortedData[n / 2]) / 2;
        }
        return sortedData[Math.floor(n / 2)];
    }

    calculateMode(data) {
        const frequency = {};
        let maxFreq = 0;
        let modes = [];

        data.forEach(value => {
            frequency[value] = (frequency[value] || 0) + 1;
            if (frequency[value] > maxFreq) {
                maxFreq = frequency[value];
            }
        });

        for (const [value, freq] of Object.entries(frequency)) {
            if (freq === maxFreq) {
                modes.push(Number(value));
            }
        }

        return modes.length === data.length ? null : modes;
    }

    calculateVariance(data, mean) {
        const sumSquaredDiffs = data.reduce((sum, value) => {
            return sum + Math.pow(value - mean, 2);
        }, 0);
        return sumSquaredDiffs / (data.length - 1);
    }

    calculateSkewness(data, mean, stdDev) {
        if (stdDev === 0) return 0;
        
        const n = data.length;
        const sumCubedDiffs = data.reduce((sum, value) => {
            return sum + Math.pow((value - mean) / stdDev, 3);
        }, 0);
        
        return (n / ((n - 1) * (n - 2))) * sumCubedDiffs;
    }

    calculateKurtosis(data, mean, stdDev) {
        if (stdDev === 0) return 0;
        
        const n = data.length;
        const sumFourthDiffs = data.reduce((sum, value) => {
            return sum + Math.pow((value - mean) / stdDev, 4);
        }, 0);
        
        return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sumFourthDiffs - 
               (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
    }

    calculateRange(sortedData) {
        return {
            min: sortedData[0],
            max: sortedData[sortedData.length - 1],
            range: sortedData[sortedData.length - 1] - sortedData[0]
        };
    }

    calculateQuartiles(sortedData) {
        const n = sortedData.length;
        
        const getQuartile = (data, percentile) => {
            const index = (percentile / 100) * (data.length - 1);
            const lower = Math.floor(index);
            const upper = Math.ceil(index);
            const weight = index % 1;
            
            if (upper >= data.length) return data[data.length - 1];
            if (lower < 0) return data[0];
            
            return data[lower] * (1 - weight) + data[upper] * weight;
        };

        return {
            q1: getQuartile(sortedData, 25),
            q2: getQuartile(sortedData, 50), // median
            q3: getQuartile(sortedData, 75),
            iqr: getQuartile(sortedData, 75) - getQuartile(sortedData, 25)
        };
    }

    /**
     * 통계 결과를 HTML로 렌더링
     * @returns {string} HTML 문자열
     */
    renderHTML() {
        if (!this.stats.mean) {
            return '<div class="no-data">No statistical data available</div>';
        }

        return `
            <div class="descriptive-stats-container">
                <div class="stats-grid">
                    <div class="stats-card">
                        <h5>Central Tendency</h5>
                        <div class="stats-values">
                            <div class="stat-item">
                                <span class="stat-label">Mean:</span>
                                <span class="stat-value">${this.stats.mean.toFixed(4)}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Median:</span>
                                <span class="stat-value">${this.stats.median.toFixed(4)}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Mode:</span>
                                <span class="stat-value">${this.stats.mode ? this.stats.mode.join(', ') : 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="stats-card">
                        <h5>Variability</h5>
                        <div class="stats-values">
                            <div class="stat-item">
                                <span class="stat-label">Std Dev:</span>
                                <span class="stat-value">${this.stats.standardDeviation.toFixed(4)}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Variance:</span>
                                <span class="stat-value">${this.stats.variance.toFixed(4)}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Range:</span>
                                <span class="stat-value">${this.stats.range.range.toFixed(4)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="stats-card">
                        <h5>Distribution Shape</h5>
                        <div class="stats-values">
                            <div class="stat-item">
                                <span class="stat-label">Skewness:</span>
                                <span class="stat-value">${this.stats.skewness.toFixed(4)}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Kurtosis:</span>
                                <span class="stat-value">${this.stats.kurtosis.toFixed(4)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="stats-card">
                        <h5>Quartiles</h5>
                        <div class="stats-values">
                            <div class="stat-item">
                                <span class="stat-label">Q1:</span>
                                <span class="stat-value">${this.stats.quartiles.q1.toFixed(4)}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Q3:</span>
                                <span class="stat-value">${this.stats.quartiles.q3.toFixed(4)}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">IQR:</span>
                                <span class="stat-value">${this.stats.quartiles.iqr.toFixed(4)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 통계 해석 텍스트 생성
     * @returns {string} 해석 텍스트
     */
    generateInsights() {
        if (!this.stats.mean) return 'No data to analyze.';
        
        const insights = [];
        
        // 분포 형태 분석
        if (Math.abs(this.stats.skewness) < 0.5) {
            insights.push('The distribution is approximately symmetric.');
        } else if (this.stats.skewness > 0.5) {
            insights.push('The distribution is right-skewed (positive skew).');
        } else {
            insights.push('The distribution is left-skewed (negative skew).');
        }
        
        // 첨도 분석
        if (this.stats.kurtosis > 3) {
            insights.push('The distribution has heavy tails (leptokurtic).');
        } else if (this.stats.kurtosis < 3) {
            insights.push('The distribution has light tails (platykurtic).');
        } else {
            insights.push('The distribution has normal tail behavior (mesokurtic).');
        }
        
        // 변동성 분석
        const cv = (this.stats.standardDeviation / this.stats.mean) * 100;
        if (cv < 15) {
            insights.push('The data shows low variability.');
        } else if (cv > 30) {
            insights.push('The data shows high variability.');
        } else {
            insights.push('The data shows moderate variability.');
        }
        
        return insights.join(' ');
    }
}