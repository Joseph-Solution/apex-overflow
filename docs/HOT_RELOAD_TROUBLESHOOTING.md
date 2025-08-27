# Hot Reload Troubleshooting Guide

## Current Configuration

The project is configured with the following hot reload optimizations:

### Vite Configuration (`vite.config.ts`)
```typescript
server: {
  host: "::",
  port: 8080,
  watch: {
    usePolling: true,    // Enable polling for file changes
    interval: 1000,      // Check for changes every 1 second
  },
  hmr: {
    port: 8080,         // Hot Module Replacement port
  },
}
```

### Docker Compose Environment Variables
```yaml
environment:
  - CHOKIDAR_USEPOLLING=true  # Enable polling for file watcher
  - WATCHPACK_POLLING=true    # Enable webpack polling
```

### Docker Compose Command
```yaml
command: bun run dev --host 0.0.0.0 --port 3000 --force
```

## Common Issues & Solutions

### 1. Hot Reload Not Working on Windows
**Problem**: File changes not detected in Docker container on Windows
**Solution**: 
- Polling is enabled in Vite config
- Environment variables set for file watchers
- Use `--force` flag to force dependency re-optimization

### 2. Slow Hot Reload
**Problem**: Changes take too long to reflect
**Solution**:
- Polling interval is set to 1000ms (1 second)
- Can be reduced to 500ms for faster detection (higher CPU usage)

### 3. Browser Not Refreshing
**Problem**: Changes detected but browser doesn't update
**Solutions**:
- Hard refresh browser (Ctrl+F5 or Cmd+Shift+R)
- Check browser console for HMR connection errors
- Ensure port 3000 is accessible from host

### 4. File Permission Issues
**Problem**: Container can't watch files due to permissions
**Solution**:
- Dockerfile sets proper ownership: `chown -R bun:bun /app`
- Container runs as `bun` user, not root

## Testing Hot Reload

1. **Make a small change** to any React component
2. **Save the file**
3. **Check browser** - should update within 1-2 seconds
4. **Check container logs**: `docker-compose logs -f frontend`

## Manual Restart (If Hot Reload Fails)

```bash
# Restart just the frontend service
docker-compose restart frontend

# Or rebuild if dependencies changed
docker-compose up --build frontend
```

## Performance Notes

- Polling uses more CPU than native file watching
- Interval of 1000ms balances performance vs responsiveness
- Named volume for `node_modules` improves performance
- Source code volume binding enables hot reload

## Alternative: Native Development

If Docker hot reload continues to be problematic:

```bash
# Install dependencies locally
bun install

# Run development server natively
bun run dev

# Keep Supabase in Docker
supabase start
```

This provides the fastest development experience while keeping database services containerized.