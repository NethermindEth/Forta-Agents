import AaveFetcher from "./aave.fetcher";
import aave from './aave.mock'; 

describe("AaveFetcher tests suite", () => {
  const mockWeb3Call: any = jest.fn();
  const fetcher: AaveFetcher = new AaveFetcher(mockWeb3Call, aave.PROVIDER);

  beforeAll(() => aave.initMock(mockWeb3Call));

  it("should return the tokens", async () => {
    let tokens = await fetcher.getTokens();
    expect(tokens).toStrictEqual(aave.TOKENS);

    tokens = await fetcher.getTokens(3);
    expect(tokens).toStrictEqual(aave.TOKENS_AT_BLOCK_3);
  });
});
