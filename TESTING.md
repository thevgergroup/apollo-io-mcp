# Testing Guide

This document describes the testing infrastructure for the Apollo.io MCP server.

## Test Suite Overview

The project includes three types of tests:

1. **Unit Tests** - Test individual components in isolation with mocks
2. **Integration Tests** - Test against real Apollo.io API (optional)
3. **CI/CD Tests** - Automated testing in GitHub Actions

## Running Tests

### All Tests
```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode for development
npm run test:coverage    # Generate coverage report
```

### Unit Tests Only
```bash
npm run test:unit        # Excludes integration tests
```

### Integration Tests
```bash
# Set your API key (optional)
export APOLLO_API_KEY=your_key_here

# Run integration tests
npm run test:integration
```

**Note:** Integration tests will skip gracefully if `APOLLO_API_KEY` is not set.

## Test Structure

```
src/
├── __tests__/
│   ├── fixtures/
│   │   └── apollo-responses.ts    # Mock API responses
│   └── integration.test.ts        # Integration tests
├── apollo.test.ts                 # ApolloClient unit tests
└── server.test.ts                 # MCP server unit tests
```

## Writing Tests

### Unit Tests

Unit tests use Vitest and mock the HTTP layer:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApolloClient } from './apollo.js';

// Mock undici
vi.mock('undici', () => ({
  request: vi.fn()
}));

describe('My Feature', () => {
  it('should do something', async () => {
    // Your test here
  });
});
```

### Integration Tests

Integration tests can run against the real API:

```typescript
import { describe, it, expect } from 'vitest';
import { ApolloClient } from '../apollo.js';

const hasApiKey = !!process.env.APOLLO_API_KEY;
const describeIntegration = hasApiKey ? describe : describe.skip;

describeIntegration('Feature Tests', () => {
  let client: ApolloClient;

  beforeAll(() => {
    client = new ApolloClient({
      apiKey: process.env.APOLLO_API_KEY!
    });
  });

  it('should work with real API', async () => {
    const result = await client.searchPeople({ q: 'test', page: 1 });
    expect(result.people).toBeInstanceOf(Array);
  });
});
```

## Test Fixtures

Mock API responses are available in `src/__tests__/fixtures/apollo-responses.ts`:

```typescript
import * as fixtures from './__tests__/fixtures/apollo-responses.js';

const mockResponse = fixtures.mockPersonSearchResponse;
```

Available fixtures:
- `mockPersonSearchResponse`
- `mockCompanySearchResponse`
- `mockPersonEnrichResponse`
- `mockCompanyEnrichResponse`
- `mockBulkEnrichPeopleResponse`
- `mockBulkEnrichOrganizationsResponse`
- `mockJobPostingsResponse`
- `mockNewsArticlesResponse`
- `mockErrorResponses`

## CI/CD Integration

### GitHub Actions Workflows

**1. CI Workflow** (`.github/workflows/ci.yml`)
- Runs on every PR and push to main
- Tests on Node.js 18, 20, and 22
- Generates coverage reports
- Type checking and build validation
- Security scanning
- Auto-merges Dependabot PRs (patch/minor only)

**2. Security Workflow** (`.github/workflows/security.yml`)
- Runs weekly on Mondays
- NPM audit for vulnerabilities
- CodeQL analysis
- Dependency scanning

**3. Publish Workflow** (`.github/workflows/publish.yml`)
- Triggers on version tags (v*)
- Runs all tests before publishing
- Publishes to npm with provenance

### Running CI Locally

You can test CI workflows locally using [act](https://github.com/nektos/act):

```bash
# Install act
brew install act  # macOS
# or download from https://github.com/nektos/act

# Run CI workflow
act pull_request

# Run specific job
act pull_request -j test
```

## Coverage Reports

Coverage reports are generated with:

```bash
npm run test:coverage
```

Output locations:
- Terminal: Text summary
- `coverage/index.html`: Interactive HTML report
- `coverage/coverage-final.json`: Raw coverage data

Coverage is uploaded to Codecov in CI (requires `CODECOV_TOKEN` secret).

## Automated Dependency Updates

### Dependabot Configuration

Dependabot is configured to:
- Check for updates weekly
- Group minor/patch updates together
- Auto-approve and merge safe updates via CI

### Manual Dependency Review

To review pending Dependabot PRs:

```bash
gh pr list --author app/dependabot
```

To check security alerts:

```bash
gh api repos/:owner/:repo/dependabot/alerts
```

## Test Best Practices

1. **Isolation**: Unit tests should not depend on external services
2. **Fixtures**: Use test fixtures for consistent mock data
3. **Coverage**: Aim for >80% code coverage
4. **Integration**: Run integration tests before major releases
5. **CI First**: Ensure tests pass in CI before merging
6. **Fast Feedback**: Keep unit tests fast (<100ms each)
7. **Descriptive Names**: Use clear, descriptive test names
8. **Single Assertion**: Focus on one behavior per test when possible

## Debugging Tests

### Watch Mode
```bash
npm run test:watch
```

### Debug Specific Test
```bash
npx vitest run -t "test name pattern"
```

### Verbose Output
```bash
npx vitest run --reporter=verbose
```

### Node Inspector
```bash
node --inspect-brk node_modules/.bin/vitest run
```

Then open Chrome DevTools at `chrome://inspect`

## Common Issues

### Integration Tests Skipped
- **Cause**: `APOLLO_API_KEY` not set
- **Solution**: Export your API key: `export APOLLO_API_KEY=your_key`

### Mock Not Working
- **Cause**: Mock is defined after import
- **Solution**: Always define `vi.mock()` before imports

### Rate Limited
- **Cause**: Too many API requests
- **Solution**: Use unit tests with mocks for rapid iteration

### TypeScript Errors
- **Cause**: Types not matching test expectations
- **Solution**: Run `npx tsc --noEmit` to check types

## Security Testing

### NPM Audit
```bash
npm audit
npm audit fix  # Auto-fix vulnerabilities
```

### Dependency Check
```bash
npm outdated  # Check for outdated packages
```

### Manual Security Review
1. Review Dependabot alerts in GitHub
2. Check CVE databases for known issues
3. Review transitive dependencies
4. Test with `npm audit --audit-level=moderate`

## Performance Testing

While not included in the default test suite, you can benchmark API calls:

```typescript
import { performance } from 'perf_hooks';

it('should complete search in reasonable time', async () => {
  const start = performance.now();
  await client.searchPeople({ q: 'test', page: 1 });
  const duration = performance.now() - start;

  expect(duration).toBeLessThan(5000); // 5 seconds max
});
```

## Continuous Improvement

- Review test coverage regularly
- Update fixtures when API changes
- Add tests for reported bugs
- Refactor tests as code evolves
- Keep CI fast (< 5 minutes total)
