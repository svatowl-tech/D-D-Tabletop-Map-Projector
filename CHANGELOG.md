# Changelog

All notable changes to **VTT-ZERO Tabletop Map Projector** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-08-28

### Initial Release
- **Dual-Window Architecture**: High-speed DM Controller view and clean fullscreen Player/Projector view.
- **Zero-Latency Synchronization**: Uses native `BroadcastChannel API` for local communication without external network servers or sockets.
- **Dynamic Fog of War Engine**:
  - Reveal brush (`[R]`) & Hide brush (`[H]`) with dynamic sizing (`15px` - `250px`).
  - Fill All (`[F]`) & Clear All (`[C]`) instant mask actions.
  - Transparent master overlay preview (`0.55` opacity) for dungeon masters.
  - Vector incremental stroke sync with full state handshake.
- **Hardware-Accelerated Viewport**:
  - Smooth pan (`[Space] + Drag`, Middle click, Right click).
  - High precision zoom (`Mouse Wheel`, `Zoom In [+]`, `Zoom Out [-]`, `Fit Map`, `Reset 1:1`).
  - CSS3 3D Matrix rendering with `will-change: transform`.
- **Media Engine**:
  - Image maps: JPG, PNG, WebP, SVG.
  - Animated battlemaps: MP4, WebM with hardware decoding.
  - Instant Blob memory management with `URL.revokeObjectURL()` to prevent memory leaks.
- **Tactical Grid**:
  - Real-time square grid with customizable cell dimensions (25px – 150px) and subtle contrast opacity.
- **Hardware Specialist Dark Industrial Theme**:
  - Precision monochrome dark layout (`#0A0A0A`, `#151619`, `#2A2A2A`) with Hardware Orange (`#F27D26`) accents.
  - Dot-matrix backdrop grid and real-time telemetry indicators.
- **Cross-Platform Releases & Automation**:
  - Windows Portable Package (`.bat` launchers + 1-click dual screen).
  - macOS Portable Package (`.command` launchers).
  - Linux Portable Package (`.sh` launchers + `.desktop` entry).
  - Standalone Single-File Universal HTML (`standalone.html`).
  - Docker container configuration (~15MB Alpine Nginx).
  - GitHub Actions CI/CD workflows for multi-platform releases and GitHub Pages auto-deploy.
