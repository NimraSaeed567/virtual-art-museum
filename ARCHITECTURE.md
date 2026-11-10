# The Atelier Museum of Emerging Art — Information Architecture

Status: **finalized (Phase 1 model)** · Code model: [`src/data/museum.ts`](src/data/museum.ts)

This defines how the museum's content is structured, how exhibits rotate, who can
see what, and how commerce (shop / donations / memberships) attaches later without
a redesign. Everything the Phase 1 build and the content-submission template use is
derived from this.

## 1. Hierarchy

```
Museum
 └─ Theme            e.g. "Light & Atmosphere"
     └─ Hall         ~5 rooms each (flexible); a hall can be members-only
         └─ Room     a display space; points at one active exhibition
             └─ Exhibition   an artist's showing, placed in a room for a period
                 └─ Artwork  image + story + (optional) prints/original for sale
```

Decisions locked in:

- **Theme-first, not artist-first.** Rooms are display spaces, not permanent
  homes for one artist — so we never depend on having enough art from any single
  artist.
- **~5 rooms per hall, but flexible.** `Hall` doesn't hard-cap rooms; `Room.capacity`
  is a soft guideline for how many works fit. Add or remove rooms freely.
- **Artists rotate via exhibitions.** An `Exhibition` links an artist (+ their
  artworks) to a room with a status and dates. To rotate a room, point
  `Room.currentExhibitionId` at a different exhibition. Old exhibitions are kept
  (`status: 'past'`) as an archive.
- **Permanent vs rotating.** `Exhibition.status`: `permanent` (core collection),
  `current` (showing now), `upcoming`, `past`.

## 2. Access levels

Four levels, applied at **Hall**, **Exhibition**, and **Artwork**:

| Level | Who sees it |
|---|---|
| `public` | Everyone |
| `member` | Free/registered members and above |
| `premium` | Premium members (e.g. the Members' Hall) |
| `private` | Admin / unlisted only |

- **Most-restrictive wins** down the chain (`effectiveAccess` / `artworkAccess`
  in the model). A public artwork inside a premium hall is premium.
- Visitor tiers: `public → member → premium → admin`. `canView()` gates content.
- This supports a **premium-members hall** (a hall with `access: 'premium'`)
  as a config flag — no separate build.

## 3. Commerce-ready by design (built in a later phase)

Fields exist now; the checkout/store is a later phase:

- **Artwork.commerce**: `printsForSale`, `prints[]` (size/price/sku), `originalForSale`,
  `originalPrice`, `currency`, `artistShare` (defaults to the museum's 50%), and
  `productRef` for a future Shopify/Stripe product id.
- **MembershipTier[]**: Visitor / Member / Premium defined with prices, benefits,
  and which access levels each `grants`.
- **Donations & gift shop** attach at the museum level later; because pricing and
  access already live on the entities, adding a cart/checkout is additive.

This is the "plan it into the architecture now" requirement — no redesign when
shop / donations / memberships arrive.

## 4. Content model per artwork

Matches the submission template (next task). Real images replace the procedural
`placeholder` (`image` field wins when present):

`title, artist, image, year, medium, dimensions, theme/category, shortDescription,
story, artist bio, access level, copyright, usageRights, commerce (prints/price)`.

## 5. Route map (public 2D site + 3D entry)

```
/                         home — themes
/theme/:themeSlug         halls in a theme
/hall/:hallSlug           rooms in a hall
/room/:roomSlug           current exhibition + artworks  (also the 3D entry point)
/exhibition/:slug         an exhibition's story + works
/artwork/:slug            artwork story + buy prints
/artist/:slug             artist profile + their exhibitions
/membership  /donate  /shop   (future phases)
```

The fast 2D pages are the source of truth for content and (later) purchases; the
3D walkthrough is layered on the same data and links back to `/artwork/:slug` to
read and buy.

## 6. Phase mapping

- **Phase 1 (now):** Theme → Hall → Room → Exhibition → Artwork content + navigation
  + the 3D walkthrough, using this model. Access levels present; only `public` used.
- **Phase 3:** accounts + membership tiers activate `member`/`premium` gating and the
  Members' Hall.
- **Phase 4:** commerce fields power prints, gift shop, donations, checkout.

## 7. What changes in the current demo (rebrand task)

The existing build still uses the flat `artworks.ts` (5 fixed wings, "living
artists", "galleries"). The rebrand task maps that content onto this model:
5 artists → exhibitions inside one theme's halls/rooms; "galleries" → "exhibits";
"living" → "emerging"; museum name → *The Atelier Museum of Emerging Art*.
