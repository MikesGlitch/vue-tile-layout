import { defineUserConfig } from 'vuepress'
import type { DefaultThemeOptions } from 'vuepress'

export default defineUserConfig<DefaultThemeOptions>({
  base: '/vue-tile-layout/',
  bundler: '@vuepress/bundler-vite',
  bundlerConfig: {
    viteOptions: {
      server: {
        fs: {
          strict: false,
        },
      },
    },
  },
  lang: 'en-US',
  title: 'Vue Tile Layout',
  description: 'A tile layout system for Vue that enables users to drag, drop and resize tiles with ease.',

  themeConfig: {
    logo: 'https://vuejs.org/images/logo.png',
    navbar: [
      {
        text: 'Guide',
        link: '/guide/',
      },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          children: ['/guide/README.md', '/guide/getting-started.md'],
        },
        {
          text: 'Examples',
          children: [
            '/guide/examples/example1.md',
            '/guide/examples/sliding-puzzle.md',
          ],
        },
      ],
    },
  },
})
