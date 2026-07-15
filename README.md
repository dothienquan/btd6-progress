# BTD6 Progress

Track solo map medals for **Bloons TD 6** through **Version 55.0 (2026)**, with auto-import from your in-game **Open Access Key (OAK)**.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## OAK sync (auto-update)

1. In BTD6: **Profile → Open Data API** → generate an OAK (expires ~90 days).
2. Paste it in the app and click **Sync from game**.
3. Medals are pulled from Ninja Kiwi’s save endpoint and stored in `data/progress.json`.

```bash
curl -X POST http://localhost:3000/api/oak/sync \
  -H "Content-Type: application/json" \
  -d '{"oak":"YOUR_OAK_TOKEN"}'
```

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/oak/sync` | Fetch save via OAK and replace local map medals |
| `POST` | `/api/oak/profile` | Peek at public profile for an OAK (no write) |
| `GET` | `/api/maps` | Local map/medal catalog |
| `GET` | `/api/progress` | Current stored progress |

Official docs: [Open Data API](https://support.ninjakiwi.com/hc/en-us/articles/13438499873937-Open-Data-API) · [data.ninjakiwi.com](https://data.ninjakiwi.com/)

Map list: [List of maps in BTD6](https://www.bloonswiki.com/List_of_maps_in_BTD6)

Medal sprites are sourced from [Blooncyclopedia BTD6 medal sprites](https://www.bloonswiki.com/Category:BTD6_medal_sprites) (Ninja Kiwi game assets).
