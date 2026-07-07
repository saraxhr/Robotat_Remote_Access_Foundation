# MQTT Publisher — Robotat UVG

## Overview

This folder contains the scripts used to publish data to an MQTT broker.

The main script, `publisher_MQTT_final.py`, was developed using functions and data structures originally implemented by MSc. Miguel Zea as a base. These components were adapted to integrate motion-capture data into the MQTT-based architecture used in the Robotat infrastructure.

---

## ⚙️ Requirements and Installation

To run the MQTT publisher (`publisher_MQTT_final.py`) correctly, the following libraries, tools, and environment configurations are required.

---

## 1. Required Python Libraries

| Library                                         | Purpose                                                                                                                                                                    | Installation             |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `json`                                          | Serializes data into JSON format before transmitting it through MQTT.                                                                                                      | Included with Python.    |
| `hashlib`                                       | Calculates checksums to validate packet integrity.                                                                                                                         | Included with Python.    |
| `datetime`                                      | Generates timestamps for each published packet.                                                                                                                            | Included with Python.    |
| `enum`                                          | Defines enumerations for packet types and data sources.                                                                                                                    | Included with Python.    |
| `paho-mqtt`                                     | MQTT client used to connect to the broker and publish messages.                                                                                                            | `pip install paho-mqtt`  |
| `numpy`                                         | Handles numerical arrays used to store positions and rotations.                                                                                                            | `pip install numpy`      |
| `NatNetClient`, `MoCapData`, `DataDescriptions` | Modules used to receive data from OptiTrack Motive through the NatNet protocol. These modules are based on prior Robotat software components developed by MSc. Miguel Zea. | Included in this folder. |

Make sure that the following files are located in the same directory as `publisher_MQTT_final.py`:

* `NatNetClient.py`
* `MoCapData.py`
* `DataDescriptions.py`

---

## 🧱 2. Mosquitto Broker Installation

The system requires the Mosquitto MQTT broker, which acts as an intermediary between publishers, such as this script, and subscribers, such as robots, backend services, or the web interface.

### 🔧 Installation on Windows

Download Mosquitto from:

https://mosquitto.org/download/

During installation, enable the following options:

* Service installation
* Start with Windows

After installation, verify that the **Mosquitto Broker** service is active in:

```text
Task Manager → Services
```

---

## 🧾 3. Mosquitto Configuration File

For public documentation, the real deployment configuration should not be included. Instead, this repository should provide an example configuration file named:

```text
mosquitto.example.conf
```

The configuration file defines the basic broker settings for local testing. Deployment-specific values such as private IP addresses, certificate paths, log paths, usernames, and passwords must be replaced with placeholders.

Example configuration:

```conf
# Defines the MQTT listener port and binds it to a placeholder local broker IP address.
listener 1880 <MQTT_BROKER_IP>

# Allows anonymous access only for local testing; disable this in secure deployments.
allow_anonymous true

# Enables message persistence so the broker can store retained messages and session data if needed.
persistence true

# Defines a placeholder path where Mosquitto can store persistence data in the local deployment.
persistence_location <MOSQUITTO_DATA_PATH>

# Defines a placeholder log file path for Mosquitto runtime logs.
# log_dest file <MOSQUITTO_LOG_PATH>
```

For a real deployment, avoid committing the actual `mosquitto.conf` file if it contains:

* private IP addresses,
* usernames or passwords,
* certificate paths,
* private keys,
* internal server paths,
* local log paths,
* deployment-specific persistence paths.

Use placeholders such as:

```text
<MQTT_BROKER_IP>
<MQTT_USERNAME>
<MQTT_PASSWORD>
<MOSQUITTO_DATA_PATH>
<MOSQUITTO_LOG_PATH>
<CERTIFICATE_PATH>
```
