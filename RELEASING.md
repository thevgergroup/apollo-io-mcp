# Releasing

This project uses semantic versioning and automated publishing to npm via GitHub Actions.

## Prerequisites

1. **Set up npm trusted publisher** (one-time setup):
   - Go to your npm account settings: https://www.npmjs.com/settings/access/tokens
   - Click "Add trusted publisher"
   - Select "GitHub Actions" as the publisher
   - Enter your GitHub repository: `thevgergroup/apollo-io-mcp`
   - Set the workflow file path: `.github/workflows/publish.yml`
   - Save the trusted publisher

2. **Ensure you have write access** to the repository

## Release Process

### Option 1: Using npm scripts (Recommended)

```bash
# For patch releases (bug fixes)
npm run release:patch

# For minor releases (new features, backward compatible)
npm run release:minor

# For major releases (breaking changes)
npm run release:major
```

### Option 2: Manual release

1. **Update version in package.json**
2. **Commit your changes**
3. **Create and push a tag**:
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

## What happens during a release

1. **Version bump**: Updates package.json with new version
2. **Tests**: Runs the test suite to ensure everything works
3. **Build**: Compiles TypeScript to JavaScript
4. **Commit**: Commits the version change
5. **Tag**: Creates a git tag (e.g., `v1.0.1`)
6. **Push**: Pushes changes and tag to GitHub
7. **Publish**: GitHub Actions automatically publishes to npm

## Version Types

- **Patch** (`1.0.0` → `1.0.1`): Bug fixes, no breaking changes
- **Minor** (`1.0.0` → `1.1.0`): New features, backward compatible
- **Major** (`1.0.0` → `2.0.0`): Breaking changes

## Viewing Releases

- **GitHub**: https://github.com/thevgergroup/apollo-io-mcp/releases
- **npm**: https://www.npmjs.com/package/@thevgergroup/apollo-io-mcp
- **Actions**: https://github.com/thevgergroup/apollo-io-mcp/actions

## Troubleshooting

### Workflow fails to publish
- Check that the trusted publisher is set up correctly
- Ensure the tag format is `v*` (e.g., `v1.0.1`)
- Verify you have write access to the repository

### Tests fail during release
- Fix the failing tests before releasing
- The release script will stop if tests fail

### Manual npm publish needed
If you need to publish manually:
```bash
npm publish --access public
```
