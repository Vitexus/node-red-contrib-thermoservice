# node-red-contrib-thermoservice

Node-RED input node that polls a [DS18B20](https://www.analog.com/en/products/ds18b20.html)
temperature sensor via the [ThermoService](https://github.com/VitexSoftware/thermoservice)
HTTP endpoint and emits each reading as a message.

## Overview

```
[thermoservice in] ──► msg.payload  = 21.38   (°C, number)
                       msg.topic    = "10.11.182.89"
                       msg.sensor   = "hostname"
                       msg.rom      = "28-0123456789ab"
                       msg.time     = "2026-05-15T10:00:00.123456"
```

The node fires on every polling interval. If the sensor is absent or
unreachable it logs an error and shows a red status badge — no message
is emitted.

## Requirements

- Node-RED ≥ 4.0
- A running [ThermoService](https://github.com/VitexSoftware/thermoservice)
  instance exposing a `/celsius` JSON endpoint
- No extra npm dependencies (uses Node.js built-in `http`/`https`)

## Installation

### From npm

```bash
cd ~/.node-red
npm install node-red-contrib-thermoservice
```

Then restart Node-RED and refresh the browser.

### From GitHub

```bash
cd ~/.node-red
npm install Vitexus/node-red-contrib-thermoservice
```

### From Debian package (Trixie)

Add the VitexSoftware APT repository and install:

```bash
wget -qO- https://repo.vitexsoftware.com/keyring.gpg \
  | sudo tee /usr/share/keyrings/vitexsoftware.gpg >/dev/null
echo "deb [signed-by=/usr/share/keyrings/vitexsoftware.gpg] \
  https://repo.vitexsoftware.com trixie main" \
  | sudo tee /etc/apt/sources.list.d/vitexsoftware.list
sudo apt update && sudo apt install node-red-contrib-thermoservice
```

## Configuration

Double-click the node to open the editor:

| Field    | Default                          | Description                                  |
|----------|----------------------------------|----------------------------------------------|
| Name     | *(empty)*                        | Optional display label                       |
| URL      | `http://localhost:5000/celsius`  | Full URL of the ThermoService `/celsius` endpoint |
| Interval | `60`                             | Polling interval in seconds (minimum: 5)     |

### ThermoService `/celsius` response format

```json
{
  "rom":         "28-0123456789ab\n",
  "time":        "2026-05-15T10:00:00.123456",
  "sensor":      "pi-hostname",
  "temperature": 21.375
}
```

When the DS18B20 sensor is absent the response contains `"temperature": null`
and an `"error"` field — the node emits no message and shows a red status.

## Output message

| Property      | Type   | Description                                      |
|---------------|--------|--------------------------------------------------|
| `msg.payload` | number | Temperature in °C (e.g. `21.375`)               |
| `msg.topic`   | string | Sensor hostname                                  |
| `msg.sensor`  | string | Sensor hostname                                  |
| `msg.rom`     | string | DS18B20 ROM ID, trimmed (e.g. `28-0123456789ab`) |
| `msg.time`    | string | Measurement timestamp from thermoservice         |

## Node status

| Status              | Meaning                              |
|---------------------|--------------------------------------|
| 🟢 `21.38 °C`      | Last reading successful              |
| 🔴 `no sensor`     | Endpoint reachable but sensor absent |
| 🔴 `conn error`    | Cannot reach the thermoservice URL   |
| 🔴 `timeout`       | HTTP request timed out (10 s limit)  |
| 🔴 `parse error`   | Response is not valid JSON           |

## Example flows

### Basic example — importovatelný flow

Soubor [`examples/basic-flow.json`](examples/basic-flow.json) obsahuje
připravený flow, který lze přímo importovat do Node-RED
(**☰ → Import → vybrat soubor**):

```
[thermoservice in: DS18B20]
    ├──► [switch: Senzor OK?]
    │        ├── OK ──► [template: Formátuj zprávu] ──► [debug: Výstup]
    │        └── null ──► [debug: Chyba senzoru]
    └──► [debug: Raw msg] (vypnutý)
```

```json
[
    {
        "id": "tab-thermo-example",
        "type": "tab",
        "label": "ThermoService příklad",
        "disabled": false,
        "info": ""
    },
    {
        "id": "ex-in",
        "type": "thermoservice-in",
        "z": "tab-thermo-example",
        "name": "DS18B20",
        "url": "http://localhost:5000/celsius",
        "interval": 60,
        "x": 160,
        "y": 120,
        "wires": [["ex-switch-err", "ex-debug-raw"]]
    },
    {
        "id": "ex-switch-err",
        "type": "switch",
        "z": "tab-thermo-example",
        "name": "Senzor OK?",
        "property": "payload",
        "propertyType": "msg",
        "rules": [{"t": "nnull"}, {"t": "null"}],
        "checkall": "false",
        "repair": false,
        "outputs": 2,
        "x": 360,
        "y": 120,
        "wires": [["ex-tpl-format"], ["ex-debug-err"]]
    },
    {
        "id": "ex-tpl-format",
        "type": "template",
        "z": "tab-thermo-example",
        "name": "Formátuj zprávu",
        "field": "payload",
        "fieldType": "msg",
        "format": "handlebars",
        "syntax": "mustache",
        "template": "Senzor: {{sensor}}  |  ROM: {{rom}}  |  Teplota: {{payload}} °C",
        "output": "str",
        "x": 570,
        "y": 100,
        "wires": [["ex-debug-out"]]
    },
    {
        "id": "ex-debug-out",
        "type": "debug",
        "z": "tab-thermo-example",
        "name": "Výstup",
        "active": true,
        "tosidebar": true,
        "console": false,
        "tostatus": true,
        "complete": "payload",
        "targetType": "msg",
        "x": 780,
        "y": 100,
        "wires": []
    },
    {
        "id": "ex-debug-err",
        "type": "debug",
        "z": "tab-thermo-example",
        "name": "Chyba senzoru",
        "active": true,
        "tosidebar": true,
        "console": false,
        "tostatus": true,
        "complete": "payload.error",
        "targetType": "msg",
        "x": 590,
        "y": 140,
        "wires": []
    },
    {
        "id": "ex-debug-raw",
        "type": "debug",
        "z": "tab-thermo-example",
        "name": "Raw msg (vypnutý)",
        "active": false,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "true",
        "targetType": "full",
        "x": 370,
        "y": 200,
        "wires": []
    }
]
```

Výstup v debug panelu po deployi:

```
Senzor: pi-hostname  |  ROM: 28-0123456789ab  |  Teplota: 21.375 °C
```

### Rozšířený flow (dashboard + InfluxDB + Teams alert)

Import the ready-made extended flow from
[`nodered-flow.json`](https://github.com/VitexSoftware/thermoservice/blob/main/nodered-flow.json)
in the thermoservice repository.  It adds a dashboard gauge/chart,
InfluxDB storage and a Microsoft Teams alert when temperature drops
below 5 °C.

### Store in InfluxDB

```
[thermoservice in] ──► [function: format for InfluxDB] ──► [influxdb out]
```

Function node body:

```js
msg.payload = [
    { temperature: msg.payload },
    { sensor: msg.sensor, rom: msg.rom }
];
return msg;
```

### Dashboard gauge

Connect `msg` directly to a `ui_gauge` node (node-red-dashboard):

- **Value format:** `{{value | number:1}}`
- **Min / Max:** `-20` / `50`
- **Label:** `°C`

### Microsoft Teams alert on low temperature

```
[thermoservice in]
    ──► [switch: payload < 5]
        ──► [delay: rate limit 1/hour]
            ──► [function: build Teams card]
                ──► [http request: POST webhook URL]
```

## Building from source

```bash
git clone https://github.com/Vitexus/node-red-contrib-thermoservice
cd node-red-contrib-thermoservice
# No build step needed — pure JS, no dependencies
```

### Build Debian package

Requires `devscripts`, `debhelper`, `pbuilder` and a Debian Trixie chroot:

```bash
debuild-pbuilder -r"sudo -E" -i -us -uc -b
```

The resulting `node-red-contrib-thermoservice_*.deb` is published via the
Jenkins pipeline to `https://repo.vitexsoftware.com`.

## CI / CD

Builds are managed by the Jenkins pipeline at
`https://jenkins.proxy.spojenet.cz/job/Foregin/job/node-red-contrib-thermoservice/`.

The pipeline (`debian/Jenkinsfile`) builds a `.deb` for Debian Trixie inside
a `vitexsoftware/debian:trixie` Docker container and publishes it to the
VitexSoftware APT repository via Aptly on success.

## Related projects

| Project | Description |
|---------|-------------|
| [thermoservice](https://github.com/VitexSoftware/thermoservice) | Flask HTTP service that reads DS18B20 via 1-Wire |
| [node-red](https://github.com/Vitexus/node-red) | Debian packaging of Node-RED 4.x |

## License

MIT © 2026 [Vitex Software](https://www.vitexsoftware.cz)
