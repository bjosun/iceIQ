# App Store-skärmdumpar

Sex bilder per språk (`sv`, `en`), samma innehåll i flera storlekar. Apple kräver bara **en** storleksuppsättning (den största, iPhone 6,9") och skalar ned resten. Fylls övriga fack i behöver varje fack sin exakta storlek.

| App Store Connect-fack | Storlek | Mapp |
|---|---|---|
| iPhone with Dynamic Island (large display), 6,9" | 1320 × 2868 | `sv/` och `en/` (denna mapp) |
| iPhone with Dynamic Island (large display), 6,7" | 1290 × 2796 | `sizes/1290x2796/` |
| iPhone with Dynamic Island (medium display), 6,3" | 1206 × 2622 | `sizes/1206x2622/` |
| iPhone with Dynamic Island (medium display), 6,1" | 1179 × 2556 | `sizes/1179x2556/` |
| iPhone with Home Button (large display), 5,5" | 1242 × 2208 | `sizes/1242x2208/` |
| iPhone with Home Button (medium display), 4,7" | 750 × 1334 | `sizes/750x1334/` |
| 6,5" (äldre Dynamic Island/notch) | 1284 × 2778 / 1242 × 2688 | `sizes/1284x2778/`, `sizes/1242x2688/` |

Alla bilder är utan genomskinlighet. Gör om dem med verktyget `store-screens.html` (se `docs/app-store-listing.md`); storleken styrs med `?w=<bredd>&h=<höjd>` i CSS-pixlar och Chromes `--force-device-scale-factor` (3 för de flesta, 2 för 750 × 1334).
