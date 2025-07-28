/**
 * 중복 데이터 누출 해결 시스템
 * ID 기반 데이터 분할로 훈련/테스트 세트 간 중복을 방지합니다
 */

export class DuplicateLeakageResolver {
    constructor() {
        this.similarityThreshold = 0.98;
        this.duplicateTypes = {
            EXACT: 'exact_duplicate',
            NEAR: 'near_duplicate', 
            ID_OVERLAP: 'id_overlap',
            FEATURE_SIMILAR: 'feature_similar'
        };
    }

    /**
     * 중복 데이터 누출 감지 및 분석
     * @param {Array} data - 전체 데이터셋
     * @param {Object} config - 설정 옵션
     * @returns {Object} 중복 분석 결과
     */
    analyzeDuplicates(data, config = {}) {
        console.log('🔍 Analyzing duplicate data leakage...');
        
        const {
            idColumns = ['id', 'user_id', 'transaction_id'],
            featureColumns = null, // null이면 자동 감지
            excludeColumns = ['timestamp', 'date', 'target']
        } = config;

        const analysisResult = {
            exactDuplicates: [],
            nearDuplicates: [],
            idOverlaps: [],
            featureSimilarities: [],
            summary: {},
            recommendations: []
        };

        // 1. 정확한 중복 감지
        analysisResult.exactDuplicates = this.findExactDuplicates(data, excludeColumns);

        // 2. 거의 중복인 데이터 감지
        analysisResult.nearDuplicates = this.findNearDuplicates(data, excludeColumns);

        // 3. ID 중복 감지
        analysisResult.idOverlaps = this.findIdOverlaps(data, idColumns);

        // 4. 특성 유사도 분석
        const features = featureColumns || this.autoDetectFeatures(data, excludeColumns);
        analysisResult.featureSimilarities = this.analyzeFeatureSimilarity(data, features);

        // 5. 요약 정보 생성
        analysisResult.summary = this.generateSummary(analysisResult, data.length);

        // 6. 권장사항 생성
        analysisResult.recommendations = this.generateRecommendations(analysisResult);

        console.log(`📊 Found ${analysisResult.summary.totalDuplicates} potential duplicates`);
        
        return analysisResult;
    }

    /**
     * 정확한 중복 데이터 찾기
     */
    findExactDuplicates(data, excludeColumns) {
        const seen = new Map();
        const duplicates = [];

        data.forEach((row, index) => {
            // 제외할 컬럼을 제외한 특성들로 해시 생성
            const features = this.getRelevantFeatures(row, excludeColumns);
            const hash = this.createFeatureHash(features);

            if (seen.has(hash)) {
                const originalIndex = seen.get(hash);
                duplicates.push({
                    type: this.duplicateTypes.EXACT,
                    originalIndex,
                    duplicateIndex: index,
                    similarity: 1.0,
                    reason: 'Identical feature values',
                    affectedFeatures: Object.keys(features)
                });
            } else {
                seen.set(hash, index);
            }
        });

        return duplicates;
    }

    /**
     * 거의 중복인 데이터 찾기
     */
    findNearDuplicates(data, excludeColumns) {
        const nearDuplicates = [];
        const processed = new Set();

        for (let i = 0; i < data.length; i++) {
            if (processed.has(i)) continue;

            const row1 = this.getRelevantFeatures(data[i], excludeColumns);
            
            for (let j = i + 1; j < data.length; j++) {
                if (processed.has(j)) continue;

                const row2 = this.getRelevantFeatures(data[j], excludeColumns);
                const similarity = this.calculateFeatureSimilarity(row1, row2);

                if (similarity >= this.similarityThreshold) {
                    nearDuplicates.push({
                        type: this.duplicateTypes.NEAR,
                        originalIndex: i,
                        duplicateIndex: j,
                        similarity: similarity,
                        reason: `Feature similarity: ${(similarity * 100).toFixed(1)}%`,
                        affectedFeatures: Object.keys(row1)
                    });
                    processed.add(j);
                }
            }
        }

        return nearDuplicates;
    }

    /**
     * ID 중복 감지
     */
    findIdOverlaps(data, idColumns) {
        const idOverlaps = [];
        
        idColumns.forEach(idCol => {
            if (!data[0].hasOwnProperty(idCol)) return;

            const idMap = new Map();
            
            data.forEach((row, index) => {
                const id = row[idCol];
                if (id && id !== '' && id !== null && id !== undefined) {
                    if (idMap.has(id)) {
                        const originalIndex = idMap.get(id);
                        idOverlaps.push({
                            type: this.duplicateTypes.ID_OVERLAP,
                            originalIndex,
                            duplicateIndex: index,
                            idColumn: idCol,
                            idValue: id,
                            similarity: 1.0,
                            reason: `Duplicate ${idCol}: ${id}`,
                            riskLevel: 'HIGH'
                        });
                    } else {
                        idMap.set(id, index);
                    }
                }
            });
        });

        return idOverlaps;
    }

    /**
     * 특성 유사도 분석
     */
    analyzeFeatureSimilarity(data, features) {
        const similarities = [];
        const sampleSize = Math.min(1000, data.length); // 성능을 위해 샘플링

        for (let i = 0; i < sampleSize; i++) {
            for (let j = i + 1; j < sampleSize; j++) {
                const row1 = this.extractFeatures(data[i], features);
                const row2 = this.extractFeatures(data[j], features);
                const similarity = this.calculateFeatureSimilarity(row1, row2);

                if (similarity > 0.9) { // 높은 유사도만 저장
                    similarities.push({
                        type: this.duplicateTypes.FEATURE_SIMILAR,
                        index1: i,
                        index2: j,
                        similarity: similarity,
                        reason: `High feature similarity: ${(similarity * 100).toFixed(1)}%`
                    });
                }
            }
        }

        return similarities;
    }

    /**
     * 안전한 ID 기반 데이터 분할
     * @param {Array} data - 전체 데이터
     * @param {Object} splitConfig - 분할 설정
     * @returns {Object} 분할된 데이터셋
     */
    createSafeDataSplit(data, splitConfig = {}) {
        console.log('🔒 Creating safe data split to prevent ID leakage...');
        
        const {
            idColumns = ['user_id', 'customer_id', 'account_id'],
            groupColumns = [], // 추가 그룹핑 컬럼
            splitRatios = { train: 0.7, validation: 0.15, test: 0.15 },
            stratifyColumn = null,
            temporalColumn = null,
            ensureMinimumSize = true
        } = splitConfig;

        // 1. 중복 제거
        const cleanData = this.removeDuplicates(data);
        console.log(`🧹 Removed ${data.length - cleanData.length} duplicate records`);

        // 2. 분할 방법 선택
        let splitResult;
        if (temporalColumn) {
            splitResult = this.createTemporalSplit(cleanData, temporalColumn, splitRatios);
        } else if (idColumns.length > 0) {
            splitResult = this.createIdBasedSplit(cleanData, idColumns, splitRatios, stratifyColumn);
        } else if (groupColumns.length > 0) {
            splitResult = this.createGroupBasedSplit(cleanData, groupColumns, splitRatios, stratifyColumn);
        } else {
            splitResult = this.createStratifiedSplit(cleanData, stratifyColumn, splitRatios);
        }

        // 3. 분할 검증
        const validation = this.validateSplit(splitResult, idColumns);

        // 4. 최소 크기 보장
        if (ensureMinimumSize) {
            splitResult = this.ensureMinimumSplitSizes(splitResult);
        }

        console.log('✅ Safe data split completed');
        
        return {
            ...splitResult,
            validation,
            splitStrategy: this.getSplitStrategy(splitConfig),
            summary: {
                originalSize: data.length,
                cleanedSize: cleanData.length,
                removedDuplicates: data.length - cleanData.length,
                trainSize: splitResult.train.length,
                validationSize: splitResult.validation.length,
                testSize: splitResult.test.length
            }
        };
    }

    /**
     * ID 기반 분할
     */
    createIdBasedSplit(data, idColumns, splitRatios, stratifyColumn) {
        // 가장 적절한 ID 컬럼 선택 (유니크 값이 많고 분포가 좋은 것)
        const bestIdColumn = this.selectBestIdColumn(data, idColumns);
        console.log(`📋 Using ${bestIdColumn} for ID-based splitting`);

        // 유니크 ID 목록 생성
        const uniqueIds = [...new Set(data.map(row => row[bestIdColumn]))].filter(id => id);
        
        // 계층화 고려한 ID 분할
        let idSplits;
        if (stratifyColumn) {
            idSplits = this.stratifiedIdSplit(data, uniqueIds, bestIdColumn, stratifyColumn, splitRatios);
        } else {
            idSplits = this.randomIdSplit(uniqueIds, splitRatios);
        }

        // ID에 따라 데이터 분할
        const trainIds = new Set(idSplits.train);
        const validIds = new Set(idSplits.validation);
        const testIds = new Set(idSplits.test);

        return {
            train: data.filter(row => trainIds.has(row[bestIdColumn])),
            validation: data.filter(row => validIds.has(row[bestIdColumn])),
            test: data.filter(row => testIds.has(row[bestIdColumn])),
            splitMethod: 'id_based',
            splitColumn: bestIdColumn,
            idCounts: {
                train: idSplits.train.length,
                validation: idSplits.validation.length,
                test: idSplits.test.length
            }
        };
    }

    /**
     * 그룹 기반 분할
     */
    createGroupBasedSplit(data, groupColumns, splitRatios, stratifyColumn) {
        // 그룹 키 생성
        const groups = this.createGroups(data, groupColumns);
        const groupKeys = Object.keys(groups);
        
        // 그룹 분할
        const groupSplits = this.randomIdSplit(groupKeys, splitRatios);
        
        const trainGroups = new Set(groupSplits.train);
        const validGroups = new Set(groupSplits.validation);
        const testGroups = new Set(groupSplits.test);

        return {
            train: data.filter(row => trainGroups.has(this.createGroupKey(row, groupColumns))),
            validation: data.filter(row => validGroups.has(this.createGroupKey(row, groupColumns))),
            test: data.filter(row => testGroups.has(this.createGroupKey(row, groupColumns))),
            splitMethod: 'group_based',
            splitColumns: groupColumns,
            groupCounts: {
                train: groupSplits.train.length,
                validation: groupSplits.validation.length,
                test: groupSplits.test.length
            }
        };
    }

    /**
     * 시간 기반 분할
     */
    createTemporalSplit(data, temporalColumn, splitRatios) {
        // 시간순 정렬
        const sortedData = [...data].sort((a, b) => {
            const dateA = new Date(a[temporalColumn]);
            const dateB = new Date(b[temporalColumn]);
            return dateA.getTime() - dateB.getTime();
        });

        const totalLength = sortedData.length;
        const trainEnd = Math.floor(totalLength * splitRatios.train);
        const validEnd = Math.floor(totalLength * (splitRatios.train + splitRatios.validation));

        return {
            train: sortedData.slice(0, trainEnd),
            validation: sortedData.slice(trainEnd, validEnd),
            test: sortedData.slice(validEnd),
            splitMethod: 'temporal',
            splitColumn: temporalColumn,
            timeBoundaries: {
                trainPeriod: {
                    start: sortedData[0][temporalColumn],
                    end: sortedData[trainEnd - 1][temporalColumn]
                },
                validPeriod: {
                    start: sortedData[trainEnd][temporalColumn],
                    end: sortedData[validEnd - 1][temporalColumn]
                },
                testPeriod: {
                    start: sortedData[validEnd][temporalColumn],
                    end: sortedData[totalLength - 1][temporalColumn]
                }
            }
        };
    }

    /**
     * 중복 데이터 제거
     */
    removeDuplicates(data, options = {}) {
        const {
            method = 'exact', // 'exact', 'near', 'aggressive'
            keepFirst = true,
            excludeColumns = ['timestamp', 'date']
        } = options;

        if (method === 'exact') {
            return this.removeExactDuplicates(data, excludeColumns, keepFirst);
        } else if (method === 'near') {
            return this.removeNearDuplicates(data, excludeColumns, keepFirst);
        } else if (method === 'aggressive') {
            let cleaned = this.removeExactDuplicates(data, excludeColumns, keepFirst);
            cleaned = this.removeNearDuplicates(cleaned, excludeColumns, keepFirst);
            return cleaned;
        }
        
        return data;
    }

    /**
     * 정확한 중복 제거
     */
    removeExactDuplicates(data, excludeColumns, keepFirst) {
        const seen = new Set();
        const cleaned = [];

        data.forEach(row => {
            const features = this.getRelevantFeatures(row, excludeColumns);
            const hash = this.createFeatureHash(features);

            if (!seen.has(hash)) {
                seen.add(hash);
                cleaned.push(row);
            }
        });

        return cleaned;
    }

    /**
     * 거의 중복인 데이터 제거
     */
    removeNearDuplicates(data, excludeColumns, keepFirst) {
        const cleaned = [];
        const removed = new Set();

        for (let i = 0; i < data.length; i++) {
            if (removed.has(i)) continue;

            const row1 = this.getRelevantFeatures(data[i], excludeColumns);
            cleaned.push(data[i]);

            // 이후 데이터에서 유사한 것들 찾아 제거
            for (let j = i + 1; j < data.length; j++) {
                if (removed.has(j)) continue;

                const row2 = this.getRelevantFeatures(data[j], excludeColumns);
                const similarity = this.calculateFeatureSimilarity(row1, row2);

                if (similarity >= this.similarityThreshold) {
                    removed.add(j);
                }
            }
        }

        return cleaned;
    }

    /**
     * 분할 검증
     */
    validateSplit(splitResult, idColumns) {
        const validation = {
            idLeakage: {},
            overlapCheck: {},
            sizeCheck: {},
            distributionCheck: {}
        };

        // ID 누출 검사
        idColumns.forEach(idCol => {
            const trainIds = new Set(splitResult.train.map(row => row[idCol]).filter(id => id));
            const validIds = new Set(splitResult.validation.map(row => row[idCol]).filter(id => id));
            const testIds = new Set(splitResult.test.map(row => row[idCol]).filter(id => id));

            const trainValidOverlap = this.setIntersection(trainIds, validIds);
            const trainTestOverlap = this.setIntersection(trainIds, testIds);
            const validTestOverlap = this.setIntersection(validIds, testIds);

            validation.idLeakage[idCol] = {
                trainValidOverlap: trainValidOverlap.size,
                trainTestOverlap: trainTestOverlap.size,
                validTestOverlap: validTestOverlap.size,
                hasLeakage: trainValidOverlap.size > 0 || trainTestOverlap.size > 0 || validTestOverlap.size > 0
            };
        });

        // 크기 검사
        const totalSize = splitResult.train.length + splitResult.validation.length + splitResult.test.length;
        validation.sizeCheck = {
            totalRecords: totalSize,
            trainRatio: splitResult.train.length / totalSize,
            validRatio: splitResult.validation.length / totalSize,
            testRatio: splitResult.test.length / totalSize,
            minSizeReached: splitResult.test.length >= 10 && splitResult.validation.length >= 10
        };

        return validation;
    }

    /**
     * 유틸리티 메서드들
     */
    getRelevantFeatures(row, excludeColumns) {
        const features = {};
        Object.keys(row).forEach(key => {
            if (!excludeColumns.includes(key)) {
                features[key] = row[key];
            }
        });
        return features;
    }

    createFeatureHash(features) {
        return JSON.stringify(features, Object.keys(features).sort());
    }

    calculateFeatureSimilarity(features1, features2) {
        const keys1 = Object.keys(features1);
        const keys2 = Object.keys(features2);
        const allKeys = [...new Set([...keys1, ...keys2])];

        if (allKeys.length === 0) return 1.0;

        let matches = 0;
        allKeys.forEach(key => {
            const val1 = features1[key];
            const val2 = features2[key];
            
            if (val1 === val2) {
                matches++;
            } else if (typeof val1 === 'number' && typeof val2 === 'number') {
                const diff = Math.abs(val1 - val2);
                const avg = (Math.abs(val1) + Math.abs(val2)) / 2;
                if (avg === 0 || diff / avg < 0.01) { // 1% 차이 이내
                    matches += 0.9;
                }
            }
        });

        return matches / allKeys.length;
    }

    selectBestIdColumn(data, idColumns) {
        let bestColumn = idColumns[0];
        let bestScore = 0;

        idColumns.forEach(col => {
            if (!data[0].hasOwnProperty(col)) return;
            
            const values = data.map(row => row[col]).filter(val => val);
            const uniqueCount = new Set(values).size;
            const coverage = values.length / data.length;
            const score = uniqueCount * coverage; // 유니크 수 × 커버리지
            
            if (score > bestScore) {
                bestScore = score;
                bestColumn = col;
            }
        });

        return bestColumn;
    }

    randomIdSplit(ids, splitRatios) {
        const shuffled = [...ids].sort(() => Math.random() - 0.5);
        const totalLength = shuffled.length;
        const trainEnd = Math.floor(totalLength * splitRatios.train);
        const validEnd = Math.floor(totalLength * (splitRatios.train + splitRatios.validation));

        return {
            train: shuffled.slice(0, trainEnd),
            validation: shuffled.slice(trainEnd, validEnd),
            test: shuffled.slice(validEnd)
        };
    }

    setIntersection(setA, setB) {
        return new Set([...setA].filter(x => setB.has(x)));
    }

    generateSummary(analysisResult, totalRecords) {
        return {
            totalRecords,
            exactDuplicates: analysisResult.exactDuplicates.length,
            nearDuplicates: analysisResult.nearDuplicates.length,
            idOverlaps: analysisResult.idOverlaps.length,
            totalDuplicates: analysisResult.exactDuplicates.length + 
                            analysisResult.nearDuplicates.length + 
                            analysisResult.idOverlaps.length,
            duplicateRate: ((analysisResult.exactDuplicates.length + 
                           analysisResult.nearDuplicates.length + 
                           analysisResult.idOverlaps.length) / totalRecords * 100).toFixed(2) + '%'
        };
    }

    generateRecommendations(analysisResult) {
        const recommendations = [];

        if (analysisResult.exactDuplicates.length > 0) {
            recommendations.push({
                priority: 'HIGH',
                action: 'Remove exact duplicates',
                count: analysisResult.exactDuplicates.length,
                reason: 'Exact duplicates can cause data leakage between train/test sets'
            });
        }

        if (analysisResult.idOverlaps.length > 0) {
            recommendations.push({
                priority: 'CRITICAL',
                action: 'Implement ID-based data splitting',
                count: analysisResult.idOverlaps.length,
                reason: 'Same IDs appearing in multiple splits causes severe data leakage'
            });
        }

        if (analysisResult.nearDuplicates.length > 0) {
            recommendations.push({
                priority: 'MEDIUM',
                action: 'Consider removing near-duplicates',
                count: analysisResult.nearDuplicates.length,
                reason: 'Near-duplicates may reduce model generalization'
            });
        }

        return recommendations;
    }

    autoDetectFeatures(data, excludeColumns) {
        return Object.keys(data[0]).filter(col => !excludeColumns.includes(col));
    }

    extractFeatures(row, features) {
        const extracted = {};
        features.forEach(feature => {
            if (row.hasOwnProperty(feature)) {
                extracted[feature] = row[feature];
            }
        });
        return extracted;
    }

    createGroups(data, groupColumns) {
        const groups = {};
        data.forEach((row, index) => {
            const groupKey = this.createGroupKey(row, groupColumns);
            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(index);
        });
        return groups;
    }

    createGroupKey(row, groupColumns) {
        return groupColumns.map(col => row[col] || 'null').join('|');
    }

    getSplitStrategy(config) {
        if (config.temporalColumn) return 'temporal';
        if (config.idColumns && config.idColumns.length > 0) return 'id_based';
        if (config.groupColumns && config.groupColumns.length > 0) return 'group_based';
        return 'stratified';
    }

    ensureMinimumSplitSizes(splitResult, minSize = 10) {
        // 최소 크기가 보장되지 않은 경우 조정
        const adjustedSplit = { ...splitResult };
        
        if (adjustedSplit.test.length < minSize && adjustedSplit.validation.length >= minSize * 2) {
            const moveCount = minSize - adjustedSplit.test.length;
            const moved = adjustedSplit.validation.splice(0, moveCount);
            adjustedSplit.test.push(...moved);
        }
        
        if (adjustedSplit.validation.length < minSize && adjustedSplit.train.length >= minSize * 2) {
            const moveCount = minSize - adjustedSplit.validation.length;
            const moved = adjustedSplit.train.splice(-moveCount);
            adjustedSplit.validation.push(...moved);
        }
        
        return adjustedSplit;
    }

    stratifiedIdSplit(data, uniqueIds, idColumn, stratifyColumn, splitRatios) {
        // 각 ID에 대해 stratify 값 결정 (다수결 또는 첫 번째 값)
        const idStratifyMap = {};
        uniqueIds.forEach(id => {
            const idData = data.filter(row => row[idColumn] === id);
            const stratifyValues = idData.map(row => row[stratifyColumn]);
            idStratifyMap[id] = this.getMajorityValue(stratifyValues);
        });

        // stratify 값별로 ID 그룹핑
        const stratifyGroups = {};
        Object.entries(idStratifyMap).forEach(([id, stratifyValue]) => {
            if (!stratifyGroups[stratifyValue]) {
                stratifyGroups[stratifyValue] = [];
            }
            stratifyGroups[stratifyValue].push(id);
        });

        // 각 그룹에서 비례적으로 분할
        const trainIds = [];
        const validIds = [];
        const testIds = [];

        Object.values(stratifyGroups).forEach(groupIds => {
            const split = this.randomIdSplit(groupIds, splitRatios);
            trainIds.push(...split.train);
            validIds.push(...split.validation);
            testIds.push(...split.test);
        });

        return {
            train: trainIds,
            validation: validIds,
            test: testIds
        };
    }

    getMajorityValue(values) {
        const counts = {};
        values.forEach(val => {
            counts[val] = (counts[val] || 0) + 1;
        });
        
        return Object.entries(counts).reduce((a, b) => 
            counts[a[0]] > counts[b[0]] ? a : b
        )[0];
    }

    createStratifiedSplit(data, stratifyColumn, splitRatios) {
        if (!stratifyColumn) {
            // 단순 무작위 분할
            return this.randomSplit(data, splitRatios);
        }

        // 계층화 분할
        const stratifyGroups = {};
        data.forEach((row, index) => {
            const stratifyValue = row[stratifyColumn];
            if (!stratifyGroups[stratifyValue]) {
                stratifyGroups[stratifyValue] = [];
            }
            stratifyGroups[stratifyValue].push(index);
        });

        const trainIndices = [];
        const validIndices = [];
        const testIndices = [];

        Object.values(stratifyGroups).forEach(groupIndices => {
            const split = this.randomIdSplit(groupIndices, splitRatios);
            trainIndices.push(...split.train);
            validIndices.push(...split.validation);
            testIndices.push(...split.test);
        });

        return {
            train: trainIndices.map(i => data[i]),
            validation: validIndices.map(i => data[i]),
            test: testIndices.map(i => data[i]),
            splitMethod: 'stratified'
        };
    }

    randomSplit(data, splitRatios) {
        const indices = data.map((_, i) => i);
        const split = this.randomIdSplit(indices, splitRatios);
        
        return {
            train: split.train.map(i => data[i]),
            validation: split.validation.map(i => data[i]),
            test: split.test.map(i => data[i]),
            splitMethod: 'random'
        };
    }
}

/**
 * 중복 누출 방지 파이프라인
 */
export function createDuplicateSafePipeline() {
    const resolver = new DuplicateLeakageResolver();
    
    return {
        resolver,
        
        // 안전한 데이터 분할 파이프라인
        processSafeSplit: async (data, config = {}) => {
            console.log('🔒 Processing safe data split to prevent duplicate leakage...');
            
            // 1. 중복 분석
            const duplicateAnalysis = resolver.analyzeDuplicates(data, config);
            
            // 2. 안전한 분할 실행
            const splitResult = resolver.createSafeDataSplit(data, config);
            
            console.log('✅ Safe data split completed');
            
            return {
                splitResult,
                duplicateAnalysis,
                summary: {
                    duplicatesRemoved: splitResult.summary.removedDuplicates,
                    leakagePrevented: duplicateAnalysis.summary.totalDuplicates,
                    splitQuality: this.calculateSplitQuality(splitResult.validation),
                    safetyScore: this.calculateSafetyScore(duplicateAnalysis, splitResult.validation)
                }
            };
        },
        
        calculateSplitQuality: (validation) => {
            let score = 100;
            
            // ID 누출 검사
            Object.values(validation.idLeakage).forEach(leakage => {
                if (leakage.hasLeakage) {
                    score -= 20;
                }
            });
            
            // 크기 적절성 검사
            if (!validation.sizeCheck.minSizeReached) {
                score -= 15;
            }
            
            return Math.max(0, score);
        },
        
        calculateSafetyScore: (duplicateAnalysis, validation) => {
            let score = 100;
            
            // 중복 감점
            const duplicateRate = parseFloat(duplicateAnalysis.summary.duplicateRate);
            score -= duplicateRate * 2;
            
            // ID 누출 감점
            const hasIdLeakage = Object.values(validation.idLeakage).some(leak => leak.hasLeakage);
            if (hasIdLeakage) {
                score -= 30;
            }
            
            return Math.max(0, Math.round(score));
        }
    };
}