# Contributing to VTT-ZERO

Thank you for your interest in contributing to **VTT-ZERO Tabletop Map Projector**!

## Core Principles
1. **Ultra-Low Resource Footprint**: The application must run smoothly on legacy hardware (e.g., MacBook 2010 with 2GB RAM / GeForce 320M, Intel Celeron, Raspberry Pi).
2. **Zero Unnecessary Dependencies**: Prefer native browser Web APIs (`BroadcastChannel`, `Canvas 2D`, `HTML5 Video`, `File API`) over heavy frameworks.
3. **No Memory Leaks**: Always revoke object URLs (`URL.revokeObjectURL`), dispose event listeners, and maintain minimal GC pressure.
4. **Offline First**: All core features must work 100% without internet access.

## Development Setup
```bash
# Clone the repository
git clone https://github.com/SvatOwl/vtt-zero-tabletop-projector.git
cd vtt-zero-tabletop-projector

# Install dependencies
npm install

# Start local development server
npm run dev

# Check code typing and linting
npm run lint

# Package all platform releases
npm run package:release
```

## Pull Request Guidelines
- Ensure `npm run lint` and `npm run package:release` pass without errors.
- Keep commits descriptive and follow conventional commit messages.
- Test both DM View and Player View synchronization locally.
