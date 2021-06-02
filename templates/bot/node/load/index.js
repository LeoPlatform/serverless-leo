process.env.LEO_ENVIRONMENT = "test";

require("leo-config").bootstrap(require("../../leo_config"));
const leo = require("leo-sdk");

const stream = leo.load("NAME_TOKEN", "WRITE_QUEUE_TOKEN");

// Write 10 events to the leo bus
for (let i = 0; i < 10; i++) {
  stream.write({
    now: Date.now(),
    index: i,
    number: Math.round(Math.random() * 10000),
  });
}
stream.end((err) => {
  if (err) {
    console.error("Error writing events", err);
  } else {
    console.log("Events loaded");
  }
});
