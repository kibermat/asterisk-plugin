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


$pamiClient->registerEventListener(new AsteriskListener($config),
    function($event) {
        return !($event instanceof VarSetEvent) &&
            !($event instanceof NewextenEvent)
            ;
    });

$pamiClient->open();

$pamiClient->process();


$responses = $cmd->getOperators();

foreach ($responses as $response) {
    print_r($response);

}

$user = 1310;

$results = $dbManager->getEvents($user, 'talk');

while ($res = $results->fetchArray(SQLITE3_ASSOC)) {
    $res['event'] = 'missed';
}

//$originate = $cmd->call($user, 8800);


Worker::runAll();
