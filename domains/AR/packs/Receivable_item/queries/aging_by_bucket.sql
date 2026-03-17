WITH
    {report_date:Date} AS report_date,

base AS
(
    SELECT
        DocumentAmount,
        dateDiff('day', DueDate, report_date) AS days_past_due
    FROM taxisbi.ar_receivable_item
    WHERE PostingDate <= report_date AND PostingDate >= toStartOfYear(report_date)
),

bucketed AS
(
    SELECT
        {{AGING_BUCKET_EXPR}} AS AgingBucket,
        {{AGING_BUCKET_ORDER_EXPR}} AS BucketOrder,
        sum(DocumentAmount) AS Balance
    FROM base
    GROUP BY AgingBucket, BucketOrder
),

bucket_dim AS
(
    SELECT
        tupleElement(bucket_row, 1) AS BucketOrder,
        tupleElement(bucket_row, 2) AS AgingBucket
    FROM
    (
        SELECT arrayJoin([
            {{AGING_BUCKET_DIM_ROWS}}
        ]) AS bucket_row
    )
)

SELECT
    bucket_dim.AgingBucket AS AgingBucket,
    bucket_dim.BucketOrder AS BucketOrder,
    coalesce(bucketed.Balance, 0) AS Balance
FROM bucket_dim
LEFT JOIN bucketed
    ON bucketed.BucketOrder = bucket_dim.BucketOrder
   AND bucketed.AgingBucket = bucket_dim.AgingBucket
ORDER BY BucketOrder, AgingBucket