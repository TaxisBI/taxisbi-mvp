INSERT INTO taxisbi.test_table
SELECT
    number AS id,
    concat('Name ', toString(number)) AS testname,
    today() AS created_date
FROM numbers(10);
