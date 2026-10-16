# Sources and IDs

## monday.com

**Application Insights** board `5928675569` (workspace Nordbo). Groups: `group_title` = Insights, `new_group25838` = Code, `new_group` = Template. Items are named `[Dxxxx] Customer`.

| Column | id | Type / values |
|---|---|---|
| Responsible | `person` | people (user 11972798 = Nicky Vølund) |
| File | `file` | file - the rev.N PDF |
| Robot | `label` | status: UR, Fanuc, Kuka, Nachi |
| Application | `label_1` | status: Coating, Grinding, Sanding, Polishing, Deburring, Blasting, Dispensing |
| Platform | `label9` | status: Mimic, CraftMate, PolishMate |
| Component(s) | `dropdown` | NAC, NRS, NFS, IR Tracker, FT Tracker, OptiTrack, NPC |
| Source material | `link` | the Slides deck |
| Code | `link0` | GitLab installation repo |
| Deal | `link1` | Pipedrive deal URL |
| Confidential | `checkbox` | |

The **Template** group item links the Insights template deck: `1fNA9qlz76HZcU7q8Inyfwz8SKdGvvYBFCwL6x7KAkIA`.

**Project Tracking** board `5415621761` (workspace Projects 2732943): `text2` project ID, `link__1` project Drive folder, `status6` status (Preparing, Evaluating, Machine Designing, In purchasing, Assembling&Debugging, AI Training, Hold, Stuck, Done - no "installing" label; groups carry Incoming / In Progress / Stuck / Closed / Lost), `description` long text, `people99` sales rep, `people9` PE DK, `multiple_person_mm6t3czc` PM. Follow-up projects for the same customer appear here as new items.

**Project plan board** `[Dxxxx] Customer` in workspace 2732943: template groups "1 Kickoff & Planning" to "5. Post-Project Review". Status column `project_status` (Not Started, In Progress, Completed, Blocked, Cancelled), Description text `text_mknas96m`, Files `files_mkn9qvvy`. Subitem updates live on the separate "Subitems of [Dxxxx] Customer" board - fetch board updates with `includeItemUpdates: true` for both boards. The board description is owned by the board creator and usually cannot be edited.

**Tasks** board `6773893984`: installation and assessment tasks for the project.

## Drive

- Project folders sit on the "Nordbo" shared drive (id `0AM3FOeFA60q6Uk9PVA`).
- Typical project folder content: `00 Pictures and videos from the factory`, `01 Cabine/... sketches`, `02 ... stepfiles`, `03 PdM Work` (mounting schematics, simulations), `04 Scope and flow documentation` (scope doc, quote PDF), `images/` and `videos/` from the installation.
- Read Docs/Slides/PDF text with Drive `read_file_content`. The Drive connector cannot download files above ~4 MB - use rclone (`media.md`).

## Other

- **Pipedrive**: `searchDeals` with `organization_id` lists the won deal and open follow-ups; `getNotes(org_id=...)` for context. Deal URL: `https://nordborobotics.pipedrive.com/deal/<id>`.
- **Gmail**: `search_threads` with the customer domain and contact names - on-site agreements, open points, distributor contacts.
- **GitLab**: `gitlab.com/nordbo-robotics-pae/<customer>-installation` - robot program (`*.urp`), Mimic config (`mimic/nordbo/nap/*.config`, Mimic version), OptiTrack files.
- **Customer website**: company profile and photos; images are often `.webp` and must be converted to JPEG before insertion.
