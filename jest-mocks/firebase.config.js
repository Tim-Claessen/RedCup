// Mock Firebase config for testing
// This file is mapped via moduleNameMapper in jest.config.js
module.exports = {
  firebaseConfig: {
    apiKey: 'test-api-key',
    projectId: 'test-project-id',
    authDomain: 'test-project.firebaseapp.com',
    storageBucket: 'test-project.appspot.com',
    messagingSenderId: '123456789',
    appId: '1:123456789:web:abcdef',
  },
};

