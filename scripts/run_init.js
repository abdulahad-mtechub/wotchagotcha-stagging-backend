import '../db.config/index.js';

// db.config/index.js runs model/init.sql on import. Wait briefly then exit.
setTimeout(() => {
  // give the pool callback time to log results
  process.exit(0);
}, 2000);
