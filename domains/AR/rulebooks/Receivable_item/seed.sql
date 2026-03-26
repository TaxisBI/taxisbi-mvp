INSERT INTO taxisbi.ar_receivable_item
(
    Client,
    FiscalYear,
    CompanyCode,
    DocumentNumber,
    DocumentLineItem,
    CustomerCode,
    CustomerDesc,
    CompanyDesc,
    PostingDate,
    DueDate,
    PaymentTerms,
    ClearingDate,
    DocumentAmount,
    CurrencyCode,
    OriginalSapClient,
    OriginalFiscalYear,
    OriginalCompanyCode,
    OriginalDocumentNumber,
    OriginalDocumentLineItem,
    LoadTimestamp
)
WITH documents AS
(
    SELECT
        number AS doc_id,
        '100' AS client,
        toUInt16(2024 + (number % 3)) AS fiscal_year,
        concat('C', toString(1000 + (number % 12))) AS company_code,
        if(number % 29 = 0, NULL, concat('Company ', toString(1000 + (number % 12)))) AS company_desc,
        concat('CUST', toString(7000000 + (cityHash64(number, 'cust_code') % 900000))) AS customer_code,
        if(number % 23 = 0, NULL, concat('Customer ', toString(500000 + (cityHash64(number, 'cust_desc') % 800000)))) AS customer_desc,
        if(number % 31 = 0, NULL, arrayElement(['USD', 'EUR', 'GBP'], (number % 3) + 1)) AS currency_code,
        arrayElement(['N15', 'N30', 'N60', 'N90'], (number % 4) + 1) AS payment_terms,
        toUInt16(toInt32(substring(arrayElement(['N15', 'N30', 'N60', 'N90'], (number % 4) + 1), 2))) AS payment_days,
        concat('INV', toString(1000000 + number)) AS document_number,
        (
            toDate(concat(toString(2024 + (number % 3)), '-01-01'))
            + toIntervalDay(cityHash64(number, 'posting_day_of_year') % 320)
        ) AS document_posting_date,
        toUInt8((number % 7) + 1) AS line_count
    FROM numbers(50001)
),
expanded AS
(
    SELECT
        d.doc_id,
        d.client,
        d.fiscal_year,
        d.company_code,
        d.company_desc,
        d.customer_code,
        d.customer_desc,
        d.currency_code,
        d.payment_terms,
        d.payment_days,
        d.document_number,
        d.document_posting_date,
        line_idx,
        leftPad(toString(line_idx + 1), 3, '0') AS document_line_item,
        if(
            line_idx = 0,
            0,
            1 + ((cityHash64(d.doc_id, 'posting_seed') + (line_idx * 7)) % 45)
        ) AS posting_offset_days
    FROM documents AS d
    ARRAY JOIN range(d.line_count) AS line_idx
)
SELECT
    client AS Client,
    fiscal_year AS FiscalYear,
    company_code AS CompanyCode,
    document_number AS DocumentNumber,
    document_line_item AS DocumentLineItem,
    customer_code AS CustomerCode,
    customer_desc AS CustomerDesc,
    company_desc AS CompanyDesc,
    (document_posting_date + toIntervalDay(posting_offset_days)) AS PostingDate,
    (
        document_posting_date
        + toIntervalDay(posting_offset_days)
        + toIntervalDay(payment_days)
    ) AS DueDate,
    payment_terms AS PaymentTerms,
    if(
        cityHash64(doc_id, line_idx, 'has_clearing') % 100 < 27,
        (
            document_posting_date
            + toIntervalDay(posting_offset_days)
            + toIntervalDay(payment_days)
            + toIntervalDay(
                least(
                    120,
                    toInt32(cityHash64(doc_id, line_idx, 'delay_a') % 41)
                    + toInt32(cityHash64(doc_id, line_idx, 'delay_b') % 41)
                    + toInt32(cityHash64(doc_id, line_idx, 'delay_c') % 41)
                )
            )
        ),
        NULL
    ) AS ClearingDate,
    toDecimal64(((cityHash64(doc_id, line_idx, 'amount') % 250000) / 100.0) + 10, 2) AS DocumentAmount,
    currency_code AS CurrencyCode,
    client AS OriginalSapClient,
    fiscal_year AS OriginalFiscalYear,
    company_code AS OriginalCompanyCode,
    document_number AS OriginalDocumentNumber,
    '001' AS OriginalDocumentLineItem,
    now() AS LoadTimestamp
FROM expanded;