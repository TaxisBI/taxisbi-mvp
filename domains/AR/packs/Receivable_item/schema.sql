-- Grain: one row per receivable document line item

DROP TABLE IF EXISTS taxisbi.ar_receivable_item;

CREATE TABLE taxisbi.ar_receivable_item
(
    id UInt64,
    DocumentNumber String,
    DocumentLineItem String,

    CustomerCode nullable(LowCardinality(String)),
    CustomerDesc nullable String,

    CompanyCode nullable(LowCardinality(String)),
    CompanyDesc nullable String,

    PostingDate Date,
    DueDate Date,
    ClearingDate Nullable(Date),

    DocumentAmount Decimal(18, 2),
    CurrencyCode nullable(LowCardinality(String))
)
ENGINE = MergeTree
ORDER BY (CompanyCode, CustomerCode, PostingDate, id);