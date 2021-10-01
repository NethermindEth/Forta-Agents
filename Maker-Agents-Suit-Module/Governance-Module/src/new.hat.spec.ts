import BigNumber from 'bignumber.js';
import {
  Finding, 
  HandleBlock,
  BlockEvent,
} from 'forta-agent';
import { 
  provideHatChecker, 
  createFinding,
} from './new.hat';
import { 
  AddressVerifier,
  HatFinding, 
  createAddr,
  createEncodedAddr,
  createEncodedUint256,
  hatCall,
  approvalsCall,
  generateAddressVerifier,
  createTestBlockEvent,
  toBalance,
} from './utils';

const alertId: string = "Test Findings";
const contract: string = createAddr("0xA");
const threshold: BigNumber = new BigNumber(20);
const isKnown: AddressVerifier = generateAddressVerifier("0xb", "0xc", "0xd");

describe('Chief Contract Hat Changes detector test suite', () => {
  const web3CallMock = jest.fn();
  let handleBlock: HandleBlock;

  beforeEach(() => {
    web3CallMock.mockClear();
    handleBlock = provideHatChecker(
      web3CallMock,
      alertId,
      contract,
      isKnown,
      threshold,
    );
  });

  it('Should report when hat is an unknown address', async () => {
    const block: number = 1;
    const hat: string = createAddr("0xDEAD");
    const blockEvent: BlockEvent = createTestBlockEvent(block);

    web3CallMock.mockReturnValueOnce(createEncodedAddr(hat));

    const findings: Finding[] = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([
      createFinding(
        alertId,
        HatFinding.UnknownHat,
        { hat: hat.toLowerCase() },
      ),
    ]);
    expect(web3CallMock).toBeCalledTimes(1);
    expect(web3CallMock).nthCalledWith(1, {to: contract, data: hatCall()}, block);
  });

  it('Should report when hat is modified', async () => {
    const block: number = 2;
    const hat: string = createAddr("0xB");
    const previousHat: string = createAddr("0xDEAD");
    const blockEvent: BlockEvent = createTestBlockEvent(block);

    web3CallMock.mockReturnValueOnce(createEncodedAddr(hat));
    web3CallMock.mockReturnValueOnce(createEncodedAddr(previousHat));
    web3CallMock.mockReturnValueOnce(createEncodedUint256(toBalance(threshold)));


    const findings: Finding[] = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([
      createFinding(
        alertId,
        HatFinding.HatModified,
        { 
          hat: hat.toLowerCase(), 
          previousHat: previousHat.toLowerCase() 
        },
      ),
    ]);
    expect(web3CallMock).toBeCalledTimes(3);
    expect(web3CallMock).nthCalledWith(1, {to: contract, data: hatCall()}, block);
    expect(web3CallMock).nthCalledWith(2, {to: contract, data: hatCall()}, block - 1);
    expect(web3CallMock).nthCalledWith(3, 
      {
        to: contract, 
        data: approvalsCall(hat.toLowerCase()),
      }, 
      block,
    );
  });

  it('Should report when hat approvals is below the threshold', async () => {
    const block: number = 2;
    const hat: string = createAddr("0xC");
    const previousHat: string = hat;
    const blockEvent: BlockEvent = createTestBlockEvent(block);

    web3CallMock.mockReturnValueOnce(createEncodedAddr(hat));
    web3CallMock.mockReturnValueOnce(createEncodedAddr(previousHat));
    web3CallMock.mockReturnValueOnce(createEncodedUint256(toBalance(threshold.minus(1))));

    const findings: Finding[] = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([
      createFinding(
        alertId,
        HatFinding.FewApprovals,
        { 
          hat: hat.toLowerCase(), 
          MKR: toBalance(threshold.minus(1)).toString(),
          threshold: toBalance(threshold).toString(),
        },
      ),
    ]);
    expect(web3CallMock).toBeCalledTimes(3);
    expect(web3CallMock).nthCalledWith(1, {to: contract, data: hatCall()}, block);
    expect(web3CallMock).nthCalledWith(2, {to: contract, data: hatCall()}, block - 1);
    expect(web3CallMock).nthCalledWith(3, 
      {
        to: contract, 
        data: approvalsCall(hat.toLowerCase()),
      }, 
      block,
    );
  });

  it('Should report when hat is unknown and the approvals is below the threshold', async () => {
    const block: number = 2;
    const hat: string = createAddr("0xD");
    const previousHat: string = createAddr("0xDEAD");
    const blockEvent: BlockEvent = createTestBlockEvent(block);

    web3CallMock.mockReturnValueOnce(createEncodedAddr(hat));
    web3CallMock.mockReturnValueOnce(createEncodedAddr(previousHat));
    web3CallMock.mockReturnValueOnce(createEncodedUint256(toBalance(threshold.minus(1))));

    const findings: Finding[] = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([
      createFinding(
        alertId,
        HatFinding.HatModified,
        { 
          hat: hat.toLowerCase(), 
          previousHat: previousHat.toLowerCase() 
        },
      ),
      createFinding(
        alertId,
        HatFinding.FewApprovals,
        { 
          hat: hat.toLowerCase(), 
          MKR: toBalance(threshold.minus(1)).toString(),
          threshold: toBalance(threshold).toString(),
        },
      ),
    ]);
    expect(web3CallMock).toBeCalledTimes(3);
    expect(web3CallMock).nthCalledWith(1, {to: contract, data: hatCall()}, block);
    expect(web3CallMock).nthCalledWith(2, {to: contract, data: hatCall()}, block - 1);
    expect(web3CallMock).nthCalledWith(3, 
      {
        to: contract, 
        data: approvalsCall(hat.toLowerCase()),
      }, 
      block,
    );
  });

  it('Should report 0 findings if hat remains valid', async () => {
    const block: number = 2;
    const hat: string = createAddr("0xB");
    const previousHat: string = hat;
    const blockEvent: BlockEvent = createTestBlockEvent(block);

    web3CallMock.mockReturnValueOnce(createEncodedAddr(hat));
    web3CallMock.mockReturnValueOnce(createEncodedAddr(previousHat));
    web3CallMock.mockReturnValueOnce(createEncodedUint256(toBalance(threshold)));

    const findings: Finding[] = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);
  });
});
