# Technical Context

## Technologies
- Browser Extension Framework
- JavaScript (ES6+)
- Gremlins.js for chaos testing
- Webpack for bundling

## Key Components

### Gremlins Attack System
1. **Handler (gremlins-attack-handler.js)**
   - Manages script injection
   - Configures gremlins species and mogwais
   - Handles browser interface interactions

2. **UI Handler (options-gremlins-handler.js)**
   - Controls configuration interface
   - Manages species selection
   - Handles distribution strategies
   - Provides bookmarklet generation

3. **Menu Integration (context-menu.js)**
   - Registers gremlins attack handler
   - Provides context menu integration
   - Manages handler type switching

## Dependencies
- gremlins.js (via unpkg.com)
- Browser-specific APIs (Chrome/Firefox)

## Technical Constraints
1. Browser Security
   - Content script injection requirements
   - Cross-origin limitations
   - Permission requirements

2. Extension Architecture
   - Background/content script separation
   - Message passing requirements
   - Browser-specific implementations

## Development Setup
- Node.js environment
- Webpack configuration for extension bundling
- Browser extension development tools

## Key Technical Decisions
1. Using unpkg.com for gremlins.js delivery
2. Separating configuration UI from attack execution
3. Browser-agnostic interface design
4. Modular handler architecture
