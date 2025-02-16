/* global chrome */

// Message type constants
const MESSAGE_TYPES = {
    START: 'startGremlins',
    STOP: 'stopGremlins',
    UPDATE: 'updateConfig',
    STATE: 'gremlinStateUpdate'
};

// Global state management
let gremlinState = {
    attacking: false,
    duration: 15,
    configuration: {
        species: ['clicker', 'toucher', 'formFiller', 'scroller', 'typer'],
        mogwais: ['alert', 'fps', 'gizmo'],
        strategy: 'distribution'
    }
};

// Library loading state tracking
let libraryStatus = {
    loaded: false,
    error: null,
    loading: false
};

function broadcastState() {
    chrome.runtime.sendMessage({
        command: MESSAGE_TYPES.STATE,
        payload: {
            attacking: gremlinState.attacking,
            duration: gremlinState.duration,
            configuration: Object.assign({}, gremlinState.configuration)
        }
    });
}

// Inject gremlins.js library with Promise-based loading
function injectGremlinsLibrary() {
    if (libraryStatus.loaded) {
        return Promise.resolve(true);
    }

    if (libraryStatus.loading) {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (libraryStatus.loaded) {
                    clearInterval(checkInterval);
                    resolve(true);
                }
            }, 100);
        });
    }

    libraryStatus.loading = true;
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('gremlins.min.js');

        script.addEventListener('load', () => {
            console.log('Gremlins library loaded successfully');
            libraryStatus.loaded = true;
            libraryStatus.loading = false;
            resolve(true);
        });

        script.addEventListener('error', (e) => {
            console.error('Failed to load Gremlins library:', e);
            libraryStatus.error = e;
            libraryStatus.loading = false;
            reject(e);
        });

        (document.head || document.documentElement).appendChild(script);
    });
}

// Helper function to ensure library is loaded
async function ensureGremlinsLoaded() {
    try {
        await injectGremlinsLibrary();
        return true;
    } catch (error) {
        console.error('Failed to ensure gremlins loaded:', error);
        return false;
    }
}

// Start gremlins attack with configuration
async function startGremlinsAttack(duration, config) {
    try {
        const loaded = await ensureGremlinsLoaded();
        if (!loaded) {
            throw new Error('Failed to load Gremlins library');
        }

        // Update state before starting
        gremlinState.attacking = true;
        gremlinState.duration = duration;
        if (config) {
            gremlinState.configuration = { ...config };
        }
        broadcastState();

        const gremlinsScript = `
            if (window.gremlins) {
                if (window.__testudoHorde) {
                    window.__testudoHorde.stop();
                }

                window.__testudoHorde = gremlins.createHorde({
                    species: [
                        ${gremlinState.configuration.species.map(s => `gremlins.species.${s}()`).join(',\n')}
                    ],
                    mogwais: [
                        ${gremlinState.configuration.mogwais.map(m => `gremlins.mogwais.${m}()`).join(',\n')}
                    ],
                    strategies: [
                        gremlins.strategies.${gremlinState.configuration.strategy}()
                    ]
                });

                console.log('Starting gremlins attack for ${duration} seconds');
                window.__testudoHorde.unleash();

                setTimeout(() => {
                    if (window.__testudoHorde) {
                        window.__testudoHorde.stop();
                        window.__testudoHorde = null;
                        console.log('Gremlins attack completed');
                    }
                }, ${duration} * 1000);
            } else {
                console.error('Gremlins library not found');
            }`;

        const scriptElement = document.createElement('script');
        scriptElement.textContent = gremlinsScript;
        (document.head || document.documentElement).appendChild(scriptElement);
        scriptElement.remove();
    } catch (error) {
        gremlinState.attacking = false;
        broadcastState();
        console.error('Error starting gremlins attack:', error);
        throw error;
    }
}

// Stop gremlins attack
function stopGremlinsAttack() {
    try {
        const stopScript = `
            if (window.__testudoHorde) {
                window.__testudoHorde.stop();
                window.__testudoHorde = null;
                console.log('Gremlins attack stopped');
            }`;

        const scriptElement = document.createElement('script');
        scriptElement.textContent = stopScript;
        (document.head || document.documentElement).appendChild(scriptElement);
        scriptElement.remove();

        gremlinState.attacking = false;
        broadcastState();
    } catch (error) {
        console.error('Error stopping gremlins attack:', error);
        throw error;
    }
}

// Update configuration
function updateConfiguration(config) {
    if (!config) return;
    gremlinState.configuration = Object.assign(
        {},
        gremlinState.configuration,
        config
    );
    broadcastState();
}

// Initialize message handling with standardized format
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message.command || !MESSAGE_TYPES[message.command]) {
        return false;
    }

    console.log('Received gremlins command:', message);

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
            default:
                console.error('Unknown gremlins command:', message.command);
                sendResponse({ status: 'error', error: 'Unknown command' });
        }
    } catch (error) {
        console.error('Error handling gremlins command:', error);
        sendResponse({ status: 'error', error: error.message });
    }

    return true; // Keep the message channel open for sendResponse
});

// Load gremlins library when content script initializes
injectGremlinsLibrary();
