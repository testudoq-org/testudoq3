# Gremlins Menu Integration Fixes

## 1. Menu Unification

### Current Issues
1. Duplicate menu creation paths:
   - context-menu.js creates right-click menu
   - popup.js provides configuration interface
2. Potential state inconsistency between interfaces

### Required Changes
1. State Management:
```javascript
// Add to gremlins-handler.js
let gremlinState = {
    attacking: false,
    duration: 15,
    configuration: {
        species: ['clicker', 'toucher', 'formFiller', 'scroller', 'typer'],
        mogwais: ['alert', 'fps', 'gizmo'],
        strategy: 'distribution'
    }
};
```

2. Message Format Standardization:
```javascript
// Standard message format for all gremlins commands
{
    command: 'startGremlins' | 'stopGremlins' | 'updateConfig',
    payload: {
        duration?: number,
        configuration?: {
            species?: string[],
            mogwais?: string[],
            strategy?: string
        }
    }
}
```

## 2. Script Loading Sequence

### Current Issues
1. Race condition potential between:
   - gremlins.min.js loading
   - content script initialization
   - popup script execution

### Required Changes
1. Load Status Tracking:
```javascript
// Add to gremlins-handler.js
let libraryStatus = {
    loaded: false,
    error: null,
    loading: false
};

async function ensureLibraryLoaded() {
    if (libraryStatus.loaded) return true;
    if (libraryStatus.loading) {
        // Wait for current load to complete
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (libraryStatus.loaded) {
                    clearInterval(checkInterval);
                    resolve(true);
                }
            }, 100);
        });
    }
    
    try {
        libraryStatus.loading = true;
        await injectGremlinsLibrary();
        libraryStatus.loaded = true;
        return true;
    } catch (error) {
        libraryStatus.error = error;
        return false;
    } finally {
        libraryStatus.loading = false;
    }
}
```

## 3. State Synchronization

### Current Issues
1. Popup and context menu can get out of sync
2. No centralized state management
3. Tab reload/navigation handling needed

### Required Changes
1. State Broadcasting:
```javascript
function broadcastState() {
    chrome.runtime.sendMessage({
        command: 'gremlinStateUpdate',
        payload: {
            attacking: gremlinState.attacking,
            configuration: gremlinState.configuration
        }
    });
}
```

2. Tab Lifecycle Management:
```javascript
// Add to background.js
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === 'complete') {
        // Reinitialize gremlins state for this tab
        chrome.tabs.sendMessage(tabId, {
            command: 'initGremlins',
            payload: {
                configuration: getDefaultConfiguration()
            }
        });
    }
});
```

## 4. Error Handling

### Required Changes
1. Message Error Handling:
```javascript
function sendMessageWithRetry(tabId, message, maxRetries = 3) {
    let attempts = 0;
    
    function attempt() {
        return new Promise((resolve, reject) => {
            chrome.tabs.sendMessage(tabId, message, response => {
                if (chrome.runtime.lastError) {
                    if (attempts < maxRetries) {
                        attempts++;
                        setTimeout(() => attempt().then(resolve).catch(reject), 100);
                    } else {
                        reject(chrome.runtime.lastError);
                    }
                } else {
                    resolve(response);
                }
            });
        });
    }
    
    return attempt();
}
```

## 5. Testing Scenarios

1. Menu Integration Tests:
   - Verify no duplicate menu entries
   - Check state sync between interfaces
   - Test configuration persistence

2. Script Loading Tests:
   - Verify proper load sequence
   - Test error recovery
   - Check reinitialization after navigation

3. State Management Tests:
   - Verify state consistency
   - Test configuration updates
   - Check error handling

## Implementation Order

1. Update message format standardization
2. Implement centralized state management
3. Fix script loading sequence
4. Add error handling and recovery
5. Update tests and documentation
