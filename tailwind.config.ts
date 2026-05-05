import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        pitch: "#0f3d2e",
        mint: "#d7f7e7",
        paper: "#f7f3ea",
        ink: "#1d2433"
      }
    }
  },
  plugins: []
};

export default config;
