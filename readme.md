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

Create a new release by following the below (v19 used as an example)

```
$ yarn run docusaurus docs:version v19
```

Then update `lastVersion` inside `docusaurus.config.js`
```
lastVersion: "v19",
```

Finally, change the Maven and Gradle sections in [documentation/getting-started.mdx](/documentation/getting-started.mdx) and versioned documentation inside `versioned_docs`.

For more, see the [Docusaurus versioning documentation](https://docusaurus.io/docs/versioning).
