/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          // Paleta principal Plataforma LATAM
          primary: "#071A3A", // Azul principal
          secondary: "#0A2A5E", // Azul secundario
          medium: "#1E6FD9", // Azul medio
          light: "#3FA9F5", // Azul claro

          // Escala utilitaria basada en el manual
          50: "#EFF7FF",
          100: "#D9ECFF",
          200: "#A9D6FF",
          300: "#6DBEFF",
          400: "#3FA9F5",
          500: "#1E8FEA",
          600: "#1E6FD9",
          700: "#0A4FA8",
          800: "#0A2A5E",
          900: "#071A3A",
          950: "#050F24",
        },

        latam: {
          yellow: "#FFC400", // Amarillo principal
          yellowSoft: "#FFD040", // Amarillo suave
          blue: "#1E6FD9",
          cyan: "#3FA9F5",
        },

        neutral: {
          white: "#FFFFFF",
          light: "#C7D2E3",
          dark: "#050F24",

          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#C7D2E3",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
          950: "#050F24",
        },

        success: {
          50: "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
          800: "#065F46",
          900: "#064E3B",
        },

        warning: {
          50: "#FFF8E1",
          100: "#FFEFB3",
          200: "#FFE680",
          300: "#FFD94D",
          400: "#FFD040",
          500: "#FFC400",
          600: "#E0A800",
          700: "#B88400",
          800: "#8F6500",
          900: "#664600",
        },

        error: {
          50: "#FEF2F2",
          100: "#FEE2E2",
          200: "#FECACA",
          300: "#FCA5A5",
          400: "#F87171",
          500: "#EF4444",
          600: "#DC2626",
          700: "#B91C1C",
          800: "#991B1B",
          900: "#7F1D1D",
        },
      },

      fontFamily: {
        montserrat: ["Montserrat", "system-ui", "sans-serif"],
        sans: ["Montserrat", "system-ui", "sans-serif"],
      },

      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #071A3A 0%, #0A2A5E 45%, #1E6FD9 100%)",
        "brand-radial":
          "radial-gradient(circle at top right, rgba(63, 169, 245, 0.35), transparent 35%), linear-gradient(135deg, #071A3A 0%, #050F24 100%)",
        "latam-glow":
          "radial-gradient(circle, rgba(63, 169, 245, 0.45) 0%, rgba(30, 111, 217, 0.12) 45%, transparent 70%)",
      },

      boxShadow: {
        brand: "0 18px 45px rgba(5, 15, 36, 0.35)",
        glow: "0 0 28px rgba(63, 169, 245, 0.35)",
        yellow: "0 0 24px rgba(255, 196, 0, 0.35)",
      },

      borderColor: {
        brand: "rgba(63, 169, 245, 0.35)",
      },
    },
  },
  plugins: [],
};
