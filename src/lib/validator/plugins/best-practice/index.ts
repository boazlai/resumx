/**
 * Best Practice Plugins
 *
 * Provides non-blocking suggestions to improve resume quality and readability.
 * These checks emit lower-severity issues (info/hint/warning/error) that highlight
 * areas that could be improved.
 *
 * ## Plugins
 *
 * | Plugin              | Code                  | Severity       | Description                         |
 * |---------------------|-----------------------|----------------|-------------------------------------|
 * | longBullet          | long-bullet           | warning/error  | Bullet point exceeds character limit|
 * | singleBulletSection | single-bullet-section | hint           | H2 section contains only one bullet |
 *
 * ## Rationale
 *
 * - **long-bullet**: Recruiters spend ~6 seconds scanning a resume. Bullets over
 *   the threshold are harder to scan quickly and may indicate content that
 *   should be split or condensed.
 *
 * - **single-bullet-section**: A section with only one bullet might indicate
 *   incomplete content or could be merged with another section.
 *
 * @module validator/plugins/best-practice
 */

export {
	createLongBulletPlugin,
	longBulletPlugin,
	type LongBulletOptions,
} from './long-bullet.js'
export { singleBulletSectionPlugin } from './single-bullet-section.js'
