<?php
require_once __DIR__ . '/vendor/autoload.php';

declare(ticks=1);

use PAMI\Client\Impl\ClientImpl as PamiClient;
use PAMI\Message\Event\VarSetEvent;
use PAMI\Message\Event\NewextenEvent;

use Workerman\Worker;
use Workerman\Lib\Timer;

use Plugin\Server\AsteriskListener;
use Plugin\Server\Response;
use Plugin\Server\SqlLiteManager;
use Plugin\Server\AsteriskCommand;


$config = include('config.inc');

$options = $config['asterisk'];

$ws_worker = new Worker($config['websocket']);

$ws_worker->count = 2;

$users = [];

$pamiClient = new PamiClient($options);
$dbManager = new SqlLiteManager();
$cmd = new AsteriskCommand();

$ws_worker->onWorkerStart = function() use (&$users) {
    global $pamiClient;
    global $config;

    // создаём локальный tcp-сервер, чтобы отправлять на него сообщения из кода нашего сайта
    $inner_tcp_worker = new Worker($config['socket']);
    // создаём обработчик сообщений, который будет срабатывать,
    // когда на локальный tcp-сокет приходит сообщение
    $inner_tcp_worker->onMessage = function($connection, $data) use (&$users) {
        $data = json_decode($data);
        if (isset($users[$data->operator])) {
            $webconnection = $users[$data->operator];
            $webconnection->send(json_encode($data));
        } elseif($data->operator === -1) {
            foreach ($users as $user) {
                $webconnection = $user;
                $webconnection->send(json_encode($data));
            }
        }
    };

    $inner_tcp_worker->listen();

    $pamiClient->registerEventListener(new AsteriskListener($config),
        function($event) {
            return !($event instanceof VarSetEvent) &&
                   !($event instanceof NewextenEvent)
                ;
        });

    $pamiClient->open();

    $time_interval = 1;
    $timer_id = Timer::add($time_interval,
        function()
        {
            global $pamiClient;
            $pamiClient->process();
        }
    );

};

$ws_worker->onConnect = function($connection) use (&$users)
{
    $connection->onWebSocketConnect = function($connection) use (&$users)
    {
        global $dbManager, $cmd;

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

        $results = $dbManager->getEvents($user, 'ring');

        while ($res = $results->fetchArray(SQLITE3_ASSOC)) {
            $res['event'] = 'missed';
            $connection->send(json_encode($res));
        }

        print_r('connected ' . $user . PHP_EOL);
    };
};

$ws_worker->onMessage = function ($connection, $data) {
    global $cmd;

    $req = json_decode($data);
    $data = $req->data;

    if ($req->method == 'call') {
       $cmd->call($connection->id, $data->phone);
    }

};

$ws_worker->onClose = function($connection) use(&$users)
{
    foreach ($users as $user) {
        $webconnection = $user;
        $response = new Response();
        $response->event = 'peerStatus';
        $response->operator = $user;
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

Worker::runAll();
