import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer } from "./server";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // fs: {
    //   allow: ["./client", "./shared"],
    //   deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    // },
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  // Add history API fallback for client-side routing
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      // Skip API routes
      if (req.url?.startsWith('/api/')) {
        return next();
      }
      
      // For non-API routes, serve index.html
      if (req.url && !req.url.includes('.')) {
        req.url = '/';
      }
      next();
    });
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    configureServer(server) {
      const app = createServer();

      // Add Express app as middleware to Vite dev server
      server.middlewares.use(app);
    },
  };
}
