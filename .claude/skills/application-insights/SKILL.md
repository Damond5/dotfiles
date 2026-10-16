---
name: application-insights
description: Create the "Insights" Google Slides deck for a finished Nordbo customer installation (Mimic / CraftMate / PolishMate projects with a [Dxxxx] project ID), then publish it - PDF export, Application Insights item on monday.com (board 5928675569), project board updates and an announcement email draft. Use when the user asks to make, draft, write or finish insights for a project, mentions the Application Insights board or the Insights template, or wants learnings from an installation written up - even if they only say "do the insights for <customer>".
---

# Application insights

An insights deck records what a customer installation looked like, what went wrong and what Nordbo learned, so the next project starts from experience instead of from zero. Colleagues read it before similar projects, so **accuracy beats completeness**: a slide that confidently states something that did not happen on site is worse than a missing slide.

That is why this skill is built around an interview. Planning documents, quotes, scope drafts and monday updates describe what was *intended*. Only the person who was on site knows what *actually happened* - and in practice many of the "facts" in the planning material turn out to be wrong (wrong ATEX zones, hardware that already existed, problems solved differently than planned). Never write planning material into the deck as fact without the interview confirming it.

Read the `google-workspace` skill's `references/slides.md` before the first Slides edit; it covers revision guards, EMU geometry and verification.

## Workflow

### 1. Resolve the project

Get the project ID (`[Dxxxx]`) and customer name. The **Project Tracking** board (5415621761) maps the ID (`text2`) to the project Drive folder (`link__1`), sales rep, PAE and status. The project plan board is named `[Dxxxx] Customer` in the Projects workspace (2732943).

### 2. Gather sources before asking anything

Read everything first so the interview asks only what the sources cannot answer. See `references/sources.md` for where each thing lives:

- The **newest insights of the same application** on the Application Insights board, plus the **Insights template** - they set structure, tone and level of detail
- The project board: items, subitems and **all updates** (subitem updates live on the separate "Subitems of [Dxxxx]" board)
- The project Drive folder: scope doc, quote PDF, mounting schematics, photos and videos from site
- Pipedrive deals for the organization (the won deal, plus open follow-up deals), Project Tracking items for follow-up projects, Gmail threads with the customer
- The project GitLab repo (robot program, Mimic config, OptiTrack files) for versions and settings
- Any earlier draft or "backup" insights deck for this project
- The customer's own website ("Über uns" / "About us", production pages) for the company slide

Monday updates that start with "Unconfirmed general suggestions. Compiled by Claude" are pre-visit plans. Treat them like the scope doc: intent, not fact.

### 3. Draft privately, then interview

Draft the whole deck content in scratch first; that is what exposes the gaps. Then run the interview in `references/interview.md` - it is the most important step of this skill. Lead with what you believe and ask the user to correct it ("I have it as touch-up of difficult areas - correct?"), since a confirm-or-correct question gets a fast, precise answer.

Ask especially about every statement that came only from planning material, everything that failed or was improvised on site, and who did which part of the work.

### 4. Build the deck

1. Copy the template into the project Drive folder as `Insights - [Dxxxx] Customer` (Drive `copy_file`).
2. Read the copy and fill it in place - see `references/template-map.md` for every slide's purpose, object layout and the text-insertion recipe that keeps the template's bullet style.
3. Front page: project ID and name on top, then application and Nordbo technology.
4. Delete slides there is no material for (Operator, Process today, Step #, Reflections are often empty); add slides the project needs (duplicate a Setup slide for e.g. "Process components" or "Electrical and controllers").
5. Media - see `references/media.md`. The Slides connector cannot insert private images or embed videos; the recipe there works around both.

Writing rules that came from user corrections:

- **Key learnings are rules for the next project**, not a log of this one. Name the action ("Ask for photos or documents behind every site fact"), not a coined label ("ATEX sensor checklist").
- Describe the application exactly as the user confirmed it - e.g. whole-part coating vs touch-up changes how the case reads.
- Credit who did what (customer, integrator, distributor, Nordbo). It is a recurring theme in learnings.
- When something was solved on site, say how, so the next team can repeat it.
- No placeholders left in the finished deck except deliberate `[...]` gaps the user knows about.

### 5. Verify every changed slide

Body boxes are 11 pt and do not shrink text: more than about seven two-line bullets overflow the slide. Split into two columns (recipe in `template-map.md`) rather than cutting content. Check renders after every batch - export PDF + `render_export.py` from the google-workspace skill, or `read_slide_page_thumbnail` + `curl` the `contentUrl` for single slides.

### 6. Finish and publish

Follow `references/finish.md`:

- Export `Insights - [Dxxxx] Customer rev.N.pdf` into the project Drive folder
- Create / complete the Application Insights item (all columns + PDF in the File column)
- Update the project board ("📝 Document best practices for future projects (insights)" → Completed with links), the Project Tracking item and any other item the session showed to be out of date
- Draft (never send) the announcement email to all@nordbo-robotics.com
- Tell the user to name the version `rev.N` in Slides (File → Version history → Name current version) - there is no API for it
- Clean up temp uploads and local downloads - ask before deleting anything on the user's Drive

## Reference files

- `references/interview.md` - the question sweep and how to run it
- `references/sources.md` - board IDs, column IDs and where each source lives
- `references/template-map.md` - template slides, object layout, text and column recipes
- `references/media.md` - choosing, cropping and inserting photos and videos (rclone + Slides API)
- `references/finish.md` - PDF, monday item, project updates, email draft, cleanup
- `scripts/publish-images.sh`, `scripts/unshare-folder.sh`, `scripts/slides-batch.sh` - media helpers used by `media.md`
