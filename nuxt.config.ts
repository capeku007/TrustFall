export default defineNuxtConfig({
  head: {
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    ],
  },

  devtools: { enabled: true },

  modules: [
    "@nuxtjs/tailwindcss",
    "nuxt-icon",
    "@formkit/auto-animate",
    "@pinia/nuxt",
    '@vite-pwa/nuxt',
  ],

  pinia: {
    storesDirs: ['./stores/**'],
  },

  aliases: {
    nuxt: "logos:nuxt-icon",
  },

  plugins: [
    "~/plugins/vue3-toastify.js",
    // Add navigation plugin
    "~/plugins/navigation.js"
  ],

  devServer: {
    port: 3002,
  },

  router: {
    options: {
      strict: true
    }
  },

  // routes: {
  //   '/game/:id/summary': {
  //     name: 'game-id-summary',
  //     component: '~/pages/game/[id]/summary.vue'
  //   }
  // },
  routeRules: {
    '/game/**': { 
      ssr: false,
      security: {
        skipInvalidTokens: true
      }
    },
    '/gamemenu': {
      ssr: false
    }
  },

  ssr: false,

  build: {
    transpile: ['vuetify'],
  },

  vite: {
    define: {
      'process.env.DEBUG': false,
    },
    // Add optimizations for game routes
    optimizeDeps: {
      include: ['firebase/app', 'firebase/auth', 'firebase/database']
    },
    server: {
      hmr: {
        protocol: 'ws'
      }
    }
  },

  experimental: {
    payloadExtraction: false,
    asyncContext: true
  },

  app: {
    pageTransition: {
      name: 'page',
      mode: 'out-in'
    }
  },

  pwa: {
    client: {
      installPrompt: true,
    },
    registerType: 'autoUpdate',
    manifest: {
      name: 'TrustFall',
      short_name: 'TrustFall',
      description: "Trust is the ultimate game",
      theme_color: '#fff',
      icons: [
        {
          src: 'pwa-64x64.png',
          sizes: '64x64',
          type: 'image/png'
        },
        {
          src: 'pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: 'maskable-icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ],
    },
    workbox: {
      navigateFallback: '/',
      navigateFallbackAllowlist: [/^\/(?!api)/],
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
      cleanupOutdatedCaches: true,
      runtimeCaching: [
        {
          urlPattern: "/",
          handler: 'NetworkFirst',
        },
        {
          urlPattern: /^https:\/\/api\.mapbox\.com\/.*/i,
          handler: "CacheFirst",
          options: {
            cacheName: "mapbox-cache",
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
      ],
    },
    devOptions: {
      enabled: true,
      type: 'module',
    },
  },

  compatibilityDate: '2024-10-30',
})