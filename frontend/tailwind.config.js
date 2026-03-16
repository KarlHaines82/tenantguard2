/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        "primary-hover": "var(--color-primaryHover)",
        "primary-light": "var(--color-primaryLight)",
        background: "var(--color-background)",
        "background-secondary": "var(--color-backgroundSecondary)",
        text: "var(--color-text)",
        "text-secondary": "var(--color-textSecondary)",
      },
    },
  },
  plugins: [],
};
