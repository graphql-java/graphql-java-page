# GraphQL Java documentation

Welcome to the GraphQL Java documentation. It's very easy to get started, all you need is Markdown.

Contributions are always welcome. Thanks for helping out!

## Local setup

This website is built using [Docusaurus 2](https://docusaurus.io/), a modern static website generator.

### Installation

```
$ yarn
```

### Local Development

```
$ yarn start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```
$ yarn build
```

Preview build files locally with

```
$ yarn run serve
```

## How to create a new release

Create a new release by following the below (v18 used as an example)

```
$ yarn run docusaurus docs:version v18
```

Then update `lastVersion` inside `docusaurus.config.js`
```
lastVersion: "v18",
```

Finally, change the Maven and Gradle sections in [documentation/getting-started.md](/documentation/getting-started.md) and the new version [v18/getting-standard](/versioned_docs/version-v18/getting-started.md)

For more, see the [Docusaurus versioning documentation](https://docusaurus.io/docs/versioning).
