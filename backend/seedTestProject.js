const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const { connect } = require('./db');

async function seedTestProject() {
  try {
    const db = await connect();
    const users = db.collection('users');
    const demoUser = await users.findOne({ email: 'demo@iotsimx.dev' });
    
    if (!demoUser) {
      console.log('Demo user not found!');
      return;
    }

    const circuits = db.collection('circuits');
    const now = new Date();

    const sampleNodes = [
      {
        "id": "node_1",
        "type": "microcontroller",
        "position": { "x": 100, "y": 150 },
        "data": { "sensorType": "esp32", "boardType": "esp32", "imgSrc": "/devices/esp32.png" }
      },
      {
        "id": "node_2",
        "type": "sensor",
        "position": { "x": 450, "y": 100 },
        "data": { "sensorType": "dht11", "boardType": "dht11", "imgSrc": "/devices/dht11.png" }
      },
      {
        "id": "node_3",
        "type": "sensor",
        "position": { "x": 450, "y": 250 },
        "data": { "sensorType": "buzzer", "boardType": "buzzer", "imgSrc": "/devices/buzzer.png" }
      }
    ];

    const sampleEdges = [
      { "id": "edge_1", "source": "node_1", "sourceHandle": "3v3", "target": "node_2", "targetHandle": "vcc" },
      { "id": "edge_2", "source": "node_1", "sourceHandle": "gnd", "target": "node_2", "targetHandle": "gnd" },
      { "id": "edge_3", "source": "node_1", "sourceHandle": "d4", "target": "node_2", "targetHandle": "signal" },
      { "id": "edge_4", "source": "node_1", "sourceHandle": "3v3", "target": "node_3", "targetHandle": "vcc" },
      { "id": "edge_5", "source": "node_1", "sourceHandle": "gnd", "target": "node_3", "targetHandle": "gnd" },
      { "id": "edge_6", "source": "node_1", "sourceHandle": "d5", "target": "node_3", "targetHandle": "signal" }
    ];

    const sampleCode = `# MR ENGINEER - Smart Temp Alarm
import time

def setup():
    print('Temp Alarm Initialized...')

def loop():
    # Read DHT11 on Pin D4
    temp = read_sensor('D4', 'temperature')
    hum = read_sensor('D4', 'humidity')
    print(f'Temp: {temp}C | Humidity: {hum}%')
    
    if temp > 30:
        print('ALARM! High Temperature detected!')
        write_pin('D5', 1)  # Turn on Buzzer
    else:
        write_pin('D5', 0)  # Turn off Buzzer
    
    time.sleep(2)
`;

    const projectData = {
      name: "Smart Temp Alarm Workspace",
      data: {
        nodes: sampleNodes,
        edges: sampleEdges,
        code: sampleCode
      },
      userId: demoUser._id.toString(),
      createdAt: now,
      updatedAt: now
    };

    const existingProject = await circuits.findOne({ userId: demoUser._id.toString(), name: "Smart Temp Alarm Workspace" });

    if (!existingProject) {
      await circuits.insertOne(projectData);
      console.log('✅ Sample testing project "Smart Temp Alarm Workspace" seeded successfully for demo user.');
    } else {
      await circuits.updateOne({ _id: existingProject._id }, { $set: projectData });
      console.log('✅ Sample testing project "Smart Temp Alarm Workspace" updated successfully for demo user.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error seeding project:', err);
    process.exit(1);
  }
}

seedTestProject();
