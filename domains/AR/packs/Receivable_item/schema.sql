-- Grain: one row per receivable document line item

DROP TABLE IF EXISTS taxisbi.ar_receivable_item;

CREATE TABLE taxisbi.ar_receivable_item
(
    Client LowCardinality(String),
    FiscalYear UInt16,
    CompanyCode LowCardinality(String),
    DocumentNumber String,
    DocumentLineItem LowCardinality(String),

    CustomerCode LowCardinality(String),
    CustomerDesc Nullable(String),

    CompanyDesc Nullable(String),

    PostingDate Date,
    DueDate Date,
    ClearingDate Nullable(Date),

    DocumentAmount Decimal(18, 2),
    CurrencyCode LowCardinality(Nullable(String)),

    OriginalSapClient LowCardinality(Nullable(String)),
    OriginalFiscalYear Nullable(UInt16),
    OriginalCompanyCode LowCardinality(Nullable(String)),
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