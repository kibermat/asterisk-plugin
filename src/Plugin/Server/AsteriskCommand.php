<?php

namespace  Plugin\Server;

$config = include('config.inc');
$options = $config['asterisk'];


use PAMI\Client\Impl\ClientImpl as PamiClient;
use PAMI\Message\Action\DeviceStateListAction;
use Plugin\Server\Response;

class AsteriskCommand
{

    private $pamiClient;

    public function __construct($event = null)
    {
        global $options;

        $this->pamiClient = new PamiClient($options);
        $this->pamiClient->open();
    }

    public function __destruct()
    {
        $this->pamiClient->close();
    }

    public function getOperators()
    {
        $results = [];
        $originateMsg = new DeviceStateListAction();
        $events = $this->pamiClient->send($originateMsg)->getEvents();

        foreach ($events as $event) {
            if (preg_match('/SIP\/(\d+)/', $event->getKey('device'), $keys)) {
                $res = new Response();

                $status = 'Offline';
                switch ($event->getKey('state')) {
                    case 'UNAVAILABLE' :
                        break;
                    case 'NOT_INUSE' :
                        $status = 'Online';
                        break;
                    case 'INUSE' :
                        $status = 'Talk';
                        break;
                    case 'BUSY' :
                        $status = 'Busy';
                        break;
                    case 'RINGING' :
                        $status = 'Ring';
                        break;
                }

                $res->origin = $event;
                $res->status = $status;
                $res->operator = array_pop($keys);
                $res->event = 'peerStatus';
                array_push($results, $res);
            }
        }

        return $results;
    }
}