import { EventType, BlockEvent, Network } from "forta-agent";

/**
 *
 * @param r1 - originalLiquidityToken1
 * @param r2 - originalLiquidityToken2
 * @param x - amount of Token1 Swapped in t1
 * @param v - amountOfToken1ToBeSwappedInTv
 * @param m - minimumAmountToBeToken2Recieved
 * @returns
 */

const detectIfAttackPossible = (
  r1: number,
  r2: number,
  x: number,
  v: number,
  m: number
): boolean => {
  r1 /= 10 ** 6;
  r2 /= 10 ** 6;

  // 0.997 is for lp fee
  // Refer : https://pub.tik.ee.ethz.ch/students/2021-FS/BA-2021-07.pdf
  const minimumAmountOfToken2Recieved =
    (v * 0.997 * (r2 - (x * 0.997 * r2) / (r1 + 0.997 * x))) /
    (r1 + x + 0.997 * v);

  return minimumAmountOfToken2Recieved >= m;
};

const maximumInputAmountForFrontrunningT1 = (
  r1: number,
  r2: number,
  m: number,
  v: number
) => {
  // Refer : https://pub.tik.ee.ethz.ch/students/2021-FS/BA-2021-07.pdf
  const t = Math.sqrt(
    9000000 * r1 * r1 * m +
      3976036000000 * r1 * r2 * v -
      5964054000 * r1 * m * v +
      988053892081 * m * v * v
  );
  return (5.01505 * 10 ** (-7) * t) / Math.sqrt(m) - 1.0015 * r1 - 0.4985 * r2;
};

function generateBlockEvent(tx: string[]): BlockEvent {
  const block: any = {
    difficulty: "",
    extraData: "",
    gasLimit: "",
    gasUsed: "",
    hash: "",
    logsBloom: "",
    miner: "",
    mixHash: "",
    nonce: "",
    number: 13068613,
    parentHash: "",
    receiptsRoot: "",
    sha3Uncles: "",
    size: "",
    stateRoot: "",
    timestamp: 0,
    totalDifficulty: "",
    transactions: tx,
    transactionsRoot: "0x",
    uncles: [],
  };

  const blockEvent = new BlockEvent(
    EventType.BLOCK,
    Network.GOERLI,
    "0x",
    0,
    block
  );
  return blockEvent;
}

export {
  detectIfAttackPossible,
  maximumInputAmountForFrontrunningT1,
  generateBlockEvent,
};
