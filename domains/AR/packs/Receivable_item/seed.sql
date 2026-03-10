WITH seeded AS
(
    SELECT
        number,

        intDiv(number, 7) * 7 AS v_original_number,
        intDiv(number, 7) AS v_document_group_number,
        intDiv(intDiv(number, 7) * 7, 7) AS v_original_document_group_number,

        '100' AS v_client,
        toUInt16(2024 + (number % 2)) AS v_fiscal_year,
        concat('CUST', toString(100000 + (number % 4000))) AS v_customer_code,
        concat('INV', toString(1000000 + v_document_group_number)) AS v_document_number,
        leftPad(toString(if((number % 7) < 5, (number % 7) + 1, (number % 7) - 4)), 3, '0') AS v_document_line_item,
        if(number % 23 = 0, NULL, concat('Customer ', toString(100000 + (number % 4000)))) AS v_customer_desc,
        concat('C', toString(1000 + (number % 12))) AS v_company_code,
        if(number % 29 = 0, NULL, concat('Company ', toString(1000 + (number % 12)))) AS v_company_desc,
        (today() - toIntervalDay(number % 180)) AS v_posting_date,
        (today() - toIntervalDay(number % 180) + toIntervalDay((number % 45) + 1)) AS v_due_date,
        if(number % 3 = 0, (today() - toIntervalDay(number % 180) + toIntervalDay(number % 120)), NULL) AS v_clearing_date,
        toDecimal64(((number % 250000) / 100.0) + 10, 2) AS v_document_amount,
        if(number % 31 = 0, NULL, arrayElement(['USD', 'EUR', 'GBP'], (number % 3) + 1)) AS v_currency_code,

        '100' AS v_original_client,
        toUInt16(2024 + (v_original_number % 2)) AS v_original_fiscal_year,
        concat('C', toString(1000 + (v_original_number % 12))) AS v_original_company_code,
        concat('INV', toString(1000000 + v_original_document_group_number)) AS v_original_document_number,
        leftPad(toString(if((v_original_number % 7) < 5, (v_original_number % 7) + 1, (v_original_number % 7) - 4)), 3, '0') AS v_original_document_line_item

    FROM numbers(50000)
)

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
SELECT
    v_client AS Client,
    v_fiscal_year AS FiscalYear,
    v_company_code AS CompanyCode,
    v_document_number AS DocumentNumber,
    v_document_line_item AS DocumentLineItem,
    v_customer_code AS CustomerCode,
    v_customer_desc AS CustomerDesc,
    v_company_desc AS CompanyDesc,
    v_posting_date AS PostingDate,
    v_due_date AS DueDate,
    v_clearing_date AS ClearingDate,
    v_document_amount AS DocumentAmount,
    v_currency_code AS CurrencyCode,
    v_original_client AS OriginalSapClient,
    v_original_fiscal_year AS OriginalFiscalYear,
    v_original_company_code AS OriginalCompanyCode,
    v_original_document_number AS OriginalDocumentNumber,
    v_original_document_line_item AS OriginalDocumentLineItem,
    now() AS LoadTimestamp
FROM seeded;