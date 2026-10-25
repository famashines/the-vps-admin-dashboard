# the-vps-app

Web app of the-vps for all roles (student, teacher, parent, admin). React,
Vite, TypeScript and Mantine. The build is static files, served by nginx.

## Work on it

    npm ci
    npm run dev       # http://localhost:5173
    npm run build     # type check, then dist/

## Release

A merge to `main` builds the image and releases it to dev
(https://dev.app.vision.ac.pk). The footer of the menu shows the release
(the commit). A merge commit of `main` into `production` releases the same
image to prod. Each pull request builds the image once as a check.

## Design

- Paper `#fcfdff` (page), sheet `#ffffff` (panels), wash `#f3f6fb` (menu,
  table head, form footer), ink `#1c2541`, royal ink `#2b4c9b` (actions, the
  active menu item, admission numbers), ruling `#d5e0f2` (lines and panel
  borders), margin red `#c42f3a` (only the margin and errors), slate `#5d6784`
  (second-level text).
- One typeface: Atkinson Hyperlegible Next, self-hosted, with tabular figures
  for numbers and dates.
- The one strong element is the red double margin of a school exercise book
  between the menu and the page, and down the sign-in page. Keep the rest
  quiet: white panels with one thin border, no shadows, no gradients.
- The menu holds the app name, the pages, the signed-in user, sign-out and
  the release. On a phone it opens from the top bar.
- Every state names the next step: an empty list offers "Register student", a
  failed list offers "Reload page".
- The Dashboard shows only what exists. Parts that are not built yet are
  listed under "Coming next", with no numbers.
