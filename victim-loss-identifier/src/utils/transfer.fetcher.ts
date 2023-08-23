import axios from "axios";
import fetch from "node-fetch";

// TODO: Confirm fetch is being used properly
// and that were are querying for the right things
export async function getErc721TransfersInvolvingScammer(scammerAddress: string, transferOccuranceTimeWindow: number, apiKey: string): Promise<any[]> {
  const erc721Transfers: any[] = [];

  try {
    const response = await fetch('https://api.zettablock.com/api/v1/dataset/sq_60ce00b3c8a04659a1974f04c0ecc394/graphql', {
      method: 'POST',
      body: '{ records(chain: "ethereum", limit: 1) {number_of_items, nft_project_name, tx_hash, tx_from, tx_to, block_time, block_number, nft_contract_address, buyer, seller, original_amount, original_amount_raw, original_currency_contract, chain, usd_amount}}',
      headers: {
        accept: 'application/json',
        'X-API-KEY': `${apiKey}`,
        'content-type': 'application/json'
      }
    })
    const data = await response.json();
  } catch(e) {
    console.log(e);
  }

  return erc721Transfers;
}
