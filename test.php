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
use PAMI\Message\Action\QueuesAction as Action;

use Plugin\Server\Response;
use Plugin\Server\AsteriskListener;


$config = include('config.inc');

$options = $config['asterisk'];

$ws_worker = new Worker($config['websocket']);

$users = [];

$pamiClient = new PamiClient($options);

$pamiClient->registerEventListener(new AsteriskListener($config),
    function ($event) {
        return !($event instanceof VarSetEvent) &&
            !($event instanceof NewextenEvent);
    });


$pamiClient->open();

$originateMsg = new Action();
$originateMsg->setActionID(1111999);
print_r($pamiClient->send($originateMsg));


$ws_worker->onConnect = function ($connection) use (&$users) {
    $connection->onWebSocketConnect = function ($connection) use (&$users) {
        foreach ($users as $user) {
            $webconnection = $user;
            $response = new Response();
            $response->name = 'peerStatus';
            $response->user = $user;
            $response->username = $user;
            $response->status = 'Online';
            $webconnection->send(json_encode($response->get()));
        }
        // при подключении нового пользователя сохраняем get-параметр
        $user = $_GET['user'];
        $users[$user] = $connection;
        print_r('connected ' . $user . PHP_EOL);
    };
};

$ws_worker->onClose = function ($connection) use (&$users) {
    foreach ($users as $user) {
        $webconnection = $user;
        $response = new Response();
        $response->name = 'peerStatus';
        $response->user = $user;
        $response->username = $user;
        $response->status = 'Offline';
        $webconnection->send(json_encode($response->get()));
    }

    // удаляем параметр при отключении пользователя
    $user = array_search($connection, $users);
    unset($users[$user]);
    print_r('disconnect ' . $user . PHP_EOL);

//    if (count($users) == 0) {
//        global $pamiClient;
//        Timer::delAll();
//        $pamiClient->close();
//        echo('Worker>>> closed');
//    }

};
