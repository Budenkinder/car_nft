import React, { useState } from "react";

function App() {
  const [carId, setCarId] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [vin, setVin] = useState("");
  const [issue, setIssue] = useState("");
  const [shop, setShop] = useState("");
  const [txHash, setTxHash] = useState("");
  const [walletAddress, setWalletAddress] = useState("");

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWalletAddress(accounts[0]);
        console.log("Connected account:", accounts[0]);
      } catch (err) {
        console.error("User rejected wallet connection", err);
      }
    } else {
      alert("MetaMask not detected. Please install it.");
    }
  };

  const handleSubmit = () => {
    console.log("Submitting repair record:", {
      carId, make, model, year, vin, issue, shop
    });
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Car Repair NFT</h1>
      <button onClick={connectWallet}>Connect Wallet</button>
      {walletAddress && <p>Connected: {walletAddress}</p>}
      <div>
        <input placeholder="Car ID" value={carId} onChange={e => setCarId(e.target.value)} />
        <input placeholder="Make" value={make} onChange={e => setMake(e.target.value)} />
        <input placeholder="Model" value={model} onChange={e => setModel(e.target.value)} />
        <input placeholder="Year" value={year} onChange={e => setYear(e.target.value)} />
        <input placeholder="VIN" value={vin} onChange={e => setVin(e.target.value)} />
        <input placeholder="Issue Fixed" value={issue} onChange={e => setIssue(e.target.value)} />
        <input placeholder="Repair Shop" value={shop} onChange={e => setShop(e.target.value)} />
        <button onClick={handleSubmit}>Submit Repair</button>
      </div>
      {txHash && (
        <p>
          Transaction sent:{" "}
          <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer">
            {txHash}
          </a>
        </p>
      )}
    </div>
  );
}

export default App;
