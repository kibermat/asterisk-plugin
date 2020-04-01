<?php

namespace Plugin\Server\Listener;

use Plugin\Server\Listener\AsteriskListener;
use Plugin\Server\Response;

use PAMI\Message\Event\NewConnectedLineEvent;
use PAMI\Message\Event\QueueMemberStatusEvent;
use PAMI\Message\Event\DeviceStateChangeEvent;
use PAMI\Message\Event\NewstateEvent;
use PAMI\Message\Event\PeerStatusEvent;
use PAMI\Message\Event\HangupEvent;
use PAMI\Message\Event\EventMessage;


class AsteriskPings extends AsteriskListener
{
    protected $socket;

    public function handle(EventMessage $event)
    {
        $response = $this->parser($event);

        $this->stream($response);
    }

    public function parser(EventMessage $event)
    {
        $response = new Response($event);
        $response->event = 'Ping';
        $response->setTarget(-1);

        if ($event instanceof DeviceStateChangeEvent && $event->getState() == 'RINGING') {
            $response->username = $event->getKey('Device');
            $response->status = 'Ring';
            // message
        } elseif ($event instanceof NewstateEvent && $event->getChannelState() >= 5) {
            $response->username = $event->getCallerIDNum();
            switch ($event->getChannelState()) {
                case 5:
                    $response->status = 'Ring';
                    break;
                case 6:
                    $response->status = 'Talk';
                    break;
            }
        } elseif ($event instanceof QueueMemberStatusEvent) {
            $interface = preg_match('/(\d)+/', $event->getKey('Interface'));

            if (!$interface) {
                return null;
            }
            if (intval($event->getKey('InCall') == 1)) {
                $response->status = 'Talk';
            } elseif (intval($event->getKey('Ringinuse') == 1)) {
                $response->status = 'Ring';
            } elseif (intval($event->getKey('Paused') == 1)) {
                $response->status = 'Talk';
            }
            $response->username = $interface[0];
//          print_r(var_export($event, true));
        } elseif ($event instanceof HangupEvent) {
            $response->username = $event->getCallerIDNum();
            $response->status = 'Online';
        } elseif ($event instanceof PeerStatusEvent) {
            $response->username = $event->getPeer();
            $response->status = $event->getPeerStatus();
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
            // message
        }

        return $response;

    }
}
