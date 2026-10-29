# USDA Source Routing

Discovery results should identify the likely system and hand off source-specific work rather than inventing a universal query contract.

| System | Discovery handoff |
|---|---|
| NASS Quick Stats | Identify documented API route, key requirement, query dimensions, and response limits. |
| FoodData Central | Identify API documentation, key requirement, data type, pagination, and rate-limit constraints. |
| Ag Data Commons | Preserve DOI or landing-page provenance and distinguish public access from submitter or authenticated access. |
| ERS | Identify product page, vintage, scope, current status, and available XLSX/CSV/ZIP resources. |
| Forest Service | Distinguish downloads from ArcGIS services and preserve layer, CRS, resolution, and vintage clues. |
| FAS PSD Online | Treat the application and any API as separate evidence; verify the endpoint before routing. |

Never claim that a route is authenticated, queryable, current, or complete unless the source documentation or bounded verification establishes it.
