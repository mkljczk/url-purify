import { defineConfig } from 'vite';

export default defineConfig({
	build: {
		copyPublicDir: false,
		lib: {
			entry: 'lib/main.ts',
			fileName: (format) => `main.${format}.js`,
			formats: ['es'],
			name: '@brandonkal/url-purify',
		},
		target: 'esnext',
		sourcemap: true,
		minify: false,
	},
});
