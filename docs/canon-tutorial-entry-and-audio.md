# Tutorial, entry, and audio canon

This document preserves the design notes formerly embedded in the served audio, deep-link, and tutorial modules. Runtime behavior remains defined by the modules and their measured contracts.

## Voluntary skill tones — `public/game/audio_feedback_manager.js`

The manager supplies optional tones for measured skills in the current tab. It reuses the existing radio and synthesis modules, stores no events, and makes no network requests.

## Deterministic deep links — `public/game/deep_links.js`

A URL action resolves deterministically to one exact action, with no timer, random choice, or network request. Its title, effect, requirements, and measured cost appear before any signature or execution. Cancellation has no effect. The action contract is a local copy of the manifest. Mouse, keyboard, and touch are supported; controls are at least 44 pixels, Escape cancels, and dialog focus is announced and restored.

## Tutorial as action contract — `public/game/genesis_tutorial.js`

The tutorial renders the actions currently available in the game. Each step identifies its action, the measured event that completes it, the governing canon, sound, and coordinate. The machine reads the schema while the person reads the panel. Each screen presents one action, in English.

Irreversible actions are taught with a dry run and measured consequences. An unavailable action explains its cause and remedy. The macro objective stays visible. Help fades with demonstrated competence, measured by completed actions rather than declarations. The tutorial opens from the first reachable action or the menu, can always be skipped, and stores no progress outside the current tab.

Completion compares the measured state at step entry with what happens afterward. Tutorial text is shared with the lab. At narrow widths, the objective and active action occupy separate lines; the status notice stays in the same block. Each proven step establishes its own next baseline.
