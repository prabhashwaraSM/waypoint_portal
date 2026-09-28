# Feature folders

Each top-level folder under `src/features` owns one business capability or user role.

- `auth/` — login experience.
- `dispatcher/` — dispatcher operational portal.
- `loader/` — warehouse loader operational portal.
- `store-manager/` — outlet Store Manager portal for Waypoint Fresh, Style and Tech.

Future roles should get their own folders instead of adding files to a generic `src/pages` directory.

Keep role-specific pages, components, data adapters, and styles inside that role's folder. Move code to `src/shared` only when it is genuinely reused across roles.
