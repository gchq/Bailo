[![Contributors][contributors-shield]][contributors-url] [![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url] [![Issues][issues-shield]][issues-url]
[![License][license-shield]][license-url]

> Bailo is still in development and we have not yet completed all of the features we want it to have. See the roadmap
> for what we plan to build.

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/gchq/bailo">
    <h1>
      <!-- TODO: Fix #gh-dark-mode-only -->
      <img src="frontend/public/Bailo-logo-full-no-box.png" alt="Logo" width="170">
    </h1>
  </a>

  <p align="center">
    Making it easy to compliantly manage the machine learning lifecycle
    <br />
    <a href="https://gchq.github.io/Bailo/docs"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/gchq/bailo/issues">Report a Bug</a>
    ·
    <a href="https://github.com/gchq/bailo/issues">Request a Feature</a>
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#breaking">Breaking Changes</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

<br />

<!-- ABOUT THE PROJECT -->

## About The Project

[![Product Screen Shot][product-screenshot]](https://github.com/gchq/bailo)

Bailo helps you manage the lifecycle of machine learning to support scalability, impact, collaboration, compliance and
sharing.

### Built With

- [Next.js](https://nextjs.org/)
- [Node.js](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/)
- [Seldon](https://www.seldon.io/)

<br />

<!-- GETTING STARTED -->

## Getting Started

### Requirements:

- Node v16
- Docker / Docker Compose

<br />

### Installation:

To run in development mode (modified files on your host machine will be reloaded into the running application):

```bash
git clone https://github.com/gchq/Bailo.git && cd Bailo
npm install
npm run certs

# This builds all the Bailo images, rerun it when you update dependencies.
DOCKER_BUILDKIT=1 docker-compose build --parallel

# Then run the development instance of Bailo.
docker-compose up -d
```

On first run, it may take a while (up to 30 seconds) to start up. It needs to build several hundred TypeScript
modules. These are cached however, so future starts only require a few seconds. You should access the site via [localhost:8080](http://localhost:8080).

<br />

### Setup:

Some example schemas are installed by default. More schemas can be added by altering and running the
`addDeploymentSchema.ts` and `addUploadSchema.ts` files.

```bash
npm run script -- addDeploymentSchema
npm run script -- addUploadSchema
```

> NOTE: Scripts are also written in Typescript. In production, run them using `node`, in development, run them using `ts-node` or `npm run script`.

<br />

### Service Ports:

| Service    | Host  | Notes                 |
| ---------- | ----- | --------------------- |
| Next UI    | 3000  | Stored in `frontend`  |
| NodeJS App | 3001  | Stored in `backend`   |
| Mongo      | 27017 | No credentials        |
| Registry   | 5000  | HTTPS only, no UI     |
| Minio UI   | 9001  | minioadmin:minioadmin |
| Minio      | 9000  | minioadmin:minioadmin |

\*\* Note: these credentials are intentionally basic/default, but in your own instances we recommend changing them to
something more secure.

We expect the administrator to provide their own forms of authentication. By default all users authenticate using as 'user'.

You can test out your new deployment using the example models which can be found in `__tests__`
[`minimal_binary.zip`](__tests__/example_models/minimal_binary.zip) and
[`minimal_code.zip`](__tests__/example_models/minimal_code.zip). There are also example forms in the `scripts` folder
[`minimal_upload_schema_examples.json`](backend/src/scripts/example_schemas/minimal_upload_schema_examples.json) and
[`minimal_deployment_schema_examples.json`](backend/src/scripts/example_schemas/minimal_deployment_schema_examples.json).

<br />

### Logical Project Flow (Overview)

![bailo diagram](frontend/public/mm-diagram.png)

1. A user accesses a URL. We use [NextJS routing](https://nextjs.org/docs/routing/introduction) to point it to a file in
   `frontend/pages`. `[xxx].tsx` files accept any route, `xxx.tsx` files allow only that specific route.
2. Data is loaded using [SWR](https://swr.vercel.app/). Data loaders are stored in `./frontend/data`. Each one exposes variables
   to specify if it is loading, errored, data, etc.
3. Requests to the backend get routed through [express](https://expressjs.com/) within `backend/routes.ts`. Each route is
   an array with all items being middleware except the last, which is the handler (`[...middleware, handler]`).
4. Routes interact with the database via `mongoose`, which stores models in `./backend/models`.

Some processing is done away from the main thread, when it is expected to take longer than a few milliseconds. These are
posted to a `mongodb` queue and processed by handlers in the `backend/processors` folder. Mongodb queues are handled
invisibly by `p-mongo-queue` (`backend/utils/queues.ts`).

<br />

### Known Issues

_Issue: Sometimes Docker struggles when you add a new dependency._

Fix: Run `docker-compose down --rmi all` followed by `docker-compose up --build`.

_Issue: Sometimes SWR fails to install its own binary and the project will refuse to start up (development only)_

Fix: Run `npm uninstall next && npm install next`. Some users report still having issues. If so, run:
`rm -rf node_modules && rm -rf package-lock.json && npm cache clean -f && npm i`.

_Issue: Unable to authenticate to the Docker registry / compile binaries._

Fix: Make sure that your authentication proxy is setup to allow the 'Authorisation' header. Make sure that your
application is able to access the Docker registry internally as it will not provide user authentication.

<br />

### Roadmap

List of near term goals:

- K8s Helm charts
- AWS deployment pattern
- Azure deployment pattern
- Deployment container watermarking

<br />

<!-- USAGE EXAMPLES -->

## Usage

See [our user documentation](https://gchq.github.io/Bailo/docs/users/upload-a-model/why-upload-a-model)

<br />

<!-- CONTRIBUTING -->

## Contributing

See [our contribution guide](https://gchq.github.io/Bailo/docs/developers/contributing)

<br />

<!-- BREAKING CHANGES -->

## Breaking Changes

**28-04-2022**: Changed 'schema' model to be stored as a string instead of an object. Delete & recreate your schemas.

<br />

<!-- LICENSE -->

## License

Bailo is released under the Apache 2.0 Licence and is covered by Crown Copyright. See `LICENSE.txt` for more
information.

<br />

<!-- ACKNOWLEDGMENTS -->

## Acknowledgments

- [Img Shields](https://shields.io)
- [Othneils's README Template](https://github.com/othneildrew/Best-README-Template)
- [Mattermost's Code Contribution Guidelines](https://github.com/mattermost/mattermost-server/blob/master/CONTRIBUTING.md)

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[contributors-shield]: https://img.shields.io/github/contributors/gchq/bailo.svg?style=for-the-badge
[contributors-url]: https://github.com/gchq/bailo/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/gchq/bailo.svg?style=for-the-badge
[forks-url]: https://github.com/gchq/bailo/network/members
[stars-shield]: https://img.shields.io/github/stars/gchq/bailo.svg?style=for-the-badge
[stars-url]: https://github.com/gchq/bailo/stargazers
[issues-shield]: https://img.shields.io/github/issues/gchq/bailo.svg?style=for-the-badge
[issues-url]: https://github.com/gchq/bailo/issues
[license-shield]: https://img.shields.io/github/license/gchq/bailo.svg?style=for-the-badge
[license-url]: https://github.com/gchq/bailo/blob/main/public/LICENSE.txt
[product-screenshot]: frontend/public/docs/bailo_product_screenshot.png
