define([
    "jquery",
    "asterisk",
    "eventbus.min",
    "./slider",
    "./config"
], function ($, Asterisk, EventBus, slider, config) {
    $(function () {
        // $('body').asterisk('connected');

        //TODO function for debugging, replace with session
        function getParam(key) {
            var p = window.location.search;
            p = p.match(new RegExp(key + '=([^&=]+)'));
            return p ? p[1] : false;
        }

        var user = getParam('user');

        var openForm =  function(data) {
            if(window.D3Api === undefined) {
                return;
            }
            D3Api.showForm('ccenter/card/edit', null, {
                vars: {
                    PRIMARY: null,
                    actioncode: "cc_card_add",
                    PHONE: data.caller
                }
            });
        };

        Asterisk.connect({
            url: [`${config.websocket}/?user=${user}`], // ip-адрес вашего сервера
            openTimeout: 3000,
            login: user, // необходимо подставить логин текущего пользователя
            debugMode: true, // используем веб-телефон voice.js
            password: user, // необходимо подставить пароль пользователя
            callback: function (data) {
            }
        }, function(res) {
            console.log('callback>>> ' + res);
        });

        slider.setVisible(true);

        EventBus.addEventListener('ringStart', function (event) {
            var data = JSON.parse( event.target.data);
            slider.setOperator(data.user, 'ring');
            slider.render();
        }, Asterisk);

        EventBus.addEventListener('talkStart', function (event) {
            var data = JSON.parse(event.target.data);
            slider.setOperator(data.user, 'Talk');
            slider.render();
        }, Asterisk);

        EventBus.addEventListener('peerStatus', function (event) {
            var data = JSON.parse( event.target.data);
            slider.setOperator(data.username, data.status);
            slider.render();
            openForm(data);
        }, Asterisk);

        EventBus.addEventListener('missed', function (event) {
            var data = JSON.parse(event.target.data);
            slider.setEvents(data.user, data);
            slider.render();
        }, Asterisk);

    });
});
