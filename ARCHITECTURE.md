# Waypoint Portal Front-end Architecture

## Why branches still show the same files

A Git branch is a complete snapshot of the repository, not a folder. That means the `login`, `dispatcher`, `loader`, and other feature branches will normally contain the whole project.

The clean way to separate ownership is:

- keep one stable repository structure;
- place each role inside its own feature folder;
- create feature branches from `develop`;
- change only the feature folder owned by that branch;
- merge feature branches back into `develop`;
- merge `develop` into `main` only after integration testing.

## Branch model

```text
main
  └── develop
       ├── login
       ├── dispatcher
       ├── loader
       ├── driver
       └── store-manager
```

`main` = stable/demo-ready build.

`develop` = integration branch and source of truth for the current front-end structure.

Role branches = short-lived feature branches. They should be created or refreshed from `develop`.

## Source structure

```text
src/
├── app/
│   ├── AppRouter.jsx
│   └── RequireRole.jsx
│
├── shared/
│   ├── auth/
│   │   └── auth.js
│   ├── components/
│   │   └── Logo.jsx
│   └── styles/
│       └── global.css
│
└── features/
    ├── auth/
    │   └── pages/
    │       └── LoginPage.jsx
    │
    ├── dispatcher/
    │   ├── components/
    │   ├── data/
    │   ├── layout/
    │   ├── pages/
    │   │   └── fleet/
    │   └── styles/
    │
    └── loader/
        ├── components/
        ├── data/
        ├── pages/
        ├── styles/
        └── utils/
```

## Ownership

### Login / authentication

Work under `src/features/auth/` for login UI.

Shared authentication/session logic is under `src/shared/auth/`.

### Dispatcher

Work under `src/features/dispatcher/`.

The Dispatcher feature owns its dashboard, stores, orders, approval, inventory, dispatch, reports, fleet, dispatcher-specific data stores, and dispatcher-specific styles.

### Loader

Work under `src/features/loader/`.

The Loader is intentionally split into separate screens rather than one large file:

- Overview
- Loading Plan
- Loading Sequence
- Inventory Lookup
- Issues & Enquiries
- Completed Loads
- Issue / shortfall modal

## Shared code rule

Only put code in `src/shared/` when more than one role genuinely needs it.

Do not place Loader-only code in shared code just because another feature may need something similar later.

## Adding a new role

When Driver or Store Manager is implemented:

1. Create `src/features/driver/` or `src/features/store-manager/`.
2. Add its own pages, components, data, and styles.
3. Add its role route to `src/app/AppRouter.jsx`.
4. Extend the role mapping in `src/shared/auth/auth.js`.
5. Develop the feature on a branch created from the latest `develop`.

## Recommended workflow

```bash
git checkout develop
git pull origin develop

git checkout -b feature/my-change

# make changes only in the relevant feature folder

git add .
git commit -m "feat(loader): improve loading sequence"
git push origin feature/my-change
```

Open a pull request into `develop`, test the integrated portal, and only then promote `develop` to `main`.
