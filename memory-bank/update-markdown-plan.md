# Documentation Update Plan for ES Module Migration

## Overview
This plan outlines the necessary documentation updates to align with our ES module migration and new MV3 patterns.

## File Updates

### 1. README.md Updates

#### Features Section
- Add ES modules and MV3 compatibility
- Update technical stack description
- Remove outdated package.json references

#### Implementation
```markdown
## Features
- Modern ES module architecture with MV3 compatibility
- Asynchronous menu handling with improved performance
- Enhanced error handling and debugging capabilities
- Streamlined menu structure with consistent footer elements
```

### 2. CONTRIBUTING.md Updates

#### Module Standards Section
Replace existing module format section with:

```markdown
## Module Format Standards
TestudoQ uses ES modules (ESM) throughout the codebase. When creating new files or modifying existing ones:

- Use .mjs extension for all JavaScript modules
- Use import/export statements for module interactions
- Leverage async/await for asynchronous operations
- Follow ES6+ conventions for modern JavaScript features

Example:
```javascript
// menu-handler.mjs
import { processMenu } from './process-menu.mjs';
export default async function handleMenu(config) {
  // Implementation
}
```

#### Build Instructions
Update build process documentation to reflect current webpack/ESM setup.

### 3. Technical Documentation

#### New File: docs/technical/current-architecture.md
Document current architecture focusing on:
- ES module structure and patterns
- Menu builder factory implementations
- Async menu flow handling
- Static footer implementation
- Service worker integration

#### Removed Features Documentation
Note the following removed features:
- addGenericMenus (replaced by static footer)
- Operational mode menu handlers (simplified workflow)
- Menu rebuild logging (integrated into core logging)
- Cache-related functions (revised state management)

## Testing Documentation

### Update test documentation to reflect:
- Jest ESM configuration
- Mocking patterns for ES modules
- Browser-specific test considerations
- Integration test updates for MV3

## Implementation Plan

1. Remove outdated CommonJS documentation
2. Update core documentation files
3. Create new technical documentation
4. Update testing guides
5. Review and validate changes

```mermaid
flowchart TB
    A[Documentation Update] --> B[Remove Legacy Docs]
    A --> C[Update Core Docs]
    A --> D[Create New Docs]
    A --> E[Update Tests]
    
    B --> B1[Remove CommonJS]
    B --> B2[Clean Old Patterns]
    
    C --> C1[README.md]
    C --> C2[CONTRIBUTING.md]
    
    D --> D1[Architecture Guide]
    D --> D2[Migration Notes]
    
    E --> E1[Test Patterns]
    E --> E2[Integration Tests]
