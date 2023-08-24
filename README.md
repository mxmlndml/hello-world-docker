# How to Dockerize an App and Publish its Image to Docker Hub

## Setup TypeScript App using pnpm

1. Initialize node app with `pnpm init`
1. Add node-specific files to `.gitignore`
   [using GitHub's template](https://raw.githubusercontent.com/github/gitignore/main/Node.gitignore)
   with
   `curl https://raw.githubusercontent.com/github/gitignore/main/Node.gitignore >> .gitignore`
1. Add the TypeScript module with `pnpm add typescript`
1. Initialize TypeScript with `pnpm exec tsc --init`
1. Configure TypeScript to use a root (`./src`) and out (`./dist`) directory in
   the `tsconf.json` file
1. Create an `index.ts` file in the `./src` directory as the primary entry point
   of the application
1. Set the `main` field in the `package.json` to `dist/index.js`
1. Add the rimraf module with `pnpm add rimraf`
1. Create npm scripts that build and start the TypeScript app:
   `"build:app": "rimraf ./dist && tsc", "start", "pnpm build:app && node ."`
1. [Chose a license](https://choosealicense.com) (eg.
   [MIT](https://choosealicense.com/licenses/mit) for open source projects). Add
   the license in a file called `LICENSE`, in the `license` field of the
   `package.json` and in the GitHub repository
