# Template map

The template (`1fNA9qlz76HZcU7q8Inyfwz8SKdGvvYBFCwL6x7KAkIA`) is a 10 x 5.625 in deck. A Drive copy keeps the object IDs below, but always read the copy (masked read from the google-workspace skill + `slides_helper.py outline`) before editing - the template may change.

## Slides

| # | Label / title | Slide id | Key objects | Notes |
|---|---|---|---|---|
| 0 | CASE, title | `g14a98d66a9c_0_459` | `g2b25cc04ff8_3_1` big text ("[Application]" bold 32 pt / "[Nordbo technology]"), `g14a98d66a9c_0_461` "Name. Position", `g14a98d66a9c_0_899` image box | Insert `[Dxxxx] Customer\n` at index 0 and style it bold 20 pt so it fits left of the image |
| 1 | COMPANY | `g1efa6e459e8_0_0` | `_1` title, `_7` description, `_3` image box | Description: 4-5 short lines max |
| 2 | CASE, Application | `g1efa6e459e8_0_8` | `_9` title, `_12` description, `_10` image | |
| 3 | CASE, Current process | `g1ef587df2a5_0_1296` | `_1299` description, `_1300` image/video box | |
| 4 | CASE, Goal | `g1efa6e459e8_0_15` | `_19` description, `_17` "Optional sketch here" | |
| 5 | INSTALLATION, Setup overview | `g2b1f4839378_0_14` | `_16` 8x2 table (fill column 1, Roboto 9 pt, not bold, color rgb(0, .125, .376)), `_17` image | Rows: Application, Robot, Software and version, Tracking technology, Method, Tools, Joystick, Contact person |
| 6-14 | INSTALLATION, Setup (one topic each) | Robot cell `g2b1f4839378_0_27`, Workspace `g1efa6e459e8_0_22`, Part(s) `g33a7f2e6fd0_0_0`, Tool(s) `g2b1f4839378_0_34`, Joystick(s) `g33a7f2e6fd0_0_8`, Lighthouse/Cameras `g363a1b42b8a_0_0`, Robot program(s) `g1ef587df2a5_0_911`, Easy problems `g1ef587df2a5_0_917`, Difficult problems `g33a7f2e6fd0_0_16` | one body box each, no image | Rename "Lighthouse/Cameras" to what was used (e.g. "Cameras") |
| 15 | Challenges | `g1ef587df2a5_0_937` | body `g363a1b42b8a_0_8` | project/organisational problems |
| 16 | Key learnings | `g2facfff7261_0_0` | body `g363a1b42b8a_0_9` | rules for next time |
| 17 | OPERATOR, Operator 1 | `g14a98d66a9c_0_496` | | delete if no operator info |
| 18-19 | ANALYSIS, Process today / Step # | `g14a98d66a9c_0_534`, `_541` | | delete if no process info |
| 20 | ANALYSIS, Result | `g14a98d66a9c_0_910` | `_913` text, `_914` image | duplicate per teach/play pair |
| 21-23 | Comments on current process, Reflections, To consider | `g14a98d66a9c_0_643`, `_674`, `_701` | | "To consider" (deadlines, production stops, customer resources, space, business opportunities) is usually worth keeping |
| 24 | ADDITIONAL SALES, Potential project(s) | `g14a98d66a9c_0_929` | images `_942`-`_946` (1.66 x 2.53 in, y 1.95), comments `_947`-`_951` (10 pt) | follow-up projects from Pipedrive / Project Tracking |
| 25 | Thank you | `g14a98d66a9c_0_720` | | |

Recent coating insights (Hilden, Heritage, Louis Poulsen, Metal Technology) drop the empty slides and add Setup slides such as "Electrical cabinet(s)", "Process components", "Electrical and controllers".

## Text recipes

**Setup body boxes** hold: heading paragraph (`Robot cell(s)\n`, bold accent), an empty paragraph, then one empty **bullet** paragraph at index `len(heading)+1`, then empty lines. Insert all bullets as one `insertText` at that index, separated by `\n` - new paragraphs inherit the template bullet and 11 pt style.

**Challenges / Key learnings / Operator bodies** start with the empty bullet paragraph at index 0 - insert there.

**Description boxes** (`Description here.`): `deleteText` ALL, then `insertText` at 0. Use `\n\n` between items; they are not bulleted.

**Rewriting a whole bullet body**: `deleteText` ALL, `insertText`, then `createParagraphBullets` with `BULLET_DISC_CIRCLE_SQUARE` - matches the template glyph.

**Small edits**: `replaceAllText` scoped with `pageObjectIds` needs no indexes; the replacement may contain `\n` to add bullets after an existing one.

**New slide from an existing one**: `duplicateObject` with an `objectIds` map naming the slide and its elements, then `replaceAllText` the title/label on that page. Duplicates land right after the original; move with `updateSlidesPosition` (insertionIndex counts slides before the move).

## Fitting and two columns

Body boxes are 4.35 x 3.72 in at x 0.65, y 1.65 (`translateX 595700, translateY 1511500`, scale 1.3254 x 1.1345 on a 3000000 base). At 11 pt they hold about seven two-line bullets; Slides never shrinks text.

To split into two columns:

1. `duplicateObject` the body box with a new id.
2. `updatePageElementTransform` ABSOLUTE on the copy: same scales, `translateX 4754880` (5.2 in). For boxes with a heading line, also move it down by the heading height (`translateY` ~1886400) so the bullets line up.
3. `deleteText` the second half from the original and the first half (including the heading) from the copy - read the indexes first.

Image boxes on Setup slides, when adding one: portrait x 6.12, y 1.28, w 3.24, h 3.75 in (`5596128, 1170432, 2962656 x 3429000` EMU); landscape x 5.2, y 1.5, w 4.4 in (height from the image aspect).
