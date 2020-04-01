<?php
require_once __DIR__ . '/vendor/autoload.php';

declare(ticks=1);

use PAMI\Client\Impl\ClientImpl as PamiClient;
use PAMI\Message\Event\HangupEvent;
use PAMI\Message\Event\NewchannelEvent;
use PAMI\Message\Event\NewstateEvent;
use PAMI\Message\Event\PeerStatusEvent;
use PAMI\Message\Event\QueueMemberStatusEvent;

use Workerman\Worker;
use Workerman\Lib\Timer;

use Plugin\Server\Listener\AsteriskActions;
use Plugin\Server\Listener\AsteriskPings;
use Plugin\Server\SqlLiteManager;
use Plugin\Server\AsteriskCommand;
use Plugin\Server\Response;


$config = include('config.inc');

$options = $config['asterisk'];

$ws_worker = new Worker($config['websocket']);

$ws_worker->count = 2;

$users = [];

$pamiClient = new PamiClient($options);
$dbManager = new SqlLiteManager();
$cmd = new AsteriskCommand();

$ws_worker->onWorkerStart = function() use (&$users, $pamiClient, $dbManager, $config) {
    // создаём локальный tcp-сервер, чтобы отправлять на него сообщения из кода нашего сайта
    $inner_tcp_worker = new Worker($config['socket']);
    // создаём обработчик сообщений, который будет срабатывать,
    // когда на локальный tcp-сокет приходит сообщение
    $inner_tcp_worker->onMessage = function($connection, $data) use (&$users, $dbManager) {
        $data = json_decode($data);
        if($data->target === -1) {
            foreach ($users as $user) {
                $webconnection = $user;
                $webconnection->send(json_encode($data));
            }
        } elseif (isset($users[$data->target])) {
            $webconnection = $users[$data->operator];
            $webconnection->send(json_encode($data));
        } else {
            $dbManager->insertEvent(
                $data->id,
                $data->parent,
                $data->event,
                $data->channel,
                'Missed',
                $data->operator,
                $data->client
            );
        }
    };

    $inner_tcp_worker->listen();

    $pamiClient->registerEventListener(new AsteriskPings($config),
        function($event) {
            return ($event instanceof QueueMemberStatusEvent) ||
                   ($event instanceof PeerStatusEvent) ||
                   ($event instanceof HangupEvent)
//                 ($event instanceof DeviceStateChangeEvent)
                ;
        });

    $pamiClient->registerEventListener(new AsteriskActions($config),
        function($event) {
            return ($event instanceof NewchannelEvent) ||
                   ($event instanceof NewstateEvent)
                ;
        });

    $pamiClient->open();
    $time_interval = 1;

    Timer::add($time_interval,
        function () use ($pamiClient) {
            $pamiClient->process();
        }
    );
};

$ws_worker->onConnect = function($connection) use (&$users, $dbManager, $cmd)
{
    $connection->onWebSocketConnect = function($connection) use (&$users, $dbManager, $cmd)
    {
        // при подключении нового пользователя сохраняем get-параметр
        $user = $_GET['operator'];

        if (!$user) {
            return;
        }
        $connection->id = $user;
        $responses = $cmd->getOperators();
        foreach ($responses as $response) {
            $connection->send(json_encode($response->get()));
        }

        $users[$user] = $connection;

        $results = $dbManager->getMissed(10);

        while ($res = $results->fetchArray(SQLITE3_ASSOC)) {
            if($user != intval($res['operator'])) {
                continue;
            }
            $res['event'] = 'Missed';
            $connection->send(json_encode($res));
        }

        print_r('connected ' . $user . PHP_EOL);
    };
};

$ws_worker->onMessage = function ($connection, $data) use ($cmd) {
    $req = json_decode($data);
    $data = $req->data;

    if ($req->method == 'call') {
       $cmd->call($connection->id, $data->phone);
    } elseif ($req->method == 'takeCall') {
       $cmd->takeCall($connection->id, $data->channel);
    }
};

$ws_worker->onClose = function($connection) use(&$users)
{
    // удаляем параметр при отключении пользователя
    $user = array_search($connection, $users);

    if (!$user) {
        return;
    }

    foreach ($users as $operator) {
        $webconnection = $operator;
        $response = new Response();
        $response->event = 'Ping';
        $response->operator = $operator;
        $response->username = $operator;
        $response->status = 'Offline';
        $webconnection->send(json_encode($response->get()));
    }

    unset($users[$user]);
    print_r('disconnect ' . $user . PHP_EOL);

//    if (count($users) == 0) {
//        Timer::delAll();
//        $pamiClient->close();
//        echo('Worker>>> closed');
//    }

};

Worker::runAll();
