# Blog briefs: shipper intent (for approval)

Ten article briefs for `/blog`. **Nothing is written yet.** The client approves each brief, then we write the article, and the client approves the article before it's published.

## Rules for every article

- **Sources:** every fact cites a primary source (a government portal, the act or rule itself, or an official notification). Rules change, so the writer re-checks each source on the day of writing and records the date checked. A notification number listed here is the starting point, not the final word.
- **TruckBuck numbers:** these come only from real rate cards and lanes (NFC-2, NFC-3). Until those exist, articles use worked examples marked "illustrative", never "our prices".
- **No legal or tax advice:** each article ends with "Check with your CA or transporter for your case." Where a rule matters, link to the rule rather than paraphrase it loosely.
- **Format:** 900–1,400 words, an FAQ block (FAQPage), Article structured data, an author and reviewer with dates, and internal links to `/pricing`, `/trucks`, the relevant `/truck-booking/...` lanes and `/help`.
- **Voice:** plain English for business owners, short sentences, Indian units (₹, tonnes, km).

---

## 1. How to calculate truck freight charges per km in India

- **Intent / query:** "truck freight charges per km", "truck rent per km calculation".
- **Reader:** a manufacturer or trader pricing a full truckload.
- **Outline:**
  1. What goes into a fare: distance, truck size, fuel, driver, tolls, loading, GST.
  2. Why per-km rates fall with distance (fixed costs spread over more km).
  3. Worked example: 350 km in a 14 ft LCV, step by step.
  4. Extras that change the price: night or urgent pickups, waiting, multi-drop.
  5. How to compare quotes fairly.
- **We bring:** how our estimate is built (distance slabs, minimum km, surcharges, GST, a range rather than one number). This is from `priceQuote`; the numbers are illustrative until NFC-2.
- **Sources:**
  - Diesel retail prices: Petroleum Planning & Analysis Cell, https://ppac.gov.in
  - Toll rates by plaza: NHAI Toll Information System, https://tis.nhai.gov.in
  - GST on road transport (GTA): CBIC GST portal, https://cbic-gst.gov.in (Notification 11/2017-Central Tax (Rate), as amended)
- **CTA:** "See your fare range in seconds" (fare widget).

## 2. Which truck size do I need for 5 tonnes?

- **Intent:** "truck for 5 ton load", "which truck for 5 tonnes".
- **Reader:** a shipper choosing between an LCV and a mid-size truck.
- **Outline:**
  1. Payload vs gross vehicle weight (GVW): what the numbers on a truck mean.
  2. Weight is half the answer. Volume and pallet count decide too.
  3. 5 tonnes of cartons vs 5 tonnes of steel: different trucks.
  4. Why we leave headroom instead of loading to the limit.
  5. Quick table: load type → suggested body and length.
- **We bring:** the logic of the "Which truck?" helper on `/trucks` (payload headroom, usable volume, body type by material).
- **Sources:**
  - Permissible axle and gross weights: MoRTH notification S.O. 3467(E), 16 July 2018, https://morth.nic.in
  - Motor Vehicles Act, 1988, section 113 (weight limits), India Code, https://www.indiacode.nic.in
  - Manufacturer spec sheets for the payload figures quoted. Cite each model's official page.
- **CTA:** "Find the right truck" (`/trucks` helper).

## 3. E-way bill rules for truck shipments

- **Intent:** "e-way bill rules for transport", "is e-way bill required for truck".
- **Reader:** a shipper or accountant moving taxable goods.
- **Outline:**
  1. What an e-way bill is and when it's needed (the value threshold, inter-state vs intra-state).
  2. Who generates it: consignor, consignee or transporter.
  3. Part A and Part B, and the vehicle number.
  4. Validity by distance, and what happens if the truck breaks down.
  5. Common mistakes that stop a truck on the road.
- **We bring:** route pages already note that inter-state consignments over ₹50,000 generally need an e-way bill. The article explains it properly.
- **Sources:**
  - CGST Rules, 2017, Rule 138 (and 138A–138E), CBIC GST portal, https://cbic-gst.gov.in
  - E-way bill system and official FAQs, https://ewaybillgst.gov.in
  - State-specific intra-state thresholds: each state's commercial tax notification, cited per state mentioned.
- **CTA:** "Book a truck with the paperwork sorted" (fare widget).

## 4. GST on truck transport: GTA, 5% vs 12% and reverse charge

- **Intent:** "GST on truck freight", "GTA GST rate", "RCM on transport".
- **Reader:** a business owner or finance team paying freight bills.
- **Outline:**
  1. What a Goods Transport Agency (GTA) is under GST.
  2. The two options: 5% without input tax credit, or 12% with it.
  3. Reverse charge: when the recipient pays the GST.
  4. What a correct freight invoice shows.
  5. Common questions.
- **We bring:** our estimates show GST inside the range. Whether TruckBuck issues GST invoices waits on NFC-11, so the article must not claim it.
- **Sources:**
  - Notification 11/2017-Central Tax (Rate) and Notification 13/2017-Central Tax (Rate), as amended (including the 2022 and 2023 GTA amendments), https://cbic-gst.gov.in
  - CGST Act, 2017, section 9(3) (reverse charge), India Code, https://www.indiacode.nic.in
- **CTA:** "See a fare range with GST included".

## 5. Overloading a truck: limits, penalties and why it costs you more

- **Intent:** "truck overloading fine India", "overload penalty".
- **Reader:** a shipper tempted to fit "a bit more" in one truck.
- **Outline:**
  1. Legal weight limits and how they're checked (weighbridges).
  2. Penalties under the Motor Vehicles Act after the 2019 amendment.
  3. Who is liable: driver, owner, consignor.
  4. Hidden costs: delays, unloading the excess, damage, insurance problems.
  5. How to split a load sensibly.
- **We bring:** the truck helper's payload headroom; our vetting checks RC and permits (live claim).
- **Sources:**
  - Motor Vehicles Act, 1988, sections 113 and 194 (as amended by the MV (Amendment) Act, 2019), India Code, https://www.indiacode.nic.in
  - MoRTH S.O. 3467(E) (2018 weight norms), https://morth.nic.in
- **CTA:** "Pick a truck that fits your load".

## 6. Goods-in-transit insurance: what's covered and what isn't

- **Intent:** "goods in transit insurance India", "is my cargo insured in a truck".
- **Reader:** a shipper sending valuable goods.
- **Outline:**
  1. A truck's motor insurance covers the vehicle and third parties, not your goods.
  2. A carrier's liability under the Carriage by Road Act.
  3. Transit, marine-inland and open policies, at a high level.
  4. What to declare, and what to do if goods are damaged.
  5. Questions to ask before you book.
- **We bring:** matches the `/safety` insurance guidance. TruckBuck's own cover is NFC-11, so the article claims none.
- **Sources:**
  - The Carriage by Road Act, 2007, and the Carriage by Road Rules, 2011, India Code, https://www.indiacode.nic.in
  - IRDAI consumer pages on non-life (marine/transit) insurance, https://www.irdai.gov.in
- **CTA:** "Talk to us before you ship high-value goods" (`/contact`).

## 7. Documents you need to send goods by truck

- **Intent:** "documents required for transport of goods by road".
- **Reader:** a first-time or occasional shipper.
- **Outline:**
  1. Tax invoice, or a bill of supply or delivery challan, and when each applies.
  2. E-way bill (link to article 3).
  3. Lorry receipt (LR) or consignment note: what the transporter issues.
  4. Goods with extra paperwork: hazardous, perishable or high-value.
  5. A printable checklist.
- **We bring:** how proof of delivery works on TruckBuck, but only once POD is confirmed (NFC-11). Until then, leave it out.
- **Sources:**
  - CGST Rules, 2017, Rule 46 (tax invoice) and Rule 55 (delivery challan), https://cbic-gst.gov.in
  - The Carriage by Road Act, 2007 (goods forwarding note, consignment note), India Code, https://www.indiacode.nic.in
- **CTA:** "Get a fare and we'll walk you through the rest".

## 8. Do trucks need a national permit to carry goods between states?

- **Intent:** "national permit truck rules", "inter-state goods vehicle permit".
- **Reader:** a shipper booking a cross-state lane (for example Coimbatore to Kochi or Bengaluru).
- **Outline:**
  1. What a goods carriage permit is, and state vs national permits.
  2. How the National Permit system works (authorisation and fee).
  3. What a shipper should check: permit validity, RC and insurance.
  4. What happens at a check when papers are missing.
- **We bring:** vetting checks every truck's RC, insurance and permit (a live claim, from the Phase 4 brief).
- **Sources:**
  - Motor Vehicles Act, 1988, section 88 (validity of permits outside the region), India Code, https://www.indiacode.nic.in
  - Central Motor Vehicles Rules, 1989 (national permit rules), and the Parivahan National Permit portal, https://parivahan.gov.in
- **CTA:** "Book a vetted transporter for your lane" (lane pages).

## 9. FASTag and tolls: how toll charges add to your freight bill

- **Intent:** "truck toll charges calculation", "toll cost for truck Chennai to Bengaluru".
- **Reader:** a shipper comparing quotes that treat tolls differently.
- **Outline:**
  1. How national highway tolls are set by vehicle class (axles).
  2. FASTag basics, and why cash lanes cost more.
  3. Working out tolls for a lane (worked example, illustrative).
  4. "Tolls included" vs "tolls extra": reading a quote.
- **We bring:** each estimate says whether tolls are included or extra. Lane pages carry a toll note once ops confirm it (NFC-3).
- **Sources:**
  - National Highways Fee (Determination of Rates and Collection) Rules, 2008, as amended, India Code, https://www.indiacode.nic.in
  - Plaza-wise rates: NHAI Toll Information System, https://tis.nhai.gov.in
  - FASTag: Indian Highways Management Company Ltd, https://ihmcl.co.in
- **CTA:** "See what's included in your fare".

## 10. Open body vs container truck: which should you book?

- **Intent:** "open body truck vs container truck", "closed body truck for goods".
- **Reader:** a shipper of textiles, machinery, FMCG or bulk goods.
- **Outline:**
  1. Body types: open, closed (container) and refrigerated.
  2. Weather, theft and handling: what each protects against.
  3. Loading: crane and side loading vs back loading.
  4. Typical loads by body type, with examples from Tamil Nadu industries (cited).
  5. Cost differences, illustrative until NFC-2.
- **We bring:** truck catalogue body types and dimensions (NFC-1), and the "Which truck?" helper.
- **Sources:**
  - Industry examples per city: the district administration portals (for example https://tiruppur.nic.in, https://coimbatore.nic.in), cited per claim.
  - Body dimensions: manufacturer spec sheets, cited per model.
- **CTA:** "Compare truck types" (`/trucks`).

---

## Next steps

1. The client approves or edits each brief and names a reviewer (ideally someone in ops) for each article.
2. We set up `/blog` (MDX, Article structured data, a blog sitemap) with the first approved article.
3. Articles stay noindex until the client approves the final text.
