<?php

namespace Plugin\Server\Listener;

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


class AsteriskActions extends AsteriskListener
{
    protected $socket;

    public function handle(EventMessage $event)
    {
        $response = $this->parser($event);
        
        $this->stream($response);

        if ($response instanceof Response and in_array($response->event, ['Talk', 'Ring', 'Missed'])) {
            $response->save();
        }
    }

    public function parser(EventMessage $event) {
        $response = new Response($event);
        $response->id = $event->getKey('uniqueid');
        $response->parent = $event->getKey('linkedid');
        $response->operator = $event->getKey('Exten');
        $response->channel = $event->getKey('Channel');

        if (!$response->id) {
            return null;
        }

        if ($event instanceof NewchannelEvent) {
            $response->event = 'Ring';
            $response->status = 'Ring';
            $response->client = $event->getExtension();
            $response->operator = $event->getCallerIDNum();
            if (!preg_match('/(\d)+/', $event->getExtension())) {
                return null;
            }
            // message
        }
        elseif ($event instanceof NewstateEvent  && $event->getChannelState() >= 5) {
            $response->event = 'Ring';
            $response->status = 'Ring';
            $response->client = $event->getCallerIDNum();
            $response->operator = $event->getConnectedLineNum();

            switch ($event->getChannelState()) {
                case 5:
                    $response->event = 'Ring';
                    $response->status = 'Ring';
                    break;
                case 6:
                    $response->event = 'Talk';
                    $response->status = 'Talk';
                    break;
            }
        }

        if (!$response->status) {
            return null;
        }

        $response->setTarget($response->operator);

//        print_r(var_export($response, true));

        return $response;

    }
}
