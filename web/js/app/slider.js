define(function () {

    'use strict';

    var template = `
            <div class="slider__wrapper hidden">
                <div class="slider__item slider__item-main" >
                   <div class="slider__item-content" 
                        style="padding: 80px 24px; height: 750px; background-color:rgba(0, 0, 0, 0.5);font-size: x-large;">
                    </div>
                </div>
            </div>
            <a class="slider__control slider__control_right " href="#" role="button"></a>
            <a class="slider__control slider__control_left slider__control_show" href="#" role="button"></a>`;

    var multiItemSlider = (function () {

        return function (selector, config) {
            var _mainElement = document.querySelector(selector),
                _mainElementWidth = _mainElement.style.width,
                _mainElementMinWidth = '40px';

            _mainElement.insertAdjacentHTML('afterbegin', template);
            // _mainElement.classList.remove('hidden');
            _mainElement.style.width = _mainElementMinWidth;

            var _sliderWrapper = _mainElement.querySelector('.slider__wrapper'), // обертка для .slider-item
                _sliderItems = _mainElement.querySelectorAll('.slider__item'), // элементы (.slider-item)
                _sliderMainContent = _mainElement.querySelector('.slider__item-main > .slider__item-content'),
                _sliderControls = _mainElement.querySelectorAll('.slider__control'), // элементы управления
                _sliderControlLeft = _mainElement.querySelector('.slider__control_left'), // кнопка "LEFT"
                _sliderControlRight = _mainElement.querySelector('.slider__control_right'), // кнопка "RIGHT"
                _wrapperWidth = parseFloat(getComputedStyle(_sliderWrapper).width), // ширина обёртки
                _itemWidth = parseFloat(getComputedStyle(_sliderItems[0]).width), // ширина одного элемента
                _positionLeftItem = 1, // позиция левого активного элемента
                _step = _itemWidth / _wrapperWidth * 100, // величина шага (для трансформации)
                _transform = -_step, // значение транфсофрмации .slider_wrapper default 0
                _items = []; // массив элементов

            var _operators = {};
            var _eventList = {};

            var _setVisible = function (isVisible) {
                if (isVisible) {
                    _mainElement.classList.remove('hidden');
                } else {
                    _mainElement.classList.add('hidden');
                }
            };

            var _getUserNum = function (name) {
                if (!name || !(~name)) {
                    return;
                }
                var num = name.match(/\d+/) || [name];

                return num[0];
            };

            var setOperator = function (name, status) {
                var num = _getUserNum(name);
                if (!num) {
                    return;
                }
                _operators[num] = status;
            };

            var setEvents = function (user, event) {
                var num = _getUserNum(user);
                if (!num) {
                    return;
                }
                _eventList[num] = event;
            };

            var _setMinSize = function() {
                _mainElement.style.width = _mainElementMinWidth;
            };

            // наполнение массива _items
            _sliderItems.forEach(function (item, index) {
                _items.push({ item: item, position: index, transform: 0, hidden: item.classList.contains('hidden') });
            });

            _sliderWrapper.style.transform = 'translateX(' + _step + '%)';

            var position = {
                getMin: 0,
                getMax: _items.length, // - 1
            };

            var _createNode = function (html, tag = 'li') {
                var tag = document.createElement(tag);
                tag.className = "slider__item-content-row";
                tag.innerHTML = html;
                return tag;
            };

            var _appendContent = function(html) {
                _sliderMainContent.append(_createNode(html));
            };

            var _render = function() {
                _sliderMainContent.innerHTML = '';

                for (var key in _operators) {
                    if (!_operators.hasOwnProperty(key)) {
                        continue;
                    }
                    _sliderMainContent.append(_createNode(key + ' : ' + _operators[key]), 'p');

                    for (var event in _eventList[key]) {
                        _sliderMainContent.append(_createNode(event.client + ' ' + event.status, 'li'));
                    }
                }
            };

            var _transformItem = function (direction) {
                if (direction === 'right') {
                    if ((_positionLeftItem + _wrapperWidth / _itemWidth - 1) >= position.getMax) {
                        return;
                    }
                    if (!_sliderControlLeft.classList.contains('slider__control_show')) {
                        _sliderControlLeft.classList.add('slider__control_show');
                    }
                    if (_sliderControlRight.classList.contains('slider__control_show') && (_positionLeftItem + _wrapperWidth / _itemWidth) >= position.getMax) {
                        _sliderControlRight.classList.remove('slider__control_show');
                    }
                    setTimeout(_setMinSize, 500);
                    _positionLeftItem++;
                    _transform -= _step;
                }
                if (direction === 'left') {
                    if (_positionLeftItem <= position.getMin) {
                        return;
                    }
                    _mainElement.style.width = _mainElementWidth;

                    if (!_sliderControlRight.classList.contains('slider__control_show')) {
                        _sliderControlRight.classList.add('slider__control_show');
                    }
                    if (_sliderControlLeft.classList.contains('slider__control_show') && _positionLeftItem - 1 <= position.getMin) {
                        _sliderControlLeft.classList.remove('slider__control_show');
                    }
                    _positionLeftItem--;
                    _transform += _step;
                }
                _sliderWrapper.style.transform = 'translateX(' + _transform*-1 + '%)';
            };

            // обработчик события click для кнопок "назад" и "вперед"
            var _controlClick = function (e) {
                _sliderWrapper.classList.remove('hidden');
                if (e.target.classList.contains('slider__control')) {
                    e.preventDefault();
                    var direction = e.target.classList.contains('slider__control_right') ? 'right' : 'left';
                    _transformItem(direction);
                }
            };

            var _setUpListeners = function () {
                // добавление к кнопкам "назад" и "вперед" обрботчика _controlClick для событя click
                _sliderControls.forEach(function (item) {
                    item.addEventListener('click', _controlClick);
                });
            };

            function initialize() {
                _setUpListeners();
            }

            // инициализация
            _setUpListeners();

            return {
                right: function () { // метод right
                    _transformItem('right');
                },
                left: function () { // метод left
                    _transformItem('left');
                },
                appendContent: function (html) {
                    _appendContent(html);
                },
                setVisible: _setVisible,
                render: _render,
                setOperator: setOperator,
                setEvents: setEvents
            }
        }
    }());

    return multiItemSlider('.slider');

});
