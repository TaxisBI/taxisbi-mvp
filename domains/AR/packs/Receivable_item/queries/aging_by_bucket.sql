WITH
    {report_date:Date} AS report_date,

base AS
(
    SELECT
        DocumentAmount,
        dateDiff('day', DueDate, report_date) AS days_past_due
    FROM taxisbi.ar_receivable_item
    WHERE PostingDate <= report_date AND PostingDate >= toStartOfYear(report_date)
)

SELECT
    {{AGING_BUCKET_EXPR}} AS AgingBucket,
    {{AGING_BUCKET_ORDER_EXPR}} AS BucketOrder,
    sum(DocumentAmount) AS Balance
FROM base
GROUP BY AgingBucket, BucketOrder
ORDER BY BucketOrder, AgingBucket