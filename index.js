const express = require("express");
const axios = require('axios');
const fs = require('fs');
const wallet = require("./wallet");
const app = express();
const port = process.env.PORT || "8000";

var finalCompoundingCoins = [];
var compoundingCount = 0;

const erc20Tokens = async (address) => {
  try {
    return await axios.get(`https://deep-index.moralis.io/api/v2/${address}/erc20?chain=eth`,
      { headers: { 'X-API-Key': `iOWumgDJl0YeKNzZNBiW7wZQR3CXkK2aCeSu4iWtJdeAIb8piSXoYecaL67Cc21P`, "content-type": "application/json" } })
  } catch (error) {
    console.error(error)
  }
}

const addressTransactions = async (address) => {
  try {
    return await axios.get(`https://deep-index.moralis.io/api/v2/${address}/erc20/transfers?chain=eth`,
      { headers: { 'X-API-Key': `iOWumgDJl0YeKNzZNBiW7wZQR3CXkK2aCeSu4iWtJdeAIb8piSXoYecaL67Cc21P`, "content-type": "application/json" } })
  } catch (error) {
    console.error(error)
  }
}

const addressNewTransactions = async (address, contractAddress) => {
  try {
    return await axios.get(`https://api.etherscan.io/api?module=account&action=tokentx&&contractaddress=${contractAddress}&address=${address}&page=1&offset=10000&sort=asc&apikey=9ZSJCS2AVWK7K1WQVKPHIGM4125A6494V3`,
      { headers: { 'X-API-Key': `iOWumgDJl0YeKNzZNBiW7wZQR3CXkK2aCeSu4iWtJdeAIb8piSXoYecaL67Cc21P`, "content-type": "application/json" } })
  } catch (error) {
    console.error(error)
  }
}

const countAdress = async (address) => {
  const tokensRes = await erc20Tokens(address);
  const tokens = tokensRes.data;
  // const transactionsRes = await addressTransactions(address);
  var compoundingCoins = [];

  for (const token of tokens) {
    const transactionsRes = await addressNewTransactions(address, token.token_address);
    const transactions = transactionsRes.data.result;
    console.log(transactions);
    var deposits = 0;
    var withdrawals = 0;
    for (const transaction of transactions) {
      if (address == transaction.to) {
        deposits = Number(deposits) + Number(transaction.value);
      } else {
        withdrawals += Number(withdrawals) + Number(transaction.value);
      }
    }
    var sum = Number(deposits) - Number(withdrawals);
    if (token.balance > sum) {
      compoundingCount++;
      console.log(compoundingCount);
      const compounding = {
        "coin_address": token.token_address,
        "wallet_address": address,
        "balance": token.balance,
        "sum": sum
      };
    
      compoundingCoins.push(compounding);
    }
  }

  return compoundingCoins;
}

const operate = async () => {
  for (const address of wallet.addresses) {
    const compouMerge = await countAdress(address);
    finalCompoundingCoins = finalCompoundingCoins.concat(compouMerge);
  }
  return finalCompoundingCoins;
}

app.get('/compoundings', (req, res) => {
  operate().then(response => {
    const tokenData = JSON.stringify(response);
    
    fs.writeFile("assets/final_result.json", tokenData, function (err) {
      if (err) {
        return console.log(err);
      }
      return res.send('compouding coin list fetched');
    });
  })
});

app.listen(port, () => {
  console.log(`Listening to requests on http://localhost:${port}`);
});