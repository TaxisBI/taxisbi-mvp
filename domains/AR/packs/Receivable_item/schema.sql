-- Grain: one row per receivable document line item

DROP TABLE IF EXISTS taxisbi.ar_receivable_item;

CREATE TABLE taxisbi.ar_receivable_item
(
    Client LowCardinality(String),
    FiscalYear UInt16,
    CustomerCode Nullable(LowCardinality(String)),
    DocumentNumber String,
    DocumentLineItem String,

    CustomerDesc Nullable(String),

    CompanyCode Nullable(LowCardinality(String)),
    CompanyDesc Nullable(String),

    PostingDate Date,
    DueDate Date,
    ClearingDate Nullable(Date),

    DocumentAmount Decimal(18, 2),
    CurrencyCode Nullable(LowCardinality(String)),

    OriginalSapClient Nullable(LowCardinality(String)),
    OriginalFiscalYear Nullable(UInt16),
    OriginalCompanyCode Nullable(LowCardinality(String)),
    OriginalDocumentNumber Nullable(String),
    OriginalDocumentLineItem Nullable(String),

    LoadTimestamp DateTime
)
ENGINE = MergeTree
ORDER BY (
    CompanyCode, 
    PostingDate, 
    CustomerCode, 
    FiscalYear, 
    DocumentNumber, 
    DocumentLineItem
);