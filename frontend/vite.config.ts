import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import fs from 'fs'
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    https: {
      key: fs.readFileSync(path.resolve(__dirname, '../localhost+1-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '../localhost+1.pem')),
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
