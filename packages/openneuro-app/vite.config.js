import path from 'path'
import { defineConfig } from 'vite'
import nodePolyfills from 'rollup-plugin-polyfill-node'

export default defineConfig({
  root: 'src',
  server: {
    port: 9876,
  },
  build: {
    sourcemap: true,
  },
  optimizeDeps: {
    include: [
      '@apollo/client/react/components',
      '@apollo/client/link/schema',
      '@apollo/client/link/context',
      '@apollo/client/link/ws',
      '@apollo/client/utilities',
    ],
    exclude: ['buffer', 'stream-browserify'],
  },
  resolve: {
    alias: [
      // Workaround for `'request' is not exported by __vite-browser-external`
      {
        find: './runtimeConfig',
        replacement: './runtimeConfig.browser',
      },
      // Workaround for bids-validator -> hed-validator -> xml2js -> sax -> Stream shim
      { find: 'stream', replacement: 'stream-browserify' },
      // sax -> Buffer shim
      { find: 'buffer', replacement: 'buffer/' },
      // Workaround UMD -> ESM issues in pluralize
      {
        find: 'pluralize',
        replacement: path.resolve(__dirname, './pluralize-esm.js'),
      },
    ],
  },
  plugins: [nodePolyfills()],
})
