import json,time,random
import paho.mqtt.client as mqtt

client=mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
client.connect("localhost",1883,60)
while True:
    d={"cpu":round(random.uniform(40,95),2),"gpu":round(random.uniform(45,98),2),
       "temperature":round(random.uniform(22,34),2),"power_kw":round(random.uniform(50,130),2),
       "water_lph":round(random.uniform(80,350),2)}
    client.publish("aquaopt/telemetry",json.dumps(d));print(d);time.sleep(2)
