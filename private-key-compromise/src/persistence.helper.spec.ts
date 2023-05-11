import { PersistenceHelper } from "./persistence.helper";
import { existsSync, writeFileSync, unlinkSync } from "fs";
import fetch, { Response } from "node-fetch";

jest.mock("node-fetch");

const mockDbUrl = "databaseurl.com/";
const mockJwt = "MOCK_JWT";
const mockKey = "mock-test-key";

// Mock the fetchJwt function of the forta-agent module
const mockFetchJwt = jest.fn();
jest.mock("forta-agent", () => {
  const original = jest.requireActual("forta-agent");
  return {
    ...original,
    fetchJwt: () => mockFetchJwt(),
  };
});

const removePersistentState = () => {
  if (existsSync(mockKey)) {
    unlinkSync(mockKey);
  }
};

describe("Persistence Helper test suite", () => {
  let persistenceHelper: PersistenceHelper;
  let mockFetch = jest.mocked(fetch, true);

  beforeAll(() => {
    persistenceHelper = new PersistenceHelper(mockDbUrl);
  });

  beforeEach(() => {
    removePersistentState();
    delete process.env.LOCAL_NODE;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should correctly POST a value to the database", async () => {
    const mockValue = 101;

    const mockPostMethodResponse = { data: "4234" };
    const mockFetchResponse: Response = {
      ok: true,
      json: jest.fn().mockResolvedValue(mockPostMethodResponse),
    } as any as Response;

    const mockEnv = {};
    Object.assign(process.env, mockEnv);

    mockFetchJwt.mockResolvedValueOnce(mockJwt);

    mockFetch.mockResolvedValueOnce(Promise.resolve(mockFetchResponse));
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await persistenceHelper.persist(mockValue, mockKey);

    expect(spy).toHaveBeenCalledWith("successfully persisted transfers to database");
    expect(mockFetchJwt).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toEqual(`${mockDbUrl}${mockKey}`);
    expect(mockFetch.mock.calls[0][1]!.method).toEqual("POST");
    expect(mockFetch.mock.calls[0][1]!.headers).toEqual({
      Authorization: `Bearer ${mockJwt}`,
    });
    expect(mockFetch.mock.calls[0][1]!.body).toEqual(JSON.stringify(mockValue));
  });

  it("should correctly store a value to a local file", async () => {
    const mockValue = 101;

    const mockEnv = { LOCAL_NODE: 35 };
    Object.assign(process.env, mockEnv);

    await persistenceHelper.persist(mockValue, mockKey);

    expect(mockFetchJwt).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();

    expect(existsSync("mock-test-key")).toBeDefined();
  });

  it("should fail to POST a value to the database", async () => {
    const mockValue = 202;
    const mockPostMethodResponse = { data: "4234" };
    const mockFetchResponse: Response = {
      ok: false,
      json: jest.fn().mockResolvedValue(mockPostMethodResponse),
    } as any as Response;

    const mockEnv = {};
    Object.assign(process.env, mockEnv);

    mockFetchJwt.mockResolvedValueOnce(mockJwt);
    mockFetch.mockResolvedValueOnce(mockFetchResponse);
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});

    await persistenceHelper.persist(mockValue, mockKey);
    expect(spy).not.toHaveBeenCalledWith("successfully persisted transfers to database");

    expect(mockFetchJwt).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("should correctly load variable values from the database", async () => {
    const mockData = { "0x0": ["0x1", "0x2"] };

    const mockPostMethodResponse = mockData;

    const mockFetchResponse: Response = {
      ok: true,
      json: jest.fn().mockResolvedValue(mockPostMethodResponse),
    } as any as Response;

    const mockEnv = {};
    Object.assign(process.env, mockEnv);

    mockFetchJwt.mockResolvedValueOnce(mockJwt);
    mockFetch.mockResolvedValueOnce(mockFetchResponse);

    const fetchedValue = await persistenceHelper.load(mockKey);
    expect(fetchedValue).toStrictEqual({ "0x0": ["0x1", "0x2"] });
  });

  it("should fail to load values from the database, but return {}", async () => {
    const mockData = '{ "0x0": ["0x1", "0x2"] }';

    const mockPostMethodResponse = mockData.toString();
    const mockFetchResponse: Response = {
      ok: false,
      json: jest.fn().mockResolvedValue(mockPostMethodResponse),
    } as any as Response;

    const mockEnv = {};
    Object.assign(process.env, mockEnv);

    mockFetchJwt.mockResolvedValueOnce(mockJwt);
    mockFetch.mockResolvedValueOnce(mockFetchResponse);

    const fetchedValue = await persistenceHelper.load(mockKey);
    expect(fetchedValue).toStrictEqual({});
  });

  it("should correctly load values from a local file if it exists", async () => {
    const mockData = '{ "0x0": ["0x1", "0x2"] }';

    writeFileSync(mockKey, mockData.toString());

    const mockEnv = { LOCAL_NODE: 121 };
    Object.assign(process.env, mockEnv);

    expect(mockFetchJwt).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();

    const fetchedValue = await persistenceHelper.load(mockKey);
    expect(fetchedValue).toStrictEqual({ "0x0": ["0x1", "0x2"] });
  });

  it("should fail load values from a local file if it doesn't exist, but return {}", async () => {
    const mockEnv = { LOCAL_NODE: 121 };
    Object.assign(process.env, mockEnv);

    expect(mockFetchJwt).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();

    const fetchedValue = await persistenceHelper.load(mockKey);
    expect(fetchedValue).toStrictEqual({});
  });
});
