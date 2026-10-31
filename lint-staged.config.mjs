/**
 * ESLint runs from the repo root but resolves the nearest eslint.config.* per
 * file (`v10_config_lookup_from_file`), so each workspace's own config applies.
 * @type {import("lint-staged").Configuration}
 */
const config = {
  "*.{ts,tsx,js,mjs,cjs}": [
    "eslint --flag v10_config_lookup_from_file --fix --max-warnings=0 --no-warn-ignored",
    "prettier --write",
  ],
  "*.{json,md,css,yml,yaml,html}": "prettier --write",
};

export default config;
