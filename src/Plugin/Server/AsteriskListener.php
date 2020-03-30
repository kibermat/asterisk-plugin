<?php

namespace Plugin\Server;

use PAMI\Message\Event\NewConnectedLineEvent;
use PAMI\Message\Event\QueueMemberStatusEvent;
use PAMI\Message\Event\DeviceStateChangeEvent;
use PAMI\Message\Event\NewchannelEvent;
use PAMI\Message\Event\NewstateEvent;
use PAMI\Message\Event\PeerStatusEvent;
use PAMI\Message\Event\QueueMemberEvent;
use PAMI\Message\Event\HangupEvent;
use PAMI\Message\Event\AgentsEvent;
use PAMI\Message\Action\OriginateAction;

use PAMI\Message\Event\EventMessage;
use PAMI\Listener\IEventListener;

use Plugin\Server\Response;
use Plugin\Server\SqlLiteManager;


class AsteriskListener implements IEventListener
{
    private $server;
    private $socket;
    private $db;

    public function __construct($config)
    {
        $this->server = null;
        $this->socket = $config['socket'];
        $this->db = new SqlLiteManager();
    }

    public function handle(EventMessage $event)
    {
        $response = $this->stream($event);

        if ($response instanceof Response and in_array($response->event, ['talkStart', 'ringStart'])) {
            $this->db->insertEvent(
                $response->id,
                $response->parent,
                $response->event,
                $response->channel,
                $response->status,
                $response->operator,
                $response->client);
        }
    }

    public function stream(EventMessage $event) {
        $response = new Response($event);
        $response->id = $event->getKey('uniqueid');
        $response->parent = $event->getKey('linkedid');
        $response->operator = $event->getKey('Exten');
        $response->event = $event->getName();
        $response->channel = $event->getKey('channel');

        if (!$response->id) {
            return null;
        }

        $response->setTarget($response->operator);
        // message
        $response->username = null;
        $response->status = null;

        if ($event instanceof NewchannelEvent) {
            $response->event = 'talkStart';
            $response->status = 'Talk';
            $response->client = $event->getExtension();
            $response->operator = $event->getCallerIDNum();
            if (!preg_match('/(\d)+/', $event->getExtension())) {
                return null;
            }
            // message
        }
        elseif ($event instanceof DeviceStateChangeEvent  && $event->getState() == 'RINGING') {
            $response->setTarget(-1);
            $response->operator = $event->getKey('Device');
            $response->event = 'ringStart';
            $response->status = 'Ring';
            // message
        }
        elseif ($event instanceof NewstateEvent  && $event->getChannelState() == 5) {
            $response->setTarget(-1);
            $response->event = 'ringStart';
            $response->status = 'Ring';
            $response->client = $event->getCallerIDNum();
            $response->operator = $event->getConnectedLineNum();
//          print_r(var_export($event, true));
        }
        elseif ($event instanceof PeerStatusEvent) {
            $response->setTarget(-1);
            $response->event = 'peerStatus';
            $response->status = $event->getPeerStatus();
            $response->username = $event->getPeer();
            switch ($response->status) {
                case 'Reachable':
                case 'Registered':
                    $response->status = 'Online';
                    break;
                case 'Unregistered' :
                case 'Rejected' :
                case 'Unknown' :
                case 'Lagged' :
                    $response->status = 'Offline';
                    break;
            }
            if (preg_match('/(\d)+/', $response->username, $peers)) {
                $response->operator = $peers[0];
            }
            // message
        }

        if (!$response->status) {
            return;
        }

        $instance = stream_socket_client($this->socket);
        fwrite($instance, json_encode($response->get()));

        print_r($response->operator . '>>> ' . $event->getName() .  PHP_EOL);

        return $response;

    }
}
