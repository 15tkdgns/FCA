/**
 * Event Bus - Component Communication System
 * ========================================
 * Decoupled event-driven communication between components
 * with namespacing, priorities, and error handling
 */

class EventBus {
    constructor() {
        this.events = new Map();
        this.wildcardEvents = new Map();
        this.onceEvents = new Set();
        this.priorities = new Map();
        this.namespaces = new Map();
        this.maxListeners = 100;
        this.debugMode = false;
        
        // Performance monitoring
        this.stats = {
            totalEvents: 0,
            totalListeners: 0,
            eventsEmitted: 0,
            errorsCount: 0
        };
    }
    
    /**
     * Subscribe to event
     */
    on(eventName, callback, options = {}) {
        try {
            this.validateEventName(eventName);
            this.validateCallback(callback);
            
            const {
                priority = 0,
                namespace = 'default',
                once = false,
                prepend = false
            } = options;
            
            const fullEventName = this.getFullEventName(eventName, namespace);
            
            if (!this.events.has(fullEventName)) {
                this.events.set(fullEventName, []);
            }
            
            const listeners = this.events.get(fullEventName);
            
            // Check max listeners
            if (listeners.length >= this.maxListeners) {
                console.warn(`⚠️ Max listeners (${this.maxListeners}) reached for event '${fullEventName}'`);
                return false;
            }
            
            const listener = {
                callback,
                priority,
                namespace,
                once,
                id: this.generateId(),
                addedAt: Date.now()
            };
            
            // Add listener based on priority and prepend option
            if (prepend) {
                listeners.unshift(listener);
            } else {
                listeners.push(listener);
            }
            
            // Sort by priority (higher priority first)
            listeners.sort((a, b) => b.priority - a.priority);
            
            // Track once events
            if (once) {
                this.onceEvents.add(listener.id);
            }
            
            // Update stats
            this.stats.totalListeners++;
            
            // Debug logging
            if (this.debugMode) {
                console.log(`📡 Event listener added: ${fullEventName} (ID: ${listener.id})`);
            }
            
            return listener.id;
            
        } catch (error) {
            console.error('❌ Failed to add event listener:', error);
            this.stats.errorsCount++;
            return false;
        }
    }
    
    /**
     * Subscribe to event once
     */
    once(eventName, callback, options = {}) {
        return this.on(eventName, callback, { ...options, once: true });
    }
    
    /**
     * Subscribe to multiple events with wildcard
     */
    onPattern(pattern, callback, options = {}) {
        const id = this.generateId();
        
        if (!this.wildcardEvents.has(pattern)) {
            this.wildcardEvents.set(pattern, []);
        }
        
        this.wildcardEvents.get(pattern).push({
            callback,
            id,
            pattern,
            ...options
        });
        
        return id;
    }
    
    /**
     * Unsubscribe from event
     */
    off(eventName, callbackOrId, namespace = 'default') {
        try {
            const fullEventName = this.getFullEventName(eventName, namespace);
            
            if (!this.events.has(fullEventName)) {
                return false;
            }
            
            const listeners = this.events.get(fullEventName);
            const originalLength = listeners.length;
            
            if (typeof callbackOrId === 'string') {
                // Remove by ID
                const index = listeners.findIndex(l => l.id === callbackOrId);
                if (index !== -1) {
                    listeners.splice(index, 1);
                    this.onceEvents.delete(callbackOrId);
                }
            } else if (typeof callbackOrId === 'function') {
                // Remove by callback
                for (let i = listeners.length - 1; i >= 0; i--) {
                    if (listeners[i].callback === callbackOrId) {
                        this.onceEvents.delete(listeners[i].id);
                        listeners.splice(i, 1);
                    }
                }
            } else {
                // Remove all listeners for this event
                listeners.length = 0;
                this.events.delete(fullEventName);
            }
            
            // Update stats
            this.stats.totalListeners -= (originalLength - listeners.length);
            
            if (this.debugMode) {
                console.log(`📡 Event listener removed: ${fullEventName}`);
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Failed to remove event listener:', error);
            this.stats.errorsCount++;
            return false;
        }
    }
    
    /**
     * Emit event
     */
    emit(eventName, data = null, options = {}) {
        try {
            const {
                namespace = 'default',
                stopOnError = false,
                async = false,
                timeout = 5000
            } = options;
            
            const fullEventName = this.getFullEventName(eventName, namespace);
            const results = [];
            
            // Update stats
            this.stats.eventsEmitted++;
            this.stats.totalEvents++;
            
            if (this.debugMode) {
                console.log(`📡 Emitting event: ${fullEventName}`, data);
            }
            
            // Execute direct listeners
            if (this.events.has(fullEventName)) {
                const listeners = [...this.events.get(fullEventName)]; // Clone to prevent modification during iteration
                
                for (const listener of listeners) {
                    try {
                        const result = async 
                            ? this.executeAsyncListener(listener, eventName, data, timeout)
                            : this.executeListener(listener, eventName, data);
                        
                        results.push({ listenerId: listener.id, result, error: null });
                        
                        // Remove once listeners
                        if (listener.once) {
                            this.removeListenerById(fullEventName, listener.id);
                        }
                        
                    } catch (error) {
                        console.error(`❌ Error in event listener (${listener.id}):`, error);
                        results.push({ listenerId: listener.id, result: null, error: error.message });
                        this.stats.errorsCount++;
                        
                        if (stopOnError) {
                            break;
                        }
                    }
                }
            }
            
            // Execute wildcard listeners
            this.executeWildcardListeners(eventName, data, results, { async, timeout, stopOnError });
            
            return {
                eventName: fullEventName,
                listenersExecuted: results.length,
                results,
                timestamp: Date.now()
            };
            
        } catch (error) {
            console.error('❌ Failed to emit event:', error);
            this.stats.errorsCount++;
            return null;
        }
    }
    
    /**
     * Emit event asynchronously
     */
    async emitAsync(eventName, data = null, options = {}) {
        return this.emit(eventName, data, { ...options, async: true });
    }
    
    /**
     * Get all listeners for an event
     */
    listeners(eventName, namespace = 'default') {
        const fullEventName = this.getFullEventName(eventName, namespace);
        return this.events.get(fullEventName) || [];
    }
    
    /**
     * Get listener count for an event
     */
    listenerCount(eventName, namespace = 'default') {
        return this.listeners(eventName, namespace).length;
    }
    
    /**
     * Remove all listeners for a namespace
     */
    removeNamespace(namespace) {
        let removedCount = 0;
        
        for (const [eventName, listeners] of this.events.entries()) {
            if (eventName.includes(`::${namespace}::`)) {
                removedCount += listeners.length;
                this.events.delete(eventName);
            }
        }
        
        this.stats.totalListeners -= removedCount;
        return removedCount;
    }
    
    /**
     * Remove all listeners
     */
    removeAllListeners() {
        const totalRemoved = this.stats.totalListeners;
        this.events.clear();
        this.wildcardEvents.clear();
        this.onceEvents.clear();
        this.stats.totalListeners = 0;
        return totalRemoved;
    }
    
    /**
     * Get event statistics
     */
    getStats() {
        return {
            ...this.stats,
            currentListeners: this.stats.totalListeners,
            activeEvents: this.events.size,
            wildcardPatterns: this.wildcardEvents.size
        };
    }
    
    /**
     * Enable/disable debug mode
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        console.log(`📡 EventBus debug mode: ${enabled ? 'ON' : 'OFF'}`);
    }
    
    /**
     * Set maximum listeners per event
     */
    setMaxListeners(max) {
        this.maxListeners = Math.max(1, max);
    }
    
    /**
     * Create namespace-specific event bus
     */
    namespace(name) {
        if (!this.namespaces.has(name)) {
            this.namespaces.set(name, new NamespaceEventBus(this, name));
        }
        return this.namespaces.get(name);
    }
    
    /**
     * Private helper methods
     */
    validateEventName(eventName) {
        if (typeof eventName !== 'string' || eventName.length === 0) {
            throw new Error('Event name must be a non-empty string');
        }
    }
    
    validateCallback(callback) {
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }
    }
    
    getFullEventName(eventName, namespace) {
        return `${eventName}::${namespace}::`;
    }
    
    generateId() {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    executeListener(listener, eventName, data) {
        return listener.callback.call(null, data, eventName);
    }
    
    async executeAsyncListener(listener, eventName, data, timeout) {
        return Promise.race([
            Promise.resolve(listener.callback.call(null, data, eventName)),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Listener timeout')), timeout)
            )
        ]);
    }
    
    executeWildcardListeners(eventName, data, results, options) {
        for (const [pattern, listeners] of this.wildcardEvents.entries()) {
            if (this.matchesPattern(eventName, pattern)) {
                for (const listener of listeners) {
                    try {
                        const result = options.async
                            ? this.executeAsyncListener(listener, eventName, data, options.timeout)
                            : this.executeListener(listener, eventName, data);
                        
                        results.push({ listenerId: listener.id, result, error: null });
                        
                    } catch (error) {
                        console.error(`❌ Error in wildcard listener (${listener.id}):`, error);
                        results.push({ listenerId: listener.id, result: null, error: error.message });
                        
                        if (options.stopOnError) {
                            break;
                        }
                    }
                }
            }
        }
    }
    
    matchesPattern(eventName, pattern) {
        const regex = new RegExp(pattern.replace('*', '.*'));
        return regex.test(eventName);
    }
    
    removeListenerById(fullEventName, id) {
        const listeners = this.events.get(fullEventName);
        if (listeners) {
            const index = listeners.findIndex(l => l.id === id);
            if (index !== -1) {
                listeners.splice(index, 1);
                this.onceEvents.delete(id);
                this.stats.totalListeners--;
            }
        }
    }
}

/**
 * Namespace-specific event bus wrapper
 */
class NamespaceEventBus {
    constructor(eventBus, namespace) {
        this.eventBus = eventBus;
        this.namespace = namespace;
    }
    
    on(eventName, callback, options = {}) {
        return this.eventBus.on(eventName, callback, { ...options, namespace: this.namespace });
    }
    
    once(eventName, callback, options = {}) {
        return this.eventBus.once(eventName, callback, { ...options, namespace: this.namespace });
    }
    
    off(eventName, callbackOrId) {
        return this.eventBus.off(eventName, callbackOrId, this.namespace);
    }
    
    emit(eventName, data, options = {}) {
        return this.eventBus.emit(eventName, data, { ...options, namespace: this.namespace });
    }
    
    emitAsync(eventName, data, options = {}) {
        return this.eventBus.emitAsync(eventName, data, { ...options, namespace: this.namespace });
    }
    
    listeners(eventName) {
        return this.eventBus.listeners(eventName, this.namespace);
    }
    
    listenerCount(eventName) {
        return this.eventBus.listenerCount(eventName, this.namespace);
    }
    
    removeAllListeners() {
        return this.eventBus.removeNamespace(this.namespace);
    }
}

// Create global instance
const eventBus = new EventBus();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EventBus, eventBus };
}

// Make available globally
if (typeof window !== 'undefined') {
    window.EventBus = EventBus;
    window.eventBus = eventBus;
}