# GitHub Workflow Recommendations

> **TL;DR**: Always use `gh` CLI instead of browser automation on Raspberry Pi 400.

---

## Why `gh` CLI > Browser Automation

| Factor | `gh` CLI | Browser Automation |
|--------|----------|---------------------|
| Memory use | ~10–20 MB | ~200–300 MB+ |
| Speed | Direct API calls | Renders full UI |
| Reliability | No GUI prompts | Blocked by keyring/sudo dialogs |
| Scriptable | Yes (exit codes, JSON) | No (screenscraping only) |

---

## When to Use Browser Automation (Rare)

- You need a **screenshot** of a specific UI state  
- Testing a **web-only feature** not exposed via `gh api`  
- Debugging UI behavior (e.g., button labels, layout)  

→ Even then, minimize session time and close browser immediately.

---

## GUI-Light Checklist (Before Any Agent Task)

✅ Close browser (`pkill chromium-browser`)  
✅ Close file manager (`pkill pcmanfm`)  
✅ Close text editor (`pkill mousepad`)  
✅ Disable GNOME keyring (`systemctl --user disable gnome-keyring`)  
✅ Run `check-resources.sh` if >70% RAM, wait or reduce load  

---

## Resource Check Reminder

Run before heavy tasks:
```bash
/home/pi/.nanobot/workspace/scripts/check-resources.sh
```

Or manually:
```bash
free -h          # RAM usage
cat /proc/swaps  # Swap usage
ps aux --sort=-%mem | head -6
```

---

## Quick `gh` CLI Alternatives

| GUI Action | CLI Equivalent |
|-----------|----------------|
| Open PR | `gh pr create --title "…" --body "…"` |
| View PR | `gh pr view <number>` |
| List PRs | `gh pr list` |
| Checkout PR | `gh pr checkout <number>` |
| Push branch | `gh pr push` |
| Create issue | `gh issue create --title "…" --body "…"` |

---

## Summary

- **Default**: Use `gh` CLI  
- **Avoid**: Browser automation unless absolutely necessary  
- **Pre-check**: Run resource check before heavy tasks  
- **Result**: No freezes, faster work, smoother workflow
