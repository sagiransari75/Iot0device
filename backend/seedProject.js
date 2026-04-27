const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const { connect, toObjectId } = require('./db');

async function seedProject() {
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
        "position": { "x": 100, "y": 100 },
        "data": { "sensorType": "esp32", "boardType": "esp32" }
      },
      {
        "id": "node_2",
        "type": "sensor",
        "position": { "x": 400, "y": 100 },
        "data": { "sensorType": "led", "boardType": "led" }
      }
    ];

    const sampleEdges = [
      {
        "id": "edge_1",
        "source": "node_1",
        "sourceHandle": "d32",
        "target": "node_2",
        "targetHandle": "signal"
      },
      {
        "id": "edge_2",
        "source": "node_1",
        "sourceHandle": "gnd",
        "target": "node_2",
        "targetHandle": "gnd"
      }
    ];

    const sampleCode = `# MR ENGINEER - ESP32/Pico Logic
import time

def setup():
    print('System Initialized...')

def loop():
    print('Blinking LED...')
    write_pin('D32', 1)
    time.sleep(1)
    write_pin('D32', 0)
    time.sleep(1)
`;

    const projectData = {
      name: "Blink LED Example Project",
      data: {
        nodes: sampleNodes,
        edges: sampleEdges,
        code: sampleCode
      },
      userId: demoUser._id.toString(),
      createdAt: now,
      updatedAt: now
    };

    const existingProject = await circuits.findOne({ userId: demoUser._id.toString(), name: "Blink LED Example Project" });

    if (!existingProject) {
      await circuits.insertOne(projectData);
      console.log('✅ Sample project "Blink LED Example Project" seeded successfully for demo user.');
    } else {
      console.log('Sample project already exists.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error seeding project:', err);
    process.exit(1);
  }
}

seedProject();
