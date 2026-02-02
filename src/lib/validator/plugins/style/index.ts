/**
 * Style Plugins
 *
 * Validates style-related references in the resume, particularly icon usage.
 * Ensures that icon references (using the `::icon::` syntax) point to valid
 * icons in the supported icon libraries.
 *
 * ## Plugins
 *
 * | Plugin      | Code         | Severity | Description                                  |
 * |-------------|--------------|----------|----------------------------------------------|
 * | unknownIcon | unknown-icon | warning  | Icon reference not found in any icon library |
 *
 * @module validator/plugins/style
 */

export { unknownIconPlugin } from './unknown-icon.js'
