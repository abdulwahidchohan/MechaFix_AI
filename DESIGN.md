# MechaFix AI - Visual Architecture & Design Specification

## Design System & Principles

### 1. Hybrid Neumorphic Canvas Strategy
MechaFix AI pairs soft tactile depth (neumorphic inset/raised shadows) with crisp high-contrast border outlines. This eliminates the muddy low-contrast look of pure neumorphism while maintaining an engaging physical hardware laboratory aesthetic.

### 2. Multi-Theme Palette Engine
The application supports five custom HSB-balanced light and dark laboratory themes:
- **Cloud Theme (Default Light)**: Off-white canvas (`#e0e5ec`), soft inset shadows, deep charcoal high-legibility typography (`#2d3748`).
- **Matcha Theme**: Subdued sage green canvas (`#e2e8e0`), soothing dark green accents.
- **Peach Pop Theme**: Soft warm peach canvas (`#f9ece6`), coral primary highlights.
- **Bubblegum Theme**: Subtle pastel lavender/pink canvas (`#f4e8f0`).
- **Midnight Theme**: Premium dark luxury laboratory theme (`#181a1f`) with electric cyan highlights.

### 3. Responsive Layout Strategy
- **Fluid Container Math**: Max width constrained to `max-w-7xl` centered with dynamic padding (`px-4 sm:px-6 lg:px-8`).
- **Split-Screen to Single-Column Collapse**: Multi-column diagnostic analysis automatically stacks vertically below `768px` (tablet/mobile).
- **Mobile Navigation Drawer**: Slide-over sidebar with backdrop blur overlay, escape key listener, focus trap, and touch-friendly (>= 44px) tap targets.

### 4. Typography Pairing
- Primary Display: **Plus Jakarta Sans** / **Inter** for UI controls, inputs, badges, and headers.
- Code & Telemetry: **JetBrains Mono** / **Fira Code** for pinouts, I2C hex addresses, error codes, and step numbers.
