DROP TABLE IF EXISTS taxisbi.ar_receivable_item;

CREATE TABLE taxisbi.ar_receivable_item
(
    id UInt32,
    DocumentNumber String,
    DocumentLineNumber String,
    CustomerCode nullable String,
    CustomerDesc nullable String,
    CompanyCode nullable String,
    CompanyDesc String,

    PostingDate Date,
    DueDate Date,
    ClearingDate nullable Date,
    ReportDate Date,
    
    DocumentAmount decimal(18, 2),
    CurrencyCode String
)
ENGINE = MergeTree
ORDER BY id;
