# ENGITRIAD — Master AI Agent Development Prompt
> **Use this prompt at the start of every AI-assisted coding session.**
> Copy the entire contents of this file and paste it as your first message to the AI agent before describing your specific task.

---

## 🧠 Project Context

You are assisting in the development of **EngiTriad**, a multi-domain mobile engineering application built with **Expo (Managed Workflow)**, **React Native**, **TypeScript**, and **Firebase**. The app combines three specialised engineering tools into a single platform:

1. **Corrosion Rate Estimator** — for metallurgical and civil engineers
2. **Concrete Mixer Calculator** — for civil site engineers
3. **Blasting Planner** — for mine supervisors and blasting officers

All modules sit behind a shared Firebase Authentication layer. Every record is tied to a verified user account (UID).

---

## 📁 Project File Structure

The project scaffold is as follows. **Every file you create or edit must have a comment at the very top indicating its file path relative to the project root.**

```
C:.  (project root: UNAM-I3691CP-Group8-ENGITRIAD)
│   .gitignore
│   app.json
│   eslint.config.js
│   package-lock.json
│   package.json
│   README.md
│   SRS.pdf
│   tsconfig.json
│
├───.vscode
│       extensions.json
│       settings.json
│
├───app
│   │   modal.tsx              ← Global modal screen
│   │   _layout.tsx            ← Root layout (auth guard lives here)
│   │
│   └───(tabs)
│           explore.tsx        ← REPLACE: becomes Departments/Home screen
│           index.tsx          ← REPLACE: becomes Welcome screen
│           _layout.tsx        ← Tab navigator (3 module tabs)
│
├───assets
│   └───images
│           android-icon-background.png
│           android-icon-foreground.png
│           android-icon-monochrome.png
│           favicon.png
│           icon.png
│           splash-icon.png
│           (... other images)
│
├───components
│   │   external-link.tsx
│   │   haptic-tab.tsx
│   │   hello-wave.tsx
│   │   parallax-scroll-view.tsx
│   │   themed-text.tsx
│   │   themed-view.tsx
│   │
│   └───ui
│           collapsible.tsx
│           icon-symbol.ios.tsx
│           icon-symbol.tsx
│
├───constants
│       theme.ts               ← Colour palette, typography constants
│
├───hooks
│       use-color-scheme.ts
│       use-color-scheme.web.ts
│       use-theme-color.ts
│
└───scripts
        reset-project.js
```

When you need to **create new files** beyond the scaffold (e.g., new screens, services, contexts), place them in logical locations:

| New file type | Suggested path |
|---|---|
| Auth screens | `app/(auth)/login.tsx`, `app/(auth)/signup.tsx`, etc. |
| Module screens | `app/(tabs)/corrosion/`, `app/(tabs)/concrete/`, `app/(tabs)/blasting/` |
| Firebase service helpers | `services/firebase.ts`, `services/auth.ts`, `services/firestore.ts` |
| Shared UI components | `components/` |
| Types / interfaces | `types/index.ts` |
| Context / state | `context/AuthContext.tsx` |
| Environment config | `.env` (never commit — already in .gitignore) |

---

## 🔑 FILE PATH COMMENT RULE (MANDATORY)

**Every single file you write or modify must begin with a comment on line 1 showing its path.**

### For `.tsx` / `.ts` files:
```typescript
// app/(tabs)/corrosion/index.tsx
```

### For `.js` files:
```javascript
// services/firebase.js
```

### For `.json` files:
```jsonc
// app.json  ← add as first key comment if format allows, else note it in your change log
```

This rule applies to **every file without exception**, including new files and edits to existing scaffold files.

---

## 🎨 Design System

Strictly follow the EngiTriad brand. Do **not** use any other colour palette or font.

| Token | Value | Usage |
|---|---|---|
| `PRIMARY` | `#DDA131` (Amber) | Buttons, highlights, active states, accent elements |
| `SECONDARY` | `#02153A` (Navy Blue) | Headers, navigation bar, primary text |
| `BACKGROUND` | `#FFFFFF` (White) | All screen backgrounds |
| `TEXT` | `#02153A` (Navy Blue) | Body text and labels |
| `FONT` | `Inter` | All UI text |

These values are (or will be) declared in `constants/theme.ts`. **Always import from there — never hardcode hex values in component files.**

Example `constants/theme.ts`:
```typescript
// constants/theme.ts

export const Colors = {
  primary: '#DDA131',
  secondary: '#02153A',
  background: '#FFFFFF',
  text: '#02153A',
  error: '#D32F2F',
  success: '#388E3C',
  border: '#E0E0E0',
  muted: '#757575',
};

export const FontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};
```

---

## 🔐 Firebase Architecture

### Services Used
| Service | Purpose | Status |
|---|---|---|
| Firebase Authentication | Email/password registration, login, logout, session persistence | Mandatory |
| Cloud Firestore | Real-time data storage for all three modules | Mandatory |
| Firebase Storage | Site photos/documents attached to blasting events | Optional |
| Firebase Cloud Messaging | Push notifications | Optional |

### SDK Rule
Use the **Firebase JavaScript SDK** (`firebase/app`, `firebase/auth`, `firebase/firestore`).  
**Do NOT use** `@react-native-firebase` — it is incompatible with Expo Managed Workflow.

### Environment Variables
All Firebase config keys must be stored in `.env` and accessed via `process.env.EXPO_PUBLIC_*`. Never hardcode keys. The `.env` file is already in `.gitignore`.

```env
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

### Firestore Collections & Fields

#### `users`
| Field | Type | Description |
|---|---|---|
| `uid` | string | Firebase-assigned user identifier |
| `displayName` | string | User's full name |
| `email` | string | Registered email address |
| `role` | string | `engineer` \| `supervisor` \| `student` |
| `domain` | string | Engineering domain |
| `createdAt` | timestamp | Account creation timestamp |

#### `corrosionRecords`
| Field | Type | Description |
|---|---|---|
| `userId` | string | Linked user UID |
| `materialType` | string | Type of material assessed |
| `environmentCondition` | string | Environmental exposure conditions |
| `exposureDuration` | number | Duration of exposure (years) |
| `corrosionRate` | number | Calculated corrosion rate result |
| `unit` | string | Unit of measurement |
| `notes` | string | Optional notes |
| `createdAt` | timestamp | Record creation timestamp |

#### `concreteMixes`
| Field | Type | Description |
|---|---|---|
| `userId` | string | Linked user UID |
| `projectName` | string | Name of the construction project |
| `concreteGrade` | string | Grade/strength class (e.g., C20/C25/C30) |
| `volumeRequired` | number | Total volume required (m³) |
| `cementQty` | number | Calculated cement quantity |
| `sandQty` | number | Calculated sand quantity |
| `aggregateQty` | number | Calculated aggregate quantity |
| `waterQty` | number | Calculated water quantity |
| `createdAt` | timestamp | Record creation timestamp |

#### `blastingEvents`
| Field | Type | Description |
|---|---|---|
| `userId` | string | Linked user UID |
| `eventName` | string | Name/identifier of the blast event |
| `scheduledDate` | timestamp | Date and time of scheduled blast |
| `blastLocation` | string | Geographic/site location |
| `materialsRequired` | string[] | List of materials needed |
| `crewAssignments` | string[] | Personnel assignments |
| `exclusionZoneRadius` | number | Safety exclusion zone radius (m) |
| `status` | string | `planned` \| `in-progress` \| `completed` |
| `attachmentURL` | string | URL of uploaded site file/photo |
| `createdAt` | timestamp | Record creation timestamp |

### Security Rule (apply to ALL collections)
```javascript
allow read, write: if request.auth != null;
```

---

## 🗺️ Navigation Flow

```
Splash Screen
      ↓
Login Screen  ←→  Sign Up Screen
      |                 |
      └────────┬─────────┘
               ↓
        Welcome Screen
               ↓
       Departments Screen
         ↓        ↓        ↓
  Cement Mixer  Corrosion  Blast Planner
         ↓        ↓        ↓
      Results   Results  Results
```

Authentication is guarded in `app/_layout.tsx`. Unauthenticated users are always redirected to the login flow.

---

## 📱 Screens Reference

### Authentication
| Screen | Key Elements |
|---|---|
| Splash Screen | EngiTriad logo, tagline, auto-redirect after delay |
| Login Screen | Email + password inputs, Login button, link to Sign Up, link to Forgot Password |
| Sign Up Screen | Full name, email, password, confirm password, Sign Up button |
| Forgot Password Screen | Email input, Send Reset Link button |

### Main Navigation
| Screen | Key Elements |
|---|---|
| Welcome Screen | Welcome message, user's name, navigate to Departments |
| Departments Screen | Three entry cards: Cement Mixer, Corrosion, Blast |

### Module Screens

**Corrosion Rate Estimator**
- Inputs: metal type, pH, temperature, exposure duration (years), optional notes
- Output: calculated corrosion rate + unit
- Save result to `corrosionRecords` in Firestore
- Show history of past calculations for the current user

**Concrete Mixer Calculator**
- Inputs: project name, concrete grade (C20/C25/C30), required volume (m³)
- Output: cement, sand, aggregate, water quantities
- Save result to `concreteMixes` in Firestore
- Show history of past calculations

**Blasting Planner**
- Inputs: event name, scheduled date, blast location, materials, crew, exclusion zone radius, optional file attachment
- Output: event card saved to `blastingEvents`, real-time sync via Firestore listeners
- Status tracking: `planned` → `in-progress` → `completed`

---

## ⚙️ Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Initial data load ≤ 3 s on 4G; calculation results display ≤ 1 s; Firestore updates reflect ≤ 2 s |
| Security | All Firestore reads/writes gated by `request.auth != null`; Firebase keys in `.env` excluded from version control; passwords never stored in plaintext |
| Usability | Clear labels, validation messages, placeholder text on all forms; consistent bottom-tab navigation; Inter font + Amber/Navy theme throughout |
| Reliability | Active internet required; offline mode out of scope; all users must register before accessing features |
| Platform | Android 10.0 (API Level 29)+; distributed as Android APK via EAS Build |

---

## ✅ Mandatory Output Format After Every Change

After every set of changes you make, you **must** output a **Change Log** in the following format. This is non-negotiable — it is how the team tracks what was done.

---

### 📋 CHANGE LOG

**Session date:** `YYYY-MM-DD`
**Task completed:** `[Brief description of what was implemented]`

#### Files Modified
| File Path | What Changed |
|---|---|
| `app/_layout.tsx` | Added auth guard; redirects unauthenticated users to `/login` |
| `constants/theme.ts` | Defined `Colors` and `FontFamily` constants |

#### Files Created
| File Path | Purpose |
|---|---|
| `services/firebase.ts` | Firebase app initialisation using env variables |
| `context/AuthContext.tsx` | Auth state provider with login/logout/register helpers |
| `app/(auth)/login.tsx` | Login screen with email/password form |

#### Files Deleted
| File Path | Reason |
|---|---|
| `app/(tabs)/explore.tsx` | Replaced by Departments screen at `app/(tabs)/departments.tsx` |

#### Packages Added (if any)
```bash
npx expo install firebase
npx expo install @expo-google-fonts/inter expo-font
```

#### Notes / Known Issues
- [ ] List anything incomplete, blocked, or requiring another team member's input
- [ ] Any assumptions made that differ from the SRS

---

## 🚦 Ground Rules for AI Agents

1. **Always read existing files before editing them.** Ask to see the current content if you don't have it.
2. **Never hardcode Firebase keys.** Use `process.env.EXPO_PUBLIC_*` always.
3. **Never hardcode colour values.** Import from `constants/theme.ts`.
4. **Always use TypeScript.** No `.js` files except `scripts/` and config files.
5. **Every file starts with a path comment** — no exceptions.
6. **Every session ends with a Change Log** — no exceptions.
7. **Do not install `@react-native-firebase`.** Use the Firebase JS SDK only.
8. **Corrosion and concrete calculations are indicative only** — not certified for structural safety sign-off. Display a disclaimer on result screens.
9. **Scope all Firestore queries by `userId`** — never allow cross-user data access.
10. **Validate all form inputs** before submitting to Firestore or running calculations.

---

*This prompt was generated from the EngiTriad System Requirements Specification (SRS) for Group 8, UNAM I3691CP.*