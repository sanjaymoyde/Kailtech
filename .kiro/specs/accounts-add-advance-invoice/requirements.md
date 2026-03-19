# Requirements Document

## Introduction

This feature implements the API integration for the **Add Direct Testing Invoice** form in the Accounts section under Testing Invoices (`/dashboards/accounts/testing-invoices/create-advance`). The `AddTestingAdvanceInvoice.jsx` component is wired to the direct invoice testing APIs.

The form allows accounts staff to create a direct testing invoice by selecting a customer, loading their PO/billing details, adding line items from the direct testing price list, applying charges and taxes, and submitting the invoice.

## Glossary

- **Advance_Invoice_Form**: The React component at `AddTestingAdvanceInvoice.jsx` rendered on route `/dashboards/accounts/testing-invoices/create-advance`.
- **Customer**: A billing entity selected from the customer list, identified by `customerid`.
- **PO_Detail**: Customer billing info, addresses, available products, and tax defaults returned by the customer-detail API.
- **Line_Item**: A single product/package row added to the invoice, with quantity, rate, and computed amount.
- **Charges**: Additional financial adjustments applied to the subtotal: discount, freight, mobilisation, witness charges, sample handling, sample preparation.
- **Tax**: Either CGST+SGST (intra-state, statecode === "23") or IGST (inter-state), determined by the customer's state code.
- **Totals_Calculator**: The `calcTotals()` pure function that derives subtotal, discount, tax amounts, total, round-off, and final total from items and charges.
- **API**: The backend REST service consumed via the `axios` utility at `utils/axios`.

---

## Requirements

### Requirement 1: Load Customer List

**User Story:** As an accounts staff member, I want to see a searchable list of all customers, so that I can select the correct billing customer for the advance invoice.

#### Acceptance Criteria

1. WHEN the Advance_Invoice_Form mounts, THE Advance_Invoice_Form SHALL fetch the customer list from `GET /people/get-all-customers`.
2. IF the customer list request fails, THEN THE Advance_Invoice_Form SHALL display a toast error message and render an empty customer dropdown.
3. THE Advance_Invoice_Form SHALL render a searchable customer dropdown that filters customers by name as the user types.

---

### Requirement 2: Load Customer PO and Billing Details

**User Story:** As an accounts staff member, I want the form to auto-populate billing details when I select a customer, so that I don't have to enter them manually.

#### Acceptance Criteria

1. WHEN a customer is selected, THE Advance_Invoice_Form SHALL fetch billing details from `GET /api/accounts/get-po-detailfor-directinvoice-testing?customerid={customerid}`.
2. WHEN the PO detail response is received, THE Advance_Invoice_Form SHALL populate the customer name, address list, available products, and tax defaults from the response.
3. WHEN the PO detail response includes a `po.value`, THE Advance_Invoice_Form SHALL pre-fill the PO number field with that value.
4. WHEN the PO detail response includes `defaults` (freight, mobilisation, witnesscharges, discount), THE Advance_Invoice_Form SHALL apply those values to the corresponding charge fields.
5. WHEN the PO detail response includes `tax` defaults (default_cgst, default_sgst, default_igst), THE Advance_Invoice_Form SHALL apply those percentages to the tax fields.
6. IF the PO detail request fails, THEN THE Advance_Invoice_Form SHALL display a toast error message.
7. WHEN a customer is cleared or changed, THE Advance_Invoice_Form SHALL reset all PO detail fields, items, and charge defaults.

---

### Requirement 3: Add Line Items

**User Story:** As an accounts staff member, I want to add product line items to the invoice, so that the invoice reflects the services being billed.

#### Acceptance Criteria

1. WHEN a product is selected and the "Add Item" button is clicked, THE Advance_Invoice_Form SHALL fetch item details from `GET /api/accounts/get-directinvoice-testing-item?package={packageid}`.
2. WHEN the item detail response is received, THE Advance_Invoice_Form SHALL append a new row to the items table with description, quantity, rate, and computed amount.
3. IF the same product is selected again, THEN THE Advance_Invoice_Form SHALL display a toast error "Item already added" and SHALL NOT add a duplicate row.
4. WHEN the user changes the quantity or rate of a line item, THE Advance_Invoice_Form SHALL recompute that item's amount as `qty × rate`.
5. WHEN the user clicks the remove button on a line item row, THE Advance_Invoice_Form SHALL remove that row and allow the same product to be added again.
6. IF the item detail request fails, THEN THE Advance_Invoice_Form SHALL display a toast error message.

---

### Requirement 4: Compute Invoice Totals

**User Story:** As an accounts staff member, I want the invoice totals to update automatically as I add items or adjust charges, so that I always see the correct amounts before submitting.

#### Acceptance Criteria

1. THE Totals_Calculator SHALL compute `subtotal` as the sum of `qty × rate` for all line items.
2. THE Totals_Calculator SHALL compute `discount` as either a fixed amount or a percentage of subtotal, based on the selected discount type.
3. THE Totals_Calculator SHALL compute `witnesscharges` as either a fixed amount or a percentage of subtotal, based on the selected witness charge type.
4. THE Totals_Calculator SHALL compute `subtotal2` as `subtotal − discount + freight + mobilisation + witnesscharges + samplehandling + sampleprep`.
5. WHEN the customer's statecode equals "23", THE Totals_Calculator SHALL compute CGST and SGST amounts from `subtotal2 × cgstper/100` and `subtotal2 × sgstper/100` respectively, and SHALL set IGST to 0.
6. WHEN the customer's statecode does not equal "23", THE Totals_Calculator SHALL compute IGST amount from `subtotal2 × igstper/100`, and SHALL set CGST and SGST to 0.
7. THE Totals_Calculator SHALL compute `total` as `subtotal2 + cgstamount + sgstamount + igstamount`.
8. THE Totals_Calculator SHALL compute `finaltotal` as `Math.round(total)` and `roundoff` as `finaltotal − total`.

---

### Requirement 5: Submit Advance Invoice

**User Story:** As an accounts staff member, I want to submit the completed advance invoice form, so that the invoice is created in the system.

#### Acceptance Criteria

1. WHEN the "Add Invoice" button is clicked, THE Advance_Invoice_Form SHALL validate that a customer is selected, a PO number is entered, an address is selected, and at least one line item exists.
2. IF any required field is missing, THEN THE Advance_Invoice_Form SHALL display a specific toast error message identifying the missing field and SHALL NOT submit the form.
3. WHEN all validations pass, THE Advance_Invoice_Form SHALL POST the invoice payload to `POST /accounts/add-direct-testing-invoice`.
4. WHEN the submission response indicates success, THE Advance_Invoice_Form SHALL display a success toast and navigate to `/dashboards/accounts/testing-invoices`.
5. IF the submission response indicates failure, THEN THE Advance_Invoice_Form SHALL display the error message from the response.
6. IF the submission request throws a network or server error, THEN THE Advance_Invoice_Form SHALL display a toast error with the server's message or a fallback message.
7. WHILE the submission is in progress, THE Advance_Invoice_Form SHALL disable the submit button and display a loading indicator.

---

### Requirement 6: Invoice Payload Structure

**User Story:** As a backend developer, I want the submitted payload to include all required fields in the correct format, so that the invoice can be persisted correctly.

#### Acceptance Criteria

1. THE Advance_Invoice_Form SHALL include `customerid` (Number), `addressid` (Number), `customername`, `address`, `statecode`, `pan`, `gstno`, `ponumber`, `invoicedate` (in `dd/mm/yyyy` format), and `typeofinvoice: "Testing"` in the payload.
2. THE Advance_Invoice_Form SHALL include item arrays `itempricematrixid[]`, `iteminstid[]`, `itemname[]`, `itempackagedesc[]`, `itemqty[]`, `itemrate[]`, `itemamount[]` in the payload.
3. THE Advance_Invoice_Form SHALL include all computed charge and tax fields: `subtotal`, `disctype`, `discnumber`, `discount`, `freight`, `mobilisation`, `witnesstype`, `witnessnumber`, `witnesscharges`, `samplehandling`, `sampleprep`, `subtotal2`, `cgstper`, `cgstamount`, `sgstper`, `sgstamount`, `igstper`, `igstamount`, `total`, `roundoff`, `finaltotal`, `remark`, and `status: 0` in the payload.
