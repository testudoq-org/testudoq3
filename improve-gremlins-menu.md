# Gremlins Menu System Improvements

## Current Architecture

### Components
1. Context Menu (context-menu.js)
   - Right-click menu integration
   - Basic start/stop functionality
   - Fixed 15-second duration

2. Popup Interface (popup/*)
   - Configuration UI
   - Detailed control options
   - Log export functionality

3. Message Handling
   - Multiple message formats
   - Different command structures
   - Inconsistent state management

## Proposed Improvements

### 1. Unified Command Interface
```javascript
// Standardize all gremlins commands
const GREMLIN_COMMANDS = {
    START: 'GREMLIN:START',
    STOP: 'GREMLIN:STOP',
    CONFIG: 'GREMLIN:CONFIG',
    STATE: 'GREMLIN:STATE'
};

// Standard message structure
interface GremlinMessage {
    command: string;
    payload?: {
        duration?: number;
        configuration?: GremlinConfig;
        state?: GremlinState;
    };
}

// Standardize configuration
interface GremlinConfig {
    species: string[];
    mogwais: string[];
    strategy: string;
    options?: Record<string, any>;
}
```

### 2. State Management
```javascript
// Centralized state store
class GremlinStateManager {
    private state: GremlinState = {
        attacking: false,
        duration: 15,
        configuration: defaultConfig,
        libraryLoaded: false
    };

    // State updates broadcast to all components
    setState(updates: Partial<GremlinState>) {
        this.state = { ...this.state, ...updates };
        this.broadcast();
    }

    // Subscribe to state changes
    subscribe(callback: (state: GremlinState) => void) {
        // Implementation
    }
}
```

### 3. Menu Integration

#### Context Menu
```javascript
// Enhanced context menu with configuration
const gremlinsMenu = menuBuilder.subMenu('Gremlins Testing', rootMenu);

// Add configuration access
menuBuilder.menuItem('Configure...', gremlinsMenu, () => {
    chrome.runtime.openOptionsPage();
});

// Add quick actions
menuBuilder.menuItem('Quick Attack (15s)', gremlinsMenu, startQuickAttack);
menuBuilder.menuItem('Stop Attack', gremlinsMenu, stopAttack);
```

#### Popup Menu
```javascript
// Enhanced popup functionality
class GremlinsPopup {
    private config: GremlinConfig;
    
    initialize() {
        // Load saved configuration
        this.loadConfiguration();
        // Setup UI listeners
        this.setupEventListeners();
        // Subscribe to state updates
        stateManager.subscribe(this.updateUI);
    }

    // Save configuration changes
    saveConfiguration() {
        chrome.storage.local.set({
            gremlinConfig: this.config
        });
        stateManager.setState({ configuration: this.config });
    }
}
```

### 4. Script Loading Improvements

```javascript
class GremlinLibraryManager {
    private loadAttempts = 0;
    private maxAttempts = 3;

    async ensureLoaded(): Promise<boolean> {
        if (window.gremlins) {
            return true;
        }

        if (this.loadAttempts >= this.maxAttempts) {
            throw new Error('Max load attempts exceeded');
        }

        this.loadAttempts++;
        return this.loadLibrary();
    }

    private async loadLibrary(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = chrome.runtime.getURL('gremlins.min.js');
            
            script.onload = () => {
                stateManager.setState({ libraryLoaded: true });
                resolve(true);
            };
            
            script.onerror = (error) => {
                stateManager.setState({ 
                    libraryLoaded: false,
                    error: error.message
                });
                reject(error);
            };

            document.head.appendChild(script);
        });
    }
}
```

### 5. Error Handling Enhancements

```javascript
class GremlinErrorHandler {
    handle(error: Error) {
        // Log error
        console.error('Gremlins Error:', error);

        // Notify user
        this.showNotification(error);

        // Attempt recovery
        this.attemptRecovery(error);
    }

    private showNotification(error: Error) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/testudo-16.png',
            title: 'Gremlins Error',
            message: this.getUserFriendlyMessage(error)
        });
    }

    private attemptRecovery(error: Error) {
        if (error.message.includes('library not loaded')) {
            return libraryManager.ensureLoaded()
                .then(() => stateManager.retry());
        }

        // Reset state for unrecoverable errors
        stateManager.setState({
            attacking: false,
            error: error.message
        });
    }
}
```

## Implementation Priority

1. State Management
   - Implement GremlinStateManager
   - Update all components to use centralized state
   - Add state persistence

2. Command Standardization
   - Update all message passing to use GREMLIN_COMMANDS
   - Implement standard message format
   - Update handlers for new format

3. Menu Enhancement
   - Add configuration access to context menu
   - Improve popup UI responsiveness
   - Add state synchronization

4. Error Handling
   - Implement GremlinErrorHandler
   - Add recovery mechanisms
   - Improve error messages

5. Script Loading
   - Implement GremlinLibraryManager
   - Add retry logic
   - Improve load status tracking

## Testing Requirements

1. State Management
   - Verify state consistency across components
   - Test state persistence
   - Check state recovery after errors

2. Menu Integration
   - Verify no duplicate functionality
   - Test configuration saving/loading
   - Check UI updates

3. Error Scenarios
   - Test library load failures
   - Verify error recovery
   - Check user notifications

4. Cross-browser Compatibility
   - Test in Chrome and Firefox
   - Verify menu appearance
   - Check script loading
