import logging
import sys
import random
import json

from leosdk.aws.payload import Payload
from leosdk.leo import Leo

import leo_config

leo = Leo(leo_config, 'mybot', 'myqueue')
leo.log_handler(logging.StreamHandler(sys.stdout))
stream = leo.load()

for i in range(0, 25):
    p = Payload()
    p.set_event("FollowUp")
    p.set_id("FollowUpTransform")
    p.set_source("FollowUpChanges")
    r = random.randint(1, 100000)
    p.set({'id': i + r, 'name': 'Random name ' + str(i)})
    print(p.get_payload_data())
    # stream.write(p)

stream.end()
