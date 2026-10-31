/** @type {import("prettier").Config & import("prettier-plugin-tailwindcss").PluginOptions} */
const config = {
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  printWidth: 100,
  plugins: ["prettier-plugin-tailwindcss"],
  // Tailwind v4 class sorting needs a stylesheet that imports Tailwind AND our
  // theme. The admin stylesheet is exactly that (`tailwindcss` + @truckbuck/ui
  // tokens); marketing's only adds a font variable, so one entry serves all.
  tailwindStylesheet: "./apps/admin/src/styles.css",
  tailwindFunctions: ["cn", "cva"],
};

export default config;
