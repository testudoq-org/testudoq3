# Immediate Debug Fixes for Gremlins Integration

## 1. Message Handling Issues

### Problem
Multiple components sending different message formats:
- context-menu.js uses handlers.gremlinsAttack.start()
- popup.js uses chrome.tabs.sendMessage directly
- gremlins-handler.js expects specific message formats

### Quick Fix
```javascript
// In gremlins-handler.js
const MESSAGE_TYPES = {
    START: 'startGremlins',
    STOP: 'stopGremlins',
    UPDATE: 'updateConfig',
    STATE: 'gremlinStateUpdate'
};

// Standardize message handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message.command || !MESSAGE_TYPES[message.command]) {
        return false;
    }

    try {
        switch (message.command) {
            case MESSAGE_TYPES.START:
                startGremlinsAttack(message.payload?.duration || 15, message.payload?.configuration);
                sendResponse({ status: 'started' });
                break;
            case MESSAGE_TYPES.STOP:
                stopGremlinsAttack();
                sendResponse({ status: 'stopped' });
                break;
            case MESSAGE_TYPES.UPDATE:
                updateConfiguration(message.payload?.configuration);
                sendResponse({ status: 'updated' });
                break;
        }
    } catch (error) {
        sendResponse({ status: 'error', error: error.message });
    }
    return true;
});
```

## 2. Library Loading Race Condition

### Problem
- gremlins.min.js might not be loaded when attack starts
- Multiple components trying to load the library
- No loading status tracking

### Quick Fix
```javascript
// In gremlins-handler.js
let libraryLoadPromise = null;

function ensureLibraryLoaded() {
    if (window.gremlins) {
        return Promise.resolve(true);
    }

    if (libraryLoadPromise) {
        return libraryLoadPromise;
    }

    libraryLoadPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('gremlins.min.js');
        script.onload = () => {
            console.log('Gremlins library loaded successfully');
            resolve(true);
        };
        script.onerror = (error) => {
            console.error('Failed to load Gremlins library:', error);
            libraryLoadPromise = null;
            reject(error);
        };
        (document.head || document.documentElement).appendChild(script);
    });

    return libraryLoadPromise;
}
```

## 3. Menu State Synchronization

### Problem
- Popup and context menu can become out of sync
- No state persistence between page reloads
- Multiple entry points updating state independently

### Quick Fix
```javascript
// In gremlins-handler.js
let gremlinState = {
    attacking: false,
    duration: 15,
    configuration: getDefaultConfiguration()
};

function broadcastState() {
    chrome.runtime.sendMessage({
        command: MESSAGE_TYPES.STATE,
        payload: { ...gremlinState }
    });
}

// Update state handlers
function startGremlinsAttack(duration, config) {
    gremlinState.attacking = true;
    gremlinState.duration = duration;
    if (config) {
        gremlinState.configuration = { ...config };
    }
    broadcastState();
    // ... rest of start logic
}

function stopGremlinsAttack() {
    gremlinState.attacking = false;
    broadcastState();
    // ... rest of stop logic
}
```

## 4. Error Recovery

### Problem
- No proper error handling for failed script injection
- Missing recovery mechanisms
- Unclear error messages

### Quick Fix
```javascript
// In popup.js and context-menu.js
function handleGremlinsError(error) {
    console.error('Gremlins Error:', error);
    
    // Attempt recovery
    if (error.message.includes('not loaded')) {
        return reloadGremlinsLibrary()
            .then(() => retryLastAction());
    }
    
    // Reset state if unrecoverable
    gremlinState.attacking = false;
    broadcastState();
    
    // Show user-friendly error
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/testudo-16.png',
        title: 'Gremlins Error',
        message: 'Failed to execute gremlins attack. Please try reloading the page.'
    });
}
```

## 5. Implementation Steps

1. Apply Message Standardization:
   - Update all message senders to use new format
   - Add MESSAGE_TYPES enum
   - Update all listeners

2. Fix Library Loading:
   - Implement ensureLibraryLoaded
   - Add to start sequence
   - Add loading status checks

3. Add State Management:
   - Implement gremlinState
   - Add broadcast mechanism
   - Update UI components to listen for state

4. Improve Error Handling:
   - Add error recovery logic
   - Implement user notifications
   - Add logging for debugging

## Verification Steps

1. Test Menu Integration:
```javascript
// In Chrome DevTools Console
await chrome.runtime.sendMessage({
    command: 'startGremlins',
    payload: { duration: 5 }
});
// Should see proper state updates in popup
```

2. Test Library Loading:
```javascript
// Verify in Chrome DevTools Console
window.gremlins // Should exist after attack starts
```

3. Test Error Recovery:
   - Try starting attack with library not loaded
   - Check error messages
   - Verify state reset
