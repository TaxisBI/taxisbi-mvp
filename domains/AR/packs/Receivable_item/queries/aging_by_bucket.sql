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
    multiIf(
        (days_past_due <= 0), 'Current',
        (days_past_due >= 1) AND (days_past_due <= 30), '1-30',
        (days_past_due >= 31) AND (days_past_due <= 60), '31-60',
        (days_past_due >= 61) AND (days_past_due <= 90), '61-90',
        (days_past_due > 90), '91+',
        'Unbucketed'
    ) AS AgingBucket,
    multiIf(
        (days_past_due <= 0), 1,
        (days_past_due >= 1) AND (days_past_due <= 30), 2,
        (days_past_due >= 31) AND (days_past_due <= 60), 3,
        (days_past_due >= 61) AND (days_past_due <= 90), 4,
        (days_past_due > 90), 5,
        9999
    ) AS BucketOrder,
    sum(DocumentAmount) AS Balance
FROM base
GROUP BY AgingBucket, BucketOrder
ORDER BY BucketOrder, AgingBucket