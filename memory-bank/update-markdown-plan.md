# Plan to Update Markdown Files

1.  **Create `memory-bank/archived` directory:** Create a new directory `memory-bank/archived` to store the outdated markdown files.
2.  **Identify and Archive Outdated Files:**
    *   Review the markdown files in `memory-bank/` and identify the files that are outdated or completed.
    *   Move the outdated files to the `memory-bank/archived` directory.
3.  **Update Relevant Markdown Files:**
    *   Review the remaining markdown files in `memory-bank/` and update them to reflect the completed MJS migration, including right-click menu pasting and Gremlin launching functionality.
    *   Specifically, update the following files:
        *   [`memory-bank/activeContext.md`](memory-bank/activeContext.md): Update the current state assessment, next steps for verification, known issues, and required testing.
        *   [`memory-bank/architectural-assessment.md`](memory-bank/architectural-assessment.md): Update the assessment based on the current architecture.
        *   [`memory-bank/automation-improvements.md`](memory-bank/automation-improvements.md): Update the recommended improvements based on the current testing setup.
        *   [`memory-bank/build-process.md`](memory-bank/build-process.md): Update the build process documentation based on the current build process.
        *   [`memory-bank/changes-summary.md`](memory-bank/changes-summary.md): Update the changes summary based on the recent changes.
        *   [`memory-bank/context-menu-test-plan.md`](memory-bank/context-menu-test-plan.md): Update the test plan based on the current context menu integration.
        *   [`memory-bank/context-option-fix.md`](memory-bank/context-option-fix.md): Update the status of the context menu fix.
        *   [`memory-bank/gremlins-popup-integration.md`](memory-bank/gremlins-popup-integration.md): Update the integration plan based on the current popup integration.
        *   [`memory-bank/implementation-plan.md`](memory-bank/implementation-plan.md): Update the implementation plan based on the current implementation.
        *   [`memory-bank/improve-gremlins-menu.md`](memory-bank/improve-gremlins-menu.md): Update the improvements to the gremlins menu.
        *   [`memory-bank/migration-mjs.md`](memory-bank/migration-mjs.md): Update the migration plan based on the current migration status.
        *   [`memory-bank/migration-verification.md`](memory-bank/migration-verification.md): Update the verification report based on the current migration status.
        *   [`memory-bank/progress.md`](memory-bank/progress.md): Update the implementation progress.
        *   [`memory-bank/projectbrief.md`](memory-bank/projectbrief.md): Update the project brief.
        *   [`memory-bank/systemPatterns.md`](memory-bank/systemPatterns.md): Update the system patterns.
        *   [`memory-bank/techContext.md`](memory-bank/techContext.md): Update the technical context.
4.  **Review `src/` code:**
    *   Analyze the source code to understand the current implementation of the features mentioned in the markdown files.
5.  **Review `template/manifest.json`:**
    *   Analyze the manifest file to understand the application's structure, permissions, and dependencies.
6.  **Review `template/config.json`:**
    *   Analyze the config file to understand the application's configuration and settings.
7.  **Update Markdown Files (Again):**
    *   Based on the analysis of the source code, manifest file, and config file, update the markdown files in `memory-bank/` to reflect the current state of the application.

Here's a Mermaid diagram of the updated plan:

```mermaid
graph TD
    A[Create memory-bank/archived directory] --> B[Identify and Archive Outdated Files];
    B --> C(Move outdated files to memory-bank/archived);
    C --> D[Update Relevant Markdown Files];
    D --> E(Update memory-bank/ markdown files);
    F[Review src/ code] --> G(Understand source code);
    H[Review template/manifest.json] --> I(Understand application manifest);
    J[Review template/config.json] --> K(Understand application configuration);
    G & I & K --> L[Update Markdown Files (Again)];
    L --> M(Update memory-bank/ markdown files);
    M --> N[Present Plan];
    N --> O{User approves plan?};
    O -- Yes --> P{Write plan to markdown?};
    P -- Yes --> Q(Write plan to markdown file);
    Q --> R[Switch Modes];
    P -- No --> R;
    O -- No --> N;
    R --> S(Implement solution in another mode);
