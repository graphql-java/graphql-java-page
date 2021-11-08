// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'GraphQL Java',
  tagline: 'The Java implementation of GraphQL',
  url: 'https://hopeful-chandrasekhar-3ca166.netlify.app',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'graphql-java', // Usually your GitHub org/user name.
  projectName: 'graphql-java-page', // Usually your repo name.
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
          lastVersion: "current",
          versions: {
            current: {
              label: "17"
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
            docId: 'getting-started-tutorial',
            position: 'left',
            label: 'Tutorial',
          },
          {
            type: 'doc',
            docId: 'getting-started',
            position: 'left',
            label: 'Documentation',
          },
          {to: '/blog', label: 'Blog', position: 'left'},
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
                to: '/documentation/getting-started-tutorial',
              },
              {
                label: 'JavaDoc',
                to: 'https://javadoc.io/doc/com.graphql-java/graphql-java/',
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
              {
                label: 'Twitter',
                href: 'https://twitter.com/graphql_java',
              },
              {
                label: 'Stack Overflow',
                href: 'https://stackoverflow.com/questions/tagged/graphql-java',
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
        copyright: `Copyright © ${new Date().getFullYear()} Andreas Marek. Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
        additionalLanguages: ['java', 'groovy'],
      },
    }),
};

module.exports = config;
