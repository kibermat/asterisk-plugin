<?php

namespace  Plugin\Server;

$config = include('config.inc');
$options = $config['asterisk'];


use PAMI\Client\Exception\ClientException;
use PAMI\Client\Impl\ClientImpl as PamiClient;
use PAMI\Message\Action\DeviceStateListAction;
use PAMI\Message\Action\OriginateAction;
use PAMI\Message\Response\ResponseMessage;
use Plugin\Server\Response;


class AsteriskCommand
{

    private $pamiClient;
    private $deviceChanel = 'SIP';

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

    /**
     * DeviceStateListAction
     * @return array (Response,)
     * @throws ClientException
     */
    public function getOperators()
    {
        $results = [];
        $originateMsg = new DeviceStateListAction();
        $events = $this->pamiClient->send($originateMsg)->getEvents();

        foreach ($events as $event) {
            if (preg_match('/'.$this->deviceChanel.'\/(\d+)/', $event->getKey('device'),$keys)) {
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
                $res->username = $res->operator;
                $res->event = 'Ping';
                array_push($results, $res);
            }
        }

        return $results;
    }

    /***
     * Call OriginateAction
     * @param $operator
     * @param $client
     * @throws ClientException
     */
    public function call($operator, $client) {
        $chanel = $this->deviceChanel.'/'.$operator;
        $originate = new OriginateAction($chanel);
        $originate->setCallerId($operator);
        $originate->setExtension($client);
        $originate->setPriority(1);
        $originate->setContext('from-internal');
        $originate->setVariable('SIPADDHEADER', 'Call-Info:\;answer-after=0');

        try {
            $this->pamiClient->send($originate);
        } catch (ClientException $e) {
            print_r('call ' . $e->getMessage() . PHP_EOL);
        }

    }

    /***
     * Take Call OriginateAction
     * @param $operator
     * @param $data
     * @return ResponseMessage
     * @throws ClientException
     */
    public function takeCall($operator, $data) {
        $chanel = $this->deviceChanel.'/'.$operator;
        $originate = new OriginateAction($chanel);
        $originate->setPriority(1);
        $originate->setData($data);
        $originate->setApplication('PickupChan');
        $originate->setCallerId($operator);
        $originate->setVariable('SIPADDHEADER', 'Call-Info:\;answer-after=0');

        return $this->pamiClient->send($originate);
    }
}