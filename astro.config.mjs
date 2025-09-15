import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import tailwind from '@astrojs/tailwind';
import path from 'path';

// https://astro.build/config
export default defineConfig({
  site: 'https://prompt-craft.vercel.app',
  output: 'server',
  adapter: vercel({
    webAnalytics: {
      enabled: true
    }
  }),
  integrations: [tailwind()],
  srcDir: './packages/apps/web',
  publicDir: './packages/apps/web/public',
  build: {
    outDir: './dist-web'
  },
  server: {
    port: 3000,
    host: true
  },
  vite: {
    resolve: {
      alias: {
        '@core': path.resolve('./packages/core'),
        '@infrastructure': path.resolve('./packages/infrastructure'),
        '@apps': path.resolve('./packages/apps')
      },
      extensions: ['.ts', '.js', '.mjs', '.json']
    },
    optimizeDeps: {
      include: [
        '@core/infrastructure/Container',
        '@core/application/usecases/PromptUseCases',
        '@infrastructure/filesystem/FileSystemPromptRepository',
        '@core/domain/entities/Prompt'
      ]
    },
    ssr: {
      noExternal: [
        '@core',
        '@infrastructure',
        '@apps'
      ],
      external: []
    },
    esbuild: {
      target: 'es2020'
    }
  }
});
