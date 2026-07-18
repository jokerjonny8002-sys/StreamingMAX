# Architectural Decisions

## D001 — ATLAS Is the Intelligence Layer

StreamingMAX is the interface and creator-focused product.
ATLAS is the intelligence that powers recommendations, monitoring, and future automation.

## D002 — No Page-Level Dashboard Scrolling

The primary cockpit should fit within the application viewport.

Panels containing variable-length content should scroll internally.

Examples:

- Mission Timeline
- ATLAS recommendations
- Process Monitor
- Equipment search results
- My Studio

## D003 — Newest and Most Important First

Mission Timeline:
- Newest events appear first.

ATLAS recommendations:
- Critical alerts first.
- Warnings second.
- Recommendations third.
- Informational items last.
- Newest item first within each priority.

Process Monitor:
- Most impactful or most recently changed processes appear first.

## D004 — Customizable Dock System

Future cockpit panels should support:

- Show and hide
- Drag and reorder
- Resize
- Collapse
- Close
- Lock layout
- Save layouts
- Load layouts
- Reset layout
- Mission-specific presets
- Future tabbed docking

## D005 — One Equipment Knowledge Engine

All equipment searches and lookups go through the ATLAS Library.

The UI must not read equipment JSON directly.

## D006 — Library Data and Studio Data Stay Separate

Library:
- What a device is
- Manufacturer
- Model
- Specifications
- Software
- Firmware
- Compatibility

Studio profile:
- Whether the user owns it
- Nickname
- Installed firmware
- Connection status
- Last seen
- User notes

## D007 — Safe Cleaner Only

Cleanup features must include:

- Preview
- Clear paths
- Estimated recovered space
- User-selected categories
- Protected folders
- Trash-based deletion where possible
- No deceptive performance claims

## D008 — “Idle” Is Not Mission-Control Language

The word “Idle” must not appear in the primary Mission Control interface.

Reason:

A technically idle network adapter does not tell the Commander whether the internet is usable or the mission is ready.

Preferred language:

- Checking
- Internet Ready
- Internet Needs Review
- Internet Not Ready
- Monitoring

Raw operating-system states may remain available in diagnostic logs.
