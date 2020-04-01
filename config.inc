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
 * Action: Originate
 * Channel: SIP/1310
 * Application: PickupChan
 * Data: SIP/1310-0000019a
 * Priority: 1
 * CallerId: 1310
 * Variable: SIPADDHEADER="Call-Info:\;answer-after=0"
 *
 */

putenv('TMP=' . __dir__ . '/temp');

return array(
    'php_extensions' => array(
        'php_pdo_sqlite',
        'php_sqlite3'
    ),
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
