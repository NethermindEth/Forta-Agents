.DEFAULT_GOAL 	:= help
.PHONY: agent test start

# variables
NAME="new-agent"
VERSION="0.0.11"

agent: ## Create an initialize a new agent
	@mkdir ${NAME} && cd ${NAME} && npx forta-agent@${VERSION} init --typescript && npm install

test: ## Run an agent test suit
	@cd ${NAME} && npm test

start: ## Run the agent handlers
	@cd ${NAME} && npm start

view: ## display the Makefile
	@cat Makefile

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

