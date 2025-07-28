/**
 * Module Manager
 * 모든 모듈의 라이프사이클을 관리
 */
import { BaseModule } from './BaseModule.js';

export class ModuleManager {
    constructor() {
        this.modules = new Map();
        this.moduleRegistry = new Map();
        this.initializationOrder = [];
        this.logger = this.createLogger();
        this.eventBus = this.createEventBus();
        
        this.logger.info('Module Manager initialized');
    }

    /**
     * 모듈 등록
     */
    register(name, moduleClass, config = {}) {
        if (this.moduleRegistry.has(name)) {
            this.logger.warn(`Module ${name} already registered, overwriting`);
        }

        this.moduleRegistry.set(name, {
            class: moduleClass,
            config: config,
            dependencies: config.dependencies || []
        });

        this.logger.debug(`Module ${name} registered`);
    }

    /**
     * 모듈 생성 및 초기화
     */
    async create(name, options = {}) {
        if (this.modules.has(name)) {
            this.logger.warn(`Module ${name} already exists`);
            return this.modules.get(name);
        }

        const moduleInfo = this.moduleRegistry.get(name);
        if (!moduleInfo) {
            throw new Error(`Module ${name} not registered`);
        }

        try {
            // 의존성 먼저 생성
            await this.createDependencies(moduleInfo.dependencies);

            // 모듈 인스턴스 생성
            const moduleInstance = new moduleInfo.class(name, moduleInfo.dependencies);
            
            // BaseModule을 상속했는지 확인
            if (!(moduleInstance instanceof BaseModule)) {
                this.logger.warn(`Module ${name} does not extend BaseModule`);
            }

            // 모듈 초기화
            await moduleInstance.initialize();

            // 모듈 등록
            this.modules.set(name, moduleInstance);
            this.initializationOrder.push(name);

            this.logger.info(`Module ${name} created and initialized`);
            this.eventBus.emit('moduleCreated', { name, module: moduleInstance });

            return moduleInstance;
        } catch (error) {
            this.logger.error(`Failed to create module ${name}:`, error);
            throw error;
        }
    }

    /**
     * 의존성 모듈들 생성
     */
    async createDependencies(dependencies) {
        for (const dependency of dependencies) {
            if (!this.modules.has(dependency)) {
                await this.create(dependency);
            }
        }
    }

    /**
     * 모듈 가져오기
     */
    get(name) {
        return this.modules.get(name);
    }

    /**
     * 모듈 존재 여부 확인
     */
    has(name) {
        return this.modules.has(name);
    }

    /**
     * 모든 모듈 가져오기
     */
    getAllModules() {
        return Array.from(this.modules.values());
    }

    /**
     * 모듈 상태 정보 가져오기
     */
    getModuleStatus() {
        const status = {};
        
        for (const [name, module] of this.modules) {
            if (typeof module.getStatus === 'function') {
                status[name] = module.getStatus();
            } else {
                status[name] = {
                    name,
                    initialized: true,
                    type: 'legacy'
                };
            }
        }
        
        return status;
    }

    /**
     * 모듈 파괴
     */
    async destroy(name) {
        const module = this.modules.get(name);
        if (!module) {
            this.logger.warn(`Module ${name} not found`);
            return;
        }

        try {
            // 의존하는 모듈들 먼저 파괴
            await this.destroyDependents(name);

            // 모듈 파괴
            if (typeof module.destroy === 'function') {
                await module.destroy();
            }

            this.modules.delete(name);
            this.initializationOrder = this.initializationOrder.filter(n => n !== name);

            this.logger.info(`Module ${name} destroyed`);
            this.eventBus.emit('moduleDestroyed', { name });
        } catch (error) {
            this.logger.error(`Failed to destroy module ${name}:`, error);
            throw error;
        }
    }

    /**
     * 의존하는 모듈들 파괴
     */
    async destroyDependents(moduleName) {
        const dependents = [];
        
        for (const [name, moduleInfo] of this.moduleRegistry) {
            if (moduleInfo.dependencies.includes(moduleName) && this.modules.has(name)) {
                dependents.push(name);
            }
        }

        for (const dependent of dependents) {
            await this.destroy(dependent);
        }
    }

    /**
     * 모든 모듈 파괴
     */
    async destroyAll() {
        const modules = [...this.initializationOrder].reverse();
        
        for (const name of modules) {
            await this.destroy(name);
        }
        
        this.logger.info('All modules destroyed');
    }

    /**
     * 모듈 재시작
     */
    async restart(name) {
        const moduleInfo = this.moduleRegistry.get(name);
        if (!moduleInfo) {
            throw new Error(`Module ${name} not registered`);
        }

        await this.destroy(name);
        return await this.create(name);
    }

    /**
     * 모듈 의존성 그래프 생성
     */
    getDependencyGraph() {
        const graph = {};
        
        for (const [name, moduleInfo] of this.moduleRegistry) {
            graph[name] = {
                dependencies: moduleInfo.dependencies,
                dependents: []
            };
        }

        // dependents 계산
        for (const [name, moduleInfo] of this.moduleRegistry) {
            for (const dependency of moduleInfo.dependencies) {
                if (graph[dependency]) {
                    graph[dependency].dependents.push(name);
                }
            }
        }

        return graph;
    }

    /**
     * 모듈 로딩 순서 계산
     */
    calculateLoadOrder() {
        const graph = this.getDependencyGraph();
        const visited = new Set();
        const result = [];

        const visit = (name) => {
            if (visited.has(name)) return;
            visited.add(name);

            const moduleInfo = graph[name];
            if (moduleInfo) {
                for (const dependency of moduleInfo.dependencies) {
                    visit(dependency);
                }
                result.push(name);
            }
        };

        for (const name of this.moduleRegistry.keys()) {
            visit(name);
        }

        return result;
    }

    /**
     * 순환 의존성 검사
     */
    detectCircularDependencies() {
        const graph = this.getDependencyGraph();
        const visiting = new Set();
        const visited = new Set();
        const cycles = [];

        const visit = (name, path = []) => {
            if (visiting.has(name)) {
                const cycleStart = path.indexOf(name);
                cycles.push(path.slice(cycleStart).concat(name));
                return;
            }

            if (visited.has(name)) return;

            visiting.add(name);
            const moduleInfo = graph[name];
            
            if (moduleInfo) {
                for (const dependency of moduleInfo.dependencies) {
                    visit(dependency, [...path, name]);
                }
            }

            visiting.delete(name);
            visited.add(name);
        };

        for (const name of this.moduleRegistry.keys()) {
            visit(name);
        }

        return cycles;
    }

    /**
     * 모듈 성능 통계
     */
    getPerformanceStats() {
        const stats = {
            totalModules: this.modules.size,
            registeredModules: this.moduleRegistry.size,
            memoryUsage: this.getMemoryUsage(),
            initializationOrder: [...this.initializationOrder]
        };

        return stats;
    }

    /**
     * 메모리 사용량 추정
     */
    getMemoryUsage() {
        if (!performance.memory) {
            return { unavailable: true };
        }

        return {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit
        };
    }

    /**
     * 이벤트 버스 생성
     */
    createEventBus() {
        const listeners = new Map();

        return {
            on: (event, callback) => {
                if (!listeners.has(event)) {
                    listeners.set(event, []);
                }
                listeners.get(event).push(callback);
            },
            
            off: (event, callback) => {
                const eventListeners = listeners.get(event);
                if (eventListeners) {
                    const index = eventListeners.indexOf(callback);
                    if (index > -1) {
                        eventListeners.splice(index, 1);
                    }
                }
            },
            
            emit: (event, data) => {
                const eventListeners = listeners.get(event);
                if (eventListeners) {
                    eventListeners.forEach(callback => {
                        try {
                            callback(data);
                        } catch (error) {
                            this.logger.error(`Error in event listener for ${event}:`, error);
                        }
                    });
                }
            }
        };
    }

    /**
     * 로거 생성
     */
    createLogger() {
        return {
            debug: (message, ...args) => console.debug(`[ModuleManager] ${message}`, ...args),
            info: (message, ...args) => console.info(`[ModuleManager] ${message}`, ...args),
            warn: (message, ...args) => console.warn(`[ModuleManager] ${message}`, ...args),
            error: (message, ...args) => console.error(`[ModuleManager] ${message}`, ...args)
        };
    }

    /**
     * 디버그 정보 출력
     */
    debug() {
        console.group('🔧 Module Manager Debug Info');
        
        console.log('Registered Modules:', Array.from(this.moduleRegistry.keys()));
        console.log('Active Modules:', Array.from(this.modules.keys()));
        console.log('Initialization Order:', this.initializationOrder);
        console.log('Dependency Graph:', this.getDependencyGraph());
        
        const cycles = this.detectCircularDependencies();
        if (cycles.length > 0) {
            console.warn('Circular Dependencies:', cycles);
        }
        
        console.log('Performance Stats:', this.getPerformanceStats());
        console.log('Module Status:', this.getModuleStatus());
        
        console.groupEnd();
    }
}

// 전역 모듈 매니저 인스턴스
export const moduleManager = new ModuleManager();

export default moduleManager;