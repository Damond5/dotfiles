# Testing Strategy

## Overview

This project uses **Bun's native test runner** for all plugin testing. The migration from Jest to Bun was completed to achieve significant performance improvements (10-20x faster test execution) while maintaining the same functionality and coverage.

## Test Framework

- **Test Runner**: Bun's built-in test runner (`bun test`)
- **Test Files Location**: `tests/plugins/`
- **Test File Pattern**: `*.test.js`
- **Type System**: ES Modules (`type: "module"` in package.json)

## Migration from Jest

### Key Changes

1. **Test Runner**: Switched from Jest to Bun's native test runner
2. **Syntax Updates**:
   - `require()` → ES6 `import` statements
   - `require('@jest/globals')` → `import { test, expect, describe, beforeAll, beforeEach, afterAll, afterEach } from 'bun:test'`
   - `it()` → `test()` (both work in Bun)
   - `jest.fn()` → Regular functions (Bun supports mocking but uses simpler patterns)

3. **Assertions**: Most Jest assertions work the same way in Bun:
   - `expect(value).toBe(expected)` ✅
   - `expect(value).toEqual(expected)` ✅
   - `expect(() => func()).toThrow()` ✅
   - `expect(value).toBeDefined()` ✅
   - `expect(value).toBeUndefined()` ✅

4. **Configuration**: Removed `jest.config.js` (not needed for Bun), created minimal `bunfig.toml`

## Running Tests

### Basic Commands

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run specific test file
bun test tests/plugins/user-input-notifier/validation.test.js

# Run tests with coverage
bun test --coverage
```

### Test Discovery

Bun automatically discovers test files:
- Files matching `**/*.test.js` or `**/*.spec.js`
- Files with `test`, `spec`, or ` benchmarks` in the name
- Custom patterns can be configured in `bunfig.toml`

## Test Structure

### Plugin Tests

Tests are organized by plugin in the `tests/plugins/` directory:

```
tests/
└── plugins/
    ├── user-input-notifier/
    │   ├── validation.test.js
    │   └── integration.test.js
    └── session-idle-notifier/
        ├── validation.test.js
        └── integration.test.js
```

### Test Types

1. **Validation Tests** (`*.validation.test.js`)
   - Validate plugin code structure and patterns
   - Check for required syntax and exports
   - Verify event handling patterns
   - Test SDK v1.1.1 compliance

2. **Integration Tests** (`*.integration.test.js`)
   - Test plugin structure and imports
   - Validate event handling patterns
   - Test mock patterns and structures
   - Verify fallback detection mechanisms

## Writing New Tests

### Basic Test Structure

```javascript
import { test, expect, describe, beforeAll } from 'bun:test';

describe('Feature Name', () => {
  let testData;

  beforeAll(() => {
    // Setup code
    testData = { key: 'value' };
  });

  test('should perform expected behavior', () => {
    const result = performAction(testData);
    expect(result).toBe('expected');
  });

  test('should handle edge cases', () => {
    expect(() => edgeCase()).toThrow();
  });
});
```

### Best Practices

1. **Descriptive Test Names**: Use clear, descriptive names that explain what is being tested
2. **Single Responsibility**: Each test should verify one specific behavior
3. **Arrange-Act-Assert**: Structure tests with clear setup, action, and assertion phases
4. **Independent Tests**: Tests should not depend on each other or execution order
5. **Mock External Dependencies**: Use simple functions to mock external systems

## Coverage Goals

- **Validation Tests**: Aim for 100% coverage of plugin code patterns
- **Integration Tests**: Focus on critical paths and edge cases
- **Overall Target**: Maintain or improve existing coverage levels

## Performance Benefits

### Expected Improvements

- **Test Execution Speed**: 10-20x faster than Jest
- **Startup Time**: Significantly reduced due to Bun's fast startup
- **Memory Usage**: Lower memory footprint compared to Jest
- **Parallel Execution**: Built-in support for parallel test execution

### Benchmarking

Run the following to see performance improvements:

```bash
# Time the test execution
time bun test

# Compare with previous Jest performance (if available)
# time jest --testPathPatterns=tests/
```

## Continuous Integration

### CI/CD Pipeline

The test runner works seamlessly in CI environments:

```yaml
# Example GitHub Actions workflow
- name: Install Bun
  uses: oven-sh/setup-bun@v1

- name: Install Dependencies
  run: bun install

- name: Run Tests
  run: bun test

- name: Run Tests with Coverage
  run: bun test --coverage
```

### Performance Monitoring

Track test performance over time to ensure the benefits of Bun's test runner are maintained.

## Troubleshooting

### Common Issues

1. **Module Resolution Errors**
   - Ensure `"type": "module"` is set in package.json
   - Use ES6 import/export syntax
   - Check file extensions (.js for ES modules)

2. **Import Errors**
   - Verify file paths are correct
   - Use relative imports for local files
   - Check for circular dependencies

3. **Test Discovery Issues**
   - Ensure test files follow `*.test.js` naming convention
   - Verify test files contain `test()` or `describe()` calls
   - Check bunfig.toml for custom patterns

### Debug Mode

Run tests with verbose output for debugging:

```bash
bun test --verbose
```

## Future Improvements

1. **TypeScript Support**: Consider migrating to TypeScript for better type safety
2. **Snapshot Testing**: Implement snapshot testing if needed for UI components
3. **Performance Optimization**: Continue monitoring and optimizing test performance
4. **Coverage Enhancement**: Increase coverage for edge cases and error conditions

## Related Documentation

- [Bun Test Runner Documentation](https://bun.sh/docs/test)
- [Bun Assertion Methods](https://bun.sh/docs/test/assertions)
- [Plugin Development Guide](../PLUGIN_DEVELOPMENT.md)
- [SDK v1.1.1 Specification](https://example.com/sdk-v1.1.1)