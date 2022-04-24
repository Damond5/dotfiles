#!/user/bin/env python

import subprocess
import threading

def ping(ip):
    # completedProcess = subprocess.run(["ping", "-c", "1", ip, ">", "/dev/null"])
    completedProcess = subprocess.run(["ping", "-c", "1", ip], capture_output = True)
    if completedProcess.returncode == 0:
        print("Found on IP: " + ip)


for i in range(256):
    thread = threading.Thread(target=ping, args=("192.168.0." + str(i),))
    thread.start()

#     if i == 101:
#         continue
#     completedProcess = subprocess.run(["ping", "-c", "1", "192.168.0." + str(i)])
#     if completedProcess.returncode == 0:
#         print("Found on IP: 192.168.0." + str(i))
#         break
