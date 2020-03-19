<?php
/**
 * Config AMI
 *
 *  sip: 1310, 1335, 1370
 *
 *  telnet 193.150.118.15 5038
 *  Action: Login
 *  Username: callcenter
 *  Secret: 01callC2020
 *
 * username=1310
 * secret=fhCZmeof8$
 *
 * username=1335
 * secret=fhCZmeof8$
 *
 * username=1370
 * secret=fhCZmeof8$
 *
 * Action: VoicemailUsersList
 *
 * 1380
 *
 */

return array(
    'socket' => 'tcp://127.0.0.1:1127',
    'websocket' => 'websocket://0.0.0.0:81',
    'asterisk' => array(
        'host' => '193.150.118.15',
        'scheme' => 'tcp://',
        'port' => 5038,
        'username' => 'callcenter',
        'secret' => '01callC2020',
        'connect_timeout' => 1000,
        'read_timeout' => 1000,
        'event_prefix' => 'Tf',
    )
);

