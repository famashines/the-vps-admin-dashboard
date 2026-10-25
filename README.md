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

- Paper `#fcfdff`, ink `#1c2541`, royal ink `#2b4c9b` (actions),
  ruling `#d5e0f2` (lines), margin red `#c42f3a` (only the margin and errors),
  slate `#5d6784` (second-level text).
- One typeface: Atkinson Hyperlegible Next, self-hosted.
- The one strong element is the red double margin of a school exercise book
  between the menu and the page. Keep the rest quiet.
