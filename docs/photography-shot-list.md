# Photography shot list

This is for the client and the photographer. It fulfils **NFC-8 (real photos)**.

Until these photos arrive, the site uses flat truck illustrations and no stock photography. Each photo below replaces a specific illustration or fills a specific slot. The "Used on" column says where.

## Before the shoot

### Consent

Get written consent from every recognisable person, before they are photographed.

- **Consent form.** Each person signs a short form in a language they read: Tamil, Hindi or English. The form says:
  - what the photo is for (the TruckBuck website, app stores and social media);
  - for how long;
  - that they can withdraw consent at any time and how to do it (an email or WhatsApp number).
- **Legal basis.** This is consent under India's Digital Personal Data Protection Act, 2023. Counsel should approve the form; it belongs with NFC-19.
- **Drivers.** Ask the driver, not only the fleet owner. If a driver says no, photograph the truck without them.
- **People to leave out.** No children. No one who hasn't signed. People in the background should be unrecognisable or out of frame.

### Vehicles and locations

- **Number plates.** Get the owner's consent to show the plate. Otherwise we blur it in editing. Say which on the shot log.
- **Locations.** Get written permission from the site owner for each loading bay, warehouse or yard.
- **Branding.** No competitor logos, and no other companies' signage that can be read. Third-party goods are fine if their brand names aren't readable.
- **Clothing.** Real working clothes. No costumes, and no TruckBuck uniforms unless TruckBuck actually issues them.

### Locations to cover

Coimbatore and Tiruppur first:

- textile and garment loading bays in Tiruppur;
- engineering and pump-industry units in Coimbatore;
- a highway stretch on the NH 544 corridor;
- a transporter's yard.

## Technical spec (all shots)

- **Resolution.** At least **2000 px** on the long edge; 4000 px or more preferred. Deliver RAW plus high-quality JPEG.
- **Colour.** Shoot in sRGB, or convert to sRGB on delivery.
- **Light.** Natural daylight. Morning or late afternoon is best: low sun and soft shadows. Avoid harsh noon light on white truck bodies, which blows out the highlights.
- **Lens.** Use 35–50 mm (full-frame equivalent) for trucks, so they don't look distorted. Use 50–85 mm for people.
- **Camera height.**
  - Truck 3/4 shots: chest height, about 1.4 m.
  - People: eye level. Never shoot down at drivers.
- **Editing.** True to life. No heavy filters or HDR, and no added skies.
- **File names.** `truckbuck_<shot-id>_<sequence>.jpg`, e.g. `truckbuck_T03_02.jpg`. Send a shot log (spreadsheet) with:
  - shot ID, place and date;
  - plate (shown or blurred);
  - the consent form number for each person;
  - one line saying what's in the frame. We'll use it for the alt text.

We crop and convert to AVIF/WebP ourselves. Every image on the site is under 200 KB, in a fixed-ratio frame, with alt text.

## Aspect ratios we crop to

| Slot                      | Ratio  | Leave room for                                                                                                  |
| ------------------------- | ------ | --------------------------------------------------------------------------------------------------------------- |
| Truck card and truck page | 4:3    | Truck centred with about 10% clear space on every side. The whole vehicle, wheels included, must stay in frame. |
| Page hero, desktop        | 16:9   | Subject in the right two-thirds; the left third takes the headline.                                             |
| Page hero, mobile         | 4:5    | Subject in the lower half; the headline sits above it.                                                          |
| Share image (OG)          | 1.91:1 | Subject on the right; the left half takes the title.                                                            |
| Portrait / testimonial    | 1:1    | Face in the upper third. Plain, uncluttered background.                                                         |

Compose loosely: one frame should crop to both 16:9 and 4:5.

## Shots

### Trucks: one set per class (replaces the illustrations)

For every truck class, shoot the same **front 3/4 view**. This matches the illustrations, so the catalogue looks consistent.

- Front of the truck to the right of the frame.
- Camera about 30° off the side, at chest height.
- Clean, empty background: a yard wall, open ground or an empty highway shoulder.
- Truck clean, no driver at the wheel, doors closed.

| ID  | Truck class (`icon_key`)          | Notes                                                                    | Used on                                    |
| --- | --------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------ |
| T01 | Mini truck (`mini`)               | Tata Ace class. Empty deck.                                              | `/trucks`, `/trucks/<slug>`, home carousel |
| T02 | Pickup 8 ft (`pickup`)            | Bolero/Dost class.                                                       | same                                       |
| T03 | LCV 14 ft (`lcv`)                 | Closed body.                                                             | same                                       |
| T04 | LCV 17 ft (`lcv`)                 | Closed body. Shoot it separately from T03 so the sizes read differently. | same                                       |
| T05 | Truck 20 ft (`mcv`)               | Closed body.                                                             | same                                       |
| T06 | Container 32 ft MXL (`container`) | Whole length in frame, so step further back.                             | same                                       |
| T07 | Open body 22 ft (`open`)          | Tarpaulin-covered load if possible.                                      | same                                       |
| T08 | Refrigerated 20 ft (`reefer`)     | Refrigeration unit visible.                                              | same                                       |
| T09 | Trailer (`trailer`)               | Only if TruckBuck books trailers (NFC-1).                                | same                                       |

Only shoot classes that are in the real catalogue (NFC-1).

### Operations: real work, real places

| ID  | Shot                                                                           | Framing                                                                               | Ratio           | Used on                             |
| --- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | --------------- | ----------------------------------- |
| O01 | Truck being loaded at a Tiruppur garment unit: cartons going in.               | Wide. Truck on the right, people working on the left, faces turned away or consented. | 16:9 and 4:5    | `/shippers` hero, home              |
| O02 | Loading bay at a Coimbatore engineering unit: a pallet or crate on a forklift. | Medium. Forklift and goods in focus.                                                  | 16:9            | `/shippers`                         |
| O03 | Truck on the highway near Coimbatore: moving, side-on.                         | Panning shot, 1/60 s, so the background blurs.                                        | 16:9 and 1.91:1 | home, OG                            |
| O04 | Transporter's yard: a row of 3–6 trucks with the owner standing in front.      | Owner (consented) on the right third, trucks behind.                                  | 16:9 and 4:5    | `/transporters` hero                |
| O05 | Paperwork at a truck door: a delivery note being signed.                       | Close-up of hands and the document. No readable personal data.                        | 4:3             | `/how-it-works` (proof of delivery) |

### Drivers: with consent

| ID  | Shot                                                                           | Framing                                                                                              | Ratio        | Used on                                                              |
| --- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | ------------ | -------------------------------------------------------------------- |
| D01 | Driver in the cab holding a phone with the TruckBuck app open.                 | Through the open door. Driver relaxed, phone screen readable (we may replace the screen in editing). | 4:5 and 16:9 | `/drivers` hero                                                      |
| D02 | Driver standing by their truck.                                                | Eye level, from the waist up, with the truck behind. Natural expression, not posed.                  | 1:1 and 4:5  | `/drivers`, testimonials (only with a real, consented quote: NFC-10) |
| D03 | Driver checking the app at a dhaba or rest stop.                               | Candid, medium shot.                                                                                 | 16:9         | `/drivers`                                                           |
| D04 | Phone close-up: app on a budget Android phone in a hand, cab dashboard behind. | Shallow depth of field.                                                                              | 4:3          | `/drivers` (also covers "3–5 app screenshots" in NFC-8)              |

### Team (optional, NFC-18)

| ID  | Shot                                                                               | Ratio | Used on                     |
| --- | ---------------------------------------------------------------------------------- | ----- | --------------------------- |
| P01 | Founders or ops team at work: on the phone with a transporter, or at a load board. | 16:9  | About section (later phase) |
| P02 | Individual portraits, if names will be published.                                  | 1:1   | About section               |

## What we don't want

- Stock photos, or photos from outside Tamil Nadu presented as local.
- Staged smiles, thumbs-up or handshakes.
- Anyone driving while holding a phone. Phone shots are always with the truck parked.
- Overloaded trucks, people riding on loads, or anything else unsafe or illegal.
- Readable personal data: phone numbers, addresses, ID cards or invoices.
