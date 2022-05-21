# Codemods 🪄

## Usage

```
npx github:xerosanyam/codemod
```

#### Extract strings from jsx/tsx files for translations

```
npx github:xerosanyam/codemod <file or dir> <transformer>
npx github:xerosanyam/codemod fixtures extract-strings
```

#### Debugging

- wrong output? please remove any `babel.config.js` files temporarily & re-try to avoid any parsing problems.

#### Inspirations

- https://github.com/reactjs/react-codemod
- https://github.com/janczizikow/sjt/blob/main/cli.js
- https://egghead.io/blog/codemods-with-babel-plugins
