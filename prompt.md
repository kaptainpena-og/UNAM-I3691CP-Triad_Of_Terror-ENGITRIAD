# ENGITRIAD — Master AI Agent Development Prompt
> **Use this prompt at the start of every AI-assisted coding session.**
> Copy the entire contents of this file and paste it as your first message to the AI agent before describing your specific task.

---

## 🧠 Project Context

You are an expert AI development assistant working on **EngiTriad**, a multi-domain mobile engineering application built with **Expo (Managed Workflow)**, **React Native**, **TypeScript**, and **Firebase**. The app combines three specialised engineering tools into a single platform:

1. **Corrosion Rate Estimator** — for metallurgical and civil engineers
2. **Concrete Mixer Calculator** — for civil site engineers
3. **Blasting Planner** — for mine supervisors and blasting officers

All modules sit behind a shared Firebase Authentication layer. Every record is tied to a verified user account (UID).

---

## 📁 Project File Structure

The project scaffold is as follows. **Every file you create or edit must have a comment at the very top indicating its file path relative to the project root.**

```text
C:.  (project root: UNAM-I3691CP-Group8-ENGITRIAD)
│   .gitignore
│   app.json
│   eslint.config.js
│   expo-env.d.ts
│   package-lock.json
│   package.json
│   prompt.md
│   README.md
│   SRS.pdf
│   tsconfig.json
│   
├───app
│   │   index.tsx               // Welcome / Splash Screen
│   │   modal.tsx
│   │   _layout.tsx             // Root layout with Auth Guard
│   │   
│   ├───(auth)
│   │       forgot-password.tsx
│   │       login.tsx
│   │       signup.tsx
│   │       _layout.tsx
│   │       
│   └───(tabs)
│       │   departments.tsx     // Main Hub
│       │   _layout.tsx
│       │   
│       ├───blast
│       │       index.tsx
│       │       results.tsx
│       │       
│       ├───concrete
│       │       index.tsx
│       │       results.tsx
│       │       
│       └───corrosion
│               index.tsx
│               results.tsx
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
│       theme.ts                // Design system tokens
│       
├───context
│       AuthContext.tsx         // Global authentication state
│
├───hooks
│       use-color-scheme.ts
│       use-theme-color.ts
│       
├───services
│       firebase.ts             // Firebase JS SDK initialization
│
└───scripts
        reset-project.js
When you need to create new files beyond the scaffold, place them in logical locations:New file typeSuggested pathAuth screensapp/(auth)/login.tsx, app/(auth)/signup.tsxModule screensapp/(tabs)/corrosion/, app/(tabs)/concrete/, app/(tabs)/blast/Firebase service helpersservices/firebase.ts, services/firestore.tsContext / statecontext/AuthContext.tsxEnvironment config.env (never commit — already in .gitignore)🔑 FILE PATH COMMENT RULE (MANDATORY)Every single file you write or modify must begin with a comment on line 1 showing its path.For .tsx / .ts files:TypeScript// app/(tabs)/corrosion/index.tsx
For .js files:JavaScript// services/firebase.js
For .json files:Code snippet// app.json  ← add as first key comment if format allows, else note it in your change log
This rule applies to every file without exception, including new files and edits to existing scaffold files.🎨 Design SystemStrictly follow the EngiTriad brand. Do not use any other colour palette or font.TokenValueUsagePRIMARY#DDA131 (Amber)Buttons, highlights, active states, accent elementsSECONDARY#02153A (Navy Blue)Headers, navigation bar, primary textBACKGROUND#FFFFFF (White)All screen backgroundsTEXT#02153A (Navy Blue)Body text and labelsFONTInterAll UI textThese values must be declared in constants/theme.ts. Always import from there — never hardcode hex values in component files.Example constants/theme.ts:TypeScript// constants/theme.ts

export const Colors = {
  primary: '#DDA131',
  secondary: '#02153A',
  background: '#FFFFFF',
  text: '#02153A',
  textMuted: '#757575',
  textOnPrimary: '#FFFFFF',
  error: '#D32F2F',
  success: '#388E3C',
  border: '#E0E0E0',
};

export const FontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};
🔐 Firebase ArchitectureServices UsedServicePurposeStatusFirebase AuthenticationEmail/password registration, login, logout, session persistenceMandatoryCloud FirestoreReal-time data storage for all three modulesMandatoryFirebase StorageSite photos/documents attached to blasting eventsOptionalSDK RuleUse the Firebase JavaScript SDK (firebase/app, firebase/auth, firebase/firestore).Do NOT use @react-native-firebase — it is incompatible with Expo Managed Workflow.Environment VariablesAll Firebase config keys must be stored in .env and accessed via process.env.EXPO_PUBLIC_*. Never hardcode keys. The .env file is already in .gitignore.Code snippetEXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
Firestore Collections & FieldsusersFieldTypeDescriptionuidstringFirebase-assigned user identifierdisplayNamestringUser's full nameemailstringRegistered email addressrolestringengineer | supervisor | studentdomainstringEngineering domaincreatedAttimestampAccount creation timestampcorrosionRecordsFieldTypeDescriptionuserIdstringLinked user UIDmaterialTypestringType of material assessedenvironmentConditionstringEnvironmental exposure conditionsexposureDurationnumberDuration of exposure (years)corrosionRatenumberCalculated corrosion rate resultunitstringUnit of measurementnotesstringOptional notescreatedAttimestampRecord creation timestampconcreteMixesFieldTypeDescriptionuserIdstringLinked user UIDprojectNamestringName of the construction projectconcreteGradestringGrade/strength class (e.g., C20/C25/C30)volumeRequirednumberTotal volume required (m³)cementQtynumberCalculated cement quantitysandQtynumberCalculated sand quantityaggregateQtynumberCalculated aggregate quantitywaterQtynumberCalculated water quantitycreatedAttimestampRecord creation timestampblastingEventsFieldTypeDescriptionuserIdstringLinked user UIDeventNamestringName/identifier of the blast eventscheduledDatetimestampDate and time of scheduled blastblastLocationstringGeographic/site locationmaterialsRequiredstring[]List of materials neededcrewAssignmentsstring[]Personnel assignmentsexclusionZoneRadiusnumberSafety exclusion zone radius (m)statusstringplanned | in-progress | completedattachmentURLstringURL of uploaded site file/photocreatedAttimestampRecord creation timestampSecurity Rule (Apply to ALL collections)JavaScriptallow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
🗺️ Navigation FlowPlaintextSplash / Welcome Screen (app/index.tsx)
      ↓
Login Screen  ←→  Sign Up Screen
      |                 |
      └────────┬────────┘
               ↓ (Auth Context validates session)
      Departments Screen (Main Hub)
         ↓        ↓        ↓
   Concrete   Corrosion   Blast Planner
         ↓        ↓        ↓
      Results  Results  Results
Authentication must be guarded in app/_layout.tsx. Unauthenticated users are always redirected to the login flow.📱 Screens ReferenceAuthenticationSplash/Welcome Screen: EngiTriad logo, tagline, check auth state, redirect.Login Screen: Email + password inputs, Login button, link to Sign Up, link to Forgot Password.Sign Up Screen: Full name, email, password, confirm password, Sign Up button. Creates a profile in the users Firestore collection upon success.Forgot Password Screen: Email input, Send Reset Link button.Main NavigationDepartments Screen: Three entry cards: Cement Mixer, Corrosion, Blast.Module ScreensCorrosion Rate Estimator: Inputs (metal type, pH, temperature, exposure duration). Output (corrosion rate + unit). Save to corrosionRecords. View history.Concrete Mixer Calculator: Inputs (project name, concrete grade, required volume). Output (cement, sand, aggregate, water quantities). Save to concreteMixes. View history.Blasting Planner: Inputs (event name, scheduled date, location, materials, crew, radius). Output (event card saved to blastingEvents). Status tracking.⚙️ Non-Functional RequirementsCategoryRequirementPerformanceInitial data load ≤ 3 s; calculation results ≤ 1 s; Firestore updates ≤ 2 sSecurityAll Firestore reads/writes gated by request.auth != null; keys in .env; passwords never plaintextUsabilityClear labels, validation, placeholder text; consistent navigation; Inter font + Amber/Navy themeReliabilityActive internet required; offline mode out of scopePlatformAndroid 10.0 (API Level 29)+; distributed as Android APK via EAS Build✅ Mandatory Output Format After Every ChangeAfter every set of changes you make, you must output a Change Log exactly in the format below. This is non-negotiable — it is how the team tracks what was done. Do not skip this step.📋 CHANGE LOGSession date: YYYY-MM-DDTask completed: [Brief description of what was implemented]Files ModifiedFile PathWhat Changedapp/_layout.tsxAdded auth guard; redirects unauthenticated users to /loginFiles CreatedFile PathPurposeservices/firebase.tsFirebase app initialisation using env variablesFiles DeletedFile PathReasonapp/(tabs)/explore.tsxReplaced by Departments screenPackages Added (if any)Bashnpx expo install firebase
Notes / Known Issues[ ] List anything incomplete, blocked, or requiring another team member's input[ ] Any assumptions made that differ from the SRS🚦 Ground Rules for AI Agents (CRITICAL)Always read existing files before editing them. Ask to see the current content if you don't have it.Never hardcode Firebase keys. Use process.env.EXPO_PUBLIC_* always.Never hardcode colour values. Import from constants/theme.ts.Always use TypeScript. No .js files except for config scripts. Define strict interfaces for Firestore documents.Every file starts with a path comment — no exceptions.Every response ends with a Change Log — no exceptions.Do not install @react-native-firebase. Use the Firebase JS SDK only.Add disclaimers: Corrosion and concrete calculations are indicative only. Display a clear visual disclaimer on all result screens.Scope all Firestore queries by userId — never allow cross-user data access.Validate all form inputs before submitting to Firestore or running calculations.