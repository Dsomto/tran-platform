#!/bin/sh
set -eu
apk add --no-cache nftables iproute2 iproute2-tc tcpdump
ip address add 10.71.254.2/30 dev eth1
ip address add 10.71.10.1/24 dev eth2
ip address add 10.71.20.1/24 dev eth3
ip address add 10.71.30.1/24 dev eth4
ip address add 10.71.40.1/24 dev eth5
ip address add 10.71.50.1/24 dev eth6
ip address add 10.71.60.1/24 dev eth7
ip address add 10.71.70.1/24 dev eth8
ip link set eth9 promisc on
for interface in eth1 eth2 eth3 eth4 eth5 eth6 eth7 eth8; do
  tc qdisc add dev "$interface" clsact
  tc filter add dev "$interface" ingress matchall action mirred egress mirror dev eth9
done
sysctl -w net.ipv4.ip_forward=1
nft -f /etc/nftables.conf
tail -f /dev/null
