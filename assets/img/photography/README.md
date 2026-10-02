# Photography Albums

Add one folder per album, then describe it in `albums.json`.

The archive has two independent dimensions: **time × category**. Each album has
one category and a date (or year range). Selecting a category keeps the selected
year, and selecting a year keeps the selected category.

| `group` | Display label | Organizing unit |
| --- | --- | --- |
| `Travel` | 旅行 | One trip, such as Japan in February 2025 |
| `Event` | 事件 | One event, such as graduation or a conference |
| `Daily` | 日常记录 | Everyday photographs, preferably collected by month or season |

Use `date` for when the photographs were taken, not the upload date. For example,
`"date": "2026.10"` and `"group": "Daily"` create an October 2026 daily album.
Use `order` when you need to control the position within a year. Category labels
live in `_data/photo_groups.yml`; category assignments belong in `albums.json`.
Missing groups default to `Daily`; legacy `Collection` values become `Event`.
Unknown category values stop the scanner with an error to catch misspellings.

The current archive has six travel albums and two event albums (graduation and
the existing conference collection). Daily records can be added as new albums;
no existing travel or event photographs need to be moved into that category.
Locations remain album metadata rather than a separate archive filter.

For conference collections, use:

```json
"07-conferences": {
  "title": "Conference",
  "date": "2025-2026",
  "order": 202699,
  "group": "Event",
  "location": "Guangzhou · Hong Kong · Shenzhen",
  "description": "Academic trips, meetings, and conference moments.",
  "note": "",
  "cover": "A.jpg"
}
```

Run `npm run photos` after editing albums or adding images.

The scanner uses macOS `sips`. It generates thumbnails, larger display images,
image dimensions, year filters, and album pages; original photographs are preserved.
The committed generated files let Jekyll build on other platforms without running the scanner.

For a date range such as `2025-2026`, the album matches either year filter.
It is displayed once in the cross-year section. Filters select whole albums,
not individual photographs within a multi-year album. Use
`"years": [2024, 2026]` when a collection spans nonconsecutive years.
Add photo descriptions with `"captions": { "DSC01234.JPG": "A short caption" }`.
Captions are shown below photographs and in the photograph viewer.

Unlisted subfolders are discovered as chapters. Chapter metadata can be added to
the album's `chapters` array using `folder`, `title`, `date`, `note`, and `captions`.
After renaming or removing an album, old generated pages redirect to the archive.

Checks: `npm test`, then `bundle exec jekyll build` and `npm run check:site`.
