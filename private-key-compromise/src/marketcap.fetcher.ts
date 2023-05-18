import fetch from "node-fetch";

let topMarketCap: string[] = [];

export default class MarketCapFetcher {
  public getTopMarketCap = async () => {
    let result;

    result = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&locale=en",
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      }
    ).then((response) => response.json());

    if (Array.isArray(result)) {
      topMarketCap = result.map((result: { symbol: string }) => result.symbol);
    }

    return topMarketCap;
  };
}
