import PersistenceHelper from "./persistence.helper";
import { existsSync, writeFileSync, unlinkSync } from "fs";
// import fetch, { Response } from "node-fetch";
import { Response } from "node-fetch";
// import { Response, ResponseInit } from "node-fetch";
// const { Response } = jest.requireActual("node-fetch");
jest.mock("node-fetch");

const mockDbUrl = "databaseurl.com/";
const mockJwt = {
  iss: "issuer",
  sub: "0x556f8BE42f76c01F960f32CB1936D2e0e0Eb3F4D",
  aud: "recipient",
  exp: 1660119443,
  nbf: 1660119383,
  iat: 1660119413,
  jti: "qkd5cfad-1884-11ed-a5c9-02420a639308",
  "bot-id": "0x13k387b37769ce24236c403e76fc30f01fa774176e1416c861yfe6c07dfef71f",
};
const mockKey = "mock-test-key";

const originalEnv = process.env;

// Mock environment variables
const mockHasOwnProperty = jest.fn();
/*
process.env = {
  hasOwnProperty: mockHasOwnProperty,
};
*/

// Mock the fetchJwt function of the forta-agent module
const mockFetchJwt = jest.fn();
jest.mock("forta-agent", () => {
  const original = jest.requireActual("forta-agent");
  return {
    ...original,
    fetchJwt: () => mockFetchJwt(),
  };
});

const DETECT_FLASHLOANS_KEY = "nm-flashloans-bot-key";
const DETECT_FLASHLOANS_HIGH_KEY = "nm-flashloans-high-profit-bot-key";
const TOTAL_TXNS_KEY = "nm-flashloans-bot-total-txns-key";

const removePersistentState = () => {
  if (existsSync(DETECT_FLASHLOANS_KEY)) {
    unlinkSync(DETECT_FLASHLOANS_KEY);
  }
  if (existsSync(DETECT_FLASHLOANS_HIGH_KEY)) {
    unlinkSync(DETECT_FLASHLOANS_HIGH_KEY);
  }
  if (existsSync(TOTAL_TXNS_KEY)) {
    unlinkSync(TOTAL_TXNS_KEY);
  }
  if (existsSync(mockKey)) {
    unlinkSync(mockKey);
  }
};

describe("Persistence Helper test suite", () => {
  let persistenceHelper: PersistenceHelper;
  // TODO: If this is right type for mockFetch
  let mockFetch = jest.fn(); /*jest.mocked(fetch, true)*/

  beforeAll(() => {
    persistenceHelper = new PersistenceHelper(mockDbUrl, mockFetch);
  });

  beforeEach(() => {
    jest.resetModules();
    process.env = {
        ...originalEnv
    };
    removePersistentState();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  it("should correctly POST a value to the database", async () => {
    const mockValue = 101;

    const mockResponseInit = { status: 202 };
    const mockPostMethodResponse = { data: "4234" };
    const mockFetchResponse: Response = new Response(JSON.stringify(mockPostMethodResponse), mockResponseInit);

    // mockHasOwnProperty.mockReturnValueOnce(false);
    // mockFetchJwt.mockResolvedValueOnce(mockJwt);
    mockFetch.mockResolvedValueOnce(Promise.resolve(mockFetchResponse));

    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await persistenceHelper.persist(mockValue, mockKey);

    expect(spy).toHaveBeenCalledWith("successfully persisted 101 to database");
    expect(mockHasOwnProperty).toHaveBeenCalledTimes(1);
    expect(mockFetchJwt).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toEqual(`${mockDbUrl}${mockKey}`);
    expect(mockFetch.mock.calls[0][1].method).toEqual("POST");
    expect(mockFetch.mock.calls[0][1].headers).toEqual({ Authorization: `Bearer ${mockJwt}` });
    expect(mockFetch.mock.calls[0][1].body).toEqual(JSON.stringify(mockValue));
  });

  /*
  it("should correctly store a value to a local file", async () => {
    const mockValue = 101;

    mockHasOwnProperty.mockReturnValueOnce(true);
    await persistenceHelper.persist(mockValue, mockKey);

    expect(mockHasOwnProperty).toHaveBeenCalledTimes(1);
    expect(mockFetchJwt).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();

    expect(existsSync("mock-test-key")).toBeDefined();
  });

  it("should fail to POST a value to the database", async () => {
    const mockValue = 202;

    const mockResponseInit = { status: 305 };
    const mockPostMethodResponse = { data: "4234" };
    const mockFetchResponse = new Response(JSON.stringify(mockPostMethodResponse), mockResponseInit);

    mockHasOwnProperty.mockReturnValueOnce(false);
    mockFetchJwt.mockResolvedValueOnce(mockJwt);
    mockFetch.mockResolvedValueOnce(mockFetchResponse);
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});

    await persistenceHelper.persist(mockValue, mockKey);
    expect(spy).not.toHaveBeenCalledWith("successfully persisted 202 to database");

    expect(mockHasOwnProperty).toHaveBeenCalledTimes(1);
    expect(mockFetchJwt).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("should correctly load variable values from the database", async () => {
    const mockData = 4234;

    const mockResponseInit = { status: 207 };
    const mockPostMethodResponse = mockData.toString();
    const mockFetchResponse = new Response(JSON.stringify(mockPostMethodResponse), mockResponseInit);

    mockHasOwnProperty.mockReturnValueOnce(false);
    mockFetchJwt.mockResolvedValueOnce(mockJwt);
    mockFetch.mockResolvedValueOnce(mockFetchResponse);

    const fetchedValue = await persistenceHelper.load(mockKey);
    expect(fetchedValue).toStrictEqual(4234);
  });

  it("should fail to load values from the database, but return zero", async () => {
    const mockData = 4234;

    const mockResponseInit = { status: 308 };
    const mockPostMethodResponse = mockData.toString();
    const mockFetchResponse = new Response(JSON.stringify(mockPostMethodResponse), mockResponseInit);

    mockHasOwnProperty.mockReturnValueOnce(false);
    mockFetchJwt.mockResolvedValueOnce(mockJwt);
    mockFetch.mockResolvedValueOnce(mockFetchResponse);

    const fetchedValue = await persistenceHelper.load(mockKey);
    expect(fetchedValue).toStrictEqual(0);
  });

  it("should correctly load values from a local file if it exists", async () => {
    const mockData = 4234;

    writeFileSync(mockKey, mockData.toString());

    mockHasOwnProperty.mockReturnValueOnce(true);
    expect(mockFetchJwt).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();

    const fetchedValue = await persistenceHelper.load(mockKey);
    expect(fetchedValue).toStrictEqual(4234);
  });

  it("should fail load values from a local file if it doesn't exist, but return 0", async () => {
    mockHasOwnProperty.mockReturnValueOnce(true);
    expect(mockFetchJwt).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();

    const fetchedValue = await persistenceHelper.load(mockKey);
    expect(fetchedValue).toStrictEqual(0);
  });
  */
});
