const { initModels } = require('../src/models');

initModels()
  .then(() => {
    console.log('Database synced');
    process.exit(0);
  })
  .catch(err => {
    console.error('DB sync failed', err);
    process.exit(1);
  });

  