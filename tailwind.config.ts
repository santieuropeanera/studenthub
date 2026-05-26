import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        era: {
          navy: "#243075",
          blue: "#32409c",
          sky: "#eef1ff",
          teal: "#32409c",
          green: "#75bd43",
          orange: "#f4cf02",
          ink: "#172033",
          paper: "#f8fafc"
        }
      },
      boxShadow: {
        soft: "0 14px 40px rgba(50, 64, 156, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
