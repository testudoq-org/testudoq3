# Technical Context

## Core Technologies

### Platform
- Browser Extension Framework (MV3)
- ES Modules (completed migration)
- Webpack 5 with module support
- Node.js LTS environment

### Languages & Standards
- JavaScript ES2022+
- ES Modules (.mjs)
- JSON for configuration
- HTML5/CSS3 for UI

### Testing & Tools
- Jasmine for unit testing
- Playwright for E2E testing
- ESLint with module rules
- Chrome/Firefox DevTools

## Architecture Components

### 1. Core Modules
```javascript
// Service Worker (background.mjs)
import { MenuSystem } from './lib/menu-system.mjs';
import { StateManager } from './lib/state-manager.mjs';

// Content Script (gremlins-handler.mjs)
import { GremlinsController } from './lib/gremlins-controller.mjs';
```

### 2. UI Components
```javascript
// Popup Interface (popup.mjs)
export class PopupUI {
  constructor(config) {
    this.statusManager = new StatusManager();
    this.configManager = new ConfigManager(config);
  }
}

// Options Interface (options.mjs)
export class OptionsUI {
  constructor() {
    this.presetManager = new PresetManager();
    this.speciesManager = new SpeciesManager();
  }
}
```

### 3. Menu System
```javascript
// Context Menu (context-menu.mjs)
export class ContextMenu {
  async initialize() {
    this.menuBuilder = new MenuBuilder();
    this.statusManager = new StatusManager();
    await this.createMenuStructure();
  }
}
```

## System Integration

### 1. Message Passing
```javascript
// Type-safe message system
interface Message {
  type: 'START_ATTACK' | 'STOP_ATTACK' | 'UPDATE_STATUS';
  payload: any;
}

// Message handling
chrome.runtime.onMessage.addListener(
  (message: Message, sender, respond) => {
    handleMessage(message).then(respond);
    return true; // Keep channel open
  }
);
```

### 2. State Management
```javascript
// Centralized state
export class StateManager {
  private state: AppState;
  
  async update(changes: Partial<AppState>) {
    this.state = { ...this.state, ...changes };
    await this.persist();
    this.notify(changes);
  }
}
```

### 3. Resource Management
```javascript
// Resource handling
export class ResourceManager {
  async initialize() {
    await this.loadModules();
    await this.setupListeners();
    await this.validatePermissions();
  }
}
```

## Dependencies

### Core Libraries
- gremlins.js v2.0+ (via CDN)
- browser extension APIs
- webpack module bundler
- testing frameworks

### Development Tools
- Visual Studio Code
- Chrome DevTools
- Firefox Developer Tools
- Node.js toolchain

## Technical Constraints

### 1. Browser Requirements
- Chrome 91+ (ES modules)
- Firefox 89+ (MV3 support)
- Edge 91+ (Chromium-based)
- Service worker limitations

### 2. Security Model
- Content security policy
- Cross-origin restrictions
- Permission model
- Host permissions

### 3. Performance Requirements
- Fast menu response (<100ms)
- Efficient state updates
- Minimal memory usage
- Clean resource cleanup

## Development Setup

### Local Environment
```bash
# Installation
npm install

# Development
npm run dev
npm run test

# Production Build
npm run build
```

### Build Configuration
```javascript
// webpack.config.mjs
export default {
  experiments: {
    outputModule: true
  },
  module: {
    rules: [
      {
        test: /\.mjs$/,
        type: 'javascript/esm'
      }
    ]
  }
};
```

## Key Technical Decisions

### 1. ES Module Architecture
✅ Complete migration to ES modules
✅ Better code organization
✅ Enhanced tree-shaking
✅ Improved debugging

### 2. State Management
✅ Centralized state
✅ Type-safe updates
✅ Persistent storage
✅ Real-time sync

### 3. Testing Strategy
✅ Unit test coverage
✅ E2E automation
✅ Performance metrics
✅ Cross-browser testing

### 4. Build Process
✅ Modern bundling
✅ Source maps
✅ Development mode
✅ Production optimization

## Future Considerations

### 1. Performance
- Bundle size optimization
- Lazy loading improvements
- Caching strategies
- Memory management

### 2. Features
- Enhanced configuration
- More attack strategies
- Better analytics
- Expanded presets

### 3. Developer Experience
- Better debugging tools
- Enhanced logging
- Documentation updates
- Example integrations
