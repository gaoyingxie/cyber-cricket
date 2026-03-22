# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## GitHub

- **SSH Key:** `~/.ssh/id_ed25519`（已配置，GitHub 已添加）
- **Token:** 【已清除】（已失效，仅作记录）
- **gh CLI:** `/home/node/bin/gh`（不在 PATH 中，使用时需 `export PATH="$HOME/bin:$PATH"` 或用绝对路径）
- **Git 协议:** 全局已配置 `url.git@github.com:.insteadOf=https://github.com/`，所有 git 操作走 SSH
- **仓库:** git@github.com:gaoyingxie/cyber-cricket.git

---

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.
