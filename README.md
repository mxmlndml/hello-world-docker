# How to Dockerize an App and Publish its Image to Docker Hub

## Setup TypeScript App using pnpm

1. Initialize node app with `pnpm init`
1. [Chose a license](https://choosealicense.com) (eg.
   [MIT](https://choosealicense.com/licenses/mit) for open source projects). Add
   the license in a file called `LICENSE` and edit the `license` field of the
   `package.json`
1. Add node-specific files to `.gitignore`
   [using GitHub's template](https://raw.githubusercontent.com/github/gitignore/main/Node.gitignore)
   with
   `curl https://raw.githubusercontent.com/github/gitignore/main/Node.gitignore >> .gitignore`
1. Add the TypeScript module with `pnpm add -D typescript`
1. Initialize TypeScript with `pnpm exec tsc --init`
1. Configure TypeScript to use a root (`./src`) and out (`./dist`) directory in
   the `tsconf.json` file
1. Create an `index.ts` file in the `./src` directory as the primary entry point
   of the application
1. Set the `main` field in the `package.json` to `dist/index.js`
1. Add the rimraf module with `pnpm add -D rimraf`
1. Create node scripts for development as well as building and starting the
   TypeScript app:
   ```json
   "scripts": {
       "start": "node .",
       "dev": "tsc -w",
       "build": "rimraf ./dist && tsc"
   }
   ```
1. Add TypeScript definitions for node.js with `pnpm add -D @types/node`

## Dockerize TypeScript App

1. Create a `Dockerfile` with this content:
   ```Dockerfile
   FROM node:slim AS base
   ENV PNPM_HOME="/pnpm"
   ENV PATH="${PNPM_HOME}:${PATH}"
   RUN corepack enable
   COPY . /app
   WORKDIR /app

   FROM base as prod-deps
   RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

   FROM base AS build
   RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
   RUN pnpm run build

   FROM base
   COPY --from=prod-deps /app/node_modules /app/node_modules
   COPY --from=build /app/dist /app/dist
   CMD [ "pnpm", "start" ]
   ```
1. Add node/pnpm-specific files to `.dockerignore`
   [using pnpm's template](https://pnpm.io/docker#example-1-build-a-bundle-in-a-docker-container):
   ```
   node_modules
   .git
   .gitignore
   *.md
   dist
   ```
1. Build the image on the target machine using
   `docker build -t <username>/<repository>:<tag>`
1. Create a `docker-compose.yaml` if the application consists either of multiple
   containers or it needs additional configuration like environment variables or
   port mappings
1. Start the container either utilizing the `docker-compose.yaml` file using
   `docker-compose up` or with the `docker run` command using
   `docker run -d <username>/<repository>:<tag>`

## Push Image to Docker Hub

1. Create a repository [on Docker Hub](https://hub.docker.com/repository/create)
1. Push the image built locally to Docker Hub using
   `docker push <username>/<repository>:<tag>`

## Automate Build and Push of Images with GitHub Actions

1. Create a [new GitHub repository](https://repo.new) and push the code if not
   done already
1. Open the GitHub repository's Action secrets by navigating to the GitHub
   repository → Settings → Secrets and variables → Actions → New repository
   secret
1. Add the username and a PAT of the Docker Hub account as repository secrets
   called `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN`. It is recommended to
   create a new PAT per repository
1. Create a `docker-build-push.yaml` file in the `.github/workflows` directory
   with this content:
   ```yaml
   name: Docker Build and Push

   on:
     push:
       tags:
         - "*"

   env:
     REGISTRY_IMAGE: <username>/<repository>

   jobs:
     build:
       runs-on: ubuntu-latest
       strategy:
         fail-fast: false
         matrix:
           platform:
             - linux/amd64
             - linux/arm/v7
             - linux/arm64

       steps:
         - name: Checkout
           uses: actions/checkout@v3

         - name: Docker meta
           id: meta
           uses: docker/metadata-action@v4
           with:
             images: ${{ env.REGISTRY_IMAGE }}

         - name: Set up Docker Buildx
           uses: docker/setup-buildx-action@v2

         - name: Login to Docker Hub
           uses: docker/login-action@v2
           with:
             username: ${{ secrets.DOCKERHUB_USERNAME }}
             password: ${{ secrets.DOCKERHUB_TOKEN }}

         - name: Build and push by digest
           id: build
           uses: docker/build-push-action@v4
           with:
             context: .
             platforms: ${{ matrix.platform }}
             labels: ${{ steps.meta.outputs.labels }}
             outputs: type=image,name=${{ env.REGISTRY_IMAGE }},push-by-digest=true,name-canonical=true,push=true

         - name: Export digest
           run: |
             mkdir -p /tmp/digests
             digest=${{ steps.build.outputs.digest }}
             touch "/tmp/digests/${digest#sha256:}"

         - name: Upload digest
           uses: actions/upload-artifact@v3
           with:
             name: digests
             path: /tmp/digests/*
             if-no-files-found: error
             retention-days: 1

     merge:
       runs-on: ubuntu-latest
       needs:
         - build

       steps:
         - name: Download digests
           uses: actions/download-artifact@v3
           with:
             name: digests
             path: /tmp/digests

         - name: Setup Docker Buildx
           uses: docker/setup-buildx-action@v2

         - name: Docker meta
           id: meta
           uses: docker/metadata-action@v4
           with:
             images: ${{ env.REGISTRY_IMAGE }}

         - name: Login to Docker Hub
           uses: docker/login-action@v2
           with:
             username: ${{ secrets.DOCKERHUB_USERNAME }}
             password: ${{ secrets.DOCKERHUB_TOKEN }}

         - name: Create manifest list and push
           working-directory: /tmp/digests
           run: |
             docker buildx imagetools create $(jq -cr '.tags | map("-t " + .) | join(" ")' <<< "$DOCKER_METADATA_OUTPUT_JSON") \
               $(printf '${{ env.REGISTRY_IMAGE }}@sha256:%s ' *)

         - name: Inspect image
           run: |
             docker buildx imagetools inspect ${{ env.REGISTRY_IMAGE }}:${{ steps.meta.outputs.version }}
   ```
1. Start the workflow by adding and pushing a new git tag using
   `git tag <semantic-version>` and `git push origin <semantic-version>`
