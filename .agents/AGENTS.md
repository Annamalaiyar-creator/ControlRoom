# Project Guidelines & Rules

## Purchase Order (PO) & Zoho Books Integration Rules

1. **PO Numbering Sequence**:
   - PO numbers generated in Control Room MUST strictly match Zoho Books' sequential format (`PO-000XX`).
   - Use `GET /api/zoho/next-po-number` to fetch the next sequential PO number.

2. **PO State Persistence**:
   - In `POST /api/zoho/purchaseorders`, save the PO to disk storage (`po_store.json`) immediately before initiating the HTTPS request to Zoho Books.
   - In `fetchZohoPOs()`, merge fetched server records with local React state so local POs are never overwritten or cleared during table reloads.

3. **Zoho Payload Constraints**:
   - `delivery_address` and `billing_address` strings sent to Zoho Books MUST be truncated to <= 80 characters to prevent Zoho API error code 15.
   - `notes` field in Zoho payload MUST ONLY contain user-entered notes (no prepended metadata or formatted addresses).

4. **Line Items Form Default**:
   - Opening the "Create PO" form MUST initialize line items to an empty array (`[]`) without forcing pre-populated items.
