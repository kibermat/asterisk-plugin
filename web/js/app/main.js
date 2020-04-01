define([
     "jquery",
    "asterisk",
    "eventbus.min",
    "voice.min",
    "panel.min",
    "app/slider",
    "app/config"
], function (
     $,
     Asterisk, EventBus, panel, voice,
     slider, config) {
    $(function () {
        // $('body').asterisk('connected');

        //TODO function for debugging, replace with session
        function getParam(key) {
            var p = window.location.search;
            p = p.match(new RegExp(key + '=([^&=]+)'));
            return p ? p[1] : false;
        }
        var operator = getParam(config.login);
        if (!operator) {
            return;
        }

        var openForm =  function(data) {
            if(!window || !window.D3Api) {
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
            url: [`${config.websocket}/?operator=${operator}`], // ip-адрес вашего сервера
            openTimeout: 3000,
            login: operator, // необходимо подставить логин текущего пользователя
            debugMode: true, // используем веб-телефон voice.js
            password: operator, // необходимо подставить пароль пользователя
            callback: function (data) {
            }
        }, function(res) {
        });

        EventBus.addEventListener('onOpen', function (event) {
            slider.setVisible(true);
        }, slider);

        EventBus.addEventListener('Ring', function (event) {
            var data = JSON.parse( event.target.data);
            slider.setOperator(data.operator, 'Ring');
            slider.changeChannel(data.operator, data.channel);
            slider.render();
        }, slider);

        EventBus.addEventListener('Talk', function (event) {
            var data = JSON.parse(event.target.data);
            slider.setOperator(data.operator, 'Talk');
            slider.render();
            openForm(data);
        }, slider);

        EventBus.addEventListener('Ping', function (event) {
            var data = JSON.parse( event.target.data);
            slider.setOperator(data.username, data.status);
            slider.render();
            console.log(data.username + ' ' + data.status);
        }, slider);

        EventBus.addEventListener('Missed', function (event) {
            var data = JSON.parse(event.target.data);
            slider.setEvents(data.operator, data);
            slider.render();
        }, slider);

        $(document).on("click", 'a.call_button', function(e) {
            Asterisk.wsSend('call',
                { phone: e.target.innerText }
            );
        });
        $(document).on("click", 'a.take_button', function(e) {
            Asterisk.wsSend('takeCall',
                { channel: e.target.getAttribute('data-phone') }
            );
        });

    });
});
