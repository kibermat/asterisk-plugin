<?php

namespace Plugin\Server\Listener;

use PAMI\Message\Event\EventMessage;
use PAMI\Listener\IEventListener;

use Plugin\Server\Response;
use Plugin\Server\SqlLiteManager;


class AsteriskListener implements IEventListener
{
    protected $socket;

    public function __construct($config)
    {
        $this->socket = $config['socket'];
    }

    /**
     * @param Response|null $response
     * @return void
     */
    public function stream($response) {
        if (!($response instanceof Response) or !$response->getId()) {
            return;
        }

        $instance = stream_socket_client($this->socket);
        fwrite($instance, json_encode($response->get()));
        print_r($response->event . $response->operator . '>>> ' . $response->client . PHP_EOL);
    }

    /**
     * @param EventMessage $event
     * @throws \Exception
     * @return void
     */
    public function handle(EventMessage $event)
    {
        throw new \Exception('Implemented by child class');
    }

    /**
     * @param EventMessage $event
     * @return Response
     */
    public function parser(EventMessage $event) {
        return new Response($event);
    }
}
