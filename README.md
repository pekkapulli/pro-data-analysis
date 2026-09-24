# Rojaltit.net

Rojaltit.net on riippumaton selainpohjainen työkalu, jolla musiikintekijät voivat analysoida Teostolta saamiaan tilitystietoja. Se auttaa hahmottamaan korvausten määrää, rakennetta ja ajoitusta esimerkiksi tilitysalueittain, maittain, teoksittain ja käyttöjaksoittain.

Käyttäjän CSV-muotoinen tilitysdata käsitellään ensisijaisesti paikallisesti selaimessa, eikä sitä lähetetä palvelimelle. Käyttäjä voi halutessaan osallistua yhteisen tutkimusaineiston muodostamiseen: tällöin aineistosta poistetaan suorat tunnistetiedot, se pseudonymisoidaan ja lähetettävät tiedot rajataan tutkimuksen kannalta tarpeellisiin tietoihin.

# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
npx sv@0.15.3 create --template minimal --types ts --add prettier eslint tailwindcss="plugins:none" sveltekit-adapter="adapter:netlify" --install npm teosto-analysis
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Pseudonymized Research Export

The upload view includes a button to download one pseudonymized CSV file from all currently uploaded rows.

### How pseudonymization works

- Hashing algorithm: SHA-256 via browser Web Crypto API
- Salt strategy: a new random 16-byte salt is generated for each export
- Salt scope: one salt per export file, shared across all rows/hashed fields in that file
- Hash input normalization: trim, collapse internal whitespace, convert to lowercase before hashing
- Date minimization: dates are reduced to `MM/YYYY`
- Row coverage: all uploaded rows are exported into one dataset CSV

Because a fresh random salt is used on every export, hashes are stable inside one exported file but not linkable across different exports.
