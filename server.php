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


$config = include('config.inc');

$options = $config['asterisk'];

$ws_worker = new Worker($config['websocket']);

$ws_worker->count = 2;

$users = [];

$pamiClient = new PamiClient($options);

$db = new SqlLiteManager();

$ws_worker->onWorkerStart = function() use (&$users) {
    global $pamiClient;
    global $config;

    // создаём локальный tcp-сервер, чтобы отправлять на него сообщения из кода нашего сайта
    $inner_tcp_worker = new Worker($config['socket']);
    // создаём обработчик сообщений, который будет срабатывать,
    // когда на локальный tcp-сокет приходит сообщение
    $inner_tcp_worker->onMessage = function($connection, $data) use (&$users) {
        $data = json_decode($data);
        if (isset($users[$data->user])) {
            $webconnection = $users[$data->user];
            $webconnection->send(json_encode($data));
        } elseif($data->user === -1) {
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

//    $originateMsg = new Action();
//    $originateMsg->setActionID(1111999);
//    print_r(  $pamiClient->send($originateMsg) );

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
        global $db;
        foreach ($users as $user) {
            $webconnection = $user;
            $response = new Response();
            $response->name = 'peerStatus';
            $response->user = $user;
            $response->username = $user;
            $response->status = 'Online';
            $webconnection->send(json_encode($response->get()));
            $db->getEvents($user);
        }
        // при подключении нового пользователя сохраняем get-параметр
        $user = $_GET['user'];
        $users[$user] = $connection;
        print_r('connected ' . $user . PHP_EOL);
    };
};

$ws_worker->onClose = function($connection) use(&$users)
{
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

Worker::runAll();
