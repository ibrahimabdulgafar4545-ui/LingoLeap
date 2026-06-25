import { getFriendProfile } from '../server/src/controllers/social.controller.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: '../server/.env' });

const mockReq = {
  params: {
    userId: '6a34eaa7e3c70f38541e020c' // testuser_1781852838739
  },
  user: {
    _id: '6a35b00c5907b1185020bf76', // marybro
    id: '6a35b00c5907b1185020bf76'
  }
};

const mockRes = {
  status: function(code) {
    console.log('RES STATUS:', code);
    this.statusCode = code;
    return this;
  },
  json: function(data) {
    console.log('RES JSON:', JSON.stringify(data, null, 2));
    return this;
  }
};

async function test() {
  console.log('Starting getFriendProfile test...');
  try {
    await getFriendProfile(mockReq, mockRes);
  } catch (err) {
    console.error('TEST CAUGHT CRASH:', err);
  }
}

test();
