# Codemod 🪄
 
### Things the library can do
1. Extract strings from react components (required during i18n and testing)
2. Find states that can be [colocated](https://kentcdodds.com/blog/state-colocation-will-make-your-react-app-faster) inside components (improves performance) (Coming Soon!) 

### Usage - Interactive
```
npx github:xerosanyam/codemod
```

### Usage - Advanced
```
npx github:xerosanyam/codemod <file or dir to apply on> <transformer name>
npx github:xerosanyam/codemod fixtures extract-strings
```

### Transformers List
1. extract-strings
2. ...

### Debugging

- wrong output? please remove any `babel.config.js` files temporarily & re-try to avoid any parsing problems.
---
#### Inspirations

- https://github.com/reactjs/react-codemod
- https://github.com/janczizikow/sjt/blob/main/cli.js
- https://egghead.io/blog/codemods-with-babel-plugins
