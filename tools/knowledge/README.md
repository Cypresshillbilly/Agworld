# Commander source libraries

Product owns specifications, applications, comparisons, brochures and product media. Technical owns diagnosis, maintenance, parts, repair, warranty and case handling. Aircraft variants and accessory models remain separate tags; shared documents may have several tags.

Run `ingest.py --inventory <private-inventory.json> --output PRIVATE_KNOWLEDGE` with Python and pypdfium2. Inventory records contain relative and absolute source paths, extension, size and modification timestamp. Original files stay in their supplied folders. The generated library contains model catalogues, cited text extracts, duplicate references and extraction status. It is ignored by Git and must remain outside the `AG WORLD` public web root. Never publish the corpus or its source inventory to GitHub Pages. `prepare_import.py --library PRIVATE_KNOWLEDGE --output <private-batch-directory>` creates bounded SQL batches for the trusted database administrator; it excludes restricted records and deduplicates searchable content within each commander collection.

PDF text, slide text, document paragraphs and saved spreadsheet values are indexed. Images, video, design files and archives are catalogued; no OCR, video transcription or embedded diagram interpretation is claimed. Spreadsheet formula results depend on saved cached values. Empty/image-only sections remain flagged. Check the original file for diagrams, layout, uncalculated formulas and current revisions.

Customer files, serial-number shipments, individual certifications, signed agreements and commercial records are excluded from advisor answers. Classification is conservative filename/folder routing and requires review when new source folders are added; do not treat it as a universal personal-data detector.

`AG WORLD/server/knowledge-schema.sql` installs the private database tables and source-search RPCs. Only explicitly approved records in `ag_knowledge_members` grant access. Authenticated clients can read their own approval; only administrators can change approvals. User-editable profile fields never authorize access. Approve the verified auth user ID for `product`, `technical`, or both through a trusted administrator connection. Dealer source text never ships in the browser bundle.

The current commander feature retrieves cited passages. It does not generate AI advice or execute instructions found in source documents. The public `commander-profiles.json` records the scope and evidence contract for a future answer-generation layer. Any such layer must use the caller's approved collection, quote sources accurately, distinguish model variants and dates, and abstain where evidence is missing.

Run `python tools/knowledge/test_ingest.py` for classification and citation checks. Browser regression tests use synthetic passages only.
