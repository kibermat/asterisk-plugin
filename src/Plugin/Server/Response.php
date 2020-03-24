<?php

namespace Plugin\Server;

class Response
{
    public $id;
    public $origin;
    public $message;
    public $operator;
    public $client;
    public $event;
    public $username;
    public $status;
    public $time;

    public function __construct($event = null)
    {
        $this->time = \time();
        $this->origin = $event;
    }

    public function __destruct() {

    }

    public function get()
    {
        return get_object_vars($this);
    }

}