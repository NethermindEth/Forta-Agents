const core = require("@actions/core");
const exec = require("@actions/exec");
const process = require("process");
const fs = require("fs");


const createConfigFile = () => {
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

    fs.writeFileSync("publish.config.json", JSON.stringify(forta_agent_config));
}

const runExpectScript = async () => {
    const password = core.getInput('private-key-password');
    await exec.exec(`../.github/scripts/run_publish_agent.sh ${password}`);
}

const moveToAgentDir = async () => {
    const dir = core.getInput("agent-directory");
    process.chdir(dir);
}

const main = async () => {
    await moveToAgentDir();
    createConfigFile();
    await runExpectScript();
}

main();