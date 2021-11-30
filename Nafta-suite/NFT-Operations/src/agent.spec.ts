import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  TransactionEvent
} from "forta-agent"
import { BigNumber } from "ethers";
import { provideHandleTransaction } from "./agent"
import { createAddress, TestTransactionEvent } from "forta-agent-tools";
import { Interface } from "@ethersproject/abi";
import abi from "./abi";

const addNft = (
  nft: string, 
  id: BigNumber,
  sender: string,
  flashFee: BigNumber,
  longtermFee: BigNumber,
  maxBlocks: BigNumber,
  lenderNFT: BigNumber,
): Finding => 
  Finding.fromObject({
    name: "NAFTA Operations",
    description: "AddNFT event emitted",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    alertId: "NAFTA-OP-1",
    metadata: {
      nft, 
      id: `${id}`,
      sender,
      flashFee: `${flashFee}`,
      longtermFee: `${longtermFee}`,
      maxBlocks: `${maxBlocks}`,
      lenderNFT: `${lenderNFT}`,
    }
  });

const editNft = (
  nft: string, 
  id: BigNumber,
  sender: string,
  flashFee: BigNumber,
  longtermFee: BigNumber,
  maxBlocks: BigNumber,
  lenderNFT: BigNumber,
): Finding => 
  Finding.fromObject({
    name: "NAFTA Operations",
    description: "EditNFT event emitted",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    alertId: "NAFTA-OP-2",
    metadata: {
      nft, 
      id: `${id}`,
      sender,
      flashFee: `${flashFee}`,
      longtermFee: `${longtermFee}`,
      maxBlocks: `${maxBlocks}`,
      lenderNFT: `${lenderNFT}`,
    }
  });

const removeNft = (
  nft: string, 
  id: BigNumber,
  sender: string,
  lenderNFT: BigNumber,
): Finding => 
  Finding.fromObject({
    name: "NAFTA Operations",
    description: "RemoveNFT event emitted",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    alertId: "NAFTA-OP-3",
    metadata: {
      nft, 
      id: `${id}`,
      sender,
      lenderNFT: `${lenderNFT}`,
    }
  });


describe("NFT-Operations agent tests suite", () => {
  const iface = new Interface(abi.NAFTA);

  it("should ignore empty txns", async () => {
    const nafta: string = createAddress("0xdead");
    const handler: HandleTransaction = provideHandleTransaction(nafta);
    const tx: TransactionEvent = new TestTransactionEvent();

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should detect AddNFT events", async () => {
    const nafta: string = createAddress("0xdead");
    const handler: HandleTransaction = provideHandleTransaction(nafta);
    
    const tx: TransactionEvent = new TestTransactionEvent()
      .addEventLog(
        iface.getEvent('AddNFT').format('sighash'),
        nafta,
        iface.encodeEventLog(
          iface.getEvent('AddNFT'),
          [
            createAddress("0x1"),
            10, 20, 30, 40, 50,
            createAddress("0x2"),
          ],
        ).data,
      )
      .addEventLog(
        iface.getEvent('AddNFT').format('sighash'),
        createAddress('0xcafe'), // should be ignored
        iface.encodeEventLog(
          iface.getEvent('AddNFT'),
          [
            createAddress("0x10"),
            11, 1, 2, 40, 3,
            createAddress("0x22"),
          ],
        ).data,
      )
      .addEventLog(
        iface.getEvent('AddNFT').format('sighash'),
        nafta,
        iface.encodeEventLog(
          iface.getEvent('AddNFT'),
          [
            createAddress("0x10"),
            11, 1, 2, 40, 3,
            createAddress("0x22"),
          ],
        ).data,
      );

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      addNft(
        createAddress("0x1"),
        BigNumber.from(10),
        createAddress("0x2"),
        BigNumber.from(20),
        BigNumber.from(30),
        BigNumber.from(40),
        BigNumber.from(50),
      ),
      addNft(
        createAddress("0x10"),
        BigNumber.from(11),
        createAddress("0x22"),
        BigNumber.from(1),
        BigNumber.from(2),
        BigNumber.from(40),
        BigNumber.from(3),
      ),
    ]);
  });

  it("should detect EditNFT events", async () => {
    const nafta: string = createAddress("0xdead2");
    const handler: HandleTransaction = provideHandleTransaction(nafta);
    
    const tx: TransactionEvent = new TestTransactionEvent()
      .addEventLog(
        iface.getEvent('EditNFT').format('sighash'),
        nafta,
        iface.encodeEventLog(
          iface.getEvent('EditNFT'),
          [
            createAddress("0x1"),
            10, 20, 30, 40, 50,
            createAddress("0x2"),
          ],
        ).data,
      )
      .addEventLog(
        iface.getEvent('EditNFT').format('sighash'),
        createAddress('0xcafe'), // should be ignored
        iface.encodeEventLog(
          iface.getEvent('EditNFT'),
          [
            createAddress("0x10"),
            11, 1, 2, 40, 3,
            createAddress("0x22"),
          ],
        ).data,
      )
      .addEventLog(
        iface.getEvent('EditNFT').format('sighash'),
        nafta,
        iface.encodeEventLog(
          iface.getEvent('EditNFT'),
          [
            createAddress("0x10"),
            11, 1, 2, 40, 3,
            createAddress("0x22"),
          ],
        ).data,
      );

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      editNft(
        createAddress("0x1"),
        BigNumber.from(10),
        createAddress("0x2"),
        BigNumber.from(20),
        BigNumber.from(30),
        BigNumber.from(40),
        BigNumber.from(50),
      ),
      editNft(
        createAddress("0x10"),
        BigNumber.from(11),
        createAddress("0x22"),
        BigNumber.from(1),
        BigNumber.from(2),
        BigNumber.from(40),
        BigNumber.from(3),
      ),
    ]);
  });

  it("should detect RemoveNFT events", async () => {
    const nafta: string = createAddress("0xdead3");
    const handler: HandleTransaction = provideHandleTransaction(nafta);
    
    const tx: TransactionEvent = new TestTransactionEvent()
      .addEventLog(
        iface.getEvent('RemoveNFT').format('sighash'),
        nafta,
        iface.encodeEventLog(
          iface.getEvent('RemoveNFT'),
          [
            createAddress("0x1"),
            10, 20,
            createAddress("0x2"),
          ],
        ).data,
      )
      .addEventLog(
        iface.getEvent('RemoveNFT').format('sighash'),
        createAddress('0xcafe'), // should be ignored
        iface.encodeEventLog(
          iface.getEvent('RemoveNFT'),
          [
            createAddress("0x10"),
            11, 1,
            createAddress("0x22"),
          ],
        ).data,
      )
      .addEventLog(
        iface.getEvent('RemoveNFT').format('sighash'),
        nafta,
        iface.encodeEventLog(
          iface.getEvent('RemoveNFT'),
          [
            createAddress("0x10"),
            11, 1,
            createAddress("0x22"),
          ],
        ).data,
      )

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      removeNft(
        createAddress("0x1"),
        BigNumber.from(10),
        createAddress("0x2"),
        BigNumber.from(20),
      ),
      removeNft(
        createAddress("0x10"),
        BigNumber.from(11),
        createAddress("0x22"),
        BigNumber.from(1),
      ),
    ]);
  });

  it("should detect all the events", async () => {
    const nafta: string = createAddress("0xdead3");
    const handler: HandleTransaction = provideHandleTransaction(nafta);
    
    const tx: TransactionEvent = new TestTransactionEvent()
      .addEventLog(
        iface.getEvent('RemoveNFT').format('sighash'),
        nafta,
        iface.encodeEventLog(
          iface.getEvent('RemoveNFT'),
          [
            createAddress("0x1"),
            10, 20,
            createAddress("0x2"),
          ],
        ).data,
      )
      .addEventLog(
        iface.getEvent('AddNFT').format('sighash'),
        nafta,
        iface.encodeEventLog(
          iface.getEvent('AddNFT'),
          [
            createAddress("0x10"),
            11, 1, 2, 40, 3,
            createAddress("0x22"),
          ],
        ).data,
      )
      .addEventLog(
        iface.getEvent('EditNFT').format('sighash'),
        nafta,
        iface.encodeEventLog(
          iface.getEvent('EditNFT'),
          [
            createAddress("0x123"),
            1, 202, 30, 0, 50111,
            createAddress("0x234"),
          ],
        ).data,
      )

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      removeNft(
        createAddress("0x1"),
        BigNumber.from(10),
        createAddress("0x2"),
        BigNumber.from(20),
      ),
      addNft(
        createAddress("0x10"),
        BigNumber.from(11),
        createAddress("0x22"),
        BigNumber.from(1),
        BigNumber.from(2),
        BigNumber.from(40),
        BigNumber.from(3),
      ),
      editNft(
        createAddress("0x123"),
        BigNumber.from(1),
        createAddress("0x234"),
        BigNumber.from(202),
        BigNumber.from(30),
        BigNumber.from(0),
        BigNumber.from(50111),
      ),
    ]);
  });
});
