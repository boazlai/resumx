/**
 * Content Plugins
 *
 * Validates the quality and completeness of resume content.
 * Catches common authoring mistakes like empty or incomplete list items
 * that would render poorly or indicate unfinished work.
 *
 * ## Plugins
 *
 * | Plugin      | Code         | Severity | Description                   |
 * |-------------|--------------|----------|-------------------------------|
 * | emptyBullet | empty-bullet | error    | List item has no text content |
 *
 * @module validator/plugins/content
 */

export { emptyBulletPlugin } from './empty-bullet.js'
