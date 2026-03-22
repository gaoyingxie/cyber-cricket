---
name: auto-updater
description: "Automatically update OpenClaw and all installed skills once daily. Runs via cron, checks for updates, applies them, and messages the user with a summary of what changed."
metadata: {"version":"1.0.0","clawdbot":{"emoji":"🔄","os":["darwin","linux"]}}
---

# Auto-Updater Skill

Keep your OpenClaw and skills up to date automatically with daily update checks.

## What It Does

This skill sets up a daily cron job that:

1. Updates OpenClaw itself (via `openclaw update`)
2. Updates all installed skills (via `clawhub update --all`)
3. Messages you with a summary of what was updated

## Setup

### Quick Start

Ask the agent to set up the auto-updater, or manually add the cron job.

### Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| Time | 4:00 AM UTC | When to run updates |
| Timezone | UTC | Set via cron expression |
| Delivery | Main session | Where to send the update summary |

## How Updates Work

### OpenClaw Updates

```bash
openclaw update
```

Or for npm/pnpm/bun installs:
```bash
npm update -g openclaw@latest
# or: pnpm update -g openclaw@latest
# or: bun update -g openclaw@latest
```

### Skill Updates

```bash
clawhub update --all
```

This checks all installed skills against the registry and updates any with new versions available.

## Update Summary Format

After updates complete, you'll receive a message like:

```
🔄 Daily Auto-Update Complete

**OpenClaw**: Updated to v2026.3.8 (was v2026.3.7)

**Skills Updated (3)**:
- summarize: 1.0.0 → 1.0.1
- superdesign: 1.0.0 → 1.0.2
- find-skills: 0.1.0 → 0.1.1

**Skills Already Current (5)**:
ontology, proactive-agent, self-improving, browser-clawdbot, skill-vetter

No issues encountered.
```

## Manual Commands

Check for updates without applying:
```bash
clawhub update --all --dry-run
```

View current skill versions:
```bash
clawhub list
```

Check OpenClaw version:
```bash
openclaw --version
```

## Troubleshooting

### Updates Not Running

1. Verify cron is enabled: `openclaw cron status`
2. Confirm Gateway is running continuously
3. Check cron job exists: `openclaw cron list`

### Update Failures

If an update fails, the summary will include the error. Common fixes:

- **Permission errors**: Ensure the Gateway user can write to skill directories
- **Network errors**: Check internet connectivity

### Disabling Auto-Updates

Remove the cron job:
```bash
openclaw cron remove "Daily Auto-Update"
```

## Resources

- [OpenClaw Updating Guide](https://docs.openclaw.ai)
- [ClawHub CLI](https://docs.openclaw.ai/tools/clawhub)
- [Cron Jobs](https://docs.openclaw.ai)
