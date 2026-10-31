# Catalog Schema and Semantics

Use the catalog's declared schema as evidence. Preserve unknown fields and retain the original record when normalizing.

## Stable normalized shape

```json
{
  "identifier": null,
  "title": "",
  "description": "",
  "publisher": null,
  "keywords": [],
  "themes": [],
  "modified": null,
  "issued": null,
  "spatial": null,
  "temporal": null,
  "landing_page": null,
  "distributions": [],
  "raw": {}
}
```

Optional values are `null` when absent. Do not convert missing metadata into claims.

## Distribution classification

| Catalog field | Safe interpretation |
|---|---|
| `landingPage` | Descriptive dataset page |
| `accessURL` | Access route, service, API, or page |
| `downloadURL` | Direct resource link, subject to verification |
| `mediaType` | MIME-type format signal |
| `format` | Secondary format description |
| `describedBy` | Schema or documentation reference |

Keep multiple distributions for one dataset. A catalog record can describe several formats, services, vintages, or access paths.
