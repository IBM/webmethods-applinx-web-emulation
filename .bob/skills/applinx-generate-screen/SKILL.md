---
name: applinx-generate-screen
description: >
  Generate a new ApplinX web-emulation screen component for this Angular workspace.
  Use when the user asks to generate, create, or scaffold a screen component for an
  ApplinX screen — including phrases like "generate screen", "create generated page",
  "scaffold ApplinX screen", "add generated component for <ScreenName>",
  "combine screens", "multi-screen form", "span across screens".
---

# ApplinX — Generate Screen Component

Follow these steps **in order** to scaffold a fully wired generated-screen component.

> **Two modes are supported:**
> - **Single-screen** — all fields belong to one ApplinX screen. Follow Steps 1–6.
> - **Multi-screen** — the UI combines fields from two or more ApplinX screens into one Angular
>   component. Follow Steps 1–6 and the additional guidance in
>   [Multi-screen submission flow](#multi-screen-submission-flow).

---

## Step 1 — Gather screen metadata from ApplinX

Call `mcp__ApplinX-MCP__get_screen` for **each** screen involved.

- **applicationName**: ask the user if not already known.
- **screenName(s)**: ask the user for all screen names involved. If more than one, clarify
  which screen is visited **first** (Screen 1) and which comes **after** (Screen 2, etc.).

From each response, extract and note:
- `name` — the screen name
- `description` — use as a comment in the component
- `fields` — array of field objects; each has `name`, `fieldType` (`PROTECTED` or `UNPROTECTED`),
  `position.row`, `position.column`, `position.length`
- `steps` — navigation steps; each has `targetScreen`, `inputFields[].fieldName`,
  `inputFields[].value`, and `action` (the host key, e.g. `[enter]`)

For **multi-screen** scenarios, also note the `action` (host key) on the step that transitions
from Screen 1 → Screen 2 (e.g. `[enter]`). This is the key sent after populating Screen 1.

---

## Step 2 — Plan what to render

Decide which fields to include based on the user's instructions (they may ask for a subset).
For every field the user wants:

| Field type    | Angular element |
|---------------|-----------------|
| `PROTECTED`   | Read-only `<span>` bound to a component getter |
| `UNPROTECTED` | `<input>` (or `<ibm-dropdown>` + nested `<ibm-dropdown-list [items]="...">` if the user asks for a dropdown) with `id` and `name` matching the ApplinX field name **exactly** |

For navigation (steps), the standard pattern is:
- A hidden `<input type="hidden" id="<fieldName>" [value]="selectedValue" />` outside `<app-screen>` for each input field
- A `<button ibmButton="primary" id="enter" (click)="onSubmit()">` that triggers `document.getElementById('enter')?.click()`

If the user requests a dropdown for an `UNPROTECTED` field, use `<ibm-dropdown>` and bind
`(selected)` to a handler that calls `this.navigationService.fillInput('<fieldName>', value)`.

---

## Step 3 — Derive names

From the ApplinX `screenName` (e.g. `LoginScreen`):

| Artifact | Convention | Example |
|---|---|---|
| Folder | `src/app/generated-pages/<ScreenName>/` | `LoginScreen/` |
| Model file | `<screenname>.model.ts` (all lowercase) | `loginscreen.model.ts` |
| Component files | `<screenname>.component.{ts,html,scss}` | `loginscreen.component.*` |
| Class name | `<ScreenName>Component` | `LoginScreenComponent` |
| Selector | `gx-<screenname>` (all lowercase) | `gx-loginscreen` |
| Route path | `<ScreenName>` (exact case) | `LoginScreen` |

---

## Step 4 — Create the four files

### 4a — Model (`loginscreen.model.ts`)

```ts
export class <ScreenName> {
  static readonly screenModel = {};
}
```

No additional content is needed unless the user asks for custom field overrides.

### 4b — Component class (`<screenname>.component.ts`)

```ts
import { <ScreenName> } from './<screenname>.model';
import { Component } from '@angular/core';
import { GXGeneratedPage } from '../GXGeneratedPage';
import { NavigationService } from '../../services/navigation/navigation.service';

@Component({
  selector: 'gx-<screenname>',
  templateUrl: './<screenname>.component.html',
  styleUrls: ['./<screenname>.component.scss']
})
export class <ScreenName>Component extends GXGeneratedPage {

  constructor(private navigationService: NavigationService) {
    super(<ScreenName>, navigationService);
  }

  /** Read a named field's content from the merged generated page at runtime */
  private getFieldContent(name: string): string {
    const field = (this.generatedPage?.fields as any[])?.find((f: any) => f.name === name);
    return field?.content ?? '';
  }

  // Add one getter per PROTECTED field that should display a live value:
  // get <fieldName>(): string { return this.getFieldContent('<fieldName>'); }

  // Add one handler per UNPROTECTED dropdown field:
  // on<FieldName>Selected(event: { item: { content: string; value: string } }): void {
  //   this.navigationService.fillInput('<fieldName>', event.item.value);
  // }

  onSubmit(): void {
    document.getElementById('enter')?.click();
  }
}
```

- Add a `get <name>(): string` getter for every PROTECTED field the user wants to display live.
- Add `readonly <name>Options = [...]` arrays and `(selected)` handlers for every dropdown field.

### 4c — Template (`<screenname>.component.html`)

Wrap all content in `<app-screen [screen]="generatedPage" [isGeneratedPage]="true">`.

Place a positioning `<div>` inside the screen with:
```html
style="grid-row: 1/24; grid-column: 1/80"
```
(adjust row count to match the screen's `screenRows` value from the ApplinX response).

**Hidden inputs** (one per navigation input field) must go **outside** `<app-screen>`:
```html
<input type="hidden" id="<fieldName>" [value]="selectedValue" />
```

**PROTECTED fields** — use a read-only `<span>`:
```html
<span class="ls-value">{{ <getter> }}</span>
```

**UNPROTECTED text inputs** — `id` and `name` must match the ApplinX field name:
```html
<input type="text" id="<fieldName>" name="<fieldName>" />
```

**Dropdown fields** — use Carbon `ibm-dropdown` with a nested `ibm-dropdown-list`.
`[items]` is an input on `ibm-dropdown-list`, **not** on `ibm-dropdown` itself:
```html
<ibm-dropdown
  label="<label>"
  placeholder="Select…"
  (selected)="on<Name>Selected($event)">
<ibm-dropdown-list [items]="<name>Options">
</ibm-dropdown-list>
</ibm-dropdown>
```

**Submit button** — must carry `id="enter"`:
```html
<button ibmButton="primary" id="enter" (click)="onSubmit()">Connect</button>
```

Use Carbon Design System components from `carbon-components-angular` (already imported in
`app.module.ts`): `ibm-dropdown`, `ibmButton`, `ibm-inline-notification`, etc.

### 4d — Styles (`<screenname>.component.scss`)

Start with Carbon token imports:
```scss
@use '@carbon/styles/scss/spacing' as *;
@use '@carbon/styles/scss/type'    as *;
@use '@carbon/styles/scss/theme'   as *;
```

Use Carbon spacing tokens (`$spacing-05`, etc.) and type-style mixins
(`@include type-style('body-compact-01')`). Do **not** hardcode pixel values when a Carbon token
exists for the same purpose.

---

## Carbon field-type examples

These examples show how to map an ApplinX `UNPROTECTED` field to a richer Carbon component
instead of a plain `<input>`. All modules (`CheckboxModule`, `RadioModule`, `DatePickerModule`,
`InputModule`) are already imported in `app.module.ts`.

In every case:
- The `id` / `name` attribute on the underlying input **must exactly match** the ApplinX field name.
- Call `this.navigationService.fillInput('<fieldName>', value)` (or `setScreen2Field()` for
  multi-screen) whenever the value changes so the framework can send it to the host.

---

### Checkbox

Use when the ApplinX field expects a toggle value (e.g. `'Y'` / `'N'`, `'1'` / `'0'`).

**Component class:**
```ts
<fieldName>Checked = false;

on<FieldName>Change(checked: boolean): void {
  this.<fieldName>Checked = checked;
  this.navigationService.fillInput('<fieldName>', checked ? 'Y' : 'N');
}
```

**Template:**
```html
<ibm-checkbox
  id="<fieldName>"
  name="<fieldName>"
  [checked]="<fieldName>Checked"
  (checkedChange)="on<FieldName>Change($event)">
<label-text>
</ibm-checkbox>
```

> `(checkedChange)` emits a `boolean`. Map it to the host value your ApplinX field expects
> (e.g. `'Y'`/`'N'`, `'true'`/`'false'`, `'X'`/`' '`).

---

### Radio buttons

Use when the ApplinX field accepts one of a fixed set of string values.

**Component class:**
```ts
readonly <fieldName>Options = [
  { label: 'Option A', value: 'A' },
  { label: 'Option B', value: 'B' },
  { label: 'Option C', value: 'C' },
];

on<FieldName>Change(event: { value: string }): void {
  this.navigationService.fillInput('<fieldName>', event.value);
}
```

**Template:**
```html
<ibm-radio-group
  name="<fieldName>"
  (change)="on<FieldName>Change($event)">
<ibm-radio
    *ngFor="let opt of <fieldName>Options"
    [value]="opt.value">
    {{ opt.label }}
  </ibm-radio>
</ibm-radio-group>
```

> `(change)` on `ibm-radio-group` emits a `RadioChange` object with a `value` property.
> `name` on `ibm-radio-group` is shared across all child radios automatically.

---

### Date picker

Use when the ApplinX field expects a date string (e.g. `'MM/DD/YYYY'`).

**Component class:**
```ts
on<FieldName>Change(dates: (Date | string)[]): void {
  if (!dates?.length) return;
  const d = dates[0] instanceof Date ? dates[0] : new Date(dates[0]);
  // Format to whatever the host field expects, e.g. MM/DD/YYYY
  const formatted = [
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
    d.getFullYear()
  ].join('/');
  this.navigationService.fillInput('<fieldName>', formatted);
}
```

**Template:**
```html
<ibm-date-picker
  id="<fieldName>"
  dateFormat="m/d/Y"
  placeholder="MM/DD/YYYY"
  (valueChange)="on<FieldName>Change($event)">
</ibm-date-picker>
```

> `(valueChange)` emits `(Date | string)[]`. Always take `dates[0]` for a single-date picker.
> Adjust `dateFormat` (flatpickr syntax) and the manual format string to match what the ApplinX
> host field expects.

---

### Password field

Use when the ApplinX field is a password (masked input with show/hide toggle).

**Component class:**
```ts
on<FieldName>Input(event: Event): void {
  this.navigationService.fillInput('<fieldName>', (event.target as HTMLInputElement).value);
}
```

**Template:**
```html
<ibm-password-label
  labelInputID="<fieldName>"
  helperText="Enter your password">
  Enter password
  <input
    ibmPassword
    id="<fieldName>"
    name="<fieldName>"
    (input)="on<FieldName>Input($event)" />
</ibm-password-label>
```

> `ibm-password-label` wraps the input and provides the show/hide toggle button automatically.
> The `[cdsPassword]` / `[ibmPassword]` directive on the raw `<input>` applies Carbon password
> styling. Use `(input)` to capture every keystroke so `fillInput` stays in sync.

---

## Step 5 — Register in `app.module.ts`

Open `src/app/app.module.ts` and make **three** targeted edits using `apply_diff`:

1. **Import** — add after the last existing generated-page import:
   ```ts
   import { <ScreenName>Component } from './generated-pages/<ScreenName>/<screenname>.component';
   ```

2. **`generatedPages` array** — append `, <ScreenName>Component` to the array.

3. **Routes array** — add a new route before the `**` catch-all:
   ```ts
   { path: '<ScreenName>', component: <ScreenName>Component, canActivate: [RouteGuardService] },
   ```

---

## Step 6 — Verify

After writing all files, run a quick sanity check:

```powershell
# Check that the folder and all four files exist
Get-ChildItem "src/app/generated-pages/<ScreenName>"
```

Then confirm that `app.module.ts` now contains the import, the `generatedPages` entry, and the
route by reading the relevant sections.

Do **not** run a full build by default — just confirm file presence and that the three
`app.module.ts` changes are in place.

---

---

## Multi-screen submission flow

Use this section when the Angular component combines fields from **two or more** ApplinX screens.

### Concept

The ApplinX session moves through screens sequentially. A single Angular form can collect all
input upfront, but the fields must be sent to the host **one screen at a time**:

1. **Phase 1** — populate Screen 1's fields via `fillInput`, then call `sendKeys('[enter]')`.
   The host transitions to Screen 2. `screen.component.ts` detects the new screen name and
   routes the Angular app to Screen 2's component, **destroying Screen 1's component**.
2. **Phase 2** — Screen 1's `screenSub` detects `<Screen2Name>` before the component is
   destroyed and calls `populateScreen2(screenId)`. Inside a `setTimeout(0)` (to let the
   router navigation complete), the Phase 2 fields are set via `setSendableField` and
   `sendKeysInternal` is called directly (bypassing the `isLocked` guard).
3. **Phase 3+** — if there are further screens, a one-shot `phase3Sub` subscription on
   `screenObjectUpdated` (using `skip(2)`) fires when Phase 2's XHR completes, then calls
   `getHostScreenNumber()` to resolve the current screen ID before sending the next key.

### Critical timing facts

These facts are non-obvious and **must** be applied correctly:

1. **`fillInput` requires a live DOM element.** It calls `document.getElementById(id)` and
   returns early (silently) if not found. For Phase 2+ fields (whose screen is not yet rendered),
   always use `navigationService.setSendableField(inputField)` directly instead.

2. **`sendKeys` checks `isLocked()` and returns early** when the screen is locked (which it is
   during the Phase 1 HTTP callback). For Phase 2+, call `sendKeysInternal` directly to bypass
   this guard.

3. **The component is destroyed by router navigation** (triggered by Phase 1's response) before
   Phase 2's XHR completes. `screenSub` (unsubscribed in `ngOnDestroy`) cannot be used to
   catch Phase 2's response. Use a closure-based one-shot subscription on the service's
   `screenObjectUpdated` for Phase 3+.

4. **`screenObjectUpdated` is a `BehaviorSubject`** — it replays its current value synchronously
   on every new `.subscribe()`. Additionally, `screen.component.ts` calls
   `screenObjectUpdated.next(null)` synchronously right after emitting a screen. So after
   subscribing inside a `setTimeout(0)` callback (Phase 2), the emission sequence is:
   - Emit 1: BehaviorSubject replay of the current value (null) — **skip**
   - Emit 2: The synchronous null-reset from `screen.component.ts` — **skip**
   - Emit 3: Phase 2's `sendKeysInternal` response (may itself be `null` if the HTTP body is empty)
   Use `pipe(skip(2))` to reach Emit 3 as the Phase 3 trigger.

5. **Phase 2+ HTTP responses may return `null` body.** Do not rely on the response value for
   the screen ID. Always call `getHostScreenNumber()` after Phase 2 completes to resolve the
   real current screen ID before sending Phase 3 keys.

### Component class additions

Add the following to the component class (4b):

```ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { InputField, GetScreenResponse } from '@ibm/applinx-rest-apis';
import { skip } from 'rxjs/operators';
import type { Subscription } from 'rxjs';

// Inside the class:

private screenSub: Subscription;

override ngOnInit(): void {
  super.ngOnInit();

  // React when Phase 1 transitions the host to Screen 2.
  // screenSub is alive for the component lifetime; ngOnDestroy tears it down.
  this.screenSub = this.navigationService.screenObjectUpdated.subscribe(
    (screen: GetScreenResponse) => {
      if (!screen) return;
      const name = (screen as any).name ?? '';
      if (name === '<Screen2Name>') {
        this.populateScreen2(screen.screenId ?? 0);
      }
    }
  );
}

ngOnDestroy(): void {
  this.screenSub?.unsubscribe();
}

/** Phase 1: fill Screen 1 fields and send the transition key. */
onSubmit(): void {
  // fillInput registers both the DOM input and sendableFields map.
  this.navigationService.fillInput('<screen1FieldName>', this.<screen1FieldValue>);
  this.navigationService.sendKeys('[enter]'); // or whatever Phase 1 key
}

/**
 * Phase 2: called by screenSub when the host lands on Screen 2.
 *
 * setTimeout(0) lets the router navigation triggered by Phase 1 complete.
 * setSendableField is used instead of fillInput because Screen 2's DOM does
 * not exist yet. sendKeysInternal bypasses the isLocked guard.
 *
 * Phase 3 (if needed) is chained via a one-shot skip(2) subscription that
 * fires on Phase 2's XHR completion, then uses getHostScreenNumber() to
 * resolve the real screen ID before sending the next key.
 */
private populateScreen2(screenId: number): void {
  const field2a = new InputField();
  field2a.name  = '<screen2Field1>';
  field2a.value = this.<screen2Field1Value>;

  const field2b = new InputField();
  field2b.name  = '<screen2Field2>';
  field2b.value = this.<screen2Field2Value>;

  // (Optional) Phase 3 field — only needed if there is a third screen
  const field3 = new InputField();
  field3.name  = '<screen3FieldName>';
  field3.value = this.<screen3FieldValue>;

  setTimeout(() => {
    this.navigationService.setScreenId(screenId);
    this.navigationService.setSendableField(field2a);
    this.navigationService.setSendableField(field2b);

    // ── Phase 3 subscription (omit if only two screens) ──────────────────
    // skip(2): skip BehaviorSubject replay + the synchronous null-reset.
    // Emit 3 is Phase 2's response (may be null) — use it as the trigger.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const phase3Sub = this.navigationService.screenObjectUpdated.pipe(skip(2)).subscribe((_s: any) => {
      phase3Sub.unsubscribe();
      // Phase 2 body may be null — resolve real screen ID via getHostScreenNumber.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.navigationService.getHostScreenNumber().subscribe((resp: any) => {
        this.navigationService.setScreenId(resp.screenNumber);
        this.navigationService.setSendableField(field3);
        this.navigationService.sendKeysInternal('[enter]'); // Phase 3 key
      });
    });
    // ─────────────────────────────────────────────────────────────────────

    this.navigationService.sendKeysInternal('[enter]'); // Phase 2 key
  }, 0);
}
```

Replace all `<…>` placeholders with the actual field names and values from your screens.
If there are only two screens, omit the `field3` / `phase3Sub` block entirely.
For four or more screens, nest another `skip(2)` subscription inside the Phase 3 callback.

### Template additions (4c)

- Render **all fields from all screens** in a single `<app-screen>` block. The user fills
  everything before clicking submit.
- Screen 2+ UNPROTECTED fields are bound to component properties in the normal way; the
  actual host submission happens in `populateScreen2()`, not from the template.
- Screen 1 UNPROTECTED fields must call `navigationService.fillInput()` (via a `(selected)`
  or `(change)` handler) **before** `onSubmit()` sends keys.

### Hidden inputs

Add a hidden input **outside** `<app-screen>` only for Screen 1 navigation fields.
Screen 2+ fields are registered via `setSendableField` in code — no hidden input is required.

```html
<!-- Screen 1 field — hidden input keeps the DOM and sendableFields in sync -->
<input type="hidden" id="<screen1FieldName>" [value]="<screen1FieldValue>" />
```

### Key constraints for multi-screen components

- **Phase 2+ must use `setSendableField`** (not `fillInput`) — the target screen's DOM does
  not exist when Phase 2 fires.
- **Phase 2+ must use `sendKeysInternal`** (not `sendKeys`) — the screen is locked when
  the Phase 1 HTTP callback runs.
- **Use `skip(2)` for Phase 3 subscriptions** — `skip(1)` is not enough because
  `screen.component.ts` emits a synchronous null-reset after Phase 1, consuming the first slot.
- **`screenSub` must be torn down in `ngOnDestroy`** to prevent memory leaks.
- **Never rely on Phase 2+ response body for screen ID** — call `getHostScreenNumber()` instead.
- Field names passed to `setSendableField` / `fillInput` must exactly match the ApplinX field
  names from `mcp__ApplinX-MCP__get_screen` — do not invent names.

---

## Key constraints (always enforce)

- `id` and `name` attributes on every `<input>` **must exactly match** the ApplinX field name
  (case-sensitive) — the framework reads inputs by ID when sending keys to the host.
- `id="enter"` is the mandatory target for the primary submit button.
- Hidden inputs for navigation fields **must be outside** `<app-screen>`.
- The component class **must extend `GXGeneratedPage`** and call `super(<ModelClass>, navigationService)`.
- Do not invent field names — use only names returned by `mcp__ApplinX-MCP__get_screen`.
- Do not add a `.css` stub file; use only `.scss`.
