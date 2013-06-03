#!/usr/bin/env python

import sys
import requests

print sys.argv[0]

url = sys.argv[1]
buddyId = sys.argv[2]
content = sys.argv[3]

payload={ 'buddyId': buddyId, 'content': content }
print url
print payload

res = requests.post(url, data=payload)
print res.text.encode('utf-8')
