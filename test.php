<?php
require_once __DIR__ . '/vendor/autoload.php';


use PAMI\Client\Impl\ClientImpl as PamiClient;
use PAMI\Message\Event\EventMessage;
use PAMI\Message\Event\DialEvent;
use PAMI\Message\Event\VarSetEvent;
use PAMI\Message\Event\NewextenEvent;
use PAMI\Message\Event\NewstateEvent;
use PAMI\Message\Event\BridgeEnterEvent;
use PAMI\Message\Event\ExtensionStatusEvent;
use PAMI\Listener\IEventListener;
use PAMI\Message\Action\SIPShowRegistryAction;
use PAMI\Message\Action\OriginateAction;
use PAMI\Message\Event\NewchannelEvent;
use PAMI\Message\Event\HangupEvent;
use PAMI\Message\Event\OriginateResponseEvent;
use PAMI\Message\Action\AgentsAction;
use PAMI\Message\Action\DeviceStateListAction as Action;

use Plugin\Server\Response;
use Plugin\Server\AsteriskListener;
use Plugin\Server\AsteriskCommand;


$config = include('config.inc');

$options = $config['asterisk'];

$users = [];

$pamiClient = new PamiClient($options);

$pamiClient->registerEventListener(new AsteriskListener($config),
    function ($event) {
        return !($event instanceof VarSetEvent) &&
            !($event instanceof NewextenEvent);
    });

$cmd = new AsteriskCommand();

$pamiClient->open();

$results = $cmd->getOperators();

foreach ($results as $res) {
    print_r($res->get());
}


