import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import robloxTs from "eslint-plugin-roblox-ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const typescriptFiles = ["src/**/*.ts", "src/**/*.tsx", "src/**/*.mts", "src/**/*.cts"];
const typescriptConfigs = typescriptEslint.configs["flat/recommended"].map((config) => ({
	...config,
	files: typescriptFiles,
}));
const robloxRecommended = robloxTs.configs.recommended;

export default [
	{
		ignores: ["**/node_modules/**", "**/out/**", "eslint.config.mjs"],
	},
	js.configs.recommended,
	...typescriptConfigs,
	{
		...robloxRecommended,
		files: typescriptFiles,
		languageOptions: {
			...robloxRecommended.languageOptions,
			parserOptions: {
				...robloxRecommended.languageOptions.parserOptions,
				projectService: true,
				tsconfigRootDir: __dirname,
			},
		},
	},
	prettierRecommended,
	{
		files: typescriptFiles,
		languageOptions: {
			parser: tsParser,
			ecmaVersion: 2018,
			sourceType: "module",
			parserOptions: {
				jsx: true,
				useJSXTextNode: true,
				projectService: true,
				tsconfigRootDir: __dirname,
			},
		},
		rules: {
			"prettier/prettier": "warn",
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-empty-object-type": "off",
			"roblox-ts/no-any": "off",
		},
	},
];
