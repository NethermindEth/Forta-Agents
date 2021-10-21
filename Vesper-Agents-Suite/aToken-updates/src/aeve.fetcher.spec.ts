import AeveFetcher from "./aeve.fetcher";
import aeve from './aeve.mock'; 

describe("AeveFetcher tests suite", () => {
  const mockWeb3Call: any = jest.fn();
  const fetcher: AeveFetcher = new AeveFetcher(mockWeb3Call, aeve.PROVIDER);

  beforeAll(() => aeve.initMock(mockWeb3Call));

  it("should return the tokens", async () => {
    let tokens = await fetcher.getTokens();
    expect(tokens).toStrictEqual(aeve.TOKENS);

    tokens = await fetcher.getTokens(3);
    expect(tokens).toStrictEqual(aeve.TOKENS_AT_BLOCK_3);
  });
});
