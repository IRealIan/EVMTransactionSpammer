const { ethers } = require("ethers");

// Global variables
let provider;
let contract;
let user;

// Test settings
TRANSACTIONS_AMOUNT = 600;
STRING_SIZE = 5000;

// Store Contract ABI
const StoreAbi = [
	{
		"inputs": [],
		"name": "store",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_s",
				"type": "string"
			}
		],
		"name": "storeString",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
];


// Initialize ethersjs, contracts and wallets
async function init() {
    return new Promise((resolve, reject) => {
        provider = new ethers.providers.WebSocketProvider("ws://127.0.0.1:9944/");
        
        // Wallets
        user = new ethers.Wallet("0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133", provider);

        // Contract
        contract = new ethers.Contract("0x3ed62137c5DB927cb137c26455969116BF0c23Cb", StoreAbi, provider);
         
        resolve(true);
    });
}


// ====== CONTRACT CALLS ========
async function sendEth(signer, receiver, amount = '0.5') {
    const tx = await signer.sendTransaction({
        to: receiver,
        value: ethers.utils.parseEther(amount)
    });
    console.log('Transaction done. ', tx);
}

// Store a string in the smartcontract.
// @param string
// @param transactionId : number associated with the transaction (transactions are ordered to avoid nonce issue)
async function saveString(string, transactionId) {
    let gasEstimate;
    let transaction = await contract.populateTransaction.storeString(string);    
    try{
        gasEstimate = await provider.estimateGas(transaction);
        console.log(`Gas needed estimed (${gasEstimate}).`)
    }catch(err){
        console.log('Error during gas estimation: ', err?.error?.message);
    }
    transaction.gasLimit = gasEstimate;
    transaction.nonce = (await provider.getTransactionCount(user.address, "latest"))+ transactionId;
    const populatedTransaction = await user.populateTransaction(transaction)
    console.log(`Executing transaction on wallet ${user.address} with nonce ${populatedTransaction.nonce}.`);
    const signedTransaction = await user.signTransaction(populatedTransaction);
    // console.log('Parsed transaction ready to be send : ', ethers.utils.parseTransaction(signedTransaction));

    await provider.sendTransaction(signedTransaction);
    console.log(`Signed transaction sent !`);
}

// ====== STRING UTILS ========
function generateString(n) {
    let string = '';
    for(let i = 0; i < n; i++)
        string+='a';
    return string; 
}


// ====== MAIN FUNCTION ========
async function test() {
    let promises = [];
    await init();

    // Generate multiple transactions at the same time
    let string = generateString(STRING_SIZE);
    for(let i = 0; i < TRANSACTIONS_AMOUNT; i++)
        promises.push(saveString(string, i));
    
    Promise.all(promises).then(success => {
        console.log('Success.');
        console.log(`${TRANSACTIONS_AMOUNT} transactions (each storing ${STRING_SIZE} characters) have been done in parallel.`);
    }).catch(e => {
        console.log('Test failed.');
    });
    return;

    // Send ETH to an address
    // await sendEth(user, 'RECEIVER_ADDRESS');
}

test();