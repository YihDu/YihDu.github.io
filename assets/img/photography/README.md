# Photography Albums

Add one folder per album, then describe it in `albums.json`.

For conference collections, use:

```json
"07-conferences": {
  "title": "Conference",
  "date": "2025-2026",
  "order": 202699,
  "group": "Collection",
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

For a date range such as `2025-2026`, the album appears under both years. Use
`"years": [2024, 2026]` when a collection spans nonconsecutive years.
Add photo descriptions with `"captions": { "DSC01234.JPG": "A short caption" }`.
Captions are shown below photographs and in the photograph viewer.

Unlisted subfolders are discovered as chapters. Chapter metadata can be added to
the album's `chapters` array using `folder`, `title`, `date`, `note`, and `captions`.
After renaming or removing an album, old generated pages redirect to the archive.

Checks: `npm test`, then `bundle exec jekyll build` and `npm run check:site`.
