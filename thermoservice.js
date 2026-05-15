module.exports = function (RED) {
    function ThermoserviceInNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var http  = require('node:http');
        var https = require('node:https');

        var url      = (config.url || 'http://localhost:5000/celsius').trim();
        var interval = Math.max(5, parseInt(config.interval) || 60) * 1000;
        var timer    = null;

        function poll() {
            var client = url.startsWith('https') ? https : http;
            var req = client.get(url, { timeout: 10000 }, function (res) {
                var raw = '';
                res.on('data', function (chunk) { raw += chunk; });
                res.on('end', function () {
                    try {
                        var data = JSON.parse(raw);
                        if (data.temperature === null || data.temperature === undefined) {
                            node.status({ fill: 'red', shape: 'ring', text: data.error || 'no sensor' });
                            node.error('No DS18B20 sensor detected', { payload: data });
                            return;
                        }
                        node.status({ fill: 'green', shape: 'dot', text: data.temperature.toFixed(2) + ' °C' });
                        node.send({
                            payload: data.temperature,
                            topic:   data.sensor || url,
                            sensor:  data.sensor,
                            rom:     (data.rom || '').trim(),
                            time:    data.time
                        });
                    } catch (e) {
                        node.status({ fill: 'red', shape: 'ring', text: 'parse error' });
                        node.error('JSON parse error: ' + e.message);
                    }
                });
            });

            req.on('timeout', function () {
                req.destroy();
                node.status({ fill: 'red', shape: 'ring', text: 'timeout' });
                node.error('Request timeout: ' + url);
            });

            req.on('error', function (e) {
                node.status({ fill: 'red', shape: 'ring', text: 'conn error' });
                node.error('HTTP error: ' + e.message);
            });
        }

        poll();
        timer = setInterval(poll, interval);

        node.on('close', function () {
            clearInterval(timer);
            node.status({});
        });
    }

    RED.nodes.registerType('thermoservice-in', ThermoserviceInNode);
};
