const ethers = require("ethers");
const testnetAbi = require("./abis/testnet-saucerSwapV2PairAbi.json");
const dotenv = require("dotenv");
const path = require("path");

const envPath = path.join(path.dirname(path.dirname(__dirname)), ".env");
dotenv.config({path: envPath});

const pollSwapEvents = async () => {
    const abi = testnetAbi;
    const provider = new ethers.JsonRpcProvider(process.env.API_JSON_RPC, "", {
        batchMaxCount: 1, //workaround for ethers V6
    });

    //load ABI data containing the Swap event
    const abiInterfaces = new ethers.Interface(abi.abi);

    const filter = {
        // address: "0x1E375f8947DfFeE57C7713F3176B01858BFBA104", // Filter address of EVM PAIR pool on SaucerSwap
        topics: [abiInterfaces.getEvent("Swap").topicHash], //topic0 filter
    };

    console.log("Polling Hedera JSON RPC....", );

    provider.on(filter, (log) => {
        const pairEvmAddress = log.address; //use this to get token0 and token1 data

        const tnxHash = log.transactionHash;

        console.log(`\nTransaction hash: ${pairEvmAddress}    ${tnxHash}`);

        const parsedLog = abiInterfaces.parseLog({topics: log.topics.slice(), data: log.data});
        const result = parsedLog.args;

        //amount0In / amount0Out is token0
        //amount1In / amount1Out is token1
        const amountIn = result.amount0In == 0 ? result.amount1In : result.amount0In;
        const amountOut = result.amount0Out == 0 ? result.amount1Out : result.amount0Out;

        console.log(`Pair: ${pairEvmAddress}, amountIn: ${amountIn}, amountOut: ${amountOut}`);
    });
};

pollSwapEvents();

// node src/pollSwapEvents/pollSwapEvents.js
