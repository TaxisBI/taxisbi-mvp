-- Grain: one row per receivable document line item

DROP TABLE IF EXISTS taxisbi.ar_receivable_item;

CREATE TABLE taxisbi.ar_receivable_item
(
    id UInt64,
    DocumentNumber String,
    DocumentLineItem String,

    CustomerCode Nullable(LowCardinality(String)),
    CustomerDesc Nullable(String),

    CompanyCode Nullable(LowCardinality(String)),
    CompanyDesc Nullable(String),

    PostingDate Date,
    DueDate Date,
    ClearingDate Nullable(Date),

    DocumentAmount Decimal(18, 2),
    CurrencyCode Nullable(LowCardinality(String))
)
ENGINE = MergeTree
ORDER BY (CompanyCode, CustomerCode, PostingDate, id);