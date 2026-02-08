# Timeguessr Social Extension

Browser extension for Timeguessr with social features.

## Browser Support

This extension supports both Chrome and Firefox.

## Development

### Prerequisites

- Node.js 24.x
- npm

### Setup

```bash
npm install
```

**Note:** After pulling the latest changes that add Firefox support, make sure to run `npm install` to install the new `cross-env` dependency.

### Development Mode

For Chrome:

```bash
npm run dev
```

For Firefox:

```bash
npm run dev:firefox
```

### Building

Build for both browsers:

```bash
npm run build
```

Build for Chrome only:

```bash
npm run build:chrome
```

Build for Firefox only:

```bash
npm run build:firefox
```

The build outputs are in:

- `dist-chrome/` - Chrome extension
- `dist-firefox/` - Firefox extension

## Deployment

### GitHub Secrets Required

For Chrome Web Store:

- `CI_GOOGLE_CLIENT_ID` - Google OAuth client ID
- `CI_GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `CI_GOOGLE_REFRESH_TOKEN` - Google OAuth refresh token
- `EXTENSION_API_KEY` - Extension API key

For Firefox Add-ons:

- `FIREFOX_API_KEY` - Firefox Add-ons API key (JWT issuer)
- `FIREFOX_API_SECRET` - Firefox Add-ons API secret (JWT secret)

### GitHub Variables Required

- `EXTENSION_ID` - Chrome Web Store extension ID

### Getting Firefox API Credentials

1. Go to https://addons.mozilla.org/en-US/developers/addon/api/key/
2. Generate API credentials
3. Add the JWT issuer as `FIREFOX_API_KEY` secret
4. Add the JWT secret as `FIREFOX_API_SECRET` secret

### Release Process

1. Update version in `package.json`
2. Update version in `src/manifest.chrome.json` and `src/manifest.firefox.json`
3. Commit changes
4. Create and push a git tag:
   ```bash
   git tag vX.X.X
   git push origin vX.X.X
   ```
5. The GitHub Action will automatically build and upload to both stores

## Browser Differences

### Manifest Differences

- **Chrome**: Uses `service_worker` for background scripts
- **Firefox**: Uses `scripts` array for background scripts
- **Firefox**: Requires `browser_specific_settings` with extension ID and minimum version

### API Compatibility

The extension uses `webextension-polyfill` to ensure API compatibility across browsers.

## License

See LICENSE file for details.
