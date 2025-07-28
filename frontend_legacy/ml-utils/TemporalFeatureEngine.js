/**
 * 시간적 데이터 누출 방지를 위한 안전한 특성 엔지니어링 클래스
 * 미래 정보 누출 없이 시간 기반 특성을 생성합니다
 */

export class TemporalFeatureEngine {
    constructor() {
        this.featureConfig = {
            rollingWindows: [7, 14, 30], // 일 단위
            lagFeatures: [1, 3, 7], // 지연 특성
            maxLookback: 365 // 최대 과거 참조 일수
        };
        this.temporalFeatures = new Map();
    }

    /**
     * 시간적으로 안전한 특성 생성
     * @param {Array} data - 시간순으로 정렬된 데이터
     * @param {string} timestampCol - 타임스탬프 컬럼명
     * @param {string} targetCol - 타겟 컬럼명 (제외할 특성)
     * @param {Date} cutoffDate - 데이터 분할 기준일
     * @returns {Array} 안전한 특성이 추가된 데이터
     */
    createSafeTemporalFeatures(data, timestampCol, targetCol, cutoffDate) {
        console.log('🕒 Creating temporally safe features...');
        
        // 1. 데이터를 시간순으로 정렬
        const sortedData = this.sortByTimestamp(data, timestampCol);
        
        // 2. 위험한 특성 식별 및 제거
        const safeData = this.removeRiskyFeatures(sortedData, targetCol);
        
        // 3. 안전한 시간 기반 특성 생성
        const enhancedData = this.generateSafeFeatures(safeData, timestampCol, cutoffDate);
        
        return enhancedData;
    }

    /**
     * 위험한 시간적 특성 제거
     */
    removeRiskyFeatures(data, targetCol) {
        const riskyFeatures = [
            'account_balance_current', // 현재 잔액 (미래 정보 포함 가능)
            'transaction_status_current', // 현재 거래 상태
            'real_time_score', // 실시간 점수
            'current_location', // 현재 위치
            'fraud_probability', // 사기 확률 (타겟 누출)
            'risk_score' // 위험 점수 (타겟 누출)
        ];

        return data.map(row => {
            const cleanRow = { ...row };
            riskyFeatures.forEach(feature => {
                if (cleanRow.hasOwnProperty(feature)) {
                    console.log(`⚠️ Removing risky feature: ${feature}`);
                    delete cleanRow[feature];
                }
            });
            return cleanRow;
        });
    }

    /**
     * 안전한 시간 기반 특성 생성
     */
    generateSafeFeatures(data, timestampCol, cutoffDate) {
        const enhancedData = [];

        for (let i = 0; i < data.length; i++) {
            const currentRow = { ...data[i] };
            const currentDate = new Date(currentRow[timestampCol]);
            
            // 미래 데이터 사용 방지 - cutoff date 이후 데이터는 사용하지 않음
            if (currentDate > cutoffDate) {
                continue;
            }

            // 과거 데이터만을 사용한 특성 생성
            const historicalData = this.getHistoricalData(data, i, currentDate, timestampCol);
            
            // 1. 안전한 롤링 통계
            currentRow.safe_rolling_features = this.createSafeRollingFeatures(historicalData, currentDate);
            
            // 2. 지연 특성 (Lag Features)
            currentRow.lag_features = this.createLagFeatures(historicalData, currentDate);
            
            // 3. 시간대별 통계 (과거 데이터만 사용)
            currentRow.temporal_stats = this.createTemporalStats(historicalData, currentDate);
            
            // 4. 계절성 특성 (안전)
            currentRow.seasonal_features = this.createSeasonalFeatures(currentDate);

            enhancedData.push(currentRow);
        }

        return enhancedData;
    }

    /**
     * 현재 시점 이전의 과거 데이터만 반환
     */
    getHistoricalData(data, currentIndex, currentDate, timestampCol) {
        const historicalData = [];
        const cutoffTime = currentDate.getTime();

        for (let i = 0; i < currentIndex; i++) {
            const rowDate = new Date(data[i][timestampCol]);
            if (rowDate.getTime() < cutoffTime) {
                historicalData.push(data[i]);
            }
        }

        return historicalData;
    }

    /**
     * 안전한 롤링 통계 생성 (과거 데이터만 사용)
     */
    createSafeRollingFeatures(historicalData, currentDate) {
        const features = {};
        
        this.featureConfig.rollingWindows.forEach(window => {
            const windowStart = new Date(currentDate.getTime() - (window * 24 * 60 * 60 * 1000));
            
            const windowData = historicalData.filter(row => {
                const rowDate = new Date(row.timestamp || row.date);
                return rowDate >= windowStart && rowDate < currentDate;
            });

            if (windowData.length > 0) {
                // 거래 금액 통계
                const amounts = windowData.map(row => parseFloat(row.transaction_amount || 0));
                features[`rolling_mean_${window}d`] = this.calculateMean(amounts);
                features[`rolling_std_${window}d`] = this.calculateStd(amounts);
                features[`rolling_count_${window}d`] = windowData.length;
                features[`rolling_sum_${window}d`] = amounts.reduce((a, b) => a + b, 0);

                // 카테고리별 통계
                const categories = this.groupBy(windowData, 'merchant_category');
                features[`category_diversity_${window}d`] = Object.keys(categories).length;
                features[`most_frequent_category_${window}d`] = this.getMostFrequentCategory(categories);
            } else {
                // 윈도우에 데이터가 없는 경우 기본값
                features[`rolling_mean_${window}d`] = 0;
                features[`rolling_std_${window}d`] = 0;
                features[`rolling_count_${window}d`] = 0;
                features[`rolling_sum_${window}d`] = 0;
                features[`category_diversity_${window}d`] = 0;
                features[`most_frequent_category_${window}d`] = 'unknown';
            }
        });

        return features;
    }

    /**
     * 지연 특성 생성 (N일 전 데이터)
     */
    createLagFeatures(historicalData, currentDate) {
        const features = {};

        this.featureConfig.lagFeatures.forEach(lag => {
            const lagDate = new Date(currentDate.getTime() - (lag * 24 * 60 * 60 * 1000));
            
            // 해당 일자와 가장 가까운 과거 데이터 찾기
            const lagData = this.findClosestPastData(historicalData, lagDate);
            
            if (lagData) {
                features[`amount_lag_${lag}d`] = parseFloat(lagData.transaction_amount || 0);
                features[`category_lag_${lag}d`] = lagData.merchant_category || 'unknown';
                features[`hour_lag_${lag}d`] = new Date(lagData.timestamp || lagData.date).getHours();
            } else {
                features[`amount_lag_${lag}d`] = 0;
                features[`category_lag_${lag}d`] = 'unknown';
                features[`hour_lag_${lag}d`] = 0;
            }
        });

        return features;
    }

    /**
     * 시간대별 통계 (과거 데이터 기반)
     */
    createTemporalStats(historicalData, currentDate) {
        const currentHour = currentDate.getHours();
        const currentDayOfWeek = currentDate.getDay();
        const currentMonth = currentDate.getMonth();

        // 동일 시간대 과거 데이터
        const sameHourData = historicalData.filter(row => {
            const rowDate = new Date(row.timestamp || row.date);
            return rowDate.getHours() === currentHour;
        });

        // 동일 요일 과거 데이터
        const sameDayData = historicalData.filter(row => {
            const rowDate = new Date(row.timestamp || row.date);
            return rowDate.getDay() === currentDayOfWeek;
        });

        return {
            avg_amount_same_hour: this.calculateMean(sameHourData.map(r => parseFloat(r.transaction_amount || 0))),
            count_same_hour: sameHourData.length,
            avg_amount_same_day: this.calculateMean(sameDayData.map(r => parseFloat(r.transaction_amount || 0))),
            count_same_day: sameDayData.length,
            total_transactions_to_date: historicalData.length,
            
            // 시간 기반 특성 (미래 정보 없음)
            hour_of_day: currentHour,
            day_of_week: currentDayOfWeek,
            month_of_year: currentMonth,
            is_weekend: currentDayOfWeek === 0 || currentDayOfWeek === 6,
            is_business_hours: currentHour >= 9 && currentHour <= 17
        };
    }

    /**
     * 계절성 특성 (안전한 시간 기반 특성)
     */
    createSeasonalFeatures(currentDate) {
        const dayOfYear = this.getDayOfYear(currentDate);
        const quarter = Math.floor(currentDate.getMonth() / 3) + 1;
        
        return {
            season: this.getSeason(currentDate.getMonth()),
            quarter: quarter,
            day_of_year: dayOfYear,
            week_of_year: this.getWeekOfYear(currentDate),
            
            // 주기적 인코딩 (sin/cos 변환)
            hour_sin: Math.sin(2 * Math.PI * currentDate.getHours() / 24),
            hour_cos: Math.cos(2 * Math.PI * currentDate.getHours() / 24),
            day_sin: Math.sin(2 * Math.PI * currentDate.getDay() / 7),
            day_cos: Math.cos(2 * Math.PI * currentDate.getDay() / 7),
            month_sin: Math.sin(2 * Math.PI * currentDate.getMonth() / 12),
            month_cos: Math.cos(2 * Math.PI * currentDate.getMonth() / 12)
        };
    }

    /**
     * 시간순 정렬
     */
    sortByTimestamp(data, timestampCol) {
        return [...data].sort((a, b) => {
            const dateA = new Date(a[timestampCol]);
            const dateB = new Date(b[timestampCol]);
            return dateA.getTime() - dateB.getTime();
        });
    }

    /**
     * 가장 가까운 과거 데이터 찾기
     */
    findClosestPastData(historicalData, targetDate) {
        let closest = null;
        let minDiff = Infinity;

        historicalData.forEach(row => {
            const rowDate = new Date(row.timestamp || row.date);
            const diff = Math.abs(targetDate.getTime() - rowDate.getTime());
            
            if (rowDate <= targetDate && diff < minDiff) {
                minDiff = diff;
                closest = row;
            }
        });

        return closest;
    }

    /**
     * 유틸리티 메서드들
     */
    calculateMean(values) {
        if (values.length === 0) return 0;
        return values.reduce((a, b) => a + b, 0) / values.length;
    }

    calculateStd(values) {
        if (values.length === 0) return 0;
        const mean = this.calculateMean(values);
        const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    }

    groupBy(array, key) {
        return array.reduce((groups, item) => {
            const group = item[key] || 'unknown';
            groups[group] = groups[group] || [];
            groups[group].push(item);
            return groups;
        }, {});
    }

    getMostFrequentCategory(categories) {
        let maxCount = 0;
        let mostFrequent = 'unknown';
        
        Object.entries(categories).forEach(([category, items]) => {
            if (items.length > maxCount) {
                maxCount = items.length;
                mostFrequent = category;
            }
        });
        
        return mostFrequent;
    }

    getDayOfYear(date) {
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = date - start;
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    }

    getWeekOfYear(date) {
        const start = new Date(date.getFullYear(), 0, 1);
        const days = Math.floor((date - start) / (24 * 60 * 60 * 1000));
        return Math.ceil((days + start.getDay() + 1) / 7);
    }

    getSeason(month) {
        if (month >= 2 && month <= 4) return 'spring';
        if (month >= 5 && month <= 7) return 'summer';
        if (month >= 8 && month <= 10) return 'autumn';
        return 'winter';
    }

    /**
     * 시간적 데이터 분할 (훈련/검증/테스트)
     */
    createTemporalSplit(data, timestampCol, trainRatio = 0.7, validRatio = 0.15) {
        const sortedData = this.sortByTimestamp(data, timestampCol);
        const totalLength = sortedData.length;
        
        const trainEnd = Math.floor(totalLength * trainRatio);
        const validEnd = Math.floor(totalLength * (trainRatio + validRatio));
        
        return {
            train: sortedData.slice(0, trainEnd),
            validation: sortedData.slice(trainEnd, validEnd),
            test: sortedData.slice(validEnd),
            splitInfo: {
                trainPeriod: {
                    start: sortedData[0][timestampCol],
                    end: sortedData[trainEnd - 1][timestampCol]
                },
                validPeriod: {
                    start: sortedData[trainEnd][timestampCol],
                    end: sortedData[validEnd - 1][timestampCol]
                },
                testPeriod: {
                    start: sortedData[validEnd][timestampCol],
                    end: sortedData[totalLength - 1][timestampCol]
                }
            }
        };
    }

    /**
     * 시간적 교차 검증
     */
    createTimeSeriesCV(data, timestampCol, nSplits = 5, testSize = 0.2) {
        const sortedData = this.sortByTimestamp(data, timestampCol);
        const splits = [];
        const stepSize = Math.floor(sortedData.length / nSplits);
        
        for (let i = 0; i < nSplits; i++) {
            const trainEnd = stepSize * (i + 1);
            const testStart = trainEnd;
            const testEnd = Math.min(testStart + Math.floor(stepSize * testSize), sortedData.length);
            
            if (testEnd > testStart) {
                splits.push({
                    train: sortedData.slice(0, trainEnd),
                    test: sortedData.slice(testStart, testEnd),
                    splitIndex: i
                });
            }
        }
        
        return splits;
    }
}

/**
 * 사용 예시
 */
export function createSafeTemporalPipeline() {
    const engine = new TemporalFeatureEngine();
    
    return {
        engine,
        
        // 안전한 특성 생성 파이프라인
        processData: async (rawData, config) => {
            console.log('🔒 Processing data with temporal safety...');
            
            // 1. 시간적으로 안전한 특성 생성
            const safeData = engine.createSafeTemporalFeatures(
                rawData,
                config.timestampCol,
                config.targetCol,
                config.cutoffDate
            );
            
            // 2. 시간 기반 데이터 분할
            const splits = engine.createTemporalSplit(
                safeData,
                config.timestampCol,
                config.trainRatio,
                config.validRatio
            );
            
            console.log('✅ Temporal feature engineering completed safely');
            
            return {
                data: safeData,
                splits,
                summary: {
                    totalRecords: safeData.length,
                    trainRecords: splits.train.length,
                    validRecords: splits.validation.length,
                    testRecords: splits.test.length,
                    temporalRange: splits.splitInfo
                }
            };
        }
    };
}