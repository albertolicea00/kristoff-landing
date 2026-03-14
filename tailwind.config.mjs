/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			colors: {
				primary: '#FF3B3B', // rojo vibrante
				secondary: '#111111', // negro
				accent: '#FFD600', // amarillo
				background: '#FFFFFF', // blanco
			},
			fontFamily: {
				heading: ['Anton', 'Bebas Neue', 'sans-serif'],
				body: ['Poppins', 'Inter', 'sans-serif'],
			},
		},
	},
	plugins: [],
}
