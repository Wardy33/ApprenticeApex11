import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import viteCompression from "vite-plugin-compression";
import viteSvgo from "vite-plugin-svgo";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5204,
    proxy: {
      "/api": {
        target: "http://localhost:3002",
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on("error", (err, req, res) => {
            console.log("🔴 Proxy error:", err.message);
            if (!res.headersSent) {
              res.writeHead(503, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  success: false,
                  error: "Backend server not available",
                }),
              );
            }
          });
        },
      },
    },
  },
  build: {
    outDir: "dist/spa",
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React - Keep critical path minimal
          react: ["react", "react-dom"],
          router: ["react-router-dom"],

          // Split Radix UI into smaller chunks
          "radix-core": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
          ],
          "radix-forms": ["@radix-ui/react-select", "@radix-ui/react-tabs"],
          "radix-layout": [
            "@radix-ui/react-accordion",
            "@radix-ui/react-popover",
            "@radix-ui/react-alert-dialog",
          ],

          // Icons - Heavy dependency, keep separate
          "lucide-icons": ["lucide-react"],

          // Utilities - Group lightweight utilities
          utils: ["clsx", "tailwind-merge", "class-variance-authority"],

          // Forms - Only load when needed
          forms: ["@hookform/resolvers", "react-hook-form"],

          // Heavy libraries - Lazy load these
          charts: ["recharts"],
          animations: ["framer-motion"],
          three: ["three", "@react-three/fiber", "@react-three/drei"],

          // Date utilities
          dates: ["date-fns"],

          // UI components
          "ui-components": [
            "sonner",
            "vaul",
            "cmdk",
            "next-themes",
            "input-otp",
          ],
          carousel: ["embla-carousel-react"],
          panels: ["react-resizable-panels"],

          // Query library
          query: ["@tanstack/react-query"],
        },

        // Optimize chunk naming for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId
                .split("/")
                .pop()
                ?.replace(".tsx", "")
                .replace(".ts", "")
            : "chunk";
          return `${facadeModuleId}-[hash].js`;
        },

        // Optimize asset naming
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split(".") || [];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext ?? "")) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext ?? "")) {
            return `assets/css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
    chunkSizeWarningLimit: 300,
    target: "esnext",
    minify: "esbuild",
    sourcemap: false,
    reportCompressedSize: false,
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "lucide-react",
      "clsx",
      "tailwind-merge",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
    ],
    exclude: ["recharts", "@react-three/fiber", "framer-motion"],
  },
  plugins: [
    react({ tsDecorators: true }),
    viteSvgo(),
    viteCompression({ algorithm: "brotliCompress", ext: ".br" }),
    viteCompression({ algorithm: "gzip", ext: ".gz" }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(
      mode === "production" ? "production" : "development",
    ),
  },
}));
