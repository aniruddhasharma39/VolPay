// Core Managers: Storage, State, and History

class StorageManager {
    static PREFIX = 'volpay_';

    static get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(this.PREFIX + key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Error reading from localStorage', e);
            return defaultValue;
        }
    }

    static set(key, value) {
        try {
            localStorage.setItem(this.PREFIX + key, JSON.stringify(value));
        } catch (e) {
            console.error('Error saving to localStorage', e);
        }
    }

    static remove(key) {
        localStorage.removeItem(this.PREFIX + key);
    }
}

class StateManager {
    constructor() {
        this.subscribers = [];
        this.defaultState = {
            role: 'Report Builder',
            theme: 'light',
            datasets: [],
            catalogue: [],
            generatedReports: [],
            notifications: [],
            activityLog: [],
            favorites: [],
            currentBuilder: {
                dataset: null,
                fields: [],
                pinnedFields: [],
                filters: {}, // map of fieldId -> array of active filters (pills)
                conditions: [], // array of condition objects for rule builder
                sorts: [],
                groups: []
            }
        };
        const savedState = StorageManager.get('app_state', null);
        if (savedState) {
            // Deep merge to ensure all defaults exist even if localstorage is from an old version
            this.state = {
                ...this.defaultState,
                ...savedState,
                currentBuilder: {
                    ...this.defaultState.currentBuilder,
                    ...(savedState.currentBuilder || {})
                }
            };
        } else {
            this.state = this.defaultState;
        }
    }

    subscribe(callback) {
        this.subscribers.push(callback);
    }

    notify() {
        this.subscribers.forEach(cb => cb(this.state));
    }

    get() {
        return this.state;
    }

    update(updater) {
        if (typeof updater === 'function') {
            this.state = updater(this.state);
        } else {
            this.state = { ...this.state, ...updater };
        }
        StorageManager.set('app_state', this.state);
        this.notify();
    }
}

class HistoryManager {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.undoStack = [];
        this.redoStack = [];
    }

    pushState() {
        // Deep clone current builder state safely
        const builderState = this.stateManager.get().currentBuilder || {};
        const currentState = JSON.parse(JSON.stringify(builderState));
        this.undoStack.push(currentState);
        this.redoStack = []; // Clear redo stack on new action
    }

    undo() {
        if (this.undoStack.length > 0) {
            const currentState = JSON.parse(JSON.stringify(this.stateManager.get().currentBuilder));
            this.redoStack.push(currentState);
            
            const prevState = this.undoStack.pop();
            this.stateManager.update(state => ({ ...state, currentBuilder: prevState }));
            return true;
        }
        return false;
    }

    redo() {
        if (this.redoStack.length > 0) {
            const currentState = JSON.parse(JSON.stringify(this.stateManager.get().currentBuilder));
            this.undoStack.push(currentState);
            
            const nextState = this.redoStack.pop();
            this.stateManager.update(state => ({ ...state, currentBuilder: nextState }));
            return true;
        }
        return false;
    }
}

window.appStorage = StorageManager;
window.appState = new StateManager();
window.appHistory = new HistoryManager(window.appState);
