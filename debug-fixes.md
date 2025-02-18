# TestudoQ Debugging and Testing Strategy

## Identified Critical Paths

1. Menu Rebuilding Sequence
   ```
   Storage Change → removeAll → buildRoot → processMenus → addHandlers
   ```

2. Click Handler Flow
   ```
   MenuClick → HandlerIdentification → ScriptExecution → MessageDispatch
   ```

## Debugging Hooks

### 1. Menu State Tracking
```javascript
const menuStateDebug = {
  lastBuildTime: null,
  menuItems: new Set(),
  buildDuration: [],
  
  logBuildStart() {
    this.lastBuildTime = performance.now();
  },
  
  logBuildComplete() {
    const duration = performance.now() - this.lastBuildTime;
    this.buildDuration.push(duration);
    console.debug(`Menu build completed in ${duration}ms`);
  }
};
```

### 2. Handler Performance Monitoring
```javascript
function wrapHandler(handler, name) {
  return async function(...args) {
    const start = performance.now();
    try {
      const result = await handler.apply(this, args);
      const duration = performance.now() - start;
      console.debug(`Handler ${name} completed in ${duration}ms`);
      return result;
    } catch (error) {
      console.error(`Handler ${name} failed:`, error);
      throw error;
    }
  };
}
```

## Testing Strategies

### 1. Menu Building Tests
```javascript
describe('Menu Building', () => {
  it('should handle rapid rebuilds', async () => {
    const changes = [
      { additionalMenus: [/*...*/] },
      { additionalMenus: [/*...*/] },
      { additionalMenus: [/*...*/] }
    ];
    
    // Trigger changes in quick succession
    await Promise.all(changes.map(c => 
      browserInterface.triggerStorageChange(c)
    ));
    
    // Verify final state is correct
    expect(menuBuilder.getMenuCount()).toBe(1);
  });
});
```

### 2. Race Condition Tests
```javascript
describe('Concurrent Operations', () => {
  it('should handle menu updates during click processing', async () => {
    const clickPromise = simulateClick(menuId);
    const updatePromise = triggerMenuUpdate();
    
    await Promise.all([clickPromise, updatePromise]);
    
    // Verify system remains consistent
    expect(getActiveHandlers()).toBeDefined();
  });
});
```

## Performance Monitoring

### 1. Build Time Metrics
```javascript
const buildMetrics = {
  samples: [],
  
  record(duration) {
    this.samples.push({
      timestamp: Date.now(),
      duration
    });
    
    if (this.samples.length > 100) {
      this.analyze();
    }
  },
  
  analyze() {
    const avg = this.samples.reduce((a,b) => a + b.duration, 0) / this.samples.length;
    console.info(`Average build time: ${avg}ms`);
    this.samples = [];
  }
};
```

### 2. Memory Usage Tracking
```javascript
const memoryTracker = {
  snapshots: [],
  
  takeSnapshot() {
    if (performance.memory) {
      this.snapshots.push({
        time: Date.now(),
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize
      });
    }
  },
  
  detectLeaks() {
    // Compare sequential snapshots for unusual growth
    return this.snapshots.reduce((acc, snap, i, arr) => {
      if (i === 0) return acc;
      const growth = snap.used - arr[i-1].used;
      if (growth > 1000000) { // 1MB threshold
        acc.push({ time: snap.time, growth });
      }
      return acc;
    }, []);
  }
};
```

## Debug Logging Strategy

### 1. Context Collection
```javascript
const debugContext = {
  collectMenuState() {
    return {
      menuCount: menuBuilder.getMenuCount(),
      activeHandlers: Object.keys(itemHandlers).length,
      lastUpdateTime: Date.now()
    };
  },
  
  collectHandlerState() {
    return {
      pendingHandlers: Object.keys(itemHandlers)
        .filter(k => itemHandlers[k].isPending()),
      handlerTypes: new Set(
        Object.values(itemHandlers)
          .map(h => h.type)
      ).size
    };
  }
};
```

### 2. Error Aggregation
```javascript
const errorAggregator = {
  errors: new Map(),
  
  record(error, context) {
    const key = `${error.name}:${error.message}`;
    if (!this.errors.has(key)) {
      this.errors.set(key, {
        count: 0,
        contexts: []
      });
    }
    
    const record = this.errors.get(key);
    record.count++;
    record.contexts.push(context);
    
    if (record.count === 1 || record.count % 10 === 0) {
      console.warn(`Error occurred ${record.count} times:`, {
        error,
        contexts: record.contexts.slice(-5)
      });
    }
  }
};
```

## Validation Rules

### 1. Menu Structure Validation
```javascript
const menuValidator = {
  validateStructure(menu) {
    const issues = [];
    
    if (!menu.id) issues.push('Missing menu ID');
    if (!menu.title) issues.push('Missing menu title');
    
    if (menu.children) {
      menu.children.forEach((child, index) => {
        const childIssues = this.validateStructure(child);
        issues.push(...childIssues.map(i => `Child ${index}: ${i}`));
      });
    }
    
    return issues;
  }
};
```

### 2. Handler Validation
```javascript
const handlerValidator = {
  validateHandler(handler) {
    const issues = [];
    
    if (typeof handler !== 'function') {
      issues.push('Handler must be a function');
    }
    
    if (handler.length !== 2) {
      issues.push('Handler must accept exactly 2 parameters');
    }
    
    return issues;
  }
};
```

## Implementation Notes

1. Add debug logging strategically around critical paths
2. Implement performance monitoring in development builds only
3. Use validation in development, strip in production
4. Add memory leak detection in development environment
5. Implement error aggregation with rate limiting
6. Add metrics collection with periodic reporting

The debug strategy should be implemented alongside the performance improvements outlined in implementation-plan.md, providing visibility into the effectiveness of the changes and early warning of potential issues.
