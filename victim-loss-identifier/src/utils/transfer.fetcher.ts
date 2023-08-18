import axios from "axios";

const options = {
  method: "POST",
  url: "https://api.zettablock.com/api/v1/dataset/sq_60ce00b3c8a04659a1974f04c0ecc394/graphql",
  headers: { accept: "application/json", "content-type": "application/json" },
  data: {
    query:
      '{ records(chain: "ethereum", limit: 10) {number_of_items, category, nft_project_name, platform_version, platform, tx_hash, tx_from, tx_to, block_time, block_number, evt_index, nft_contract_address, buyer, seller, original_amount, original_amount_raw, original_currency_contract, chain, usd_amount}}',
  },
};

export function fetchTransfersToScammerAddress(): any {
  let response: any;

  axios
    .request(options)
    .then(function (response) {
      console.log("Successfully retrieved data.");
      response = response.data;
    })
    .catch(function (error) {
      console.error(error);
    });

  return response;
}
