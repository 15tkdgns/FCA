/**
 * Correlation Analysis Module
 * 상관관계 분석 기능을 담당하는 모듈
 */
export class CorrelationAnalysis {
    constructor() {
        this.correlationMatrix = null;
        this.correlationMethod = 'pearson'; // pearson, spearman, kendall
    }

    /**
     * 상관관계 매트릭스 계산
     * @param {Array} datasets - 분석할 데이터셋들
     * @param {string} method - 상관관계 계산 방법
     * @returns {Object} 상관관계 매트릭스와 메타데이터
     */
    calculateCorrelationMatrix(datasets, method = 'pearson') {
        this.correlationMethod = method;
        
        if (!datasets || datasets.length < 2) {
            throw new Error('At least two datasets are required for correlation analysis');
        }

        const variables = Object.keys(datasets);
        const matrix = {};
        const significance = {};
        
        // 상관관계 매트릭스 초기화
        variables.forEach(var1 => {
            matrix[var1] = {};
            significance[var1] = {};
            
            variables.forEach(var2 => {
                if (var1 === var2) {
                    matrix[var1][var2] = 1.0;
                    significance[var1][var2] = 0.0;
                } else {
                    const correlation = this.calculateCorrelation(
                        datasets[var1], 
                        datasets[var2], 
                        method
                    );
                    matrix[var1][var2] = correlation.coefficient;
                    significance[var1][var2] = correlation.pValue;
                }
            });
        });

        this.correlationMatrix = {
            matrix,
            significance,
            method,
            variables,
            size: variables.length
        };

        return this.correlationMatrix;
    }

    /**
     * 두 변수 간 상관관계 계산
     * @param {Array} x - 첫 번째 변수 데이터
     * @param {Array} y - 두 번째 변수 데이터
     * @param {string} method - 계산 방법
     * @returns {Object} 상관계수와 p-value
     */
    calculateCorrelation(x, y, method) {
        if (x.length !== y.length) {
            throw new Error('Datasets must have the same length');
        }

        switch (method) {
            case 'pearson':
                return this.pearsonCorrelation(x, y);
            case 'spearman':
                return this.spearmanCorrelation(x, y);
            case 'kendall':
                return this.kendallCorrelation(x, y);
            default:
                throw new Error(`Unknown correlation method: ${method}`);
        }
    }

    /**
     * 피어슨 상관계수 계산
     */
    pearsonCorrelation(x, y) {
        const n = x.length;
        const meanX = x.reduce((sum, val) => sum + val, 0) / n;
        const meanY = y.reduce((sum, val) => sum + val, 0) / n;

        let numerator = 0;
        let sumXSquared = 0;
        let sumYSquared = 0;

        for (let i = 0; i < n; i++) {
            const deltaX = x[i] - meanX;
            const deltaY = y[i] - meanY;
            
            numerator += deltaX * deltaY;
            sumXSquared += deltaX * deltaX;
            sumYSquared += deltaY * deltaY;
        }

        const denominator = Math.sqrt(sumXSquared * sumYSquared);
        const coefficient = denominator === 0 ? 0 : numerator / denominator;
        
        // t-통계량 계산 (p-value 근사)
        const tStat = coefficient * Math.sqrt((n - 2) / (1 - coefficient * coefficient));
        const pValue = this.tTestPValue(tStat, n - 2);

        return { coefficient, pValue };
    }

    /**
     * 스피어만 상관계수 계산
     */
    spearmanCorrelation(x, y) {
        const ranksX = this.getRanks(x);
        const ranksY = this.getRanks(y);
        
        return this.pearsonCorrelation(ranksX, ranksY);
    }

    /**
     * 켄달 타우 상관계수 계산
     */
    kendallCorrelation(x, y) {
        const n = x.length;
        let concordant = 0;
        let discordant = 0;

        for (let i = 0; i < n - 1; i++) {
            for (let j = i + 1; j < n; j++) {
                const signX = Math.sign(x[j] - x[i]);
                const signY = Math.sign(y[j] - y[i]);
                
                if (signX * signY > 0) {
                    concordant++;
                } else if (signX * signY < 0) {
                    discordant++;
                }
            }
        }

        const coefficient = (concordant - discordant) / (n * (n - 1) / 2);
        const pValue = this.kendallPValue(coefficient, n);

        return { coefficient, pValue };
    }

    /**
     * 순위 계산
     */
    getRanks(data) {
        const indexed = data.map((value, index) => ({ value, index }));
        indexed.sort((a, b) => a.value - b.value);
        
        const ranks = new Array(data.length);
        for (let i = 0; i < indexed.length; i++) {
            ranks[indexed[i].index] = i + 1;
        }
        
        return ranks;
    }

    /**
     * t-검정 p-value 근사 계산
     */
    tTestPValue(tStat, df) {
        // 간단한 근사 공식 (정확하지 않지만 데모용)
        const t = Math.abs(tStat);
        if (t > 6) return 0.0001;
        if (t > 4) return 0.001;
        if (t > 3) return 0.01;
        if (t > 2) return 0.05;
        return 0.1;
    }

    /**
     * 켄달 p-value 근사 계산
     */
    kendallPValue(tau, n) {
        // 간단한 근사 공식
        const z = Math.abs(tau) * Math.sqrt((n * (n - 1)) / (2 * (2 * n + 5)));
        if (z > 2.58) return 0.01;
        if (z > 1.96) return 0.05;
        if (z > 1.64) return 0.1;
        return 0.2;
    }

    /**
     * 상관관계 강도 해석
     */
    interpretCorrelation(coefficient) {
        const abs = Math.abs(coefficient);
        
        if (abs >= 0.9) return 'Very Strong';
        if (abs >= 0.7) return 'Strong';
        if (abs >= 0.5) return 'Moderate';
        if (abs >= 0.3) return 'Weak';
        return 'Very Weak';
    }

    /**
     * 상관관계 매트릭스를 히트맵 HTML로 렌더링
     */
    renderHeatmap() {
        if (!this.correlationMatrix) {
            return '<div class="no-data">No correlation data available</div>';
        }

        const { matrix, variables, significance } = this.correlationMatrix;
        
        let html = `
            <div class="correlation-heatmap">
                <h4>Correlation Matrix (${this.correlationMethod})</h4>
                <table class="correlation-table">
                    <thead>
                        <tr>
                            <th></th>
                            ${variables.map(v => `<th title="${v}">${v.substring(0, 8)}...</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
        `;

        variables.forEach(var1 => {
            html += `<tr><td class="row-header" title="${var1}">${var1.substring(0, 8)}...</td>`;
            
            variables.forEach(var2 => {
                const corr = matrix[var1][var2];
                const pVal = significance[var1][var2];
                const intensity = Math.abs(corr);
                const color = corr >= 0 ? 'positive' : 'negative';
                const opacity = intensity;
                
                html += `
                    <td class="correlation-cell ${color}" 
                        style="opacity: ${opacity}"
                        title="Correlation: ${corr.toFixed(3)}, p-value: ${pVal.toFixed(3)}">
                        ${corr.toFixed(2)}
                    </td>
                `;
            });
            
            html += '</tr>';
        });

        html += `
                    </tbody>
                </table>
                <div class="correlation-legend">
                    <div class="legend-item">
                        <span class="legend-color positive"></span>
                        <span>Positive Correlation</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color negative"></span>
                        <span>Negative Correlation</span>
                    </div>
                    <div class="legend-note">
                        <small>Color intensity represents correlation strength</small>
                    </div>
                </div>
            </div>
        `;

        return html;
    }

    /**
     * 주요 상관관계 인사이트 생성
     */
    generateInsights() {
        if (!this.correlationMatrix) {
            return 'No correlation analysis available.';
        }

        const { matrix, variables, significance } = this.correlationMatrix;
        const insights = [];
        const strongCorrelations = [];

        // 강한 상관관계 찾기
        variables.forEach(var1 => {
            variables.forEach(var2 => {
                if (var1 !== var2) {
                    const corr = matrix[var1][var2];
                    const pVal = significance[var1][var2];
                    
                    if (Math.abs(corr) >= 0.7 && pVal < 0.05) {
                        strongCorrelations.push({
                            var1, var2, correlation: corr, pValue: pVal
                        });
                    }
                }
            });
        });

        if (strongCorrelations.length > 0) {
            insights.push(`Found ${strongCorrelations.length} strong correlation(s):`);
            strongCorrelations.slice(0, 3).forEach(item => {
                const direction = item.correlation > 0 ? 'positive' : 'negative';
                insights.push(`${item.var1} and ${item.var2} show ${direction} correlation (r=${item.correlation.toFixed(3)})`);
            });
        } else {
            insights.push('No strong correlations detected between variables.');
        }

        return insights.join(' ');
    }

    /**
     * 상관관계 데이터 내보내기
     */
    exportData() {
        if (!this.correlationMatrix) {
            throw new Error('No correlation data to export');
        }

        return {
            correlationMatrix: this.correlationMatrix,
            insights: this.generateInsights(),
            exportTimestamp: new Date().toISOString()
        };
    }
}