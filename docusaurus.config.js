// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const {themes} = require('prism-react-renderer');

const plausibleInitScript = `
  window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};
  plausible.init()
`;

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'GraphQL Java',
  tagline: 'The Java implementation of GraphQL',
  url: 'https://graphql-java.com',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  favicon: 'img/favicon.ico',
  organizationName: 'graphql-java', // Usually your GitHub org/user name.
  projectName: 'graphql-java-page', // Usually your repo name.
  headTags: [
    {
      tagName: 'script',
      attributes: {
        async: 'true',
        src: 'https://plausible.io/js/pa-p0EwT1dUPS95Hq8MWvpRd.js',
      },
    },
    {
      tagName: 'script',
      attributes: {},
      innerHTML: plausibleInitScript,
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
        crossorigin: 'anonymous',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossorigin: 'anonymous',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@600&display=swap',
      },
    },
  ],
  presets: [
    [
      '@docusaurus/preset-classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          path: 'documentation',
          routeBasePath: 'documentation',
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/graphql-java/graphql-java-page/edit/master/',
          lastVersion: "v25",
          versions: {
            current: {
              label: "master",
              path: "master"
            }
          }
        },
        blog: {
          showReadingTime: true,
          editUrl:
            'https://github.com/graphql-java/graphql-java-page/edit/master/blog/',
          blogSidebarTitle: 'All posts',
          blogSidebarCount: 'ALL',
          postsPerPage: 5,
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'GraphQL Java',
        logo: {
          alt: 'GraphQL Java logo',
          src: 'img/logo.png',
        },
        items: [
          {
            type: 'doc',
            docId: 'getting-started',
            position: 'left',
            label: 'Documentation',
          },
          {href: 'https://leanpub.com/graphql-java/', label: 'Book', position: 'left'},
          {to: '/tutorials/getting-started-with-spring-boot', label: 'Tutorial', position: 'left'},
          {href: 'https://feddi.dev', label: 'Federation', position: 'left', className: 'navbar-federation-link'},
          {to: '/blog', label: 'Blog', position: 'left'},
          {to: '/security', label: 'Security', position: 'left'},
          {to: '/about', label: 'About', position: 'left'},
          {type: 'docsVersionDropdown', position: 'right'},
          {
            href: 'https://github.com/graphql-java/graphql-java',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Documentation',
                to: '/documentation/getting-started',
              },
              {
                label: '3 Min Tutorial',
                to: '/tutorials/getting-started-with-spring-boot',
              },
              {
                label: 'JavaDoc',
                to: 'https://javadoc.io/doc/com.graphql-java/graphql-java/',
              },
              {
                label: 'Security',
                to: '/security'
              }
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'GitHub Discussions',
                href: 'https://github.com/graphql-java/graphql-java/discussions',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'Blog',
                to: '/blog',
              },
              {
                label: 'GitHub',
                href: 'https://github.com/graphql-java/graphql-java',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Andreas Marek.`,
      },
      prism: {
        theme: themes.github,
        darkTheme: themes.dracula,
        additionalLanguages: ['java', 'groovy', 'kotlin'],
      }
    }),
};

module.exports = config;
