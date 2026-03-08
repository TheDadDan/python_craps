# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the App

```bash
# Web interface (Flask, runs at http://localhost:5000)
python start.py

# CLI interface (terminal-based, no Flask required)
python craps_cli.py
```

There are no tests or linting configured for this project.

## Architecture

This is a Flask web app with three mini-apps registered as Blueprints, plus a standalone CLI version:

**`start.py`** — The Flask entry point. It defines all Blueprints and registers them:
- `dice_bp` (Blueprint `dice_app`) — mounted at `/`, serves `web_app/templates/` and `web_app/static/`
- `craps_bp` (Blueprint `craps_app`) — mounted at `/craps`, serves `craps_app/templates/` and `craps_app/static/`
- `dice_invaders_bp` (Blueprint `dice_invaders_app`) — mounted at `/dice-invaders`, serves `dice_invaders_app/templates/` and `dice_invaders_app/static/`

Game state for the craps app is stored in the Flask `session` (not global variables). The state dict lives at `session['craps_game_state']` and is explicitly written back after every mutation because Flask sessions require reassignment to detect changes.

**Key API endpoints in `start.py`:**
- `POST /craps/craps_roll` — rolls dice and resolves bets; handles both come-out and point-established phases
- `POST /craps/place_bets` — validates and deducts bets from balance (only allowed between rounds)
- `POST /craps/craps_reset` — resets session state to defaults ($1000 balance)
- `POST /roll` — dice simulator roll (any number of dice/sides)

**`craps_cli.py`** — Self-contained CLI version using `CrapsGame` class. No Flask; uses ANSI colors and ASCII dice art. Mirrors the same game logic as the web version.

## Bet Accounting Pattern

Like a real casino — you pay to play. Bets are **deducted from balance when placed**. On a win, the full return (original bet × multiplier) is added back. This means:
- Pass Line win: `balance += bet * 2` (returns bet + profit)
- Loss: no further deduction (already taken at placement)
- Don't Pass on 12: push — `balance += bet` (returns original bet only)

## Single-Roll Bets

Both apps support these proposition bets (cleared after every roll):
| Type | Wins on | Payout |
|------|---------|--------|
| `any-7` | 7 | 4:1 |
| `any-craps` | 2, 3, or 12 | 7:1 |
| `two-or-twelve` | 2 or 12 | 30:1 |
| `three-or-eleven` | 3 or 11 | 15:1 |
| `called-2` | 2 | 30:1 (web only) |
| `called-12` | 12 | 30:1 (web only) |
