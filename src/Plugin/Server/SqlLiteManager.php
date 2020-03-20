<?php

namespace Plugin\Server;

use SQLite3;


class SqlLiteManager extends SQLite3
{
    function __construct()
    {
        $this->open('db/astra.db');
        $this->query('
                create table if not exists astra_history (
                    operator int, 
                    client int,
                    status int default null, 
                    create_time timestamp default current_timestamp
                )');
    }

    function insertHistory($operator, $client, $status)
    {
        $format = 'insert into astra_history (operator, client, status) values (%d, %d, %d)';
        $this->exec(sprintf($format, $operator, $client, $status));
    }
}

$db = new SqlLiteManager();
//$db->insertHistory(1310, 88800, 1);
