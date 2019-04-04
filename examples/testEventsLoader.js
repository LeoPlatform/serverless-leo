"use strict";
process.env.NODE_ENV = 'test'
require("leo-config").bootstrap(require('./leo_config'));
let leo = require("leo-sdk");

let stream = leo.load('helloWorld_loader_bot', 'test_hello');

// Write 10 events to the leo bus
for (let i = 0; i < 10; i++) {
    stream.write({
        now: Date.now(),
        index: i,
        number: Math.round(Math.random() * 10000)
    });
}
stream.end(err => {
    console.log("All done loading events", err);
});
