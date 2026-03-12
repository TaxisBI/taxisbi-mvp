WITH
    toDate('2025-12-31') AS report_date,

base AS
(
    SELECT
        DocumentAmount,
        dateDiff('day', DueDate, report_date) AS days_past_due
    FROM taxisbi.ar_receivable_item
    WHERE PostingDate <= report_date and PostingDate >= '2025-01-01'
)

SELECT
    multiIf(
        days_past_due <= 0, 'Current',
        days_past_due <= 30, '1-30',
        days_past_due <= 60, '31-60',
        days_past_due <= 90, '61-90',
        '90+'
    ) AS AgingBucket,
    sum(DocumentAmount) AS Balance
FROM base
GROUP BY AgingBucket
ORDER BY AgingBucket