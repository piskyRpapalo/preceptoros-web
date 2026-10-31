# tools-install-control

Date: 2026-10-31
Law: Sovereign acceptance of the Tools decision (D5, declared in the EU-1 plan `usuario-efimero.md`, accepted by the Mesa on 2026-10-31); Mesa commission «D5 · TOOLS INSTALAR COMO CONTROL PROPIO» (2026-10-31). Plan first, FIRMA before code, one PR, cost S.

## Objective

On the intro, the Tools door always opens the device list and never installs on a click. Installing the app is its own control, shown only when the browser has offered the install.

## Problem and why

Today the Tools door has two jobs. If the browser kept its install offer (`beforeinstallprompt`), a click installs the app and the device list does not open. On other browsers the same click opens the list. The same button means two things, and on an install-offering browser the list cannot be reached from the door at all. Measured: `public/assets/intro.js`, click handler of `#door-tools`, first branch `PreceptorPwa.instalable()`.

## Scope

In scope:

1. `#door-tools` click: always toggles the device list (open and close), with its `aria-expanded` and focus as they are today.
2. A new button `#install-app` inside `#tools-dispositivo`, first in the list, hidden by default. It becomes visible when `PreceptorPwa.instalable()` is true (and `instalada()` is false), and it calls `PreceptorPwa.instala()`. It hides again after the install.
3. The door's status line stops promising a one-click install. It says where the install is, when it exists.

Out of scope: the install mechanism itself (`public/assets/pwa.js` is unchanged); the device links; the release card; any change to the other doors.

## Constraints

- Accessibility unchanged: `aria-expanded` on the door, focus to the heading on open, focus back to the door on close, Escape closes, the close button at least 44 px. The install button is a real button at least 44 px, and it is announced as a button, not as a link.
- No external resource; English text; no new file beyond the one check.
- Door `public/index.html` stays under 16 KiB (today 10,964 B); `intro.js` stays under 16 KiB (today 3,978 B).

## Checklist (one piece = one PR; FIRMO before code)

- [ ] T-1 · this plan. FIRMA of the Sovereign required before T-2.
- [ ] T-2 · markup: `#install-app` in `#tools-dispositivo`, hidden; the door status text updated.
- [ ] T-3 · `public/assets/intro.js`: the click always toggles the list; `#install-app` shown and hidden from `pwa-oferta` and `instalada()`; click calls `instala()`.
- [ ] T-4 · checks: `test_web.py` (`test_las_puertas_se_ven` pins the new button and the hidden state) and a browser check. Browser cases: without an offer, Tools opens the list and the install control stays hidden; with a simulated offer, Tools still opens the list and the install control shows; pressing install calls the prompt. Sabotage: the old click (install on click) turns the case red.
- [ ] T-5 · seal chain with the next free letter after `ax` (`aw` stays for the chat), judges, receipt.

## Verification evidence

Measured on `main` `3658a6d`: the door markup (`public/index.html` lines 38 to 42), the click branch in `intro.js`, the install API in `pwa.js` (`instalable`, `instalada`, `instala`, `beforeinstallprompt`, `pwa-oferta`). Not measured yet: the browser cases (T-4).

## Standing signature

Required: FIRMA of this plan before T-2. FIRMA per PR after that.

## Methodology relief

None.

## Log

- 2026-10-31 · Plan written from the code on `main` `3658a6d`. No code moved.

## Next step

The Sovereign's FIRMA of this plan (T-1). Then T-2 to T-5 in one PR.
