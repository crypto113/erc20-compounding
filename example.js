import { ethers } from "ethers";
import Web3 from "web3";
import axios from "axios";
import {abi} from "./erc20_abi.js";
import {compoundings} from "./result.js";

const web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/v3/f9a2730694dd4acabe368fbd9563b3e5"));

var finalCompoundingCoins = [];

const balanceTokenByBlockNo = async (contractAddress, walletAddress, blockNo) => {
  try {
    return await axios.get(`https://api.etherscan.io/api?module=account&action=tokenbalancehistory&contractaddress=${contractAddress}&address=${walletAddress}&blockno=${blockNo}&apikey=9ZSJCS2AVWK7K1WQVKPHIGM4125A6494V3 `,
      { headers: { "content-type": "application/json" } })
  } catch (error) {
    console.error(error)
  }
}

const tokenBalanceBlock = async (contractAddress, walletAddress, blockNo) => {
  const contract = new web3.eth.Contract(abi, contractAddress);
  const result = await contract.methods.balanceOf(walletAddress).call({}, blockNo);
  console.log(result);
}

const countCompound = async (compounding) => {
  const lastBlockNo = Number(compounding.blockNums[compounding.blockNums.length - 1]);
  const lastNextBlockNo = Number(lastBlockNo) + 1;
  for (let blockNo = lastBlockNo; blockNo <= lastNextBlockNo; blockNo++) {
    const blockBalance = await tokenBalanceBlock(compounding.coin_address, compounding.wallet_address, blockNo);

    console.log(blockBalance);
  }
  return "compoundingCoins";
}

const operate = async () => {
  for (const compounding of compoundings) {
    const compouMerge = await countCompound(compounding);
    finalCompoundingCoins = finalCompoundingCoins.concat(compouMerge);
  }
  return finalCompoundingCoins;
}

operate().then(response => {
  const tokenData = JSON.stringify(response);
  
  // fs.writeFile("assets/block_result.json", tokenData, function (err) {
  //   if (err) {
  //     return console.log(err);
  //   }
  //   console.log("compouding coin list fetched");
  // });
})