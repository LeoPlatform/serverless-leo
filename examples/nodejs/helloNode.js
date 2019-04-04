'use strict';
process.env.NODE_ENV = 'test'
require("leo-config").bootstrap(require('./leo_config'));

const leo = require("leo-sdk");
const ls = leo.streams;

exports.handler = require("leo-sdk/wrappers/cron.js")(async (settings, context, callback) => {
    ls.pipe(
        // source queue: hello
        leo.read(settings.botId, settings.source, { start: settings.start }),

        ls.count(1),

        ls.stats(settings.botId, settings.source),

        // destination queue: world
        leo.load(context.botId, 'test_world'),

        (err) => {
            if (err) {
                console.log("Error:", err);
                return callback(err);
            }
            console.log("Completed. Remaining Time:", context.getRemainingTimeInMillis());
            stats.checkpoint(callback)
        }
    );
});
