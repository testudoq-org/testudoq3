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
   - Provides attack status monitoring
   - Supports enhanced configuration options

2. **UI Components**
   - **Popup Interface**
     - Real-time configuration management
     - Attack status monitoring
     - Visual feedback system
     - Preset configuration management
   - **Options UI**
     - Advanced configuration interface
     - Species selection
     - Distribution strategies
     - Bookmarklet generation

3. **Menu Integration (context-menu.js)**
   - Registers gremlins attack handler
   - Provides hierarchical context menu
   - Manages handler type switching
   - Supports dynamic status updates
   - Quick action triggers

### Communication Layer
- Message passing for status updates
- Configuration synchronization
- Real-time feedback channels
- State management system

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
   - Real-time status updates

## Development Setup
- Node.js environment
- Webpack configuration for extension bundling
- Browser extension development tools
- Testing framework for UI components

## Key Technical Decisions
1. Using unpkg.com for gremlins.js delivery
2. Enhanced popup-based configuration management
3. Browser-agnostic interface design
4. Modular handler architecture
5. Real-time status monitoring system
6. Hierarchical context menu organization
