DROP TABLE IF EXISTS taxisbi.test_table;

CREATE TABLE taxisbi.test_table
(
    id UInt32,
    testname String,
    created_date Date
)
ENGINE = MergeTree
ORDER BY id;
