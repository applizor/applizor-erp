const bcrypt = require('bcryptjs');

const hash = '$2a$10$HcfetdKKLYV7sNhQcvDvQ.7JIWXePpI79z9L5iVXtUGXM2V0qYPry';

bcrypt.compare('admin123', hash).then(res => {
  console.log('Comparison result for admin123:', res);
});
