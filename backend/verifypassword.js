const bcrypt = require('bcryptjs');

const password = 'password123'; // The plain text password you are trying to compare
const hashedPassword = '$2a$10$e6ZnzdMyYBsp2Ov.Bw9NKeM4.wkCGgTcIRWCT2aCO.hgg1SO/ghqy'; // The hashed password from the database

bcrypt.compare(password, hashedPassword, (err, result) => {
  if (err) {
    console.error('Error comparing passwords:', err);
  } else {
    console.log('Password match:', result); // This should be true
  }
});
