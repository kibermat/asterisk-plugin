/*
 * asterisk.js
 * copy from oktel
 * version 0.0.1
 */

define(["eventbus.min"], function (EventBus) {
    let Asterisk = (function () {

        var self = this,
            debugMode = true,
            logStr = '';

        /**
         * log to console if debugMode == true
         */
        var log = function () {
            if (debugMode) {
                var d = new Date();
                var dd = d.getFullYear() + '-' + (d.getMonth() < 10 ? '0' : '') + d.getMonth() + '-' + (d.getDate() < 10 ? '0' : '') + d.getDate();
                var t = (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes() + ':' + (d.getSeconds() < 10 ? '0' : '') + d.getSeconds() + ':' +
                    (d.getMilliseconds() + 1000).toString().substr(1);
                logStr += dd + ' ' + t + ' | ';
                args = ['asterisk.js ' + t + ' |']
                for (var i = 0, j = arguments.length; i < j; i++) {
                    logStr += (typeof arguments[i] == 'object' ? JSON.stringify(arguments[i]) : arguments[i]) + ' | ';
                    args.push(arguments[i]);
                }
                logStr += "\n\n";
                try {
                    console.log.apply(console, args || []);
                } catch (e) {
                    debugMode = false;
                }
            }
        };

        /**
         * md5
         * @param str target
         * @return {String}
         */
        var md5 = function (str) {
            var xl;

            var rotateLeft = function (lValue, iShiftBits) {
                return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
            };

            var addUnsigned = function (lX, lY) {
                var lX4, lY4, lX8, lY8, lResult;
                lX8 = (lX & 0x80000000);
                lY8 = (lY & 0x80000000);
                lX4 = (lX & 0x40000000);
                lY4 = (lY & 0x40000000);
                lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
                if (lX4 & lY4) {
                    return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
                }
                if (lX4 | lY4) {
                    if (lResult & 0x40000000) {
                        return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
                    } else {
                        return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
                    }
                } else {
                    return (lResult ^ lX8 ^ lY8);
                }
            };

            var _F = function (x, y, z) {
                return (x & y) | ((~x) & z);
            };
            var _G = function (x, y, z) {
                return (x & z) | (y & (~z));
            };
            var _H = function (x, y, z) {
                return (x ^ y ^ z);
            };
            var _I = function (x, y, z) {
                return (y ^ (x | (~z)));
            };

            var _FF = function (a, b, c, d, x, s, ac) {
                a = addUnsigned(a, addUnsigned(addUnsigned(_F(b, c, d), x), ac));
                return addUnsigned(rotateLeft(a, s), b);
            };

            var _GG = function (a, b, c, d, x, s, ac) {
                a = addUnsigned(a, addUnsigned(addUnsigned(_G(b, c, d), x), ac));
                return addUnsigned(rotateLeft(a, s), b);
            };

            var _HH = function (a, b, c, d, x, s, ac) {
                a = addUnsigned(a, addUnsigned(addUnsigned(_H(b, c, d), x), ac));
                return addUnsigned(rotateLeft(a, s), b);
            };

            var _II = function (a, b, c, d, x, s, ac) {
                a = addUnsigned(a, addUnsigned(addUnsigned(_I(b, c, d), x), ac));
                return addUnsigned(rotateLeft(a, s), b);
            };

            var convertToWordArray = function (str) {
                var lWordCount;
                var lMessageLength = str.length;
                var lNumberOfWords_temp1 = lMessageLength + 8;
                var lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
                var lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
                var lWordArray = new Array(lNumberOfWords - 1);
                var lBytePosition = 0;
                var lByteCount = 0;
                while (lByteCount < lMessageLength) {
                    lWordCount = (lByteCount - (lByteCount % 4)) / 4;
                    lBytePosition = (lByteCount % 4) * 8;
                    lWordArray[lWordCount] = (lWordArray[lWordCount] | (str.charCodeAt(lByteCount) << lBytePosition));
                    lByteCount++;
                }
                lWordCount = (lByteCount - (lByteCount % 4)) / 4;
                lBytePosition = (lByteCount % 4) * 8;
                lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
                lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
                lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
                return lWordArray;
            };

            var wordToHex = function (lValue) {
                var wordToHexValue = "",
                    wordToHexValue_temp = "",
                    lByte, lCount;
                for (lCount = 0; lCount <= 3; lCount++) {
                    lByte = (lValue >>> (lCount * 8)) & 255;
                    wordToHexValue_temp = "0" + lByte.toString(16);
                    wordToHexValue = wordToHexValue + wordToHexValue_temp.substr(wordToHexValue_temp.length - 2, 2);
                }
                return wordToHexValue;
            };

            var x = [],
                k, AA, BB, CC, DD, a, b, c, d, S11 = 7,
                S12 = 12,
                S13 = 17,
                S14 = 22,
                S21 = 5,
                S22 = 9,
                S23 = 14,
                S24 = 20,
                S31 = 4,
                S32 = 11,
                S33 = 16,
                S34 = 23,
                S41 = 6,
                S42 = 10,
                S43 = 15,
                S44 = 21;

            // str = this.utf8_encode(str);
            x = convertToWordArray(str);
            a = 0x67452301;
            b = 0xEFCDAB89;
            c = 0x98BADCFE;
            d = 0x10325476;

            xl = x.length;
            for (k = 0; k < xl; k += 16) {
                AA = a;
                BB = b;
                CC = c;
                DD = d;
                a = _FF(a, b, c, d, x[k + 0], S11, 0xD76AA478);
                d = _FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
                c = _FF(c, d, a, b, x[k + 2], S13, 0x242070DB);
                b = _FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
                a = _FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
                d = _FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
                c = _FF(c, d, a, b, x[k + 6], S13, 0xA8304613);
                b = _FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
                a = _FF(a, b, c, d, x[k + 8], S11, 0x698098D8);
                d = _FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
                c = _FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
                b = _FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
                a = _FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
                d = _FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
                c = _FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
                b = _FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
                a = _GG(a, b, c, d, x[k + 1], S21, 0xF61E2562);
                d = _GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
                c = _GG(c, d, a, b, x[k + 11], S23, 0x265E5A51);
                b = _GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
                a = _GG(a, b, c, d, x[k + 5], S21, 0xD62F105D);
                d = _GG(d, a, b, c, x[k + 10], S22, 0x2441453);
                c = _GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
                b = _GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
                a = _GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
                d = _GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
                c = _GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
                b = _GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
                a = _GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
                d = _GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
                c = _GG(c, d, a, b, x[k + 7], S23, 0x676F02D9);
                b = _GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
                a = _HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
                d = _HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
                c = _HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
                b = _HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
                a = _HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
                d = _HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
                c = _HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
                b = _HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
                a = _HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
                d = _HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
                c = _HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
                b = _HH(b, c, d, a, x[k + 6], S34, 0x4881D05);
                a = _HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
                d = _HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
                c = _HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
                b = _HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
                a = _II(a, b, c, d, x[k + 0], S41, 0xF4292244);
                d = _II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
                c = _II(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
                b = _II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
                a = _II(a, b, c, d, x[k + 12], S41, 0x655B59C3);
                d = _II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
                c = _II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
                b = _II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
                a = _II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
                d = _II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
                c = _II(c, d, a, b, x[k + 6], S43, 0xA3014314);
                b = _II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
                a = _II(a, b, c, d, x[k + 4], S41, 0xF7537E82);
                d = _II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
                c = _II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
                b = _II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
                a = addUnsigned(a, AA);
                b = addUnsigned(b, BB);
                c = addUnsigned(c, CC);
                d = addUnsigned(d, DD);
            }

            var temp = wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);

            return temp.toLowerCase();
        }

        var utf8Decode = function (str_data) {
            // http://kevin.vanzonneveld.net
            // +   original by: Webtoolkit.info (http://www.webtoolkit.info/)
            // +      input by: Aman Gupta
            // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
            // +   improved by: Norman "zEh" Fuchs
            // +   bugfixed by: hitwork
            // +   bugfixed by: Onno Marsman
            // +      input by: Brett Zamir (http://brett-zamir.me)
            // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
            // *     example 1: utf8_decode('Kevin van Zonneveld');
            // *     returns 1: 'Kevin van Zonneveld'
            var tmp_arr = [],
                i = 0,
                ac = 0,
                c1 = 0,
                c2 = 0,
                c3 = 0;

            str_data += '';

            while (i < str_data.length) {
                c1 = str_data.charCodeAt(i);
                if (c1 < 128) {
                    tmp_arr[ac++] = String.fromCharCode(c1);
                    i++;
                } else if (c1 > 191 && c1 < 224) {
                    c2 = str_data.charCodeAt(i + 1);
                    tmp_arr[ac++] = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
                    i += 2;
                } else {
                    c2 = str_data.charCodeAt(i + 1);
                    c3 = str_data.charCodeAt(i + 2);
                    tmp_arr[ac++] = String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                    i += 3;
                }
            }

            return tmp_arr.join('');
        }

        var utf8DecodePass = function (aa) {
            var bb = '', c = 0;
            for (var i = 0; i < aa.length; i++) {
                c = aa.charCodeAt(i);
                if (c > 127) {
                    if (c > 1024) {
                        if (c == 1025) {
                            c = 1016;
                        } else if (c == 1105) {
                            c = 1032;
                        }
                        bb += String.fromCharCode(c - 848);
                    }
                } else {
                    bb += aa.charAt(i);
                }
            }
            return bb;
        }

        var base64_decode = function base64_decode(data) {
            // http://kevin.vanzonneveld.net
            // +   original by: Tyler Akins (http://rumkin.com)
            // +   improved by: Thunder.m
            // +      input by: Aman Gupta
            // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
            // +   bugfixed by: Onno Marsman
            // +   bugfixed by: Pellentesque Malesuada
            // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
            // +      input by: Brett Zamir (http://brett-zamir.me)
            // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
            // -    depends on: utf8_decode
            // *     example 1: base64_decode('S2V2aW4gdmFuIFpvbm5ldmVsZA==');
            // *     returns 1: 'Kevin van Zonneveld'
            // mozilla has this native
            // - but breaks in 2.0.0.12!
            //if (typeof this.window['btoa'] == 'function') {
            //    return btoa(data);
            //}
            var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
            var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
                ac = 0,
                dec = "",
                tmp_arr = [];

            if (!data) {
                return data;
            }

            data += '';

            do { // unpack four hexets into three octets using index points in b64
                h1 = b64.indexOf(data.charAt(i++));
                h2 = b64.indexOf(data.charAt(i++));
                h3 = b64.indexOf(data.charAt(i++));
                h4 = b64.indexOf(data.charAt(i++));

                bits = h1 << 18 | h2 << 12 | h3 << 6 | h4;

                o1 = bits >> 16 & 0xff;
                o2 = bits >> 8 & 0xff;
                o3 = bits & 0xff;

                if (h3 == 64) {
                    tmp_arr[ac++] = String.fromCharCode(o1);
                } else if (h4 == 64) {
                    tmp_arr[ac++] = String.fromCharCode(o1, o2);
                } else {
                    tmp_arr[ac++] = String.fromCharCode(o1, o2, o3);
                }
            } while (i < data.length);

            dec = tmp_arr.join('');
            dec = utf8Decode(dec);

            return dec;
        }

        /**
         * Extending object
         * @param obj
         * @return {*}
         */
        var extend = function (obj) {
            var args = Array.prototype.slice.call(arguments, 1);
            each(args, function (arg, kk) {
                each(arg, function (a, prop) {
                    if (arg.hasOwnProperty(prop)) {
                        obj[prop] = a;
                    }
                });
            });
            return obj;
        };

        /**
         * Check if target is array
         * @param obj target
         * @return {Boolean}
         */
        var isArray = function (obj) {
            if (Array.isArray) {
                return Array.isArray(obj);
            } else {
                return Object.prototype.toString.call(obj) == '[object Array]';
            }
        }

        /**
         * Object cloning (don't work with functions) TODO: throw error if circular links
         * @param obj
         * @param useJSON
         * @return {*}
         */
        var cloneObject = function (obj, useJSON) { // don't work with functions as properties
            if (useJSON) {
                return JSON.parse(JSON.stringify(obj));
            } else {
                var c = {};
                for (var i in obj) {
                    if (obj.hasOwnProperty(i)) {
                        if (typeof obj[i] == 'object') {
                            c[i] = cloneObject(obj[i], false);
                        } else {
                            c[i] = obj[i];
                        }
                    }
                }
                return c;
            }
        };

        /**
         * Array's or object's size
         * @param obj
         * @return {*}
         */
        var size = function (obj) {
            obj = obj || [];
            if (isArray(obj)) {
                return obj.length;
            } else if (obj === Object(obj)) {
                if (Object.keys) {
                    return Object.keys(obj).length;
                } else {
                    var keysCount = 0;
                    for (var key in obj) if (Object.prototype.hasOwnProperty.call(obj, key)) {
                        keysCount++;
                    }
                    return keysCount;
                }
            }
            return false;
        };

        var breaker = {};
        /**
         * foreach with callback
         * @param obj
         * @param fn
         * @param context
         */
        var each = function (obj, fn, context) {
            if (obj == null) return;
            if (Array.prototype.forEach && obj.forEach === Array.prototype.forEach) {
                obj.forEach(fn, context);
            } else if (obj.length === +obj.length) {
                for (var i = 0, l = obj.length; i < l; i++) {
                    if (i in obj && fn.call(context, obj[i], i, obj) === breaker) return;
                }
            } else {
                for (var key in obj) {
                    if (Object.prototype.hasOwnProperty.call(obj, key)) {
                        if (fn.call(context, obj[key], key, obj) === breaker) return;
                    }
                }
            }
        }

        var trim = function (val) {
            return val.replace(/^\s+/, '').replace(/\s+$/, '');
        }

        /**
         * Format phone number
         * @param value
         * @return {String}
         */
        var formatPhone = function (value) {
            if (!value) {
                return '';
            }

            value = value.toString().split(';').join(',');

            var phones = value.split(',');

            for (var i = 0; i < phones.length; i++) {
                phones[i] = trim(phones[i]);
                var phone
                    , country = ""
                    , city = ""
                    , extra = "";

                if (phones[i] == "") {
                    continue;
                }

                if (phones[i].indexOf('(') != -1) {

                    var tmp = phones[i].split('(');
                    country = trim(tmp[0]);

                    tmp = tmp[1].split(')');
                    city = trim(tmp[0]);

                    var phone = trim(tmp[1]);
                    phone = phone.replace(/(.?[0-9]) ([0-9].?)/ig, "$1-$2");
                    phone = phone.replace(/(.?[0-9]) ([0-9].?)/ig, "$1-$2");

                    if (phone.indexOf('-') == -1) {

                        tmp = [phone.split(' ')[0], phone.split(' ').slice(1).join(' ')];
                        phone = trim(tmp[0]);
                        extra = trim(tmp[1]);

                        if (phone.length == 5) {
                            phone = phone.substr(0, 3) + "-" + phone.substr(3, 2);
                        }
                        if (phone.length == 6) {
                            phone = phone.substr(0, 2) + "-" + phone.substr(2, 2) + "-" + phone.substr(4, 2);
                        }
                        if (phone.length == 7) {
                            phone = phone.substr(0, 3) + "-" + phone.substr(3, 2) + "-" + phone.substr(5, 2);
                        }

                        if (extra != "") {
                            phone += ' ' + extra;
                        }
                    }

                } else {

                    phone = phones[i].split('+').join('');
                    phone = phone.replace(/(.?[0-9]) ([0-9].?)/ig, "$1-$2");
                    phone = phone.replace(/(.?[0-9]) ([0-9].?)/ig, "$1-$2");

                    var tmp = [phone.split(' ')[0], phone.split(' ').slice(1).join(' ')];
                    phone = trim(tmp[0]);
                    phone = phone.split('-').join('');
                    phone = phone.split('—').join('');
                    extra = trim(tmp[1]);

                    if (phone.length == 5) {
                        phone = phone.substr(0, 3) + "-" + phone.substr(3, 2);
                    } else if (phone.length == 6) {
                        phone = phone.substr(0, 2) + "-" + phone.substr(2, 2) + "-" + phone.substr(4, 2);
                    } else if (phone.length == 7) {
                        phone = phone.substr(0, 3) + "-" + phone.substr(3, 2) + "-" + phone.substr(5, 2);
                    } else if (phone.length == 9) {
                        city = phone.substr(0, 3);
                        phone = phone.substr(3, 2) + "-" + phone.substr(5, 2) + "-" + phone.substr(7, 2);
                    } else if (phone.length == 10) {
                        city = phone.substr(0, 3);
                        phone = phone.substr(3, 3) + "-" + phone.substr(6, 2) + "-" + phone.substr(8, 2);
                    } else if (phone.length == 11) {
                        country = phone.substr(0, 1);
                        city = phone.substr(1, 3);
                        phone = phone.substr(4, 3) + "-" + phone.substr(7, 2) + "-" + phone.substr(9, 2);
                    } else if (phone.length == 12) {
                        country = phone.substr(0, 2);
                        city = phone.substr(2, 3);
                        phone = phone.substr(5, 3) + "-" + phone.substr(8, 2) + "-" + phone.substr(10, 2);
                    } else if (phone.length == 13) {
                        country = phone.substr(0, 3);
                        city = phone.substr(3, 3);
                        phone = phone.substr(6, 3) + "-" + phone.substr(9, 2) + "-" + phone.substr(11, 2);
                    } else if (phone.length == 14) {
                        country = phone.substr(0, 4);
                        city = phone.substr(4, 3);
                        phone = phone.substr(7, 3) + "-" + phone.substr(10, 2) + "-" + phone.substr(12, 2);
                    }

                    if (extra != "") {
                        phone += ' ' + extra;
                    }
                }

                if (country == "8") {
                    country = "+7";
                }
                if (country[0] != "+" && country != "") {
                    country = "+" + country;
                }

                if (true) { // collect
                    var full = [];
                    if (country != "") {
                        full.push(country);
                    }
                    if (city != "") {
                        full.push("(" + city + ")");
                    }
                    if (phone != "") {
                        full.push(phone);
                    }

                    phones[i] = full.join(' ');
                }
            }

            value = phones.join(', ');
            return value;
        };

        /**
         * create new guid
         * @return {String}
         */
        var newGuid = function () {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        };

        var buildParams = function (obj) {
            if (typeof obj == 'object') {
                var str = '';
                each(obj, function (v, k) {
                    str += '&' + k + '=' + v.toString()
                });
                return str;
            }
            return false
        };

        /**
         * target is guid or not
         * @param str
         * @return {Boolean}
         */
        var isGuid = function (str) {
            if (typeof str == 'string' && (str.match(/[a-zA-Z0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12}/)) || (str.length == 32 && str.match(/[a-zA-Z0-9]{32}/))) {
                return true;
            }
            return false;
        };

        /**
         * call target if it is function
         * @param fn
         */
        var callFunc = function (fn) {
            if (typeof fn == 'function') fn.apply(undefined, Array.prototype.slice.call(arguments, 1));
        }

        var dateToIso = function (dt) {
            if (dt instanceof Date) {
                return dt.getFullYear() + '-' + (dt.getMonth() < 10 ? '0' + dt.getMonth() : dt.getMonth()) + '-' + (dt.getDate() < 10 ? '0' + dt.getDate() : dt.getDate());
            }
            return false;
        }

        var cookie = function (key, value, options) {
            // key and at least value given, set cookie...
            if (arguments.length > 1 && String(value) !== "[object Object]") {
                options = extend({}, options);

                if (value === null || value === undefined) {
                    options.expires = -1;
                }

                if (typeof options.expires === 'number') {
                    var seconds = options.expires, t = options.expires = new Date();
                    t.setSeconds(t.getSeconds() + seconds);
                }

                value = String(value);

                return (document.cookie = [
                    encodeURIComponent(key), '=',
                    options.raw ? value : encodeURIComponent(value),
                    options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
                    options.path ? '; path=' + options.path : '',
                    options.domain ? '; domain=' + options.domain : '',
                    options.secure ? '; secure' : ''
                ].join(''));
            }

            // key and possibly options given, get cookie...
            options = value || {};
            var result, decode = options.raw ? function (s) {
                return s;
            } : decodeURIComponent;
            return (result = new RegExp('(?:^|; )' + encodeURIComponent(key) + '=([^;]*)').exec(document.cookie)) ? decode(result[1]) : null;
        };

        var eventSplitter = /\s+/;
        var normalizeEventNames = function (eventNames) {
            if (typeof eventNames == 'string') {
                eventNames = eventNames.replace(/,/g, ' ').split(eventSplitter);
            } else if (isArray(eventNames) && eventNames.length > 0) {
                var eventsArray = [];
                for (var i = 0; i < eventNames.length; i++) {
                    var event = eventNames[i];
                    if (event && typeof event == 'string') {
                        eventsArray.push(event);
                    }
                }
                eventsNames = eventsArray;
            } else {
                return false;
            }
            return eventNames;
        };

        /**
         * Events object. For extending other objects
         * @type {Object}
         */

        var Events = {
            /**
             * Subscribe to events
             * @param eventNames
             * @param callback
             * @param context
             * @return {Boolean}
             */
            on: function (eventNames, callback, context) {
                eventNames = normalizeEventNames(eventNames);
                if (!eventNames || typeof callback != 'function') {
                    return false;
                }

                var calls = this._callbacks || (this._callbacks = {});
                each(eventNames, function (event, key) {
                    if (typeof event != 'string') {
                        return breaker;
                    }
                    var eventCalls = calls[event] || (calls[event] = []);
                    eventCalls.push({
                        callback: callback,
                        context: context
                    });
                });
                return true;
            },
            /**
             * Unsubscribe
             * @param eventNames to unsubscribe, if empty - unsubscribe from all events
             * @param callback to unsubscribe, if empty - unsubscribe from all eventNames
             * @return {Boolean}
             */
            off: function (eventNames, callback) {

                var calls = this._callbacks || (this._callbacks = {});

                if (!eventNames) {
                    calls = {};
                } else {
                    eventNames = normalizeEventNames(eventNames);
                    if (!eventNames) {
                        return false;
                    }

                    if (typeof callback == 'function') {
                        each(eventNames, function (event) {
                            if (typeof event != 'string') {
                                return;
                            }
                            each(calls[event], function (cl, i) {
                                if (cl && cl.callback === callback) {
                                    delete calls[event][i];
                                }
                            });
                        });
                    } else {
                        each(eventNames, function (event) {
                            delete calls[event];
                        });
                    }
                }
                return true;
            },
            /**
             * Trigger event with or without additional params
             * @param eventNames
             * @return {Boolean}
             */
            trigger: function (eventNames) {
                eventNames = normalizeEventNames(eventNames);
                var calls = this._callbacks || (this._callbacks = {});
                if (!eventNames) {
                    return false;
                }
                var args = Array.prototype.slice.call(arguments, 1);
                var allEventCalls = calls['all'];
                each(eventNames, function (event) {
                    var eventCalls = calls[event];
                    if (eventCalls) {
                        each(eventCalls, function (eventCall) {
                            if (eventCall && typeof eventCall.callback == 'function') {
                                eventCall.callback.apply(eventCall.context || undefined, args);
                            }
                        });
                    }
                    if (allEventCalls) {
                        var allEventArgs = [event].concat(args);
                        each(allEventCalls, function (eventCall) {
                            if (eventCall && typeof eventCall.callback == 'function') {
                                eventCall.callback.apply(eventCall.context || undefined, allEventArgs);
                            }
                        });
                    }
                });
                return true;
            },
            notify: function (eventNames, context) {
                eventNames = normalizeEventNames(eventNames);
                if (!eventNames) {
                    return false;
                }
                let event = new CustomEvent(eventNames, {detail: context, bubbles: true});
                self.dispatchEvent(event);
                return event;
            }
        };

        /**
         * class for connecting and working with browser's websocket API
         * @param url адрес сервера
         * @param openTimeout таймаут подключения
         * @param onOpenCallback коллбэк
         * @constructor
         */
        var Server = function (url, openTimeout, delayMin, delayMax, onOpenCallback) {
            var ws,
                wsArr = {},
                wsUrlRegexp = /^ws[s]{0,1}:\/\/\S+$/i,
                self = this,
                wsWasOpened = false,
                wsErrorConnection = false,
                callbacks = {},
                multiparts = {},
                AsteriskEventCallbacks = {},
                currentSessionSubscriptions = {},
                eventGroups = {
                    'dynamic': ['executemethod', 'cancelmethod'],
                    'dynamicwaitabort': ['executemethodwaitaborted'],
                    'chat': ['chatmessageviewed', 'chatmessage', 'chatmemberremoved', 'chatmemberadded', 'chatnamechanged', 'chatcreated'],
                    'dlgcard': ['dlgcard_showreserve', 'dlgcard_showconfirm', 'dlgcard_showformstop', 'dlgcard_showformdialog', 'dlgcard_closeall', 'dlgcard_closereserve', 'dlgcard_closeformreturnvalues', 'dlgcard_closeformreturncomment']
                };

            self.setQueryDelayMin(delayMin);
            self.setQueryDelayMax(delayMax);

            var parseUrls = function (urls) {
                if (!isArray(urls)) {
                    return false;
                }
                var needSecure = location.protocol == 'https:' ? true : false,
                    defaultPort = 80,
                    result = [];

                for (var i, l = urls.length; i < l; i++) {
                    if (typeof urls[i] != 'string') {
                        return false;
                    }
                    if (wsUrlRegexp.text(urls[i])) {
                        result.push(urls[i]);
                    } else {
                        var uArr = urls[i].split(':'),
                            host = uArr[0],
                            port = uArr[1];
                        if (!port) {
                            port = defaultPort;
                            result.push(host + ':' + '4066'); //
                        }
                        if (port == '443') {
                            needSecure = true;
                        }
                        result.push(host + ':' + port);
                    }
                }

                var prefix = needSecure ? 'wss://' : 'ws//';
                for (var i, l = result.length; i < l; i++) {
                    if (!wsUrlRegexp.text(urls[i])) {
                        result[i] = prefix + result[i];
                    }
                }
            };
            var n_onClose = function (a, b, c) {
            };
            var n_onError = function (a, b, c) {
            };
            var n_onError = function (a, b, c) {
            };
            var n_wasConnected = false;
            var n_onConnect = function (wsObj) {
                if (!n_wasConnected) {
                    n_wasConnected = true;
                    ws = wsObj;
                    // send ping, wait pong, redirect to secure if need
                    var qid = Math.random().toString();
                    ws.onmessage = function (evt) {

                        var data = JSON.parse(evt.data);

                        var afterSuccessConnect = function (finalWs) {
                            self.ws = finalWs;
                            finalWs.onmessage = onMessage;
                            finalWs.onclose = n_onClose;
                            finalWs.onerror = n_onError;
                            onOpen()
                        }

                        if (data[0] == 'websocketredirect') {
                            var wss = new WebSocket(wsObj.url.replace('ws://', 'wss://').replace(':4066', ':443'), 'json');
                            wss.onopen = function () {
                                afterSuccessConnect(wss);
                            }
                        } else if (data[1] && data[1].qid == qid) {
                            afterSuccessConnect(wsObj);
                        }
                    }
                    ws.send(JSON.stringify({method:'ping', data:{qid: qid}}));
                } else {
                    wsObj.close();
                }
            };

            self.n_connect = function () {
                var wsArr = [];
                var urls = parseUrls(url);
                for (var i, l = urls.length; i < l; i++) {
                    setTimeout(function () {
                        var ws = new WebSocket(urls[i]);
                        ws.onopen = function () {
                            n_onConnect(ws);
                        }
                        ws.onerror = function () {

                        }
                        ws.onclose = function () {

                        }
                    }, 1);
                }
            };

            self.url = url;

            var errorConnection = function () {
                if (!wsErrorConnection) {
                    wsErrorConnection = true;
                    self.trigger('errorConnection');
                }
            };

            var onOpen = function (evt) {
                wsWasOpened = true;
                if (typeof onOpenCallback == 'function') {
                    log('success connect to ' + ws.url);
                    onOpenCallback(ws.url);
                }
                EventBus.dispatch('onOpen', evt, null);
            };

            var onMessage = function (evt) {
                var data =  JSON.parse(evt.data);
                EventBus.dispatch(data.event, evt, data);
                triggerAsteriskEvent(data);
            };

            var onClose = function () {
                if (wsWasOpened) {
                    if (!wsErrorConnection) {
                        self.trigger('connectionClose');
                    }
                } else {
                    errorConnection();
                }
                currentSessionSubscriptions = {};
            };

            self.arrKeysInterval = [];
            self.connectErrorsCount = 0;

            self.multiConnect = function () {
                var maxErrors = 100;

                if (!isArray(url)) {
                    url = [url];
                }

                log('Multi connect start', url);

                url = url.slice(0, 10);
                each(url, function (curl, i) {

                    self.arrKeysInterval.push(
                        setInterval(function () {
                            if (self.getWebSocketState(wsArr[curl]) != 1 && self.connectErrorsCount <= maxErrors) {
                                self.connectErrorsCount++;
                                self.multiConnect();
                            }
                        }, openTimeout*10)
                    );

                    setTimeout(function () {
                        try {
                            wsArr[curl] = new WebSocket(curl);

                            log('trying to connect > ' + curl);

                            wsArr[curl].onopen = function (evt) {
                                wsArr[curl].wasOpened = true;
                                var qid = Math.random().toString();
                                // wsArr[curl].send(JSON.stringify({method: 'ping', data: {qid: qid}}));
                                wsArr[curl].onmessage = onMessage;
                                EventBus.dispatch('onOpen', evt, null);
                            };

                            setTimeout(function () {
                                // log('timeout for ' + curl + ' ' + self.getWebSocketState(wsArr[curl]));
                                if ((self.getWebSocketState(wsArr[curl]) != 1 && !wsArr[curl].wasOpened) || self.url != curl) {
                                    self.disconnect(wsArr[curl]);
                                    self.connectErrorsCount++;
                                }
                            }, openTimeout);

                        } catch (e) {
                            //log('exception for ' + curl);
                            if (self.connectErrorsCount == url.length) {
                                //log('trigger errorConnection for ' + curl);
                                self.connectErrorsCount = -url.length*2;
                                self.trigger('errorConnection', e);
                            }
                            self.connectErrorsCount++;

                            return breaker;
                        }

                    }, 1);

                });

                if (self.connectErrorsCount > url.length * maxErrors) {
                    self.arrKeysInterval.forEach(function (key) {
                        clearInterval(key);
                    });
                }

            };

            self.connect = function () {
                wsErrorConnection = false;
                try {
                    log('trying to connect >>>' + url);
                    ws = new WebSocket(url);

                    setTimeout(function () {
                        log('setTimeout >>>' + self.getWebSocketState());
                        if (self.getWebSocketState() == 0) {
                            self.disconnect();
                            errorConnection();
                        }
                    }, openTimeout);
                } catch (e) {
                    self.trigger('errorConnection', e);
                    return false;
                }

                ws.onopen = onOpen;
                ws.onmessage = onMessage;
                ws.onclose = onClose;
            };

            self.send = function (data, id, callback) {
                var d = JSON.parse(data);
                if (typeof callback == 'function') {
                    callbacks[id] = callback;
                }
                if (self.delayMin > 0) {
                    var timeout = self.delayMin;
                    if (delayMax) {
                        timeout = Math.round(Math.random() * Math.abs(self.delayMax - self.delayMin) + self.delayMin);
                    }
                    setTimeout(function () {
                        ws.send(data);
                    }, timeout);
                    return true
                } else {
                    return ws.send(data);
                }
            };

            self.sendAsterisk = function (method, body, callback) {
                body = body || {};
                var msg = new Array();
                msg.push(method);
                body.qid = Math.random().toString();
                msg.push(body);
                if (self.send(JSON.stringify(msg), msg[1].qid, callback) === false) {
                    callFunc(callback, {result: 0, errormsg: 'websocket send error'});
                }
            };

            self.wsSend = function (method, body, callback = null) {
                for (var curl in wsArr ) {
                    wsArr[curl].send(JSON.stringify({method: method, data: body}));
                }
            };

            self.execProc = function (procName, paramsObj, callback) {
                var msg = [
                    'execpredefineddbstoredproc',
                    extend({
                        qid: Math.random().toString(),
                        procedure: procName
                    }, paramsObj)
                ];
                self.send(JSON.stringify(msg), msg[1].qid, function (data) {
                    var items = [];
                    if (data.result == 1 && data.errorcode == 0) {
                        for (var i = 0; i < data.dataset.length; i++) {
                            var d = [];
                            items.push(d);
                            var keys = [];
                            for (var k = 0; k < data.dataset[i][0].length; k++) {
                                keys.push(data.dataset[i][0][k]);
                            }
                            for (var j = 1; j < data.dataset[i].length; j++) {
                                var item = {};
                                for (var f = 0; f < keys.length; f++) {
                                    item[keys[f]] = data.dataset[i][j][f];
                                }
                                d.push(item);
                            }
                        }
                    } else {
                        items = false;
                    }
                    callFunc(callback, items, data.dataset);
                });
            };

            self.bindAsteriskEvent = function (eventNames, callback) {
                eventNames = normalizeEventNames(eventNames);
                if (!eventNames || typeof callback != 'function') {
                    return false;
                }

                each(eventNames, function (event) {
                    if (!AsteriskEventCallbacks[event]) {
                        AsteriskEventCallbacks[event] = [];
                    }
                    AsteriskEventCallbacks[event].push(callback);
                });

                self.sendAsteriskEventSubscription(eventNames);

                return true;
            };

            var triggerAsteriskEvent = function (data) {
                if (AsteriskEventCallbacks && AsteriskEventCallbacks[data[0]]) {
                    log('<<< EVENT ' + data[0], data[1]);
                    each(AsteriskEventCallbacks[data[0]], function (callback) {
                        callFunc(callback, data[1]);
                    });
                }
            };

            self.sendAsteriskEventSubscription = function (eventNames, dontSend) {
                var self = this;
                eventNames = normalizeEventNames(eventNames)
                if (!eventNames) {
                    return false;
                }

                var toSend = [];

                each(eventNames, function (event) {
                    if (!currentSessionSubscriptions[event]) {
                        toSend.push(event)
                        if (isArray(eventGroups[event])) {
                            self.sendAsteriskEventSubscription(eventGroups[event], true);
                        }
                    }
                    if (dontSend) {
                        currentSessionSubscriptions[event] = true;
                    }
                });

                if (!dontSend && toSend.length) {
                    log('===> Event subscription', toSend);
                    self.sendAsterisk('subscribeevent', {eventmethod: toSend}, function (data) {
                        log('<=== Event subscribtion result: ' + data.result, toSend)
                        each(toSend, function (ev) {
                            currentSessionSubscriptions[ev] = true;
                        });
                    });
                }
            };

            /**
             * Unsubscribe from native event of Asterisk server
             * @param eventNames
             * @param callback
             * @return {Boolean}
             */
            self.unbindAsteriskEvent = function (eventNames, callback) {
                if (!eventNames) {
                    AsteriskEventCallbacks = {};
                } else {
                    eventNames = normalizeEventNames(eventNames);
                    if (!eventNames) {
                        return false;
                    }
                    callback = typeof callback == 'function' ? callback : false;

                    for (var i = 0; i < eventNames.length; i++) {
                        var event = eventNames[i];
                        if (callback) {
                            each(AsteriskEventCallbacks[event], function (cb, i) {
                                if (cb === callback) {
                                    delete AsteriskEventCallbacks[event][i];
                                }
                            });
                        } else {
                            delete AsteriskEventCallbacks[event];
                        }
                    }
                }
                return true;
            };

            self.reSendAsteriskEventSubscribtions = function () {

                var events = [];
                each(currentSessionSubscriptions, function (v, ev) {
                    if (v) {
                        events.push(ev);
                    }
                });

                if (events.length) {
                    self.sendAsterisk('subscribeevent', {eventmethod: events}, function (data) {

                    });
                }
            };

            self.disconnect = function (websocket) {
                websocket = websocket || ws;
                websocket.close();
                var status = self.getWebSocketState(websocket);
                if (status == 3 || status == 2) {
                    return true;
                } else {
                    return false;
                }
            };

            self.getWebSocketState = function (websocket) {
                websocket = websocket || ws;
                return websocket ? websocket.readyState : undefined;
            }
        };
        Server.prototype.setQueryDelayMin = function (delay) {
            delay = parseInt(delay);
            if (delay) {
                this.delayMin = delay;
            }
        };
        Server.prototype.setQueryDelayMax = function (delay) {
            delay = parseInt(delay);
            if (delay) {
                this.delayMax = delay;
            }
        };
        extend(Server.prototype, Events);

        var Abonent = function () {

        };

        var Asterisk = function (options) {
            var self = this,
                server,
                _AsteriskConnected = false,
                nativeEventsForBindAfterConnect = [],
                currentUrlIndex = 0,
                pingTimer,
                queueTimer,
                AsteriskOptions = {
                    openTimeout: 10000,
                    queryTimeout: 20000,
                    queueInterval: 5000,
                    AsteriskVoice: false
                },
                AsteriskVoice,
                sipPhone,
                sipPnoneActive = false,
                AsteriskInfo = {
                    redirectNumber: undefined,
                    allowedProcedures: {}
                },
                methodVersions = {
                    getmyuserinfo: {v: 120327, critical: true},
                    getversion: {v: 120112, critical: true},
                    pbxmakeflash: {v: 120725},
                    getextendedlineinfo: {v: 120112, critical: true},
                    getflashedabonentinfo: {v: 120112, critical: true},
                    saveredirectrules: {v: 120725},
                    deleteredirectrules: {v: 120725},
                    getredirectrules: {v: 120725},
                    pbxmaketransfer: {v: 120725},
                    triggercustomevent: {v: 120725},
                    getallusernumbers: {v: 120920},
                    cc_getlunchtypes: {v: 130101},
                    pbxanswercall: {v: 131218}
                },
                httpQueryData = {},
                cookieSessionName = '___Asterisksessionid',

                users = {},
                numbers = {},
                numbersById = {},
                connectionClosedByUser = false;

            var exportApi = function (name, fn, context) {
                if (!self[name] && typeof fn == 'function') {
                    self[name] = function () {
                        return fn.apply(context || self, arguments);
                    }
                }
            }

            var AsteriskConnected = function (connected) {
                if (connected !== undefined) {
                    if (connected) {
                        _AsteriskConnected = true;
                    } else {
                        _AsteriskConnected = false;
                    }
                }
                return _AsteriskConnected;
            }

            /**
             * Events
             * @type {*}
             */
            var events = extend({}, Events);

            /**
             * Return state of connection with websocket server
             * @return {Boolean}
             */
            var serverConnected = function () {
                if (server && server.getWebSocketState() == 1) {
                    return true;
                }
                return false;
            }

            /**
             * Return name of state if state found, or false
             * @param code of state
             * @param states Object with states ( key is code, val is state name )
             * @return {*}
             */
            var getStateByCode = function (code, states) {
                if (code === undefined || !size(states)) {
                    return false;
                }
                code = parseInt(code);
                var msg = '';
                each(states, function (scode, message) {
                    if (scode == code) {
                        msg = message.toLowerCase();
                    }
                });
                return msg;
            };

            /**
             * Convert target to array of strings
             * @param strings - string or array of string
             * @return {*} array or false
             */
            var toStringsArray = function (strings) {
                if (!strings || !(typeof strings == 'string' || typeof strings == 'number' || isArray(strings))) {
                    return false;
                }
                if (typeof strings == 'string' || typeof strings == 'number') {
                    strings = [strings.toString()];
                }
                var result = true;
                each(strings, function (s) {
                    if (typeof s != 'string') {
                        result = false;
                        return breaker;
                    }
                });
                if (!result) {
                    return false;
                } else {
                    return strings
                }
            }

            /**
             * Check Asterisk websocket method's version
             * @param method name
             * @return {Boolean} true if supported, false if not
             */
            var isValidMethodVersion = function (method) {
                if (AsteriskInfo.AsteriskDated && methodVersions[method] && AsteriskInfo.AsteriskDated < methodVersions[method].v) {
                    return false;
                }
                return true;
            };

//		var connectErrors = {
//			10: 'error',
//			11: 'ws login method return error',
//			12: 'desktop client is connected now',
//			13: 'wrong login/pass combination',
//			14: 'session is not exist and no password param',
//			15: 'error loading phone state',
//			16: 'error loading user state',
//			17: 'error loading user info',
//			18: 'error loading version info',
//			19: 'bad url param'
//			20: 'max online users count reached'
//		}
//		var getConnectErrorObj = function(code, msg) {
//			return { errorCode: code, errorMessage: connectErrors[code] + ( msg ? ' ' + msg : '') }
//		}

            /**
             * Possible disconnect reasons
             * @type {Object}
             */
            var disconnectReasons = {
                10: 'critical ws method not supported by this version of Asterisk server',
                11: 'error loading version info',
                12: 'websocket connection closed',
                13: 'disconnected by user',
                14: "can't login using Asterisk.connect"
            };

            /**
             * Return disconnect reason object
             * @param code from disconnectReasons
             * @param msg that will be concatenated to reason message
             * @return {Object}
             */
            var getDisconnectReasonObj = function (code, msg) {
                return {
                    code: code,
                    message: (disconnectReasons[code] + ' ' + (msg || '')) || ''
                }
            };

            /**
             * Possible errors
             * @type {Object}
             */
            var errorTypes = {
                // common
                1000: 'something goes wrong',
                // exec
                1101: 'method not supported by current Asterisk version',
                1102: 'server didnt understand method or response timeout',
                1103: 'error execute method',
                1104: 'bad method for execute',
                1105: 'error execute stored procedure',
                1106: 'bad params',
                // connect
                1200: 'cant connect to server',
                1201: 'error websocket connection',
                1202: 'error login\pass',
                1203: 'Asterisk version too old',
                1204: 'using Asterisk desktop client',
                1205: 'error url',
                1206: 'error loading version info',
                1207: 'error loading phone state',
                1209: 'error loading user state',
                1210: 'error loading user info',
                1211: 'login failure',
                1212: 'error connect using session',
                1213: 'no password or session',
                1214: 'max online users count reached, license limitation',
                1215: 'Asterisk service is not available',
                // call
                2001: 'user state - disconnected',
                2002: 'phone not connected',
                2101: 'user has hold call and is talking now',
                2102: 'user in conference now',
                2103: 'phone state not valid for call',
                2104: 'user state - busy',
                2105: 'calling number is talking with us',
                2106: 'bad number',
                2107: 'error autocall method call',
                2108: 'error user or phone state for call',
                // conference
                2201: 'no numbers to invite',
                2202: 'cant build conference from current call',
                2203: 'no number to create conference',
                2204: 'error conference method call',
                2205: 'bad user or phone state for creating conference',
                2206: 'cant invite hold abonent',
                2207: 'error inviting',
                2208: 'cant create conference while in callcenter in break',
                // transfer
                2301: 'error transfer method call',
                2302: 'bad user or phone state for transfer',
                2303: 'nothing to transfer',
                2304: 'bad number for transfer',
                // toggle
                2401: 'error toggle method executing',
                2402: 'nothing to toggle, no hold',
                // ghost modes
                2501: 'not in conference',
                2502: 'server retunred error while enabling ghost mode',
                2503: 'bad ghost mode',
                2504: 'bad userId or number',
                2505: 'error rigths',
                2506: 'user is not in ghost mode',
                2507: 'cant change ghost mode of this user',
                // flash
                2601: 'bad flash mode',
                2602: 'error while exec flash method',
                // queue
                2701: 'error while loading user queue',
                // change pass
                2801: 'wrong old password',
                2802: 'incorrect new password',
                2803: 'error while exec changepassword method on server',
                // answer
                2901: 'incorrect state',
                2902: 'phone probably does not support intercom calls',
                // uploadFile
                3001: 'error while getting temp pass',
                3002: 'aborted in beforeRequest callback function'

            };

            /**
             * Return error object
             * @param code from errorTypes
             * @param msg that will be added to errorMessage
             * @param obj that will extend return object
             * @return {*} error object
             */
            var getErrorObj = function (code, msg, obj) {
                code = parseInt(code);

                var errorObj = extend(obj || {}, {
                    result: false,
                    errorCode: code,
                    errorMessage: (errorTypes[code] ? errorTypes[code] : '') + (msg ? msg.toString() : '')
                });
                log('ERROR ' + code + ' ' + errorObj.errorMessage, errorObj);
                return errorObj;
            };

            /**
             * Return success object
             * @param obj that will extend return object
             * @return {*}
             */
            var getSuccessObj = function (obj) {
                var sObj = extend(obj || {}, {result: true});
                log('SUCCESS ', sObj)
                return sObj;
            };

            /**
             * Return object, that explain result of operation, error object or succec object
             * @param result - if true than return success object, else return error object
             * @param obj that will extend return object
             * @param errorCode error code from errorTypes
             * @param msg that concatenated to returning message
             * @return {*}
             */
            var getReturnObj = function (result, obj, errorCode, msg) {
                if (result) {
                    return getSuccessObj(obj);
                } else {
                    return getErrorObj(errorCode, msg, obj);
                }
            };

            var bindAsteriskEvent = function (eventNames, callback) {
                eventNames = normalizeEventNames(eventNames);
                evObjs = [];
                for (var i = 0; i < eventNames.length; i++) {
                    var event = eventNames[i];
                    var alreadyExist = false;
                    for (var j = 0; j < nativeEventsForBindAfterConnect.length; j++) {
                        var obj = nativeEventsForBindAfterConnect[j];
                        if (obj && obj.eventName == event && obj.callback === callback) {
                            alreadyExist = true;
                            break;
                        }
                    }
                    if (alreadyExist) {
                        eventNames[i] = undefined;
                    } else {
                        var evObj = {eventName: event, callback: callback};
                        nativeEventsForBindAfterConnect.push(evObj);
                        evObjs.push(evObj);
                    }
                }
                if (AsteriskConnected()) {
                    for (var i = 0; i < evObjs.length; i++) {
                        evObjs[i].binded = true;
                    }
                    server.bindAsteriskEvent(eventNames, callback);
                }
            }

            var unbindAsteriskEvent = function (eventNames, callback) {
                if (!eventNames) {
                    nativeEventsForBindAfterConnect = [];
                } else {
                    eventNames = normalizeEventNames(eventNames);
                    if (!eventNames) {
                        return false;
                    }
                    callback = typeof callback == 'function' ? callback : false;

                    for (var i = 0; i < eventNames.length; i++) {
                        var event = eventNames[i];
                        for (var j = 0; j < nativeEventsForBindAfterConnect.length; j++) {
                            var evObj = nativeEventsForBindAfterConnect[j];
                            if (evObj && evObj.eventName == event && ((callback && evObj.callback === callback) || !callback)) {
                                nativeEventsForBindAfterConnect[j] = undefined;
                            }
                        }
                    }
                }
                if (server) {
                    server.unbindAsteriskEvent(eventNames, callback);
                }
            }

            /**
             * Wrapper for server.sendAsterisk with userlogin setting
             * @param method name from Asterisk Websocket API
             * @param params for method
             * @param callback on Asterisk server answer
             */
            var sendAsterisk = function (method, params, callback) {
                var callbackFn = typeof params == 'function' ? params : callback
                if (serverConnected()) {
                    if (isValidMethodVersion(method)) {
                        params = size(params) ? params : {};
                        var params = extend({userlogin: AsteriskInfo.login}, params);
                        var errorTimer;
                        if (typeof callbackFn == 'function') {
                            var errorTimer = setTimeout(function () {
                                log('error timer for method ' + method);
                                callFunc(callbackFn, getErrorObj(1102, ': ' + method));
                            }, AsteriskOptions.queryTimeout);
                        }
                        server.sendAsterisk(method, params, function (data) {
                            clearTimeout(errorTimer);
                            log('<<<< ' + method, data);
                            callFunc(callbackFn, data);
                        });
                        log('>>>> ' + method, params);

                    } else {
                        callFunc(callbackFn, getErrorObj(1101, ' ' + method));
                        if (methodVersions[method].critical) {
                            disconnect(getDisconnectReasonObj(10), method);
                        }
                    }
                } else {
                    callFunc(callbackFn, getErrorObj(1201));
                }
            };

            /**
             * Call Asterisk websocket API method, that not return anything. sendAsterisk wrapper
             * @param method name
             * @param params for method
             */
            var sendAsteriskWithoutBackData = function (method, params) {
                if (!serverConnected()) {
                    return getErrorObj(1201);
                } else if (!isValidMethodVersion(method)) {
                    return getErrorObj(1101, ' ' + method);
                } else {
                    sendAsterisk(method, params, null, true);
                    return getSuccessObj();
                }
            };

            /**
             * execute websocket api method or permitted stored procedure on Asterisk server's db
             * @param method or procedure name
             * @param params
             * @param callback
             */
            var exec = function (method, params, callback) {
                var callbackFn = typeof params == 'function' ? params : callback;
                if (!method) {
                    callFunc(callbackFn, getErrorObj(1104));
                } else {
                    if (AsteriskInfo.allowedProcedures[method.toLowerCase()]) {
                        var p = {
                            userid: AsteriskInfo.userid,
                            userlogin: AsteriskInfo.login,
                            inputparams: params || {}
                        };
                        log('>>>> ' + method, p);
                        server.execProc(method, p, function (items, datasetRaw) {
                            var resultdata = {
                                result: false
                            };
                            if (items) {
                                resultdata.result = true;
                                resultdata.datasets = items;
                                resultdata.datasetsRaw = datasetRaw;
                            }
                            log('<<<< ' + method, resultdata);
                            callFunc(callbackFn, getReturnObj(resultdata.result, resultdata, 1105, ' ' + method));
                        });
                    } else {
                        if (!callbackFn) {
                            sendAsterisk(method, params);
                        } else {
                            sendAsterisk(method, params, function (data) {
                                var r = data.errorCode ? getReturnObj(data.result, data, data.errorCode) : getReturnObj(data.result, data, 1103, ' ' + method);
                                callFunc(callbackFn, r);
                            });
                        }
                    }
                }
            };
            exportApi('exec', exec);

            /**
             * Custom user events stuff
             * @type {*}
             */
            var customEvents = extend({
                /**
                 * Subscribe to all custom event on server
                 * @return {Boolean}
                 */
                sendCustomBinding: function () {
                    if (this._subscribed) {
                        return false;
                    }
                    this._subscribed = true;
                    var that = this;
                    server.bindAsteriskEvent('customevent', function (data) {
                        if (data && data.eventname) {
                            that.trigger(data.eventname, data.eventparam);
                        }
                    });
                },
                /**
                 * Trigger custom event through Asterisk server
                 * @param eventName
                 * @param recipients userid's array
                 * @param data to send with event
                 * @param send back event or not, used only if recipients array defined
                 */
                triggerCustomEvent: function (eventName, recipientsArr, data, sendBack) {
                    sendAsterisk('triggercustomevent', {
                        userid: AsteriskInfo.userid,
                        userlogin: AsteriskInfo.login,
                        eventname: eventName,
                        eventparam: data,
                        recipients: recipientsArr,
                        sendback: sendBack ? 1 : "0"
                    });
                }
            }, Events);
            exportApi('triggerCustomEvent', customEvents.triggerCustomEvent, customEvents);
            exportApi('offCustomEvent', customEvents.off, customEvents);
            exportApi('onCustomEvent', customEvents.on, customEvents);

            /**
             * Load users
             * @param callback
             */
            var loadUsers = function (callback) {
                sendAsterisk('getallusernumbers', {fillsubordinates: true}, function (data) {
                    if (data.result && data.users) {
                        each(data.users, function (u) {
                            users[u.id] = {
                                id: u.id,
                                name: u.name,
                                number: u.main || undefined,
                                numbers: u.nums || [],
                                //controlMe: u.controlMe ? true : false,
                                controlledByMe: u.sub ? true : false
                            };
                            users[u.id].numberObj = numbers[users[u.id].number] || undefined;
                            if (users[u.id].numberObj) {
                                users[u.id].numberObj.userid = u.id;
                                users[u.id].numberObj.userObj = users[u.id];
                            }
                        });
                        sendAsterisk("getalluserphotolink", {mode: "page"}, function (data) {
                            if (data.result) {
                                var servPath = getWebServerLink();
                                each(data.links, function (data) {
                                    var user = data.id == AsteriskInfo.userid ? AsteriskInfo : users[data.id];
                                    if (user) {
                                        user['avatarLink'] = data['link'] ? servPath + data['link32x32'] : AsteriskOptions.defaultAvatar || '';
                                        user['avatarLink32x32'] = data['link32x32'] ? servPath + data['link32x32'] : AsteriskOptions.defaultAvatar32x32 || '';
                                        user['avatarLink96x96'] = data['link96x96'] ? servPath + data['link96x96'] : AsteriskOptions.defaultAvatar64x64 || '';
                                    }
                                });
                            }

                            callFunc(callback);
                        });
                    } else {
                        callFunc(callback);
                    }
                });
            };

            /**
             * Is target user is controlled by me
             * @param target
             * @return {*}
             */
            var userControlledByMe = function (target) {
                if (!target) {
                    return false;
                } else if ((target = target.toString()) && users[target] && users[target].id) {
                    return users[target].controlledByMe;
                } else if (numbers[target] && numbers[target].userObj) {
                    return numbers[target].userObj.controlledByMe;
                } else {
                    return false;
                }
            };

            /**
             * Load number plan
             * @param callback
             */
            var loadPbxNumbers = function (callback) {
                sendAsterisk('getpbxnumbers', {mode: 'full'}, function (data) {
                    if (data.result && data.numbers) {
                        each(data.numbers, function (n) {
                            numbers[n.number] = n;
                            numbersById[n.id] = numbers[n.number];
                        });
                    }
                    callFunc(callback);
                });
            };

            /**
             * Return url of Asterisk web server
             * @return {*}
             */
            var getWebServerLink = function () {
                if (AsteriskInfo.currentUrl && AsteriskInfo.AsteriskWebServerPort) {
                    var protocol = AsteriskInfo.currentUrl.match(/^wss/) ? "https://" : "http://",
                        host = AsteriskInfo.currentUrl.match(/wss?:\/\/([^\s\/:]+)/)[1];
                    port = '';
                    if ((protocol == 'https://' && self.getMyInfo().AsteriskWebServerPort != '443') || (protocol == 'http://' && self.getMyInfo().AsteriskWebServerPort != '80')) {
                        port = ':' + self.getMyInfo().AsteriskWebServerPort;
                    }
                    return protocol + host + port;
                }
                return false;
            };

            /**
             * Set callback for http query
             * @param pass
             * @param onResultsEvent
             */
            var setHttpQueryCallback = function (pass, callback) {
                var self = this;
                if (pass) {
                    httpQueryData[pass] = {
                        time: (new Date()).getTime(),
                        callback: callback
                    }
                }
            }
            //exportApi('setHttpQueryCallback',setHttpQueryCallback);

            /**
             * Get password for http query
             * @param callback
             */
            var getHttpQueryPass = function (responsetowebsock, callback) {
                sendAsterisk('gettemphttppass', {responsetowebsock: responsetowebsock ? true : false}, function (data) {
                    if (data.result) {
                        callFunc(callback, getSuccessObj(data))
                    } else {
                        callFunc(callback, getErrorObj(1103, ' gettemphttppass', data))
                    }
                });
            }
            //exportApi('getHttpQueryPass',getHttpQueryPass);

            /**
             * Set up user avatar
             * @param filepath
             * @param callback
             */
            var setUserAvatar = function (filepath, callback) {
                if (!filepath) {
                    return;
                }

                var t = filepath.toString().split('.');
                if (t.length < 2 || ['jpg', 'gif', 'png', 'jpeg'].indexOf(t[t.length - 1]) == -1) {
                    return;
                }

                sendAsterisk('setmyuserphoto', {filepath: filepath}, function (data) {
                    callFunc(callback, getReturnObj(data.result, {}, 1103, ' setmyuserphoto'));
                });
            };
            exportApi('setUserAvatar', setUserAvatar);

            /**
             * Load my avatar
             * @param callback
             */
            var loadUserAvatar = function (callback) {
                var self = this;
                sendAsterisk('getuserphoto', {mode: 'page'}, function (data) {
                    if (data.result) {
                        var servPath = getWebServerLink();
                        AsteriskInfo['avatarLink'] = data['link'] ? servPath + data['link32x32'] : AsteriskOptions.defaultAvatar || '';
                        AsteriskInfo['avatarLink32x32'] = data['link32x32'] ? servPath + data['link32x32'] : AsteriskOptions.defaultAvatar32x32 || '';
                        AsteriskInfo['avatarLink96x96'] = data['link96x96'] ? servPath + data['link96x96'] : AsteriskOptions.defaultAvatar64x64 || '';

                        callFunc(callback, getSuccessObj({
                            avatarLink: AsteriskInfo['avatarLink'],
                            avatarLink32x32: AsteriskInfo['avatarLink32x32'],
                            avatarLink96x96: AsteriskInfo['avatarLink96x96']
                        }));
                    } else {
                        callFunc(callback, getErrorObj(1103, ' getuserphoto'));
                    }
                });
            };
            exportApi('getUserAvatar', loadUserAvatar);

            /**
             * Upload file to Asterisk webserver. jQuery used if exist, else pure javascript version called
             * @param storagemode - storage, temp, script or scriptplain
             * @param pathmode - absolute or relative
             * @param callback
             * @return
             */
            var uploadFile = function (options, callback, beforeRequest) {
                var $ = window.$ || window.jQuery || undefined;
                if (!$) {
                    return uploadFilePure.apply(self, arguments);
                }

                var accept = options.accept;
                delete options.accept;
                if (accept) {
                    if (!isArray(accept)) {
                        accept = [accept];
                    }
                    accept = 'accept="' + accept.join(',') + '"';
                } else {
                    accept = '';
                }

                var rid = Math.random().toString().replace('.', ''),
                    frameId = '_Asteriskjs_user_avatar_frame_' + rid,
                    formId = '_Asteriskjs_user_avatar_form_' + rid,
                    inputId = '_Asteriskjs_user_profile_select_file_' + rid;

                $('body').append('<iframe width="0" height="0" id="' + frameId + '" name="' + frameId + '"></iframe>');
                $('body').append('<form enctype="multipart/form-data" target="' + frameId + '" id="' + formId + '" action="" method="post">' +
                    '<input style="visibility: hidden;" type="file" ' + accept + ' name="file" id="' + inputId + '" /></form>');

                var callCallback = function (data) {
                    $('#' + formId).remove();
                    $('#' + frameId).remove();
                    callFunc(callback, data);
                }

                $('#' + inputId).change(function (e) {

                    var file = $(e.currentTarget).val();

                    if (!file) {
                        return;
                    }

                    var fileName = file.replace('/', '\\').split('\\');
                    fileName = fileName[fileName.length - 1];

                    if (typeof beforeRequest == 'function' && beforeRequest(getSuccessObj({fileName: fileName})) === false) {
                        callCallback(getErrorObj(3002));
                        return;
                    }

                    getHttpQueryPass(true, function (data) {

                        if (data.result) {

                            $("#" + formId).attr("action", getWebServerLink() + "/upload?temppass=" + data.password + buildParams(options));

                            setHttpQueryCallback(data.password, function (data) {
                                var r = /uploadfilesresult count="1"[\s\S]+?path="([\s\S]+?)"/,
                                    path = r.exec(data);

                                if (!path || !path[1]) {
                                    return false
                                }

                                path = path[1].replace(/\\/g, '/');

                                callCallback(getSuccessObj({path: path}));
                            });

                            $('#' + formId).submit()
                        } else {
                            callCallback(getErrorObj(3001));
                        }

                    });
                });


                $('#' + inputId).click()


            };

            /**
             * Upload file to Asterisk webserver. Pure javascript version
             * @param storagemode - storage, temp, script or scriptplain
             * @param pathmode - absolute or relative
             * @param callback
             * @return
             */
            var uploadFilePure = function (options, callback) {
                var rid = Math.random().toString().replace('.', ''),
                    frameId = '_Asteriskjs_user_avatar_frame_' + rid,
                    formId = '_Asteriskjs_user_avatar_form_' + rid,
                    inputId = '_Asteriskjs_user_profile_select_file_' + rid;

                var accept = options.accept;
                delete options.accept;
                if (accept) {
                    if (!isArray(accept)) {
                        accept = [accept];
                    }
                    accept = 'accept="' + accept.join(',') + '"';
                } else {
                    accept = '';
                }

                var iframe = document.createElement('iframe');
                iframe.id = frameId;
                iframe.name = frameId;
                iframe.width = 0;
                iframe.height = 0;
                document.body.appendChild(iframe);

                var form = document.createElement('form');
                form.id = formId;
                form.style.display = 'none';
                form.target = frameId;
                form.enctype = "multipart/form-data";
                form.action = '';
                form.method = 'post';
                document.body.appendChild(form);

                var input = document.createElement('input');
                input.style.visibility = 'hidden';
                input.type = 'file';
                input.id = inputId
                input.name = 'file';
                input.accept = accept;
                form.appendChild(input);

                var callCallback = function (data) {
                    var elem;
                    (elem = document.getElementById(frameId)).parentNode.removeChild(elem);
                    (elem = document.getElementById(formId)).parentNode.removeChild(elem);
                    callFunc(callback, data);
                }


                input.onchange = function () {
                    var file = input.value;

                    if (!file) {
                        return;
                    }

                    var fileName = file.replace('\\', '/').split('/');
                    fileName = fileName[fileName.length - 1];

                    if (typeof beforeRequest == 'function' && beforeRequest(getSuccessObj({fileName: fileName})) === false) {
                        callCallback(getErrorObj(3002));
                        return;
                    }

                    getHttpQueryPass(true, function (data) {
                        if (data.result) {
                            form.action = getWebServerLink() + "/upload?temppass=" + data.password + '&' + buildParams(options);

                            setHttpQueryCallback(data.password, function (data) {
                                var r = /uploadfilesresult count="1"[\s\S]+?path="([\s\S]+?)"/,
                                    path = r.exec(data);

                                if (!path || !path[1]) {
                                    return false
                                }

                                path = path[1].replace(/\\/g, '/');

                                callCallback(getSuccessObj({path: path}));
                            });

                            form.submit();
                        } else {
                            callCallback(getErrorObj(3001));
                        }
                    });
                }

                input.click();

            };
            exportApi('uploadFile', uploadFile);

            var DynamicMethods = (function () {
                function DynamicMethods(Asterisk, server) {
                    var self = this;
                    self.Asterisk = Asterisk;
                    self.server = server;
                    self.currentMethods = {};
                    self.methodTimers = {};
                    self.onExecuteMethod = function (data) {
                        if (!data.executionid) {
                            return false;
                        }
                        self.currentMethods[data.executionid] = true;
                        Asterisk.trigger('')
                    };
                    self.onCancelMethod = function (data) {
                        if (!data.executionid) {
                            return false;
                        }
                        delete self.currentMethods[data.executionid];
                    };
                    self.onExecuteMethodWaitAborted = function (data) {
                        if (!data.executionid) {
                            return false;
                        }
                        self.currentMethods[data.executionid] = true;
                        self.methodTimers[data.executionid] = setTimeout(function () {
                            delete self.currentMethods[data.executionid];
                        }, data.waitresponsems);
                    };
                };
                DynamicMethods.prototype.init = function (server) {
                    var self = this;
                    self.server.bindAsteriskEvent('dynamic', function () {
                    });
                    self.server.bindAsteriskEvent('dynamicwaitabort', function () {
                    });
                    self.server.bindAsteriskEvent('executemethod', self.onExecuteMethod, self);
                    self.server.bindAsteriskEvent('cancelmethod', self.onCancelMethod, self);
                    self.server.bindAsteriskEvent('executemethodwaitaborted', self.onExecuteMethodWaitAborted, self);
                }
                DynamicMethods.prototype.sendMethodResult = function (executionId, data) {
                    var self = this;
                    if (self.currentMethods[executionId]) {
                        delete self.currentMethods[executionId];
                        sendAsterisk('methodresult', {executionid: executionId, outputparameters: data || {}});
                    } else {
                        return false;
                    }
                }
                DynamicMethods.prototype.reset = function () {
                    var self = this;
                    self.currentMethods = {};
                    for (var id in self.methodTimers) {
                        if (self.methodTimers.hasOwnProperty(id)) {
                            clearTimeout(self.methodTimers[id]);
                        }
                    }
                    self.server.unbindAsteriskEvent('executemethod', self.onExecuteMethod);
                    self.server.unbindAsteriskEvent('cancelmethod', self.onCancelMethod);
                    self.server.unbindAsteriskEvent('executemethodwaitaborted', self.onExecuteMethodWaitAborted);

                }
                return DynamicMethods;
            })();
            extend(DynamicMethods.prototype, Events);
            // TODO bindAsterisk or self.server.bindAsteriskEvent ?
            var dynamicMethods = new DynamicMethods()


            /**
             * USER STATES
             * @type {Object}
             */
            var userStates = extend({}, Events, {
                _stateId: 0,
                states: {
                    DISCONNECTED: 0,
                    READY: 1,
                    BREAK: 2,
                    OFF: 3,
                    BUSY: 5,
                    RESERVED: 6,
                    NOPHONE: 7
                },
                webStates: {
                    READY: 1, //'Ready for calls',
                    DND: 2, //'DND',
                    REDIRECT: 3, //'Redirect', not in callcenter
                    BREAK: 4 // break, only in callcenter
                },
                onCallCenter: 0,
                _onRedirect: false,
                _status: 0,
                _webStateId: 0,
                onBreak: 0,
                breakReasons: {},

                loadBreakReasons: function (callback) {
                    var that = this;
                    sendAsterisk('cc_getlunchtypes', {}, function (data) {
                        if (data.result) {
                            each(data.items, function (r) {
                                that.breakReasons[r.id.toString()] = r;
                            });

                        }
                        callFunc(callback, getReturnObj(data.result, data, 1103, ' cc_getlunchtypes'));
                    });
                },

                /**
                 * String name for state
                 * @param code
                 * @return {*}
                 */
                getStateStr: function (code) {
                    return getStateByCode(code === undefined ? this._stateId : parseInt(code), this.states);
                },

                /**
                 * String name for web state
                 * @param code
                 * @return {*}
                 */
                getWebStateStr: function (code) {
                    return getStateByCode(code === undefined ? this._webStateId : parseInt(code), this.webStates);
                },

                /**
                 * Получение состояния и локальное сохранение нового состояния
                 * Get or set current state
                 * @param newStateId
                 * @return {Number} current stateId
                 */
                state: function (newStateId) {
                    newStateId = parseInt(newStateId);
                    if (this.getStateStr(newStateId) && this._stateId !== newStateId) {
                        log('SET USER STATE ' + newStateId + ' ' + this.getStateStr(newStateId));
                        this._stateId = newStateId;
                        this.trigger('userStateChange', this._stateId);
                    }
                    return this._stateId;
                },

                /**
                 * Change states through change stateid on server or enabling redirect on server. Also save local states
                 * @param newWebState
                 * @param silent - if true, then event statusChange API event
                 * @param message - lunch reason message in callcenter
                 * @return {Boolean}
                 */
                changeStates: function (newWebState, silent, message) {
                    newWebState = this.webStates[newWebState.toString().toUpperCase()] || parseInt(newWebState);

                    if (!this.getWebStateStr(newWebState)) {
                        return false;
                    }

                    if ((newWebState == this._webStateId && !this.setAfterBusy) || !serverConnected()) {
                        return false;
                    }
                    var userState = this.state();
//				// set state, that was set while user was busy
//				if ( userState == this.states.BUSY && this.setAfterBusy && this.setAfterBusy != newWebState ) {
//					newWebState = this.setAfterBusy;
//					this.setAfterBusy = false;
//				}

                    switch (newWebState) {
                        case 1:
                            if (userState == this.states.BUSY) {
                                this.setAfterBusy = this.webStates.READY;
                            } else {
                                sendAsterisk('setuserstate', {userstateid: 1});
                            }
                            break;
                        case 2:
                            if (userState == this.states.BUSY) {
                                this.setAfterBusy = this.webStates.DND;
                            } else {
                                if (userState == this.states.READY || userState == this.states.BREAK || userState == this.states.OFF) {
                                    sendAsterisk('setuserstate', {userstateid: 3});
                                }
                            }
                            break;
                        case 3:
                            if (this.getRedirectNumber()) {
                                this.enableUserRedirectState(true);
                            } else {
                                return false;
                            }
                            break;
                        case 4:
                            if (this.onCallCenter) { //&& ( userState == this.states.READY || userState == this.states.BREAK || userState == this.states.OFF ) ) {
                                var sObj = {userstateid: 2}, msg = '';
                                if (message) {
                                    if (this.breakReasons[message]) {
                                        sObj.lunchreasonid = message;
                                    } else {
                                        sObj.lunchreasonmsg = message;
                                    }
                                }
                                sendAsterisk('setuserstate', sObj);
                            }
                            break;
                    }

                    this.webState(newWebState, silent);
                    return true;
                },

                /**
                 * Save stateId local
                 * @param newStateId
                 * @param newStateId
                 * @param silent silent - if true, then event statusChange API event
                 * @return {Number}
                 */
                webState: function (newStateId, silent) {
                    if (newStateId !== undefined && this.getWebStateStr(newStateId) && this._webStateId != newStateId) {
                        log('SET WEB STATE ' + this.getWebStateStr(newStateId));
                        var oldStatus = this.getWebStateStr(this._webStateId);
                        this._webStateId = newStateId;
                        if (!silent) {
                            self.trigger('statusChange', this.getWebStateStr(this._webStateId), oldStatus);
                        }
                    }
                    return this._webStateId;
                },

                /**
                 * Get redirect state or save redirect state locally
                 * @param newState новое состояние переадресации
                 * @return {Boolean} текущее состояние переадресации
                 */
                onRedirect: function (newState) {
                    if (newState !== undefined) {
                        newState = newState ? true : false;
                        if (this._onRedirect !== newState) {
                            this._onRedirect = newState;
                            events.trigger('userOnRedirectChanged', this._onRedirect);
                        }
                    }
                    return this._onRedirect;
                },

                /**
                 * Load all states from server
                 */
                loadState: function (callback) {
                    var that = this;
                    sendAsterisk('getuserstate', {}, function (data) {
                        if (data.result) {
                            that.saveStatesFromServer(data);
                        }
                        callFunc(callback, getReturnObj(data.result, data, 1103, ' getuserstate'));
                    });
                },

                callCenterState: function (newState) {
                    if (newState !== undefined) {
                        newState = newState ? true : false;
                        if (this.onCallCenter !== newState) {
                            this.onCallCenter = newState;
                            self.trigger('callCenterStateChange', this.onCallCenter);
                        }
                    }
                    return this.onCallCenter;
                },

                /**
                 * Save and set all states locally
                 * @param data loaded from server {oncallcenter, onlunch, onredirect, userstateid}
                 */
                saveStatesFromServer: function (data) {
                    this.callCenterState(data.oncallcenter);
                    this.onBreak = data.onlunch;
                    this.onRedirect(data.onredirect);

                    var currentWebState = this.webState();
                    var currentState = this.state();
                    this.state(data.userstateid);
                    if (currentWebState == this.webStates.DND && this.setAfterBusy == this.webStates.DND && currentState == 5 && data.userstateid == 1) {
                        this.setAfterBusy = false;
                        this.changeStates(this.webStates.DND, true);
                        return;
                    }

                    this.setWebStateFromUserState();
                },

                setUserStateBusy: function () {
                    this.state(5);
                },

                /**
                 * Get redirect rule id for redirect state
                 * @return {String}
                 */
                getUserRedirectId: function () {
                    return md5(AsteriskInfo.userid.toLocaleLowerCase() + AsteriskInfo.userid.toLocaleLowerCase()).toLowerCase();
                },

                /**
                 * Get current redirect number
                 * @return {*} number or undefined
                 */
                getRedirectNumber: function () {
                    return AsteriskInfo.redirectNumber ? AsteriskInfo.redirectNumber : undefined;
                },

                /**
                 * Set redirect number locally
                 * @param number
                 * @return {*} object like {number:'564'} or undefined
                 */
                setRedirectNumber: function (number) {
                    AsteriskInfo.redirectNumber = number ? number : undefined;
                    return AsteriskInfo.redirectNumber;
                },

                /**
                 * Load redirect number from server and set it locally
                 * @param callback
                 */
                checkUserRedirect: function (callback) {
                    var that = this;
                    sendAsterisk("getredirectrules", {}, function (data) {
                        if (data.result) {
                            var rule;
                            if (data.redirectrules && data.redirectrules.length > 0) { // ищем наше правило
                                each(data.redirectrules, function (rule) {
                                    if (rule.id.replace(/-/g, '').toLowerCase() == that.getUserRedirectId()) {
                                        that.setRedirectNumber(rule.destinationnumber);
                                    }
                                });
                            }
                        }
                        callFunc(callback, getReturnObj(data.result, data, 1103, ' getredirectrules'));
                    });
                },

                /**
                 * Save redirect number
                 * @param number or empty if need to cancel redirect
                 * @param callback
                 */
                saveUserRedirect: function (number, callback) {
                    var that = this;
                    if (!number) {
                        sendAsterisk("deleteredirectrules", {ids: [this.getUserRedirectId()]}, function (data) {
                            if (data.result) {
                                that.setRedirectNumber(undefined);
                                if (that.webState() == that.webStates.REDIRECT) {
                                    that.changeStates(that.webStates.READY);
                                }
                            }
                            callFunc(callback, getReturnObj(data.result, data, 1103, ' deleteredirectrules'));
                        });

                    } else {
                        sendAsterisk("saveredirectrules", {
                            redirectrule: {
                                id: that.getUserRedirectId(),
                                caption: 'Переадресация сохраненная из веб-октела. Действует постоянно.',
                                description: 'Переадресация сохраненная из веб-октела. Действует постоянно.',
                                priority: 1,
                                userid: AsteriskInfo.userid,
                                isenabled: true,
                                allowcascade: true,
                                state: 2,
                                destinationnumber: number,
                                onlyforredirectstate: true,
                                definesources: false
                            }
                        }, function (data) {
                            if (data.result) {
                                that.setRedirectNumber(number);
                            }
                            callFunc(callback, getReturnObj(data.result, data, 1103, ' saveredirectrules'));
                        });
                    }
                    return true;
                },

                /**
                 * enable or disable redirect on server
                 * @param enable
                 */
                enableUserRedirectState: function (enable) {
                    sendAsterisk('setuserstate', {onredirect: enable ? true : false});
                },

                /**
                 * Set web state by stateId
                 */
                setWebStateFromUserState: function () {
                    if (!this.onRedirect()) {
                        switch (this.state()) {
                            case 1:
                                this.webState(this.webStates.READY);
                                break;
                            case 2:
                                this.webState(this.webStates.BREAK);
                                break;
                            case 3:
                                this.webState(this.webStates.DND);
                                break;
                            case 5:
                                if (this.onBreak && this.onCallCenter) {
                                    this.webState(this.webStates.BREAK);
                                } else {
                                    this.webState(this.webStates.READY);
                                }
                                break;
                            case 7:
                                this.webState(this.webStates.READY);
                                break;
                        }
                    } else {
                        this.webState(this.webStates.REDIRECT);
                    }
                }

            });
            exportApi('setRedirectNumber', userStates.saveUserRedirect, userStates);
            exportApi('getStatus', userStates.getWebStateStr, userStates);
            exportApi('setStatus', userStates.changeStates, userStates);
            exportApi('setUserStateBusy', userStates.setUserStateBusy, userStates);

            /**
             * PHONE
             * @type {Object}
             */
            var phone = {

                _conferenceInfo: {},

                // from this version Asterisk has 'number' param for 'createconference' method for
                // all phone numbers, server decides, is it external or internal
                _AsteriskDatedWithConfNumber: 140929,

                _holdNumber: false,
                _conferenceId: false,
                abonentList: {},
                queueList: {},
                answerCheckTimeout: 3000,
                _talkLength: 0,
                _talkTimer: false,
                sip: false,
                sipActive: false,
                sipHasRTCSession: false,
                _notRoutingIvrState: false,
                currentSessionData: {},
                intercomSupport: null,
                states: {
                    DISCONNECTED: -1,
                    READY: 0,
                    BACKCALL: 1,
                    CALL: 2,
                    RING: 3,
                    BACKRING: 4,
                    TALK: 5
                    //CALLWEBPHONE: 6
                },


                setSipPhone: function (sip) {
                    var that = this;
                    that.sip = sip;
                    that.sip.on('connect', function () {
                        that.sipActive = true;
                    });
                    that.sip.on('disconnect', function () {
                        that.sipHasRTCSession = false;
                        that.sipActive = false;
                    });
                    that.sip.on('ringStart', function (name, remoteIdentity) {
                        self.trigger('webrtcRingStart', name, remoteIdentity);
                    });
                    that.sip.on('RTCSessionFailed', function () {

                    });
                    that.sip.on('RTCSessionStarted', function () {
                        that.sipHasRTCSession = true;
                        self.trigger('')
//					that.loadStates();
                    });
                    that.sip.on('RTCSessionEnded', function () {
                        that.sipHasRTCSession = false;
                        that.loadStates();
                    });
                    that.sip.on('RTCSessionFailed', function () {
                        that.sipHasRTCSession = false;
                    });
                    that.sip.on('sessionClose', function () {
                        that.sipHasRTCSession = false;
                        that.loadStates();
                    });

                },

                notRoutingIvrState: function (state) {
                    if (typeof state !== "undefined" && Boolean(state) !== this._notRoutingIvrState) {
                        this._notRoutingIvrState = Boolean(state);
                    }
                    return this._notRoutingIvrState;
                },

                answer: function (callback) {
                    var self = this,
                        checkInterval,
                        checkIntercomSupport,
                        afterTimer,
                        isAnswerSuccess;

                    if (self.sipActive) {
                        self.sip.answer();
                        callFunc(callback, getSuccessObj()); // TODO check answer result for callback
                    } else if (self.intercomSupport === false) {
                        callFunc(callback, getErrorObj(2902));
                    } else if (self.state() == self.states.RING || self.state() == self.states.BACKRING) {
                        sendAsterisk('pbxanswercall');
                        afterTimer = function () {
                            clearInterval(checkInterval);
                            clearTimeout(checkTimer);
                            callFunc(callback, getReturnObj(self.intercomSupport, {}, 2902));
                        }
                        checkIntercomSupport = function () {
                            return self.intercomSupport = (self.state() == self.states.TALK || self.state() == self.states.CALL);
                        }
                        checkInterval = setInterval(function () {
                            if (checkIntercomSupport()) {
                                afterTimer();
                            }
                        }, 50);
                        checkTimer = setTimeout(function () {
                            afterTimer();
                        }, self.answerCheckTimeout);
                    } else {
                        callFunc(callback, getErrorObj(2901));
                    }
                },

                /**
                 * Set info about conference
                 * @param newInfoObj
                 */
                setConferenceInfo: function (newInfoObj) {
                    this._conferenceInfo = typeof newInfoObj == 'object' ? newInfoObj : {};
                },

                /**
                 * Get info about conference
                 * @return {*|Object}
                 */
                getConferenceInfo: function () {
                    return this._conferenceInfo || {};
                },

                /**
                 * Clear hold info
                 * @return {Boolean}
                 */
                clearHold: function () {
                    this.setHold(false);
                    return true;
                },
                /**
                 * Set hold info
                 * @param info - phone number or conference id
                 * @return {Boolean} успех
                 */
                setHold: function (info) {
                    var oldHoldInfo = this.getHoldInfo();
                    if (info !== undefined && ((info.userid && info.userid != this._holdNumber) || (info.number && info.number != this._holdNumber) || (info.conferenceid && info.conferenceid != this._holdNumber))) {

                        var oldHoldAbonent = this._holdAbonent;

                        this._holdNumber = info.conferenceid ? info.conferenceid : (info.userid ? info.userid : info.number);
                        this._holdAbonent = info.conferenceid ? {
                            isConference: true,
                            conferenceId: info.conferenceid,
                            conferenceName: info.conferencename,
                            conferenceRoom: info.conferenceroom
                        } : this.createAbonent(info);

                        var holdAbonentChange = false;
                        if (oldHoldAbonent && (oldHoldAbonent.key != this._holdAbonent.key) || (!this._holdAbonent)) {
                            holdAbonentChange = true;
                            self.trigger('holdAbonentLeave', cloneObject(oldHoldAbonent));
                        }

                        if (!(oldHoldAbonent && this._holdAbonent && this._holdAbonent.key && oldHoldAbonent.key && this._holdAbonent.key == oldHoldAbonent.key)) {
                            holdAbonentChange = true;
                            self.trigger('holdAbonentEnter', cloneObject(this._holdAbonent));
                        }
                        var newHoldInfo = this.getHoldInfo();
                        if (oldHoldInfo.hasHold != newHoldInfo.hasHold || holdAbonentChange) {
                            self.trigger('holdStateChange', cloneObject(newHoldInfo));
                        }
                        return true;
                    } else if (info === false) {
                        if (this._holdAbonent) {
                            self.trigger('holdAbonentLeave', cloneObject(this._holdAbonent));
                        }
                        this._holdAbonent = undefined;
                        var oldHold = this._holdNumber;
                        this._holdNumber = false;

                        if (oldHold !== this._holdNumber) {
                            self.trigger('holdStateChange', cloneObject(this.getHoldInfo()));
                        }
                    }
                    return false;
                },
                /**
                 * Get hold info
                 * @return {Object}
                 */
                getHoldInfo: function () {
                    var i = {
                        hasHold: this._holdNumber ? true : false
                    };
                    if (i.hasHold) {
                        if (this._holdAbonent && this._holdAbonent.isConference) {
                            extend(i, cloneObject(this._holdAbonent));
                        } else {
                            i.isConference = false;
                            i.abonent = cloneObject(this._holdAbonent);
                        }
                    }
                    return i;
                },

                /**
                 * Set conference id
                 * @param newConferenceId
                 * @param notLoadConfAbonents boolean
                 * @return {Boolean}
                 */
                conferenceId: function (newConferenceId, notLoadConfAbonents) {
                    if (newConferenceId !== undefined && newConferenceId != this._conferenceId) {
                        var oldConfId = this._conferenceId;
                        this._conferenceId = newConferenceId;
                        if (oldConfId) {
                            sendAsterisk('confhandleevent', {
                                conferenceid: oldConfId,
                                eventtype: 'competitors',
                                handle: false
                            });
                        }
                        if (this._conferenceId) {

                            sendAsterisk('confhandleevent', {
                                conferenceid: this._conferenceId,
                                eventtype: 'competitors',
                                handle: true
                            });

                            if (!notLoadConfAbonents) {
                                this.loadConferenceInfo();
                            }
                        } else {
                            this.setConferenceInfo(false);
                        }
                    }
                    return this._conferenceId;
                },
                /**
                 * Set me as conference creator, or get
                 * @param newState
                 * @return {*}
                 */
                isConfCreator: function (newState) {
                    if (newState !== undefined) {
                        this._isConfCreator = newState ? true : false;
                    }
                    return this._isConfCreator;
                },

                /**
                 * Return string description of phone state by state code
                 * @param code , if undefined, current code will be used
                 * @return {*}
                 */
                getStateStr: function (code) {
                    return getStateByCode(code === undefined ? this._stateId : parseInt(code), this.states);
                },

                /**
                 * Return string description of phone state for outside api calls. Replace BACKCALL to CALL
                 * @param code
                 * @return {*}
                 */
                apiGetStateStr: function (code) {
                    var state = code === undefined ? this.state() : parseInt(code);
                    if (state == this.states.BACKCALL) {
                        state = this.states.CALL;
                    }
                    return this.getStateStr(state);
                },

                /**
                 * Set or get current state
                 * @param newStateId
                 * @return {*} current state id
                 */
                state: function (newStateId, oldAbonents, fireEventAnyway) {
                    newStateId = parseInt(newStateId);

                    if (this.getStateStr(newStateId) && (fireEventAnyway || newStateId != this._stateId)) {

                        var newState = this.apiGetStateStr(newStateId);
                        var oldStateId = this._stateId;
                        var oldState = this.apiGetStateStr(oldStateId);

                        log('CHANGE STATE FROM ' + this.getStateStr(this._stateId) + ' TO ' + this.getStateStr(newStateId), this.getAbonents(true), oldAbonents);

                        this._stateId = newStateId;

                        if (newStateId === this.states.READY || newStateId === this.states.DISCONNECTED) {
                            this.removeAbonents();
                            this.conferenceId(false);
                            this.isConfCreator(false);
                            if (newStateId === this.states.DISCONNECTED) {
                                this.clearHold();
                            }
                        }

                        self.trigger('stateChange', newState, oldState);

                        var abonents = this.getAbonents(true);
                        if (abonents.length == 0) {
                            abonents = oldAbonents;
                        }

//					var abonentsForTalkStop = newStateId == this.states.TALK && oldStateId == this.states.TALK ? oldAbonents : abonents;

                        switch (oldStateId) {
                            case this.states.READY:
                                self.trigger('readyStop', oldAbonents);
                                break;
                            case this.states.RING:
                                self.trigger('ringStop', oldAbonents);
                                break;
                            case this.states.BACKRING:
                                self.trigger('backRingStop', oldAbonents);
                                break;
                            case this.states.CALL:
                                self.trigger('callStop', oldAbonents);
                                break;
                            case this.states.BACKCALL:
                                self.trigger('callStop', oldAbonents);
                                break;
                            case this.states.TALK:
                                self.trigger('talkStop', oldAbonents);
                                break;
                        }

                        switch (this._stateId) {
                            case this.states.READY:
                                self.trigger('readyStart', abonents);
                                break;
                            case this.states.RING:
                                self.trigger('ringStart', abonents);
                                break;
                            case this.states.BACKRING:
                                self.trigger('backRingStart', abonents);
                                break;
                            case this.states.CALL:
                                self.trigger('callStart', abonents);
                                break;
                            case this.states.BACKCALL:
                                self.trigger('callStart', abonents);
                                break;
                            case this.states.TALK:
                                self.trigger('talkStart', abonents);
                                break;
                            //case this.states.CALLWEBPHONE: self.trigger('webphoneCallStart', abonents); break;
                        }


                    }

                    return this._stateId;
                },

                /**
                 * Load hold state
                 * @param callback
                 */
                loadFlashInfo: function (callback) {
                    var that = this;
                    sendAsterisk('getflashedabonentinfo', {}, function (data) {
                        if (data.result) {
                            if (data.containsflashed && data.abonent) {
                                that.setHold(data.abonent);
                            } else {
                                that.clearHold();
                            }
                        }
                        callFunc(callback, getReturnObj(data.result, data, 1103, ' getflashedabonentinfo'));
                    });
                },

                /**
                 * Load phone state
                 * @param callback
                 * @params knownData some already known data (for example knownData.isAutoCall, knownData.sequence, etc)
                 * possible properties for knownData
                 *        isAutoCall: boolean
                 */
                loadStates: function (callback, knownData) {
                    var that = this;
                    knownData = knownData || {};
                    extend(that.currentSessionData, knownData);
                    //that.loadFlashInfo(function(data){
                    if (!serverConnected()) {
                        return false;
                    }

                    sendAsterisk('getextendedlineinfo', {}, function (data) {
                        var callCallback = function () {
                            callFunc(callback, getReturnObj(data.result, data, 1103, ' getextendedlineinfo'));
                        }

                        log('getextendedlineinfo result and that.currentSessionData', data, that.currentSessionData);

                        if (data.result) {

                            var oldState = that.state();
                            var oldHoldInfo = that.getHoldInfo();
                            var oldAbonents = that.getAbonents(true);
                            var oldAb = oldAbonents && oldAbonents[0] || false;

                            var setStateFromResultData = function () {
                                log('setStateFromResultData');

                                // check if toggle called
                                var newHoldInfo = that.getHoldInfo();
                                var newAbonents = that.getAbonents(true);
                                var newAb = newAbonents && newAbonents[0] || false;

                                /*if ( newAb && oldAb && oldHoldInfo.hasHold && newHoldInfo.hasHold &&
									( // curr ab is old hold
										( newAb.conferenceId && oldHoldInfo.conferenceId && newAb.conferenceId == oldHoldInfo.conferenceId ) || // curr ab is conf and it is old hold
										( ! newAb.conferenceId && oldHoldInfo.abonent && newAb.key == oldHoldInfo.abonent.key ) // or curr ab isnt conf and it is old hold
									)
									&&
									( // old ab is curr hold
										( oldAb.conferenceId && newHoldInfo.conferenceId && oldAb.conferenceId == newHoldInfo.conferenceId ) || // curr ab is conf and it is old hold
										( ! oldAb.conferenceId && newHoldInfo.abonent && oldAb.key == newHoldInfo.abonent.key ) // or curr ab isnt conf and it is old hold
									)
								) {

								log('toggle was called');

							} else*/
                                if (that.currentSessionData.isAutoCall && !data.abonent.isautocall && oldState == that.states.READY) {
                                    that.state(that.states.BACKRING, oldAbonents);
                                } else if (data.abonent.isautocall) {
                                    that.currentSessionData.isAutoCall = false;
                                    that.state(that.states.BACKCALL, oldAbonents);
                                } else if (data.abonent.isringing) {
                                    if (data.abonent.direction == 'acm_callback' || oldState == that.states.BACKRING) {
                                        that.state(that.states.BACKRING, oldAbonents);
                                    } else {
                                        that.state(that.states.RING, oldAbonents);
                                    }
                                } else if ((!(that.currentSessionData.isAutoCall) && (
                                    data.abonent.iscommutated ||
                                    data.abonent.iswaitinginflash ||
                                    data.abonent.isconference)) ||
                                    (data.linestatestr == 'lsCommutated' && data.abonent.isivr && !data.abonent.isroutingivr)
                                ) {  // || data.abonent.isivr) ) {
                                    that.startTalkTimer(parseInt(data.timertalklensec) || 0);
                                    var newTalkStarted = that.currentSessionData.commStopped;
                                    that.currentSessionData.commStopped = false;
                                    that.state(that.states.TALK, oldAbonents, newTalkStarted);
                                } else if (data.abonent.extline || data.abonent.number) { //
                                    that.currentSessionData.isAutoCall = false;
                                    that.state(that.states.CALL, oldAbonents);
                                } else if (data.linestatestr == 'lsDisconnected') {
                                    that.state(that.states.DISCONNECTED);
                                } else if (oldState == that.states.TALK && that.sipHasRTCSession) {

                                } else if (data.linestatestr != 'lsReserved') {
                                    that.currentSessionData = {};
                                    that.state(that.states.READY, oldAbonents);
//								if ( oldState !== that.state() && that.sipActive ) {
//									that.sip.hangup();
//								}
                                }
                            }

                            if (data.isflashing && data.flashed) {
                                that.setHold(data.flashed);
                            } else {
                                that.setHold(false);
                            }

                            if (data.abonent) {
                                if (!data.abonent.conferenceid) {
                                    data.abonent.chainId = data.chainid;
                                    that.setAbonent(data.abonent, (oldState == that.states.TALK && that.sipHasRTCSession) || data.abonent.isivr || that.currentSessionData.isAutoCall);
                                    that.conferenceId(false);
                                    setStateFromResultData();
                                    callCallback();
                                } else {
                                    that.conferenceId(data.abonent.conferenceid, true);
                                    that.loadConferenceInfo(function () {
                                        setStateFromResultData();
                                        callCallback();
                                    });
                                }
                            } else {
                                callCallback();
                            }
                        } else {
                            callCallback();
                        }

                    });
                    //});
                },

                /**
                 * Load current conference competitors
                 * @param callback
                 */
                loadConferenceInfo: function (callback) {
                    var that = this;
                    sendAsterisk('getconferenceinfo', {conferenceid: this.conferenceId()}, function (data) {
                        that.setConfAbonentList(data.competitors);
                        that.setConferenceInfo(data.conference);
                        callFunc(callback, getReturnObj(data.result, data, 1103, ' getconferencecompetitors'));
                    });
                },

                /**
                 * Create abonent object from loaded data
                 * @param data
                 * @return {*}
                 */
                createAbonent: function (data) {
                    var key = data.competitorid || data.number || data.userid || data.callerid || (data.chainId != '00000000-0000-0000-0000-000000000000' && data.chainId);
                    if (!key && data.isivr) {
                        key = newGuid();
                    }
                    if (key) {
                        var abonent = new Abonent();
                        extend(abonent, {
                            key: key,
                            guid: data.competitorid || data.userid,

                            isIvr: data.isivr,
                            ivrName: data.ivrname || undefined,

                            isConferenceCompetitor: data.competitorid ? true : false,
                            conferenceId: this.conferenceId(),
                            isConferenceCreator: data.competitorid && data.iscreator ? true : undefined,
                            isConferenceDirector: data.competitorid && data.isdirector ? true : undefined,
                            isConferenceGhost: data.competitorid && data.isghost ? true : undefined,
                            isConferenceGhostMajor: data.competitorid && data.isghostmajor ? true : undefined,
                            isConferenceHidden: data.competitorid && data.ishidden ? true : undefined,
                            isExternal: data.isextline ? true : false,

                            chainId: data.chainId,

                            phone: data.number ? data.number.toString() : (data.calledid ? data.callerid.toString() : undefined),
                            phoneFormatted: data.number ? formatPhone(data.number.toString()) : undefined,

                            name: data.simplename || data.username || data.name || data.caption || data.userlogin || data.number || data.ivrname,

                            isUser: data.userid ? true : false,
                            user: {
                                id: data.userid || undefined,
                                name: data.username || undefined,
                                login: data.userlogin || undefined,
                                comment: data.comment || undefined
                            },

                            isClient: undefined,
                            client: {
                                id: undefined,
                                name: undefined
                            },
                            line: {
                                id: undefined,
                                number: undefined
                            }
                        });
                        return abonent;
                    }
                    return false;
                },

                /**
                 * Set current abonent (for simple calls)
                 * @param data - loaded info about abonent
                 * @return {*}
                 */
                setAbonent: function (data, saveOldAbonentIfEmpty) {
                    var oldKey;
                    if (size(this.abonentList)) {
                        each(this.abonentList, function (ab, key) {
                            oldKey = key;
                        });
                    }
                    var oldAbonent = this.abonentList[oldKey];
                    this.abonentList = {};
                    var a = data ? this.createAbonent(data) : undefined;
                    if (a) {
                        this.abonentList[a.key] = a;
                        if (a.key != oldKey) {
                            self.trigger('abonentListChange', this.getAbonents());
                            self.trigger('abonentsChange', this.getAbonents(true));
                        }
                    } else if (oldAbonent && saveOldAbonentIfEmpty) {
                        this.abonentList[oldKey] = oldAbonent;
                    } else if (oldKey) {
                        self.trigger('abonentListChange', this.getAbonents());
                        self.trigger('abonentsChange', this.getAbonents(true));
                    }
                    return this.abonentList;
                },

                /**
                 * Set abonents list from loaded conference's competitors list
                 * @param abonents
                 * @return {Boolean}
                 */
                setConfAbonentList: function (abonents) {
                    var newList = {},
                        that = this;
                    if (abonents && isArray(abonents)) {
                        each(abonents, function (ab) {
                            if (!that.getConferenceInfo().isghost || (that.getConferenceInfo().isghost && (ab.isghost || ab.userid == AsteriskInfo.userid || ab.number == AsteriskInfo.number))) {
                                newList[ab.competitorid] = true;
                                if (!that.abonentList[ab.competitorid]) {
                                    var a = that.createAbonent(ab);
                                    that.abonentList[a.key] = a;
                                    if (that.conferenceId() && that.state() == that.states.TALK) {
                                        self.trigger('conferenceAbonentEnter', that.abonentList[a.key]);
                                    }
                                }
                            }
                        })
                    }
                    var localList = that.getAbonents();
                    each(localList, function (ab, id) {
                        if (!newList[id]) {
                            that.removeAbonents(id);
                        }
                    });
                    self.trigger('abonentListChange', that.getAbonents());
                    self.trigger('abonentsChange', that.getAbonents(true));
                    return true;
                },

                /**
                 * Get current abonents list
                 * @return {Object}
                 */
                getAbonents: function (asArray) {
                    var list = asArray ? [] : {};
                    each(this.abonentList, function (ab, i) {
                        if (asArray) {
                            list.push(cloneObject(ab));
                        } else {
                            list[i] = cloneObject(ab);
                        }
                    });
                    return list;
                },

                /**
                 * Check, target is current abonent or not
                 * @param number
                 * @return {Boolean}
                 */
                isAbonent: function (data, abonents) {
                    if (!data) {
                        return false;
                    }
                    abonents = abonents || this.getAbonents();
                    if (size(abonents)) {
                        if (abonents.key) {
                            abonents = [abonents];
                        }
                        var curAb = false;
                        each(abonents, function (ab) {
                            if ((ab.guid && ab.guid == data) ||
                                (ab.user && ab.user.id && ab.user.id == data) ||
                                (ab.client && ab.client.id && ab.client.id == data) ||
                                (ab.phone && ab.phone == data)) {
                                curAb = cloneObject(ab);
                                return breaker;
                            }
                        });
                        return curAb;
                    }
                    return false;
                },

                /**
                 * Clear conference's abonents list
                 */
                removeConfAbonents: function () {
                    var that = this;
                    each(that.abonentList, function (ab, i) {
                        if (that.conferenceId() && that.state() == that.states.TALK && ab.isConferenceCompetitor) {
                            self.trigger('conferenceAbonentLeave', ab);
                        }
                        delete that.abonentList[i];
                    });
                },

                /**
                 * Remove abonent by number or id
                 * @param number
                 * @return {Boolean}
                 */
                removeAbonents: function (number) {
                    var that = this;
                    if (number && that.abonentList[number]) {
                        if (that.conferenceId() && that.state() == that.states.TALK && that.abonentList[number].isConferenceCompetitor) {
                            self.trigger('conferenceAbonentLeave', that.abonentList[number]);
                        }
                        delete that.abonentList[number];
                        self.trigger('abonentListChange', that.getAbonents());
                        self.trigger('abonentsChange', that.getAbonents(true));
                    } else if (number === undefined && size(that.abonentList)) {
                        each(that.abonentList, function (ab, i) {
                            if (that.conferenceId() && that.state() == that.states.TALK && ab.isConferenceCompetitor) {
                                self.trigger('conferenceAbonentLeave', ab);
                            }
                            delete that.abonentList[i];
                        });
                        that.abonentList = {};
                    } else {
                        return false;
                    }
                    self.trigger('abonentListChange', that.getAbonents());
                    self.trigger('abonentsChange', that.getAbonents(true));
                    return true;
                },

                /**
                 * Back ring
                 * @param number
                 * @param callback
                 * @return {Boolean}
                 */
                makeCall: function (number, intercom, sequence, callback) {
                    var that = this;
                    var error, msg = '';
                    if (!number) {
                        error = 2106;
                    }
                    if (userStates.state() == userStates.states.DISCONNECTED) {
                        error = 2001;
                    }
                    if (that.state() == that.states.DISCONNECTED) {
                        error = 2002;
                    }
                    if (that.getHoldInfo().hasHold && that.state() == that.states.TALK) {
                        error = 2101;
                    }
                    if (that.conferenceId()) {
                        error = 2102;
                    }
                    if ([that.states.BACKCALL, that.states.BACKRING, that.states.CALL, that.states.RING].indexOf(that.state()) != -1) {
                        error = 2103;
                        msg = ' (' + that.getStateStr() + ')';
                    }
                    if (that.state() == that.states.READY && userStates.state() == userStates.states.BUSY && !that.getHoldInfo().hasHold) {
                        error = 2104;
                    }

                    if (error) {
                        callFunc(callback, getErrorObj(error));
                        return false;
                    }

                    if (that.isAbonent(number)) {
                        callFunc(callback, getErrorObj(2105));
                        return false;
                    } else if ((that.state() == that.states.READY) && that.sipActive && !intercom) {
                        if (that.state() == that.states.TALK) {
                            that.sip.hold();
                        }
                        that.sip.call(number);

                        // find user or number and set it as abonent
                        var user = users[number];
                        var numberObj = numbers[number] || numbersById[number];
//					if ( ! user && numberObj ) {
//						each(users, function(u){
//							if ( u.numberObj == numberObj || u.number == number ) {
//								user = u;
//								return breaker;
//							}
//						});
//					}

//					if ( user ) {
//						log('setAbonent with user');
//						that.setAbonent(user);
//					} else if ( numberObj ) {
//						log('setAbonent with numberObj');
//						that.setAbonent(numberObj);
//					} else {
//						log('setAbonent with number');
//						that.setAbonent({number:number});
//					}
                        callFunc(callback, getSuccessObj());
                    } else if (that.state() == that.states.READY || that.state() == that.states.TALK) {
                        // обратный вызов
                        // если TALK - текущий кладется в холд, и обратный вызов на number
                        that.acmCall(number, intercom, sequence, function (data) {
                            callFunc(callback, getReturnObj(data.result, data, 2107));
                        });
                    } else {
                        // сюда никогда не придем (в теории)
                        log('error call, unknown state');
                        callFunc(callback, getErrorObj(2108));
                        return false;
                    }
                },

                /**
                 * Call server method for backcall
                 * @param number
                 * @param intercom - call in intercom mode
                 * @param callback
                 * @return {Boolean}
                 */
                acmCall: function (number, intercom, sequence, callback) {
                    var that = this;
                    sequence = ['abonent', 'user'].indexOf(sequence) !== -1 ? sequence : 'user';
                    if (!number) {
                        return false;
                    }
                    var params = {
                        sequence: intercom ? 'user' : sequence,
                        intercom: intercom ? true : undefined
                    };
                    params.number = number.toString();

                    sendAsterisk('pbxautocallstart', params, function (data) {
//					that.loadStates(function(){
                        callFunc(callback, data);
//					});
                    });
                },

                /**
                 * Switch current call and hold call
                 * @param callback
                 */
                toggleHold: function (callback) {
                    var that = this;
                    // TODO maybe it makes sense to load hold info from server before switch
                    if (that.getHoldInfo().hasHold) {
                        that.makeFlash('switch');
                        callFunc(callback, getSuccessObj());
                    } else {
                        callFunc(callback, getErrorObj(2402));
                    }
                },


                /**
                 * Call flash method
                 * @param mode тип
                 * @param callback
                 */
                makeFlash: function (mode) {
                    var that = this;
                    var modeTypes = ['abort', 'switch', 'next'];
                    sendAsterisk('pbxmakeflash', {mode: modeTypes.indexOf(mode) != -1 ? mode : undefined});
                },

                /**
                 * Create conference or invite new competitor or make conference from current call
                 * @param numbers or number for inviting to conference
                 * @param callback
                 */
                conference: function (numbers, callback) {
                    var that = this;
                    numbers = toStringsArray(numbers);

                    if (userStates.state() == userStates.states.BREAK) {
                        callFunc(callback, getErrorObj(2208));
                    } else if (that.state() == that.states.TALK) {
                        if (that.conferenceId() && numbers) {
                            // invite
                            that.inviteToConf(that.conferenceId(), numbers, callback);
                        } else if (!that.conferenceId()) {
                            if (!numbers) {
                                that.callToConf(callback);
                            } else {
                                that.callToConf(function (data) {
                                    if (data.result) {
                                        that.inviteToConf(that.conferenceId(), numbers, callback);
                                    } else {
                                        callFunc(callback, getErrorObj(2202));
                                    }
                                });
                            }
                        }
                    } else if (that.state() == that.states.READY && !that.conferenceId() && numbers) {
                        // new conf
                        that.createConf(numbers, callback);
                    } else {
                        callFunc(callback, getErrorObj(2205))
                    }
                },

                /**
                 * Call server method for creating conference from current call
                 * @param callback
                 */
                callToConf: function (callback) {
                    var that = this;
                    that.buildConfFromCommCallback = callback;
                    that.buildConfFromCommTimer = setTimeout(function () {
                        callFunc(that.buildConfFromCommCallback, getErrorObj(2202));
                        that.buildConfFromCommCallback = undefined;
                    }, 2000)
                    sendAsterisk('buildconferencefromcommutation');
                },

                /**
                 * Call server method for creating conference
                 * @param numbers
                 * @param callback
                 */
                createConf: function (numbers, callback) {
                    var that = this;
                    var confId = newGuid();
                    var room = Math.round(Math.random() * 10000);
                    var numParam = [{userlogin: AsteriskInfo.login}];
                    numbers = toStringsArray(numbers);
                    if (isArray(numbers)) {
                        each(numbers, function (n) {
                            if (isGuid(n)) {
                                numParam.push({userid: n});
                            } else {
                                if (AsteriskInfo.AsteriskDated >= that._AsteriskDatedWithConfNumber) {
                                    numParam.push({number: n});
                                } else {
                                    numParam.push({intnumber: n});
                                }
                            }
                        });
                    }

                    if (size(numParam) > 1) {
                        sendAsterisk('createnewconference', {
                            conference: {
                                id: confId,
                                room: room,
                                name: "",
                                description: "",
                                accessmode: "free",
                                isselector: false,
                                record: true,
                                recordrights: "selected",
                                everyonecaninvite: true,
                                canvieweachother: true
                            },
                            competitors: numParam
                        }, function (data) {
                            if (data.result == 1) {
                                that.conferenceId(confId, true);
                            } else {
                                that.conferenceId(false);
                            }
                            callFunc(callback, getReturnObj(data.result, data, 2204));
                        });
                    } else {
                        callFunc(callback, getErrorObj(2203));
                    }
                },

                /**
                 * Call server method for inviting competitors to conference
                 * @param confId conference id
                 * @param numbers or number for invite
                 * @param callback
                 */
                inviteToConf: function (confId, numbers, callback) {
                    if (!confId) {
                        callFunc(callback, false);
                    }
                    var that = this;
                    numbers = toStringsArray(numbers);
                    var numParam = [];
                    var fromHold;
                    var holdAbonent = that.getHoldInfo().abonent || {};
                    if (isArray(numbers)) {
                        each(numbers, function (n) {
                            if (typeof n == 'string' && n !== '') {
                                if (that.isAbonent(n, holdAbonent)) {
                                    fromHold = n;
                                } else {
                                    if (isGuid(n)) {
                                        numParam.push({userid: n});
                                    } else {
                                        numParam.push({number: n});
                                    }
                                }
                            }
                        });
                    }

                    var sendInvites = function () {
                        sendAsterisk('invitetoconference', {
                            conferenceid: confId,
                            competitors: numParam
                        }, function (data) {
                            callFunc(callback, getReturnObj(data.result, data, 2202));
                        });
                    }

                    if (size(numParam) == 0 && !fromHold) {
                        callFunc(callback, getErrorObj(2201));
                    } else if (fromHold) {
                        if (confId != that.conferenceId()) {
                            callFunc(callback, getErrorObj(2206));
                            return;
                        }
                        sendAsterisk('checkcanconnecttogathertoconference', {}, function (data) {
                            if (data.canconnecttogather) {
                                sendAsterisk('connecttogathertoconference');
                                if (size(numParam) != 0) {
                                    sendInvites();
                                } else {
                                    callFunc(callback, getSuccessObj());
                                }
                            } else {
                                callFunc(callback, getErrorObj(2206));
                            }
                        });
                    } else if (size(numParam) != 0) {
                        sendInvites();
                    } else {
                        callFunc(callback, getErrorObj(2207));
                    }
                },

                /**
                 * Stop call, dial, conference. Disconnection of conference competitor
                 * @param numbers or number for disconnect
                 */
                endCall: function (numbers) {
                    var that = this;
                    numbers = toStringsArray(numbers);
                    var isAbonent = false;
                    var isMe = false;
                    if (numbers) {
                        each(numbers, function (n) {
                            if (!isAbonent && that.isAbonent(n)) {
                                isAbonent = true;
                            }
                            if (!isMe && (n == AsteriskInfo.number || n == AsteriskInfo.userid)) {
                                isMe = true;
                            }
                        });
                    }

                    if (!numbers) {
                        if (that.state() == that.states.TALK || that.state() == that.states.CALL || that.getHoldInfo().hasHold) {
                            that.abortCall();
                        } else if (that.state() == that.states.BACKCALL) {
                            that.abortAcmCall();
                        } else if (that.state() == that.states.RING || that.state() == that.states.BACKRING) {
                            that.declineCall();
                        }
                    } else if (that.getHoldInfo().hasHold && (isMe || (!that.conferenceId() && isAbonent))) {
                        that.makeFlash('abort');
                    } else if (isAbonent || isMe) {
                        if (that.state() == that.states.TALK) {
                            if (that.conferenceId()) {
                                that.kickConfAbonent(that.conferenceId(), numbers);
                            } else {
                                that.abortCall();
                            }
                        } else if (that.state() == that.states.BACKCALL) {
                            that.abortAcmCall();
                        } else if (that.state() == that.states.CALL) {
                            that.abortCall();
                        } else if (that.state() == that.states.RING || that.state() == that.states.BACKRING) {
                            that.declineCall();
                        }
                    }
                },

                /**
                 * Call server method for disconnect current connection
                 */
                abortCall: function () {
                    sendAsterisk('pbxabortcall');
                },

                /**
                 * Call server method for end commutation if exist, stop autocall if started
                 */
                declineCall: function () {
                    sendAsterisk('pbxdeclinecall');
                },

                /**
                 * Call server method for disconnect conference competitor by number
                 * @param confId conference id
                 * @param numbers or number
                 */
                kickConfAbonent: function (confId, numbers) {
                    numbers = toStringsArray(numbers);
                    var that = this;
                    sendAsterisk('getconferencecompetitors', {conferenceid: confId}, function (data) {
                        var compsByNumber = {};
                        var compsById = {};
                        var iam = false;
                        for (var i = 0, l = data.competitorlist.length; i < l; i++) {
//						if ( data.competitorlist[i].number != AsteriskInfo.number ) {
//							compsByNumber[data.competitorlist[i].number] = data.competitorlist[i].competitorid;
//						} else {
//							iam = true;
//						}
//						if ( data.competitorlist[i].userid != AsteriskInfo.userid ) {
//							compsById[data.competitorlist[i].userid] = data.competitorlist[i].competitorid;
//						} else {
//							iam = true;
//						}
                            compsByNumber[data.competitorlist[i].number] = data.competitorlist[i].competitorid;
                            compsById[data.competitorlist[i].userid] = data.competitorlist[i].competitorid;
                        }
                        var n;
                        each(numbers, function (num) {
                            if (n = (compsByNumber[num] || compsById[num] || '')) {
                                if (num && (num == AsteriskInfo.number || num == AsteriskInfo.userid)) {
                                    iam = true;
                                } else {
                                    sendAsterisk('confdisconnectcompetitor', {
                                        conferenceid: confId,
                                        competitor: {competitorid: n}
                                    });
                                }
                            }
                        });
                        if (iam) {
                            that.exitConf(confId);
                        }
                    });
                },

                /**
                 * Call server method for stop back ring
                 * @param callback
                 */
                abortAcmCall: function (callback) {
                    sendAsterisk('pbxautocallabort');
                },

                /**
                 * Call method for exit conference
                 * @param confId
                 */
                exitConf: function (confId) {
                    sendAsterisk('exitconference', {conferenceid: confId});
                },

                /**
                 * Call method for transfer call
                 * @param transferTo
                 * @param callback
                 */
                makeTransfer: function (transferTo, callback) {
                    sendAsterisk('pbxmaketransfer', {
                        transferto: transferTo ? transferTo + '' : ""
                    });
                    self.trigger('transfer', transferTo);
                    callFunc(callback, getSuccessObj());
                },

                /**
                 * Transfer call
                 * @param number
                 * @param callback
                 */
                transfer: function (number, callback) {
                    var that = this;
                    if (!number) {
                        callFunc(callback, getErrorObj(2304));
                    }

                    if (that.state() == that.states.TALK) {
                        if (that.getHoldInfo().hasHold) {
                            if (!number || that.isAbonent(number, that.getHoldInfo().abonent || {})) {
                                // connect B to A, we disconnect
                                that.endCall(undefined);
                                callFunc(callback, getSuccessObj());
                            } else {
                                // connect B to C, we connect to A
                                that.makeTransfer(number, callback);
                            }
                        } else if (number) {
                            // connect A to B, we disconnect
                            that.makeTransfer(number, callback);
                        } else {
                            callFunc(callback, getErrorObj(2302));
                        }
                    } else {
                        callFunc(callback, getErrorObj(2303));
                    }
                },

                /**
                 * Connect for help or wiretapping, change connection type
                 * @param target
                 * @param mode
                 * @param callback
                 * @return {Boolean}
                 */
                ghost: function (target, mode, callback) {
                    var that = this;

                    var fn = function (d) {
                        that.loadConferenceInfo(callFunc(callback, d));
                    };

                    target = (users[target] && users[target].id) || (numbers[target] && numbers[target].userid);
                    if (!target) {
                        callFunc(fn, getErrorObj(2504));
                        return false;
                    }

                    mode = mode || 'monitor';

                    if (['monitor', 'conference', 'help'].indexOf(mode) == -1) {
                        callFunc(fn, getErrorObj(2503));
                        return false;
                    }


                    if (that.state() == that.states.READY) {

                        sendAsterisk('attachasghost', {ghostedid: target}, function (data) {
                            if (data.result) {
                                if (mode && mode != 'monitor') {
                                    setTimeout(function () {
                                        if (that.conferenceId()) {
                                            that.changeGhostMode(mode, fn);
                                        }
                                    }, 500);
                                } else {
                                    callFunc(fn, getSuccessObj());
                                }
                            } else {
                                if (data.error == 52710) {
                                    callFunc(fn, getErrorObj(2505));
                                } else {
                                    callFunc(fn, getErrorObj(2502));
                                }
                            }
                        });

                    } else {

                        var ab = that.isAbonent(AsteriskInfo.userid);
                        var conferenceId = that.conferenceId();
                        if (!ab || !conferenceId || !that.getConferenceInfo().isghost) {
                            callFunc(fn, getErrorObj(2506));
                            return false;
                        }

                        var targetAbonent = that.isAbonent(target);
                        if (!targetAbonent) {
                            callFunc(fn, getErrorObj(2507));
                            return false;
                        }

                        if (!targetAbonent.isConferenceGhostMajor && (mode == 'help' || mode == 'monitor')) {

                            sendAsterisk('confsetvoiceparams', {
                                conferenceid: conferenceId,
                                competitor: {
                                    competitorid: targetAbonent.guid,
                                    ghosthelp: mode == 'help' ? true : false
                                }
                            }, function (data) {
                                if (data.result) {

                                }
                                callFunc(fn, getReturnObj(data.result, {}, 2502));
                            });

                        } else {

                            sendAsterisk('confsetghostmode', {
                                conferenceid: conferenceId,
                                ghostmode: mode
                            }, function (data) {
                                if (data.result) {

                                }
                                callFunc(fn, getReturnObj(data.result, {}, 2502));
                            });

                        }
                    }
                },

                /**
                 * Load waiting queue
                 * @param callback
                 */
                queue: function (callback) {
                    var that = this;
                    sendAsterisk('getcurrentqueue', {}, function (data) {
                        if (data.result) {
                            var abonents = {},
                                absArr = [],
                                listChanged = false;
                            if (isArray(data.queue) && size(data.queue) > 0) {
                                each(data.queue, function (q) {
                                    ab = that.createAbonent(q)
                                    abonents[ab.key] = ab;
                                    absArr.push(ab);
                                    if (!that.queueList[ab.key] && !that.isAbonent(ab.key)) {
                                        that.queueList[ab.key] = ab;
                                        self.trigger('queueAbonentEnter', ab)
                                        listChanged = true;
                                    }
                                });
                            }
                            each(that.queueList, function (ab, key) {
                                if (!abonents[key]) {
                                    self.trigger('queueAbonentLeave', ab)
                                    delete that.queueList[key];
                                    listChanged = true;
                                }
                            });
                            if (listChanged) {
                                self.trigger('queueChange', absArr);
                            }
                            callFunc(callback, getSuccessObj({queue: absArr}));
                        } else {
                            callFunc(callback, getErrorObj(2701));
                        }
                    });
                },


                startTalkTimer: function (seconds) {
                    var that = this;
                    that.clearTalkTimer(true);
                    that._talkLength = Date.now() - (parseInt(seconds) || 0) * 1000;
                    that.triggerTalkTimeEvent()
                    that._talkTimer = setInterval(function () {
                        that.triggerTalkTimeEvent()
                    }, 1000);
                },

                triggerTalkTimeEvent: function () {
                    var that = this;
                    if (that._talkLength !== false) {
                        var len = that.getCurrentTalkLength()
                        self.trigger('talkTimer', len, that.formatTime(len));
                    } else {
                        self.trigger('talkTimer', false);
                    }
                },

                getCurrentTalkLength: function () {
                    return Math.floor((Date.now() - this._talkLength) / 1000)
                },

                clearTalkTimer: function (silent) {
                    clearInterval(this._talkTimer);
                    this._talkLength = false
                    if (!silent) {
                        this.triggerTalkTimeEvent()
                    }
                },

                formatTime: function (sec) {
                    var t = sec,
                        h = Math.floor(t / 3600),
                        m = Math.floor(t / 60) % 60,
                        s = t % 60;
                    return (h ? h + ':' : '') +
                        (m < 10 ? '0' + m : m) + ':' +
                        (s < 10 ? '0' + s : s);
                },

                talkLength: function (format) {
                    if (this._talkLength === false) {
                        return '';
                    }
                    var sec = this.getCurrentTalkLength()
                    if (format) {
                        return this.formatTime(sec);
                    } else {
                        return sec;
                    }
                },

                dtmf: function (code) {
                    if (!this.sipActive || typeof code != 'string' || !code.match(/^[0-9\*#]{1}$/)) {
                        return false;
                    }
                    return this.sip.dtmf(code);
                },

                hold: function () {
                    if (this.sipActive) {
                        this.sip.hold();
                    } else if (this.state() == this.states.TALK || this.getHoldInfo().hasHold) {
                        this.makeFlash('switch');
                    }
                },

                resume: function () {
                    if (this.getHoldInfo().hasHold && this.sipActive) {
                        this.sip.resume();
                    }
                }
            };
            extend(phone, Events);
            exportApi('isAbonent', phone.isAbonent, phone);
            exportApi('conferenceId', phone.conferenceId, phone);
            exportApi('getHoldInfo', phone.getHoldInfo, phone);
            exportApi('endCall', phone.endCall, phone);
            exportApi('conference', phone.conference, phone);
            exportApi('transfer', phone.transfer, phone);
            exportApi('toggle', phone.toggleHold, phone);
            exportApi('getState', phone.apiGetStateStr, phone);
            exportApi('getQueue', phone.queue, phone);
            exportApi('getTalkLength', phone.talkLength, phone);
            exportApi('answer', phone.answer, phone);
            exportApi('dtmf', phone.dtmf, phone);
            exportApi('hold', phone.hold, phone);
            exportApi('resume', phone.resume, phone);
//		exportApi('getPhoneState', phone.apiGetPhoneState, phone);


            /**
             * Possible actions for phone states
             * @type {Object}
             */
            var pa = {};
            pa['-'] = {}
            pa[phone.states.DISCONNECTED] = {};
            pa[phone.states.BACKCALL] = {endCall: 1};
            pa[phone.states.BACKRING] = {endCall: 1, answer: 1};
            pa[phone.states.CALL] = {endCall: 1, conference: 1, call: 1, intercom: 1, transfer: 1};
            pa[phone.states.READY] = {
                conference: 1,
                call: 1,
                intercom: 1,
                ghostListen: 1,
                ghostHelp: 1,
                ghostConference: 1,
                transfer: 1,
                toggle: 1,
                endCall: 1,
                resume: 1
            };
            pa[phone.states.RING] = {endCall: 1, answer: 1};
            pa[phone.states.TALK] = {
                endCall: 1,
                conference: 1,
                call: 1,
                resume: 1,
                hold: 1,
                intercom: 1,
                toggle: 1,
                transfer: 1,
                ghostListen: 1,
                ghostHelp: 1,
                ghostConference: 1
            };
            //pa[phone.states.CALLWEBPHONE] = { };

            /**
             * Possible actions for user states
             * @type {Object}
             */
            var pau = {};
            pau['-'] = {}
            pau[userStates.states.DISCONNECTED] = {};
            pau[userStates.states.READY] = {
                endCall: 1,
                conference: 1,
                call: 1,
                intercom: 1,
                toggle: 1,
                transfer: 1,
                resume: 1,
                ghostListen: 1,
                ghostHelp: 1,
                ghostConference: 1,
                resume: 1
            };
            pau[userStates.states.BREAK] = {
                endCall: 1,
                call: 1,
                intercom: 1,
                toggle: 1,
                transfer: 1,
                ghostListen: 1,
                resume: 1,
                ghostHelp: 1,
                ghostConference: 1
            };
            pau[userStates.states.OFF] = {
                endCall: 1,
                conference: 1,
                call: 1,
                intercom: 1,
                toggle: 1,
                transfer: 1,
                resume: 1,
                ghostListen: 1,
                ghostHelp: 1,
                ghostConference: 1
            };
            pau[userStates.states.BUSY] = {
                answer: 1,
                endCall: 1,
                conference: 1,
                call: 1,
                intercom: 1,
                toggle: 1,
                transfer: 1,
                resume: 1,
                hold: 1,
                ghostListen: 1,
                ghostHelp: 1,
                ghostConference: 1
            };
            pau[userStates.states.RESERVED] = {};
            pau[userStates.states.NOPHONE] = {};


            /**
             * Phone actions class
             * @constructor
             */
            var PhoneActions = function () {
                var a = [];
                var s = phone.state();
                s = typeof s == 'number' ? s : '-';
                var us = userStates.state() || '-';
                us = typeof us == 'number' ? us : '-';
                this.push = function () {
                    each(arguments, function (arg) {
                        if (pa[s][arg] && pau[us][arg]) {
                            a.push(arg);
                        }
                    })
                };
                this.getActions = function () {
                    return a;
                }
            }

            /**
             * Return possible actions by phone number or userid
             * @param data
             * @return {*}
             */
            var getPhoneActions = function (data) {
                var a = new PhoneActions;
                if (!data || !serverConnected()) {
                    return a.getActions();
                }
                // if user has number, but number doesn't exist in numbers, use users's number as argument
                if (users[data] && users[data].number && !numbers[data] && !numbersById[data]) {
                    data = users[data].number;
                }
                var isMe = AsteriskInfo.userid == data || AsteriskInfo.number == data;
                var hold = phone.isAbonent(data, phone.getHoldInfo().abonent || {});
                var obj = users[data] || numbers[data] || numbersById[data];
                if (obj && obj.numberObj) {
                    obj = obj.numberObj;
                }
                var abonent = phone.isAbonent(data) || (obj && obj.number && phone.isAbonent(obj.number));
                var isInQueue = phone.isAbonent(data, phone.queueList) || (obj && obj.number && phone.isAbonent(obj.number, phone.queueList));
                var hasHold = phone.getHoldInfo().hasHold;
                var isConf = phone.conferenceId() ? true : false;
                var isConfCreator = isConf && abonent && abonent.isConferenceCreator;
                var iAmAbonent = isConf && phone.isAbonent(AsteriskInfo.userid);
                var iAmCreator = isConf && iAmAbonent && iAmAbonent.isConferenceCreator;
                var phoneState = phone.state();
                var intercomSupport = phone.intercomSupport;

                if (isInQueue) {

                } else if (isMe) {
                    if (phoneState != phone.states.DISCONNECTED && phoneState != phone.states.READY) {
                        if ((phoneState == phone.states.RING || phoneState == phone.states.BACKRING) && (phone.sipActive || intercomSupport !== false)) {
                            a.push('answer');
                        }
                        a.push('endCall');
                    }
                } else if (!obj || (obj && obj.state !== undefined && obj.state != 0)) {
                    if (hold) {
                        if (phone.sipActive && phone.sip && typeof phone.sip.isOnHold === "function" && phone.sip.isOnHold()) {
                            a.push('resume');
                        } else {
                            a.push('toggle', 'endCall'); // toogle and connect current with hold, and disconnect myself
                        }
                    } else if (!abonent) {
                        if (isConf) {
                            if (!(obj && obj.state == 2)) {
                                a.push('conference');
                            }
                            a.push('transfer');
                        } else {
                            if ((!hasHold && phoneState == phone.states.TALK) || phoneState == phone.states.READY) {
                                a.push('call');
                                if (phoneState == phone.states.TALK) {
                                    a.push('transfer');
                                }
                                if (!(obj && obj.state == 2)) {
                                    a.push('conference');
                                }
                                a.push('intercom');
                            } else if (hasHold && phoneState == phone.states.TALK) {
                                a.push('transfer');
                            }
                        }
                        //log(phone.state() + userControlledByMe(data));
                        if (obj && obj.state == 5 && phoneState == phone.states.READY && userControlledByMe(data)) {
                            a.push('ghostListen', 'ghostHelp', 'ghostConference');
                        }
                    } else if (abonent) {
                        if ((phoneState == phone.states.RING || phoneState == phone.states.BACKRING) && (phone.sipActive || intercomSupport !== false)) {
                            a.push('answer');
                        }
                        if (isConf) {
                            if (iAmCreator) {
                                a.push('endCall');
                            }
                        } else {
                            a.push('endCall');
                            if (phone.sipActive && !hasHold) {
                                a.push('hold');
                            }
                            if (!(obj && obj.state == 2)) {
                                a.push('conference');
                            }
//						if ( hasHold ) {
//							a.push('transfer');
//						}
                        }
                        if (phone.getConferenceInfo().isghost && userControlledByMe(data)) {
                            a.push('ghostListen', 'ghostHelp', 'ghostConference');
                        }
                    }
                }
                //log('Phone action for ' + data + ' ' + a.getActions());
                return a.getActions();
            };
            exportApi('getPhoneActions', getPhoneActions);

            startQueueTimer = function (timeout) {
                clearInterval(queueTimer);
                queueTimer = setInterval(function () {
                    if (serverConnected()) {
                        phone.queue()
                    }
                }, timeout);
            }

            /**
             * connect with server
             * @param options
             * @param callback
             * @return {Boolean}
             */
            var connect = function (options, callback) {

                self.trigger('connecting');

                if (serverConnected()) {
                    return true;
                }

                options = options || {};
                var loginError = false;

                extend(AsteriskOptions, options);
                debugMode = AsteriskOptions.debugMode;
                AsteriskVoice = false;
                if (AsteriskOptions.AsteriskVoice) {
                    if (AsteriskOptions.AsteriskVoice.isAsteriskVoice === true) {
                        AsteriskVoice = AsteriskOptions.AsteriskVoice
                    } else if (window.AsteriskVoice && window.AsteriskVoice.isAsteriskVoice === true) {
                        AsteriskVoice = window.AsteriskVoice
                    }
                }

                var sessionId = cookie(cookieSessionName) || (localStorage && localStorage[cookieSessionName]);

                if (!sessionId && options.password !== undefined && options.password !== null) {
                    AsteriskOptions.password = md5(utf8DecodePass(options.password.toString().toLowerCase()));
                    AsteriskOptions.Password = md5(utf8DecodePass(options.password.toString()));
                } else {
                    AsteriskOptions.password = undefined;
                    AsteriskOptions.Password = undefined;
                }


                var wsProtocolUrlRegExp = /^w[s]{1,2}:\/\/\S+$/,
                    portRegExp = /:[0-9]{1,5}$/;
                var prepareUrl = function (urlStr) {
                    if (wsProtocolUrlRegExp.test(urlStr)) {
                        return urlStr;
                    } else {
                        var useWss = location.protocol == 'https:',
                            port = useWss ? ':443' : ':80',
                            protocol = useWss ? 'wss://' : 'ws://';
                        if (portRegExp.test(urlStr)) {
                            return protocol + urlStr;
                        } else {
                            return protocol + urlStr; // + port
                        }
                    }
                    return false;
                }

                if (typeof AsteriskOptions.url == 'string') {
                    AsteriskOptions.url = [AsteriskOptions.url];
                }

                if (isArray(AsteriskOptions.url)) {
                    var links = []
                    for (var i = 0, j = AsteriskOptions.url.length; i < j; i++) {
                        if (typeof AsteriskOptions.url[i] !== 'string') {
                            continue;
                        }
                        links.push(prepareUrl(AsteriskOptions.url[i]));
                    }
                    AsteriskOptions.url = links;
                } else {
                    callFunc(AsteriskOptions.callback, getErrorObj(1205));
                    self.trigger('connectError', getErrorObj(1205));
                    return false;
                }

                AsteriskInfo.url = AsteriskOptions.url;
                AsteriskInfo.login = AsteriskOptions.login;
                AsteriskInfo.defaultAvatar = AsteriskOptions.defaultAvatar;
                AsteriskInfo.defaultAvatar32x32 = AsteriskOptions.defaultAvatar32x32;
                AsteriskInfo.defaultAvatar64x64 = AsteriskOptions.defaultAvatar64x64;

                var currentUrlIndex = 0;

                if (!sessionId && (AsteriskOptions.password === undefined || AsteriskOptions.password === null)) {
                    callFunc(AsteriskOptions.callback, getErrorObj(1213));
                    self.trigger('connectError', getErrorObj(1213));
                    return false;
                }

                var createServer = function () {
                    server = new Server(AsteriskOptions.url, AsteriskOptions.openTimeout, AsteriskOptions.queryDelayMin, AsteriskOptions.queryDelayMax, function (url) {
                        //alert(url);
                        loginError = false;
                        AsteriskInfo.currentUrl = server.url; //AsteriskOptions.url[currentUrlIndex];
                        sendAsterisk('login', {
                            Password: AsteriskOptions.Password,
                            password: AsteriskOptions.password,
                            sessionid: sessionId || undefined,
                            showid: 1,
                            usewebrtc: AsteriskVoice ? true : false,
                            workplace: AsteriskOptions.workplace || undefined,
                            expires: AsteriskOptions.expires || undefined
                        }, function (data) {
                            loginError = true;
                            var getLoginErrorObj = function (code) {
                                return getErrorObj(errorCode, '', {
                                    serverErrorMessage: data.errormsg,
                                    serverErrorCode: data.error
                                });
                            }
                            if (data.error || data.errormsg) {
                                var errorCode = 1000;
                                if (data.error == 50093) {
                                    errorCode = 1204; // Пользователь уже зарегистрирован
                                } else if (data.error == 50025) {
                                    errorCode = 1214; // Количество пользователей, одновременно работающих с системой, ограничено лицензией
                                } else if (data.errormsg == "Service not available") {
                                    errorCode = 1215; // служба октела недозагрулась
                                } else if (data.errormsg == "Wrong login/pass combination") {
                                    cookie(cookieSessionName, null);
                                    localStorage && (delete localStorage[cookieSessionName]);
                                    errorCode = 1202;
                                } else if (data.errormsg == 'Bad request. Session does not exist' || data.errormsg == 'Bad request. Invalid session user') {
                                    cookie(cookieSessionName, null);
                                    localStorage && (delete localStorage[cookieSessionName]);
                                    errorCode = 1212;
                                }
                                callFunc(AsteriskOptions.callback, getLoginErrorObj(errorCode));
                                self.trigger('connectError', getLoginErrorObj(errorCode));
                                disconnect(14);
                            } else if (data.result == 1) {
                                clearInterval(pingTimer);
                                pingTimer = setInterval(function () {
                                    if (serverConnected()) {
                                        server.sendAsterisk('ping');
                                    }
                                }, 15000);
                                startQueueTimer(AsteriskOptions.queueInterval);
                                phone.queue();
                                customEvents.sendCustomBinding();

                                server.bindAsteriskEvent('userstatechanged', function (data) {
                                    userStates.saveStatesFromServer(data);
                                });

                                if (AsteriskVoice) {
                                    setTimeout(function () {
                                        sipPhone = AsteriskVoice.connect({
                                            login: data.sipuser,
                                            password: data.sippass,
                                            server: url.replace(/w[s]{1,2}:\/\//, '').replace('/', '').split(':')[0] + ':' + data.sipport,
                                            useWSS: data.sipsecure,
                                            debugMode: debugMode
                                        });
                                        if (sipPhone) {
                                            sipPhone.on('connect', function () {
                                                sipPnoneActive = true;
                                                self.trigger('webphoneConnect');
                                            });
                                            sipPhone.on('all', function (event) {
                                                log('Asterisk webphone event: ' + event, arguments);
                                            });
                                            sipPhone.on('disconnect', function () {
                                                sipPnoneActive = true;
                                                self.trigger('webphoneDisconnect');
                                            });
                                            phone.setSipPhone(sipPhone);
                                        }
                                    }, 200);
                                }

                                AsteriskInfo.userid = data.userid;
                                AsteriskInfo.sessionId = data.sessionid;
                                if (AsteriskInfo.sessionId) {
                                    cookie(cookieSessionName, AsteriskInfo.sessionId, {expires: AsteriskOptions.expires});
                                    localStorage && (localStorage[cookieSessionName] = AsteriskInfo.sessionId);
                                }

                                sendAsterisk('getversion', {showalloweddbstoredprocs: 1}, function (data) {

                                    if (data.result) {
                                        AsteriskInfo.AsteriskDated = data.version.dated;
                                        AsteriskInfo.AsteriskBuild = data.version.build;

                                        // поддержка нескольких бетта-версий октелл, где вместо версии 2.11.1.140905 приходит 2.11.xxxx.xxxxx
                                        if (AsteriskInfo.AsteriskDated < 140918 && /2\.11\.[0-9]{4}\.[0-9]{5}/g.test(AsteriskInfo.AsteriskBuild)) {
                                            AsteriskInfo.AsteriskBuild = "2.11.1." + AsteriskInfo.AsteriskDated
                                        }

                                        AsteriskInfo.allowedProcedures = data.alloweddbstoredprocs || {};
                                        AsteriskInfo.AsteriskWebServerPort = data.version.webserverport;
                                        AsteriskInfo.AsteriskWebServerLink = getWebServerLink();
                                        if (!isValidMethodVersion('pbxanswercall')) {
                                            phone.intercomSupport = false;
                                        }

                                        sendAsterisk('getmyuserinfo', {}, function (data) {
                                            if (data.result) {
                                                AsteriskInfo.number = data.mainpbxnumber;
                                                AsteriskInfo.username = data.username;
                                                AsteriskInfo.hasline = data.hasline;
                                                AsteriskInfo.lineid = data.lineid;
                                                AsteriskInfo.linenumber = data.linenumber;
                                                AsteriskInfo.isoperator = data.isoperator;
                                                userStates.loadBreakReasons(function (data) {
                                                    userStates.loadState(function (result) {
                                                        if (result) {
                                                            userStates.checkUserRedirect(function (result) {
                                                                loadPbxNumbers(function () {

                                                                    server.bindAsteriskEvent('pbxnumberstatechanged', function (data) {
                                                                        for (var i = 0; i < data.numbers.length; i++) {
                                                                            var n = numbers[data.numbers[i].num];
                                                                            if (n) {
                                                                                n.state = data.numbers[i].numstateid;
                                                                            }
                                                                        }
                                                                    });

                                                                    loadUsers(function () {
                                                                        phone.loadStates(function (result) {
                                                                            if (result) {
                                                                                loginError = false;
                                                                                events.trigger('login');
                                                                                server.bindAsteriskEvent('httpresponsecopy', function (data) {
                                                                                    var result = data.response;
                                                                                    if (result == '200 OK') {
                                                                                        var pass = data.password;
                                                                                        var content = data.content;
                                                                                        if (httpQueryData[pass] && typeof httpQueryData[pass].callback == 'function') {
                                                                                            httpQueryData[pass].callback(content);
                                                                                        }
                                                                                    }
                                                                                });
                                                                                callFunc(AsteriskOptions.callback, getSuccessObj());
                                                                                AsteriskConnected(true);

                                                                                for (var i = 0; i < nativeEventsForBindAfterConnect.length; i++) {
                                                                                    var obj = nativeEventsForBindAfterConnect[i];
                                                                                    if (obj && obj.eventName && obj.callback && !obj.binded) {
                                                                                        obj.binded = true;
                                                                                        server.bindAsteriskEvent(obj.eventName, obj.callback);
                                                                                    }
                                                                                }

                                                                                self.trigger('connect');
                                                                            } else {
                                                                                callFunc(AsteriskOptions.callback, getLoginErrorObj(1207));
                                                                                self.trigger('connectError', getLoginErrorObj(1207));
                                                                                disconnect(14);
                                                                            }
                                                                        });
                                                                    });
                                                                });
                                                            });
                                                        } else {
                                                            callFunc(AsteriskOptions.callback, getLoginErrorObj(1209));
                                                            self.trigger('connectError', getLoginErrorObj(1209));
                                                            disconnect(14);
                                                        }
                                                    });
                                                });
                                            } else {
                                                callFunc(AsteriskOptions.callback, getLoginErrorObj(1210));
                                                self.trigger('connectError', getLoginErrorObj(1210));
                                                disconnect(14);
                                            }
                                        });
                                    } else {
                                        callFunc(AsteriskOptions.callback, getLoginErrorObj(1206));
                                        self.trigger('connectError', getLoginErrorObj(1206));
                                        disconnect(11);
                                    }
                                });


                            } else {
                                callFunc(AsteriskOptions.callback, getLoginErrorObj(1211));
                                self.trigger('connectError', getLoginErrorObj(1211));
                                disconnect(14);
                            }
                        });
                    });
                    server.on('errorConnection', function (data) {
                        self.trigger('connectError', getErrorObj(1200));
                        callFunc(AsteriskOptions.callback, getErrorObj(1200));
                    });
                    server.on('connectionClose', function () {
                        if (connectionClosedByUser) {
                            connectionClosedByUser = false;
                            disconnect(13);
                        } else if (!loginError) {
                            disconnect(12);
                        }
                    });
                    server.multiConnect();
                    // server.connect();
                    if (debugMode) {
                        AsteriskInfo.server = server;
                    }
                };

                createServer();
            };
            exportApi('connect', connect);

            var wsSend = function(method, body) {
                server.wsSend(method, body);
            };
            exportApi('wsSend', wsSend);

            /**
             * disconnect from server
             * @param reason code or reason object
             * @param silent  - trigger outside 'disconnect' event or not
             * @return {Boolean}
             */
            var disconnect = function (reason, silent) {
                AsteriskConnected(false);
                for (var i = 0; i < nativeEventsForBindAfterConnect.length; i++) {
                    var obj = nativeEventsForBindAfterConnect[i];
                    obj.binded = false;
                }
                if (sipPhone && sipPhone.disconnect) {
                    sipPhone.disconnect();
                }
                if (!serverConnected()) {
                    if (typeof reason == 'number') {
                        reason = getDisconnectReasonObj(reason);
                    }
                    if (!silent) {
                        self.trigger('disconnect', reason);
                    }
                } else {
                    cookie(cookieSessionName, null);
                    localStorage && (delete localStorage[cookieSessionName]);
                    connectionClosedByUser = true;
                    userStates.state(0);
                    phone.state(phone.states.DISCONNECTED);
                    sendAsterisk('logout');
                }

                return true;
            };

            var removeUserSession = function () {
                cookie(cookieSessionName, null);
                return true;
            };
            exportApi('removeUserSession', removeUserSession);

            /**
             * Chanhe number plan's states
             */
            userStates.on('userStateChange', function (stateId) {
                setTimeout(function () {
                    phone.loadStates();
                }, 400);
                if (stateId == 5) {

                } else if (stateId == 7) {
                    phone.state(phone.states.DISCONNECTED);
                } else {
                    phone.loadStates();
//				phone.state( phone.states.READY );
                }
            });

            /**
             * Subscribe to stuff on login
             */
            events.on('login', function () {

                server.bindAsteriskEvent('linestatechanged', function (data) {
                    setTimeout(function () {
                        phone.loadStates();
                    }, 500);
                });

                server.bindAsteriskEvent('flashstatechanged', function (data) {
                    setTimeout(function () {
                        phone.loadStates();
                    }, 500);
                });

                server.bindAsteriskEvent('confcompositionchanged', function (data) {
                    if (data.eventinfo.conferenceid == phone.conferenceId()) {
                        phone.setConfAbonentList(data.eventinfo.competitorlist);
                        phone.loadStates();
                    }
                });

                server.bindAsteriskEvent('phoneevent_acmcallstarted', function (data) {
                    phone.loadStates(null, {
//					sequence: phone.state() == phone.states.READY ? '': null,
                        isAutoCall: true
                    });
                });

                server.bindAsteriskEvent('phoneevent_acmcallstopped', function (data) {
                    setTimeout(function () {
                        phone.loadStates();
                    }, 700);
                });

                server.bindAsteriskEvent('phoneevent_ringstarted', function (data) {
                    phone.loadStates(function (result) {
                        if (phone.conferenceId()) {
                            phone.loadConferenceInfo();
                        }
                    }, false);
                });

                server.bindAsteriskEvent('phoneevent_ringstopped', function (data) {
                    phone.loadStates();
                });

                server.bindAsteriskEvent('phoneevent_ivrstarted', function (data) {
                    if (data.isroutingivr === false) {
                        phone.notRoutingIvrState(true);
                    } else if (data.isroutingivr === true && phone.state() == phone.states.READY) {
                        phone.loadStates();
                    }
                });

                server.bindAsteriskEvent('phoneevent_commstarted', function (data) {
                    phone.startTalkTimer(0);
                    phone.currentSessionData.commStarted = true;
                    if (data.isconference) {
                        if (phone.buildConfFromCommCallback) {
                            phone.isConfCreator(true);
                            clearTimeout(phone.buildConfFromCommTimer);
                        }
                        phone.conferenceId(data.confid);
                        phone.loadConferenceInfo(function () {
                            phone.loadStates(function () {
                                if (phone.buildConfFromCommCallback) {
                                    callFunc(phone.buildConfFromCommCallback, getSuccessObj());
                                    phone.buildConfFromCommCallback = undefined;
                                }
                            });
                        });
                    } else {
                        setTimeout(function () {
                            phone.loadStates(function () {
                            });
                        }, 700);
                    }
                });

                server.bindAsteriskEvent('phoneevent_commstopped', function (data) {
                    phone.clearTalkTimer();
                    phone.currentSessionData.commStopped = true;
                    setTimeout(function () {
                        phone.loadStates(function () {
                        });
                    }, 700);
                });

                userStates.loadBreakReasons();
            });

            //
            // API
            //

            //self.loadPhoneStates = function(callback){ phone.loadStates(callback); };

            /**
             * API disconnect from server
             * @param silent - trigger or not 'disconnect' event
             * @return {*}
             */
            self.disconnect = function (silent) {
                return disconnect(13, silent);
            };

            /**
             * API get current abonents list
             * @return {Object}
             */
            self.getAbonents = function () {
                return phone.getAbonents(true);
            };

            /**
             * Call
             * @param number
             * @param callback
             */
            self.call = function (number, sequence, callback) {
                phone.makeCall(number, false, typeof sequence == 'string' ? sequence : '', typeof sequence == 'function' ? sequence : callback);
            };

            /**
             * API Subscribe to server events
             * @param eventName
             * @param callback
             */
            self.onNativeEvent = function (eventNames, callback) {
                bindAsteriskEvent(eventNames, callback);
            };

            /**
             * API Unsubscribe from server events
             * @param eventName
             * @param callback
             */
            self.offNativeEvent = function (eventNames, callback) {
                unbindAsteriskEvent(eventNames, callback);
            };

            /**
             * API Get information about current connection and user
             * @return {*}
             */
            self.getMyInfo = function () {
                return cloneObject(AsteriskInfo);
            }

            /**
             * API Call in intercom mode
             * @param number
             * @param callback
             */
            self.intercom = function (number, callback) {
                phone.makeCall(number, true, '', callback);
            };

            /**
             * API Connect for wiretapping, or change mode for existing connection to wiretapping
             * @param target - phone number or userid
             * @param callback
             */
            self.ghostListen = function (target, callback) {
                phone.ghost(target, 'monitor', callback);
            };
            /**
             * API Connect for help , or change mode for existing connection to help
             * @param target
             * @param callback
             */
            self.ghostHelp = function (target, callback) {
                phone.ghost(target, 'help', callback);
            };
            /**
             * API Connect in conference mode, or change mode for existing connection to conference
             * @param target номер телефона или id пользователя
             * @param callback
             */
            self.ghostConference = function (target, callback) {
                phone.ghost(target, 'conference', callback);
            };

            /**
             * API Get users
             * @return {Object}
             */
            self.getUsers = function () {
                var us = {}
                each(users, function (u) {
                    us[u.id] = u;
                })
                return us;
            };

            /**
             * API Get numbers
             * @return {Object}
             */
            self.getNumbers = function () {
                var nums = {}
                each(numbers, function (u) {
                    nums[u.number] = u;
                });
                return nums;
            }

            /**
             * API get lunch reasons
             */
            self.getLunchReasons = self.getBreakReasons = function () {
                return cloneObject(userStates.breakReasons) || {}
            }

            self.getLog = function () {
                return logStr;
            }

            exportApi('formatPhone', formatPhone, undefined);

            self.inCallCenter = function () {
                return userStates.callCenterState();
            }

            self.webphoneIsActive = function () {
                return sipPnoneActive;
            }

            self.changePassword = function (newPass, oldPass, callback) {
                if (!(typeof newPass == 'string' && newPass)) {
                    callFunc(callback, getErrorObj(2802));
                } else {
                    newPass = md5(utf8DecodePass(newPass));
                    oldPass = md5(utf8DecodePass(oldPass));
                    self.exec('changepassword', {newpwdmd5: newPass, oldpwdmd5: oldPass}, function (data) {
                        if (data.result) {
                            callFunc(callback, getSuccessObj({result: true}));
                        } else if (data.errormsg == 'old password is wrong') {
                            callFunc(callback, getErrorObj(2801));
                        } else {
                            callFunc(callback, getErrorObj(2803));
                        }
                    });
                }
            }

            self.config = function (config) {
                if (!config) {
                    return false;
                }
                if (config.debugMode !== undefined) {
                    debugMode = Boolean(config.debugMode);
                }
                if (config.queryDelayMin !== undefined) {
                    if (server) {
                        server.setQueryDelayMin(config.queryDelayMin);
                    } else {
                        AsteriskOptions.queryDelayMin = config.queryDelayMin;
                    }
                }
                if (config.queryDelayMax !== undefined) {
                    if (server) {
                        server.setQueryDelayMax(config.queryDelayMax);
                    } else {
                        AsteriskOptions.queryDelayMax = config.queryDelayMax;
                    }
                }
                if (config.queueInterval !== undefined && parseInt(config.queueInterval)) {
                    startQueueTimer(parseInt(config.queueInterval));
                }
                if (config.queryTimeout !== undefined && parseInt(config.queryTimeout)) {
                    AsteriskOptions.queryTimeout = parseInt(config.queryTimeout);
                }

            }

            self.version = '1.7.2';

        };
        extend(Asterisk.prototype, Events);

        return Asterisk;
    })();


    $.fn.asterisk = function (state) {
        return this.append(`<p>Asterisk ${state}</p>`);
    };

    return new Asterisk;
});

