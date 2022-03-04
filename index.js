import { ethers } from "ethers";
import axios from "axios";
import fs from "fs";
import { addresses } from "./wallet.js";

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

// moralis api fetch max 10000 history, so we can not use this api for fetch transaction history.
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
    return await axios.get(`https://api.etherscan.io/api?module=account&action=tokentx&&contractaddress=${contractAddress}&address=${address}&page=1&offset=10000&sort=asc&apikey=9ZSJCS2AVWK7K1WQVKPHIGM4125A6494V3`)
  } catch (error) {
    console.error(error)
  }
}

const countAdress = async (address) => {
  const tokensRes = await erc20Tokens(address);
  const tokens = tokensRes.data;
  var compoundingCoins = [];

  for (const token of tokens) {
    const transactionsRes = await addressNewTransactions(address, token.token_address);
    const transactions = transactionsRes.data.result;

    var deposits = ethers.BigNumber.from(0);
    var withdrawals = ethers.BigNumber.from(0);
    var blockNums = [];

    for (const transaction of transactions) {
      blockNums.push(transaction.blockNumber);
      if (address == transaction.from) {
        const newWidrawal = ethers.BigNumber.from(transaction.value);
        withdrawals = withdrawals.add(newWidrawal);
      } else {
        const newDeposit = ethers.BigNumber.from(transaction.value);
        deposits = deposits.add(newDeposit);
      }
    }

    var sum = deposits.sub(withdrawals);
    var balanceBignum = ethers.BigNumber.from(token.balance);
    if (balanceBignum.gt(sum)) {
      compoundingCount++;
      console.log(compoundingCount);
      const compounding = {
        "coin_address": token.token_address,
        "balance": balanceBignum.toString(),
        "sum": sum.toString(),
        "test_result": {
          "wallet_address": address,
          "bockFirst": "",
          "firstBalance": "",
          "bockSecond": "",
          "secondBalance": "",
        }
      };
      // console.log(compounding);
      compoundingCoins.push(compounding);
    }
  }

  return compoundingCoins;
}

const operate = async () => {
  for (const address of addresses) {
    const compouMerge = await countAdress(address);
    finalCompoundingCoins = finalCompoundingCoins.concat(compouMerge);
  }
  return finalCompoundingCoins;
}

operate().then(response => {
  const tokenData = JSON.stringify(response);
  
  fs.writeFile("assets/final_result.json", tokenData, function (err) {
    if (err) {
      return console.log(err);
    }
    console.log("compouding coin list fetched");
  });
})