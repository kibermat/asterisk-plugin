<?php

namespace Plugin\Server;

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
    private $message;

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