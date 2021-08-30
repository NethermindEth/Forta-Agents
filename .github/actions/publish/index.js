const core = require("@actions/core");
const exec = require("@actions/exec");
const { EEXIST } = require("constants");
const fs = require("fs");


const createConfigFile = async () => {
    const content = fs.readFileSync("package.json");
    const packageData = JSON.parse(content);
    const agentId = packageData["agentId"];
    const agentVersion = packageData["version"];
    const agentRegistryJsonRpcUrl = core.getInput("goerli-endpoint");
    const ipfsGatewayUrl = core.getInput("ipfs-endpoint");
    const ipfsGatewayAuth = core.getInput("ipfs-authorization");

    const forta_agent_config = {
        "agentId": agentId,
        "version": agentVersion,
        "agentRegistryJsonRpcUrl": agentRegistryJsonRpcUrl,
        "ipfsGatewayUrl": ipfsGatewayUrl,
        "ipfsGatewayAuth": ipfsGatewayAuth === "" ? undefined : ipfsGatewayAuth,
        "handlers": ["./dist"],
        "documentation": "README.md"
    }

    fs.writeFileSync("forta.config.json", JSON.stringify(forta_agent_config));
}

const runExpectScript = () => {
    const password = core.getInput('password');
    await exec.exec(`./.github/scripts/run_publish_agent.sh ${password}`);
}

const main = async () => {
    createConfigFile();
    runExpectScript();
}

main();