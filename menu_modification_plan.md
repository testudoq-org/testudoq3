# Menu Modification Plan

## Objective

Remove the 'editable' entry from the DEFAULT_CONTEXTS array in [`src/lib/chrome-menu-builder.mjs`](src/lib/chrome-menu-builder.mjs), evaluate whether renaming `config.json` to `menu-config.json` would improve clarity, and conditionally rename the file.

## Plan

1.  **Information Gathering:**
    *   Read [`src/lib/context-menu.mjs`](src/lib/context-menu.mjs) to understand the structure of the `contexts` submenu.
    *   Read [`src/lib/chrome-menu-builder.mjs`](src/lib/chrome-menu-builder.mjs) to understand how the menu items are created and added.
    *   Read [`template/config.json`](template/config.json) to understand how the `config.json` file is used to dynamically construct the menu.

2.  **Code Modification:**
    *   Remove 'editable' from `DEFAULT_CONTEXTS` in [`src/lib/chrome-menu-builder.mjs`](src/lib/chrome-menu-builder.mjs).

3.  **Verification:**
    *   Ensure the entries are removed and the menu still functions as expected.

4.  **Evaluation of Renaming:**
    *   Search for all instances of `config.json` in the project using `search_files`.
    *   Analyze the search results and determine if renaming to `menu-config.json` would improve clarity and maintainability.

5.  **Renaming (Conditional):**
    *   If renaming is deemed beneficial:
        *   Rename `config.json` to `menu-config.json`.
        *   Update all references to `config.json` in the codebase to `menu-config.json` using `apply_diff`.

6.  **Final Steps:**
    *   Present the results and the reasoning behind the renaming decision using `attempt_completion`.

## Mermaid Diagram

```mermaid
graph TD
    A[Start] --> B{Read src/lib/context-menu.mjs};
    B --> C{Read template/config.json};
    C --> D{Apply diff to src/lib/chrome-menu-builder.mjs};
    D --> E{Verify removal};
    E --> F{Search for config.json};
    F --> G{Evaluate renaming};
    G --> H{Rename config.json (Conditional)};
    H --> I{Apply diff to update references};
    I --> J{Write to rename file};
    J --> K[Attempt Completion];
