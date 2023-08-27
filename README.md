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

## Dockerize TypeScript App

1. Create a `Dockerfile` with this content:
   ```Dockerfile
   FROM node:alpine AS base
   # add pnpm
   RUN corepack enable
   RUN corepack prepare pnpm@latest --activate


   FROM base as deps
   WORKDIR /app
   # install dependencies with pnpm
   COPY package.json pnpm-lock.yaml* ./
   RUN pnpm i --frozen-lockfile


   FROM base as builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .
   RUN pnpm build:app


   FROM base as runner
   WORKDIR /app
   COPY --from=builder /app/dist ./dist
   COPY --from=builder /app/node_modules ./node_modules

   USER node

   CMD ["node", "./dist/index.js"]
   ```
1. Build the image on the target machine using
   `docker build -t <repository>/<image-name>:<tag>`
1. Create a `docker-compose.yaml` if the application consists either of multiple
   containers or it needs additional configuration like environment variables or
   port mappings
1. Start the container either utilizing the `docker-compose.yaml` file using
   `docker-compose up` or with the `docker run` command using
   `docker run -d <repository>/<image-name>:<tag>`

## Push Image to Docker Hub

1. Create a repository [on Docker Hub](https://hub.docker.com/repository/create)
1. Push the image built locally to Docker Hub using
   `docker push <repository>/<image-name>:<tag>`
