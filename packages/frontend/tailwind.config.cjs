/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#FAFAF9",
        surface: "#FFFFFF",
        "surface-muted": "#F3F2EF",
        primary: "#FF6B35",
        "primary-hover": "#E85A2A",
        "primary-subtle": "#FFE8DC",
        "text-primary": "#1F1B16",
        "text-muted": "#6B6560",
        border: "#E7E4DE",
        success: "#2E7D4F",
        warning: "#C98A1E",
        danger: "#C4432B",
        info: "#3B82F6",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "8px",
        xl: "12px",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgba(0, 0, 0, 0.04)",
        md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      },
    },
  },
  plugins: [],
};
