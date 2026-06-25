import dotenv from 'dotenv';
dotenv.config();

import { checkDbConnection } from './services/db.service.js';
import { getFriendProfile as getFriendProfileController } from './controllers/social.controller.js';

const mockReq = {
  params: {
    userId: '6a39684f4ae5ae75463edd14' // GAFMAN
  },
  user: {
    _id: '6a39220b76f717c0cc8f7013', // Gafboi
    id: '6a39220b76f717c0cc8f7013'
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
  await checkDbConnection();
  console.log('Starting getFriendProfile test...');
  try {
    await getFriendProfileController(mockReq, mockRes);
  } catch (err) {
    console.error('TEST CAUGHT CRASH:', err);
  }
}

test();
