/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0F172A",
        cardBg: "#1E293B",
        primary: {
          DEFAULT: "#F97316",
          hover: "#EA580C",
          light: "#FDBA74",
        },
        darkGray: "#334155",
        textWhite: "#F8FAFC",
        textGray: "#94A3B8"
      },
      borderRadius: {
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.3)',
        'premium': '0 10px 30px -5px rgba(249, 115, 22, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
      }
    },
  },
  plugins: [],
}
