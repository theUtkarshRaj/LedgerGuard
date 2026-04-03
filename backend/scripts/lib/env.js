/**
 * Load .env and validate required vars for scripts that boot the app without server.js.
 */
require("dotenv").config();
const validateEnv = require("../../src/config/validateEnv");
validateEnv();
