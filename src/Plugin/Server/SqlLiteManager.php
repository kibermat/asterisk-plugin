<?php

namespace Plugin\Server;

use SQLite3;


class SqlLiteManager extends SQLite3
{
    public function __construct()
    {
        $db = __DIR__ . '/db/astra.db';
        $this->open($db);
        $this->exec('
               create table if not exists astra_status as
                    with cte(id, code) as (
                        select t.*
                        from (values (0, \'OFFLINE\'),
                                     (1, \'ONLINE\'),
                                     (10, \'TALK\'),
                                     (11, \'BUSY\'),
                                     (20, \'RING\'),
                                     (30, \'MISSING\')
                             ) as t)
                    select id, code
                    from cte    
        ');
        $this->exec('
                create table if not exists astra_events (
                    event text not null,
                    message text, 
                    status int not null, 
                    direction text, 
                    operator int default null,
                    client int default null,
                    create_time timestamp default current_timestamp,
                    foreign key(status) references astra_status(id)
                );
                create index if not exists astra_events_create_time ON astra_events(create_time);  
        ');
    }

    public function __destruct()
    {
        $this->close();
    }

    public function insertEvent($event, $message, $status, $operator = null, $client = null, $direction = null)
    {
        if (!$event or !($status and $this->getStatus($status))) {
            return false;
        }

        $format = 'insert into astra_events (event, message, status, direction, operator, client) 
                        values ( \'%s\', \'%s\', %d, \'%s\', %d, %d)';

        return $this->exec(sprintf($format, $event, substr($message, 0, 250),
            $this->getStatus($status), $direction, $operator, $client));
    }

    public function getStatus($code)
    {
        return $this->querySingle(sprintf('select id from astra_status where code = \'%s\' limit 1',
            strtoupper($code)), false);
    }
}

//$db = new SqlLiteManager();
//$db->insertEvent( 'event', 'ping ', 'ring', 1310, 8800, 'out');
//$db->getStatus('ring');
