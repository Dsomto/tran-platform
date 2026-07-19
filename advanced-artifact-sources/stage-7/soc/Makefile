.PHONY: lab baseline collect destroy

lab:
	containerlab deploy --topo topology.clab.yml

baseline:
	docker exec clab-netforge-a3-gateway nft -f /etc/nftables.conf

collect:
	bash scripts/collect-state.sh

destroy:
	containerlab destroy --topo topology.clab.yml --cleanup
