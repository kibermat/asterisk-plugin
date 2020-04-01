<?php

namespace Plugin\Server;

use Plugin\Server\SqlLiteManager;


class Response
{
    public $id;
    public $parent;
    public $origin;
    public $channel;
    public $operator;
    public $client;
    public $event;
    public $username;
    public $status;
    public $time;

    public $target;
    private static $db;

    public function __construct($event = null)
    {
        $this->time = \time();
        $this->origin = $event;
        self::$db = new SqlLiteManager();
    }

    public function __destruct() {

    }

    public function save() {
        self::$db->insertEvent(
            $this->id,
            $this->parent,
            $this->event,
            $this->channel,
            $this->status,
            $this->operator,
            $this->client
        );
    }

    public function get()
    {
        return get_object_vars($this);
    }

    public function getId()
    {
        return $this->id;
    }

    public function getMessage()
    {
        return '';
    }

    public function setTarget($point)
    {
        $this->target = $point;
    }

    public function getTarget()
    {
        return $this->target ? $this->target : $this->operator;
    }
}