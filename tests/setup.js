const {sessionStore} = require('../src/middleware/passportSession.js')

afterAll(() => {
  // The MemoryStore session store has a interval that prunes entries
  // It must be stopped in order to shut down
  sessionStore.stopInterval()
})
