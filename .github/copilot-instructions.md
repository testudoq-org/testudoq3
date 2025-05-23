# TestudoQ - GitHub Copilot Instructions

## Project Overview
TestudoQ is a browser extension providing various utilities for testing and development, with a powerful gremlins testing feature that simulates chaotic user interactions on web pages. The extension supports both Chrome and Firefox browsers.

## Core Features
- Context menu integration for testing utilities
- Value injection and clipboard operations
- Gremlins attack functionality for chaos testing
- Configuration management for test scenarios

## Current Focus
We're reactivating the gremlins attack functionality, specifically:
- ✅ Restored context menu integration
- ✅ Updated handler to use local gremlins.min.js
- ✅ Fixed code structure and documentation
- 🔄 Testing script loading and attack functionality

## Technical Architecture
The extension uses a handler-based architecture with these key components:

### Components
1. **Gremlins Attack System**
   - Handler (gremlins-attack-handler.js) - Script injection, species configuration
   - UI Handler (options-gremlins-handler.js) - Configuration interface
   - Menu Integration (context-menu.js) - Context menu integration

2. **Browser Interface Abstraction**
   - Common interface for cross-browser compatibility
   - Chrome and Firefox specific implementations

### Design Patterns
- **Factory Pattern**: Menu builder creation, handler instantiation
- **Observer Pattern**: Storage change listeners, configuration updates
- **Strategy Pattern**: Gremlins attack strategies, browser-specific implementations

### Data Flow
- Context Menu → Handler → Browser Interface → Script Injection
- User Input → Configuration Storage → Handler Configuration → Execution

## Integration Points
- Context menu connects to handler
- Handler communicates with browser interface
- Browser interface manages script injection
- Configuration controls attack execution

## Testing Requirements
Focus on testing these areas:
1. **Context Menu Integration**
   - Menu item visibility
   - Click handling
   - Error scenarios

2. **Attack Functionality**
   - Script injection
   - Species configuration
   - Mogwai integration
   - Strategy application

3. **Cross-browser Testing**
   - Chrome verification
   - Firefox verification

## Known Issues
None identified yet - pending full testing cycle

## Coding Guidelines
- JavaScript (ES6+ features with CommonJS module system)
- Follow the established handler pattern
- Abstract browser-specific code
- Maintain proper error handling
- Document integration points

## Reference Documentation
For more detailed information, consult these resources:
- `memory-bank/projectbrief.md` - Project goals and success criteria
- `memory-bank/techContext.md` - Technologies and technical decisions
- `memory-bank/systemPatterns.md` - Architecture and design patterns
- `memory-bank/activeContext.md` - Current state and next steps
- `memory-bank/progress.md` - Task progress and remaining work

Check the `memory-bank` directory for additional context and resources.

## Success Criteria
- Functional context menu integration for gremlins attack
- Working script loading and species configuration
- Proper attack execution and mogwai integration
- Reliable cross-browser compatibility
