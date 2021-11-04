import requests
import json
import re

repo_url = "https://api.github.com/repos/makerdao/community/contents/governance/votes"
addr_re = r'---.*\naddress: "(.*)"\n.*---'

addresses = []
data = json.loads(requests.get(repo_url).text)
for item in data:
    if item["type"] == "file":
        addr = re.findall(addr_re, requests.get(item["download_url"]).text, re.DOTALL)
        if addr and addr[0] != "$spell_address":
            addresses.append(addr[0].lower())
fd = open("knownAddresses.json", 'w')
json.dump(addresses, fd)
