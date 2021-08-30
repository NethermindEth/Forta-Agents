#!/usr/bin/expect -f
set timeout -1
set password [lindex $argv 0]

spawn npx forta-agent publish
expect "Enter password to decrypt*"
send -- "$password\r"
expect eof