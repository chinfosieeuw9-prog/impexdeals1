# Migratie: LocalStorage producten -> MySQL

## 1. Doel
Products leven nu alleen client-side. We verhuizen ze naar de server zodat sitemap en SEO altijd actuele data hebben.

## 2. Tabel aanmaken
Voer uit in MySQL (pas database naam):
```sql
SOURCE db/schema.sql;
```

## 3. Backend endpoints (te bouwen)
Aanbevolen REST endpoints:
- `GET /api/products` lijst (optionele query params: `q`, `category`, `limit`, `offset`)
- `GET /api/products/:id` detail (external_id)
- `POST /api/products` nieuw product
- `PUT /api/products/:id` update
- `DELETE /api/products/:id` verwijderen
- `POST /api/products/:id/publish` zet `is_draft=0`
- `POST /api/products/:id/extend` body `{ days: 7 }` => verleng `expires_at`

## 4. Data mapping
| Front-end veld       | DB kolom / opmerking                   |
|----------------------|----------------------------------------|
| id                   | external_id (uuid / bestaande id)      |
| title                | title                                  |
| category             | category                               |
| price                | price DECIMAL                          |
| qty                  | qty INT                                |
| condition            | condition                              |
| description          | description                            |
| images (array)       | images_json (bewaar array van urls/base64) |
| ownerId              | owner_id                               |
| ownerName            | owner_name                             |
| tags[]               | tags_json                              |
| location             | location                               |
| minOrder             | min_order                              |
| negotiable           | negotiable (0/1)                       |
| vatIncluded          | vat_included (0/1)                     |
| shippingMethods[]    | shipping_methods_json                  |
| expiresAt (ms ts)    | expires_at (DATETIME)                  |
| brand                | brand                                  |
| externalLink         | external_link                          |
| isDraft              | is_draft (0/1)                         |
| createdAt (ms ts)    | created_at (DATETIME)                  |
| updatedAt            | updated_at                             |

## 5. Migratie script (eenmalig)
Schrijf een kleine front-end functie die alle lokale producten naar een endpoint `POST /api/products/migrate` stuurt, of een console snippet:
```js
const all = JSON.parse(localStorage.getItem('impex_products_v1')||'[]');
fetch('http://localhost:3000/api/products/migrate', {
  method:'POST', headers:{'Content-Type':'application/json'},
  body: JSON.stringify({ items: all })
});
```
Server: loop items, insert als `external_id` niet bestaat.

## 6. Server insert voorbeeld
```js
connection.query(
  `INSERT INTO products (external_id,title,category,price,qty,\`condition\`,description,images_json,owner_id,owner_name,tags_json,location,min_order,negotiable,vat_included,shipping_methods_json,expires_at,brand,external_link,is_draft,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, ?, FROM_UNIXTIME(?/1000))`,
  [p.id,p.title,p.category,p.price,p.qty,p.condition,p.description,JSON.stringify(p.images||[]),p.ownerId,p.ownerName,JSON.stringify(p.tags||[]),p.location,p.minOrder,p.negotiable?1:0,p.vatIncluded?1:0,JSON.stringify(p.shippingMethods||[]), p.expiresAt? new Date(p.expiresAt): null, p.brand, p.externalLink, p.isDraft?1:0, p.createdAt],
  cb
);
```

Let op: `expires_at` mag NULL zijn; converteer ms timestamp naar `FROM_UNIXTIME(ms/1000)` of JS Date → format.

## 7. Sitemap
Zodra producten in DB staan gebruikt `/sitemap.xml` automatisch alleen DB data (al geïmplementeerd). Geen herstart nodig behalve voor code changes.

## 8. Front-end aanpassing
Vervang `productService.ts` functies met fetch calls naar API. Houd tijdelijk fallback (als fetch faalt gebruik localStorage) voor soepele overgang.

## 9. Indexen & performance
- `idx_products_created` ondersteunt sorteren op nieuwste.
- Voeg later index op `category` toe als filters zwaar worden.
- Overweeg FULLTEXT index voor zoeken.

## 10. Beveiliging
- Auth/ACL: alleen eigenaar of admin mag update/delete/publish.
- Valideer & sanitize user input (prijs numeriek, length limits).

## 11. Volgende stappen
1. Endpoints implementeren.
2. Migratie uitvoeren.
3. Front-end omschakelen.
4. LocalStorage code opruimen.

```
TIP: test eerst op kopie database.
```
