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
                    with cte(id, code, label) as (
                        select t.*
                        from (values (0, \'OFFLINE\', \'Не в сети\'),
                                     (1, \'ONLINE\',  \'В сети\'),
                                     (10, \'TALK\',   \'Разговаривает\'),
                                     (11, \'BUSY\',   \'Занят\'),
                                     (20, \'RING\',   \'Звонок\'),
                                     (30, \'MISSED\', \'Пропущенный\')
                             ) as t)
                    select cast(id as int) as id, cast(code as text) as code, cast(label as text) as label
                    from cte    
        ');
        $this->exec('
                create table if not exists astra_events (
                    id text not null,
                    parent text,
                    event text not null,
                    сhannel text, 
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

    public function insertEvent($id, $parent, $event, $сhannel, $status, $operator = null, $client = null, $direction = null)
    {
        if (!$event or !$status or !$this->getStatus($status)) {
            return false;
        }
        $result = null;

        try {
            $format = 'insert into astra_events (id, parent, event, сhannel, status, direction, operator, client) 
                        values ( \'%s\', \'%s\',\'%s\', \'%s\', %d, \'%s\', %d, %d)';

            $result = $this->exec(sprintf($format, $id, $parent, strval ($event), substr($сhannel, 0, 250),
                $this->getStatus($status), $direction, $operator, $client));
        } catch (\Exception $e) {
            print_r('Ошибка insertEvent>>>' . $e->getMessage());
        }
        return $result;
    }

    public function getStatus($code)
    {
        if (!$code) {
            return;
        }
        return $this->querySingle(sprintf('select id from astra_status where code = \'%s\' limit 1',
            strtoupper($code)), false);
    }

    public function getEvents($operator, $status = null, $limit = 10)
    {
        $code = $this->getStatus($status);
        return $this->query(sprintf(
            'select e.*, s.code, s.label
                        from astra_events as e 
                            join astra_status as s on e.status = s.id
                        where e.operator = %d 
                              and (e.status = \'%s\' or \'%s\' == \'\')  
                              and e.create_time >= current_date 
                         order by e.create_time desc limit %d 
                              ', $operator, $code, $code, $limit));
    }

    public function getMissed($limit = 10)
    {
        return $this->query(sprintf(
            'with event as (
                    select e.*,
                           s.code,
                           s.label
                    from astra_events as e
                             join astra_status as s on e.status = s.id
                    where (s.code like \'MISSED\')
                      and e.event like \'Ring\'
                      and e.create_time >= current_date
                )
                select e.*, max(e.create_time) as max_create_time
                from event as e
                         left join astra_events a
                                   on a.operator = e.operator and 
                                   a.client = e.client and 
                                   a.status = e.status and 
                                   a.event like \'Talk\'
                where a.id is null
                group by e.operator, e.client, e.event limit %d ',  $limit));
    }
}

//$db = new SqlLiteManager();
//////$db->insertEvent( '11112', '1111', 'event', 'sip/1310 ', 'missed', 1310, 8891, 'out');
//////$db->getStatus('missed');
//////$results = $db->getMissed(3);
//////
//////while ($res = $results->fetchArray(SQLITE3_ASSOC)) {
//////    print_r(var_export($res, true));
//////}