# Project Context

## Purpose
Configure firmware for a custom Dacty split keyboard in ZMK. The goal is to maintain unified multilingual layouts (EN/DE/RU, plus OS-specific Android/Mac variants), with working pointing support, macros for fast language/BT switching, and optional OLED/underglow.

## Tech Stack
- ZMK firmware (Zephyr RTOS) pulled via west (`config/west.yml`) from `zmkfirmware/zmk@main`
- nice_nano_v2 MCU targets, built separately for `dacty_left` and `dacty_right` shields
- DeviceTree overlays/dtsi/keymaps under `config/boards/shields/dacty/`
- Optional ZMK Studio snippet (`studio-rpc-usb-uart`) and RGB underglow (WS2812)
- SSD1306 I2C OLED on Pro Micro header; pointing/mouse behaviors enabled in config

## Project Conventions

### Code Style
- DeviceTree formatting with aligned properties and uppercase keycodes; keep layer diagrams in comments above bindings
- Macros/behaviors live in `dacty_macros.dtsi`; layer IDs defined via `#define` and must stay in sync with keymap layers
- Prefer ASCII; match existing spacing/indentation (4-space indents, angle-bracket arrays on separate lines)

### Architecture Patterns
- ZMK split keyboard with central/peripheral role (central on left half) and matrix-transform mapping to Sofle-like 5x6 layout
- Separate overlays per half (`dacty_left.overlay`, `dacty_right.overlay`) wiring GPIO matrix and applying column offset on right
- `default_transform` drives matrix mapping; `dacty.dtsi` sets physical layout and OLED binding
- Layers for OS/language variants (default, Android, Deutsch, Deutsch-Mac, Russian, Russian-Mac, RU-Android), plus lower/raise/magic/shift/ralt variants
- Macros for BT slot selection (`to_linux`, `to_mac`, `to_android`), language cycling, and AltGr helpers; combos for ESC/Enter/BSPC
- Pointing layer (`lower_layer`) provides mouse movement and clicks; underglow/display guarded by config flags

### Testing Strategy
- Build both halves with west/ZMK: `west build -p -b nice_nano_v2 -- -DSHIELD=dacty_left` and `... dacty_right`; add `-DSNIPPET=studio-rpc-usb-uart -DCONFIG_ZMK_STUDIO=y` to match CI matrix
- No automated tests; validation is firmware compile success and manual flash/typing verification on hardware
- Keep `build.yaml` matrix in sync with supported targets

### Git Workflow
- Standard branch/PR flow with GitHub Actions CI (driven by `build.yaml` matrix for left/right builds); no custom commit semantics documented

## Domain Context
- Dacty is a column-staggered split (5 rows + thumb keys). Matrix is 12 columns x 6 rows mapped via `default_transform`; maintain ordering to avoid key swaps
- OLED uses SSD1306 over Pro Micro I2C; disabling display requires removing `zephyr,display` in `dacty.dtsi` or toggling config flags
- Bluetooth macros assume slots 0/1/2 map to Linux/Mac/Android respectively
- Language cycle keys live on home row (e.g., CAPS replacement) and depend on layer indices staying consistent
- Combo timings set to 50 ms; keep short for fast access to ESC/Enter/BSPC without false positives

## Important Constraints
- Target hardware is nice_nano_v2; configs assume Pro Micro pinout for matrix/OLED
- Keep `columns=12`/`rows=6` in `default_transform` aligned with physical wiring and overlays
- Split settings rely on `ZMK_SPLIT`/`ZMK_SPLIT_ROLE_CENTRAL` defaults; avoid changing without testing both halves
- Pointing/mouse behaviors depend on `CONFIG_ZMK_POINTING` and `CONFIG_ZMK_MOUSE_*` settings in `dacty.conf`
- RGB underglow requires WS2812 strip and SPI selections; leave disabled if hardware absent

## External Dependencies
- `zmkfirmware/zmk` repo via west manifest (`config/west.yml`)
- Zephyr toolchain (via ZMK build environment or Docker image)
- Optional ZMK Studio connection (USB RPC snippet) and WS2812 underglow hardware
- Hardware peripherals: SSD1306 OLED, nice_nano_v2 MCU pair, wired key matrix per overlays
