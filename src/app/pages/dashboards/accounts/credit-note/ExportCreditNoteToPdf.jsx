

// Number to words helper
function numberToWords(n) {
    if (n === 0) return "zero";
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const numToWords = (num) => {
        let str = "";
        if (num > 99) {
            str += ones[Math.floor(num / 100)] + " Hundred ";
            num %= 100;
        }
        if (num > 19) {
            str += tens[Math.floor(num / 10)] + " ";
            num %= 10;
        }
        if (num > 0) {
            str += ones[num] + " ";
        }
        return str.trim();
    };
    let words = "";
    if (n > 9999999) {
        words += numToWords(Math.floor(n / 10000000)) + " Crore ";
        n %= 10000000;
    }
    if (n > 99999) {
        words += numToWords(Math.floor(n / 100000)) + " Lakh ";
        n %= 100000;
    }
    if (n > 999) {
        words += numToWords(Math.floor(n / 1000)) + " Thousand ";
        n %= 1000;
    }
    if (n > 0) {
        words += numToWords(n);
    }
    return words.trim();
}

const s = {
    table: { width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "sans-serif", marginBottom: 15 },
    th: { border: "1px solid #000", padding: "4px", backgroundColor: "#f9f9f9", fontWeight: "bold" },
    td: { border: "1px solid #000", padding: "4px", verticalAlign: "top" },
    tR: { textAlign: "right" },
    tC: { textAlign: "center" },
    tL: { textAlign: "left" },
    bold: { fontWeight: "bold" },
};

const f2 = (v) => parseFloat(v || 0).toFixed(2);

const gstStateMap = {
    "01": "JAMMU AND KASHMIR", "02": "HIMACHAL PRADESH", "03": "PUNJAB", "04": "CHANDIGARH", "05": "UTTARAKHAND",
    "06": "HARYANA", "07": "DELHI", "08": "RAJASTHAN", "09": "UTTAR PRADESH", 10: "BIHAR", 11: "SIKKIM",
    12: "ARUNACHAL PRADESH", 13: "NAGALAND", 14: "MANIPUR", 15: "MIZORAM", 16: "TRIPURA", 17: "MEGHALAYA",
    18: "ASSAM", 19: "WEST BENGAL", 20: "JHARKHAND", 21: "ODISHA", 22: "CHHATTISGARH", 23: "MADHYA PRADESH",
    24: "GUJARAT", 27: "MAHARASHTRA", 29: "KARNATAKA", 32: "KERALA", 33: "TAMIL NADU", 36: "TELANGANA",
    37: "ANDHRA PRADESH",
};

export default function ExportCreditNoteToPdf({ data, logoBase64, withLH = true }) {
    if (!data) return null;

    const isSGST = data.sgst == 1;
    const stCode = String(data.statecode || "");
    const stateName = gstStateMap[stCode] || data.statename || stCode || "NA";

    return (
        <div
            style={{
                width: "210mm",
                minHeight: "297mm",
                padding: "10mm",
                margin: 0,
                backgroundColor: "#fff",
                color: "#000",
                fontFamily: "Arial, sans-serif",
                fontSize: "11px",
                boxSizing: "border-box",
            }}
        >
            {/* HEADER */}
            {withLH && (
                <table style={{ width: "100%", border: "none", marginBottom: 20 }}>
                    <tbody>
                        <tr>
                            <td style={{ width: "25%", verticalAlign: "top", border: "none" }}>
                                {logoBase64 ? (
                                    <img src={logoBase64} alt="Logo" style={{ height: "65px", maxWidth: "100%" }} />
                                ) : null}
                            </td>
                            <td style={{ width: "75%", textAlign: "right", verticalAlign: "top", border: "none" }}>
                                <div style={{ fontSize: "10px", fontStyle: "italic", fontFamily: "monospace", color: "#555" }}>
                                    NABL Accredited as per IS/ISO/IEC 17025 (Certificate Nos. TC-7832 &amp; CC-2348),<br />
                                    BIS Recognized &amp; ISO 9001 Certified Test &amp; Calibration Laboratory
                                </div>
                                <h2 style={{ fontSize: 20, color: "navy", margin: "5px 0 0 0", fontWeight: "bold" }}>
                                    {data.companyname || "KAILTECH TEST AND RESEARCH CENTRE PVT. LTD."}
                                </h2>
                            </td>
                        </tr>
                        <tr>
                            <td colSpan={2} style={{ textAlign: "center", paddingTop: 10, border: "none" }}>
                                <b style={{ fontSize: 15, textTransform: "uppercase" }}>CREDIT NOTE</b>
                            </td>
                        </tr>
                    </tbody>
                </table>
            )}

            {/* TOP INFO */}
            <table style={s.table}>
                <tbody>
                    <tr>
                        <td style={{ ...s.td, width: "60%" }}>
                            <div style={s.bold}>Customer:</div>
                            <div>M/s. {data.customername}</div>
                            {data.address && <div>{data.address}{data.city && `, ${data.city}`}{data.pincode && `, ${data.pincode}`}</div>}
                            <div style={{ marginTop: 8 }}>
                                <span style={{ display: "inline-block", width: "65%" }}><span style={s.bold}>State name :</span> {stateName}</span>
                                <span style={{ display: "inline-block", width: "35%" }}><span style={s.bold}>State code :</span> {stCode || "NA"}</span>
                            </div>
                            <div style={{ marginTop: 4 }}>
                                <span style={{ display: "inline-block", width: "65%" }}><span style={s.bold}>GSTIN/UIN :</span> {data.gstno}</span>
                                <span style={{ display: "inline-block", width: "35%" }}><span style={s.bold}>PAN :</span> {data.pan}</span>
                            </div>
                        </td>
                        <td style={{ ...s.td, width: "40%" }}>
                            <div><span style={s.bold}>Credit Note No. :</span> {data.creditnoteno}</div>
                            <div><span style={s.bold}>Date :</span> {data.creditnotedate ? new Date(data.creditnotedate).toLocaleDateString("en-IN") : ""}</div>
                            <div><span style={s.bold}>Invoice No./ Date :</span> {data.invoiceno}</div>
                            {data.status == 2 && data.signed_qr_code && (
                                <div style={{ marginTop: 10 }}>
                                    <img src={`data:image/png;base64,${data.signed_qr_code}`} alt="QR Code" style={{ width: 100, height: 100 }} />
                                </div>
                            )}
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* ITEMS LIST */}
            <table style={s.table}>
                <thead>
                    <tr>
                        <th style={{ ...s.th, width: "8%" }}>S. No.</th>
                        <th style={{ ...s.th, width: "52%" }}>Description</th>
                        <th style={{ ...s.th, width: "10%" }}>No&apos;s</th>
                        {data.potype === "Normal" && <th style={{ ...s.th, width: "15%" }}>Rate</th>}
                        {data.potype === "Normal" && <th style={{ ...s.th, width: "15%" }}>Amount</th>}
                    </tr>
                </thead>
                <tbody>
                    {(data.items || []).map((item, idx) => (
                        <tr key={idx}>
                            <td style={{ ...s.td, ...s.tC }}>{idx + 1}</td>
                            <td style={s.td} dangerouslySetInnerHTML={{ __html: item.description }}></td>
                            <td style={{ ...s.td, ...s.tC }}>{item.qty || item.quantity || 1}</td>
                            {data.potype === "Normal" && <td style={{ ...s.td, ...s.tC }}>{item.rate}</td>}
                            {data.potype === "Normal" && <td style={{ ...s.td, ...s.tR }}>{f2(item.amount)}</td>}
                        </tr>
                    ))}
                    {/* Pad to ensure table looks full if desired, or skip */}
                </tbody>
            </table>

            {/* TOTALS AND REMARKS */}
            <table style={s.table}>
                <tbody>
                    <tr>
                        <td style={{ ...s.td, width: "60%", wordBreak: "normal" }}>
                            {data.status == 2 && (
                                <div style={{ marginBottom: 10 }}>
                                    <div style={{ wordBreak: "break-all" }}><span style={s.bold}>IRN No:</span> {data.irn}</div>
                                    <div><span style={s.bold}>Acknowledgment No:</span> {data.ack_no}</div>
                                    <div><span style={s.bold}>Acknowledgement Date:</span> {data.ack_dt}</div>
                                </div>
                            )}
                            {data.brnnos && <div style={{ marginBottom: 5, wordBreak: "break-word" }}><span style={s.bold}>BRN No :</span> {data.brnnos.split(',').join(', ')}</div>}
                            {data.remark && <div style={{ marginBottom: 5 }}><span style={s.bold}>Remark :</span> {data.remark}</div>}
                            <div style={{ marginTop: 10, lineHeight: 1.4 }}>
                                PAN : AADCK0799A<br />
                                GSTIN : 23AADCK0799A1ZV<br />
                                SAC Code : 998394 Category : Scientific and Technical Consultancy Services<br />
                                Udhyam Registration No. Type of MSME : 230262102537<br />
                                CIN NO.U73100MP2006PTC019006
                            </div>
                        </td>
                        <td style={{ ...s.td, width: "40%", padding: 0 }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", border: "none" }}>
                                <tbody>
                                    <tr>
                                        <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd" }}><span style={s.bold}>Subtotal</span></td>
                                        <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd", ...s.tR }}>{f2(data.subtotal)}</td>
                                    </tr>
                                    {data.discnumber > 0 && (
                                        <tr>
                                            <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd" }}>Discount ({data.discnumber}{data.disctype === "%" ? "%" : ""})</td>
                                            <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd", ...s.tR }}>{f2(data.discount)}</td>
                                        </tr>
                                    )}
                                    {data.witnesscharges > 0 && (
                                        <tr>
                                            <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd" }}>Witness Charges</td>
                                            <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd", ...s.tR }}>{f2(data.witnesscharges)}</td>
                                        </tr>
                                    )}
                                    {data.samplehandling > 0 && (
                                        <tr>
                                            <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd" }}>Sample Handling</td>
                                            <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd", ...s.tR }}>{f2(data.samplehandling)}</td>
                                        </tr>
                                    )}
                                    {data.sampleprep > 0 && (
                                        <tr>
                                            <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd" }}>Sample Prep</td>
                                            <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd", ...s.tR }}>{f2(data.sampleprep)}</td>
                                        </tr>
                                    )}
                                    {data.freight > 0 && (
                                        <tr>
                                            <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd" }}>Freight</td>
                                            <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd", ...s.tR }}>{f2(data.freight)}</td>
                                        </tr>
                                    )}
                                    {data.mobilisation > 0 && (
                                        <tr>
                                            <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd" }}>Mobilization</td>
                                            <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd", ...s.tR }}>{f2(data.mobilisation)}</td>
                                        </tr>
                                    )}
                                    <tr>
                                        <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd" }}><span style={s.bold}>Total</span></td>
                                        <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd", ...s.tR }}>{f2(data.subtotal2)}</td>
                                    </tr>
                                    {isSGST ? (
                                        <>
                                            <tr>
                                                <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd" }}>CGST {data.cgstper}%</td>
                                                <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd", ...s.tR }}>{f2(data.cgstamount)}</td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd" }}>SGST {data.sgstper}%</td>
                                                <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd", ...s.tR }}>{f2(data.sgstamount)}</td>
                                            </tr>
                                        </>
                                    ) : (
                                        <tr>
                                            <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd" }}>IGST {data.igstper}%</td>
                                            <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd", ...s.tR }}>{f2(data.igstamount)}</td>
                                        </tr>
                                    )}
                                    <tr>
                                        <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd" }}><span style={s.bold}>Total w/ Tax</span></td>
                                        <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd", ...s.tR }}>{f2(data.total)}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: "4px 8px" }}>Round off</td>
                                        <td style={{ padding: "4px 8px", ...s.tR }}>{f2(data.roundoff)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>

                    {/* FINAL ROW */}
                    <tr>
                        <td style={{ ...s.td, width: "60%" }}>
                            (IN WORDS): Rs. {numberToWords(Math.round(data.finaltotal || 0))} Only
                        </td>
                        <td style={{ ...s.td, width: "40%", padding: 0 }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", border: "none", height: "100%" }}>
                                <tbody>
                                    <tr>
                                        <td style={{ padding: "4px 8px" }}><span style={s.bold}>Total Credit Note</span></td>
                                        <td style={{ padding: "4px 8px", ...s.tR }}>{f2(Math.round(data.finaltotal || 0))}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* FOOTER / T&C */}
            <table style={{ ...s.table, border: "none" }}>
                <tbody>
                    <tr>
                        <td style={{ width: "60%", border: "none", padding: "0 10px 0 0", verticalAlign: "top" }}>
                            <div>For online payments - {data.bankaccountname ?? "Kailtech Test And Research Centre Pvt. Ltd."}</div>
                            <div>Bank Name : {data.bankname ?? "—"}, Branch Name : {data.bankbranch ?? "—"}</div>
                            <div>Bank Account No. : {data.bankaccountno ?? "—"}, A/c Type : {data.bankactype ?? "—"}</div>
                            <div>IFSC CODE: {data.bankifsccode ?? "—"}, MICR CODE: {data.bankmicr ?? "—"}</div>
                            <div style={{ marginTop: 10 }}>Certified that the particulars given above are true and correct.</div>
                        </td>
                        <td style={{ width: "40%", border: "none", textAlign: "left", verticalAlign: "bottom" }}>
                            <div style={{ marginBottom: 4 }}>For {(data.companyname || "Kailtech Test And Research Centre Pvt. Ltd.")}</div>
                            {(Number(data.status) === 1 || Number(data.status) === 2) && data.digital_sign && (
                                <div style={{ marginBottom: 5 }}>
                                    <img src={data.digital_sign} alt="Digital Signature" style={{ maxWidth: "250px", maxHeight: "100px", objectFit: "contain" }} />
                                </div>
                            )}
                            <div style={{ textDecoration: "underline", marginLeft: 2 }}>Authorised Signatory</div>
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* T&C */}
            <div style={{ marginTop: 20 }}>
                <div style={{ ...s.bold, textDecoration: "underline", marginBottom: 5 }}>Terms &amp; Conditions:</div>
                <ol style={{ paddingLeft: 20, margin: 0, fontSize: 10 }}>
                    <li>Cross Cheque/DD should be drawn in favour of Kailtech Test And Research Centre Pvt. Ltd. Payable at Indore.</li>
                    <li>Please attached bill details indicating Invoice No. Quotation no &amp; TDS deductions if any along with your payment.</li>
                    <li>As per existing GST rules. the GSTR-1 has to be filed in the immediate next month of billing. So if you have any issue in this tax invoice viz customer Name, Address, GST No., Amount etc, please inform positively in writing before 5th of next month, otherwise no such request will be entertained.</li>
                    <li>Payment not made with in 15 days from the date of issued bill will attract interest @ 24% P.A.</li>
                    <li>If the payment is to be paid in Cash pay to UPI <b>0795933A0099960.bqr@kotak</b> only and take official receipt. Else claim of payment, shall not be accepted.</li>
                    <li>Subject to exclusive jurisdiction of courts at Indore only.</li>
                    <li>Errors &amp; omissions accepted.</li>
                </ol>
            </div>

        </div>
    );
}
