import { useState, useEffect } from "react";
import { ethers } from "ethers";

const contractAddress = "0x0b4447778f4FE94C5a1ad10D3a3b4Fd3509d2A4D";
const abi = [
  "event MessagePosted(address indexed user, string message, uint256 timestamp)",
  "function postMessage(string _text) external",
  "function getMessagesCount() external view returns (uint256)",
  "function getLatestMessage() external view returns (tuple(address user, string text, uint256 timestamp))"
];

export default function MessageBoard() {
  const [contract, setContract] = useState(null);
  const [message, setMessage] = useState("");
  const [latestMessage, setLatestMessage] = useState(null);
  const [count, setCount] = useState(0);

  // Автозагрузка количества и последнего сообщения
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const c = new ethers.Contract(contractAddress, abi, provider);

      const total = await c.getMessagesCount();
      setCount(Number(total));

      if (total > 0) {
        const last = await c.getLatestMessage();
        setLatestMessage({
          user: last[0],
          text: last[1],
          time: new Date(Number(last[2]) * 1000).toLocaleString()
        });
      }
    } catch (err) {
      console.error("Load error:", err);
    }
  }

  async function connectWallet() {
    if (!window.ethereum) {
      alert("Install wallet!");
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const c = new ethers.Contract(contractAddress, abi, signer);

    setContract(c);
  }

  async function publishMessage() {
    if (!contract) {
      alert("Connect wallet first");
      return;
    }

    try {
      const tx = await contract.postMessage(message);
      await tx.wait();
      setMessage("");
      loadData(); // обновляем данные после публикации
    } catch (err) {
      console.error("Publish error:", err);
      alert("Transaction failed or wrong network");
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <button onClick={connectWallet}>Connect Wallet</button>

      <div style={{ marginTop: 20 }}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write a message..."
          style={{ width: "100%", padding: 10 }}
        />

        <button onClick={publishMessage} style={{ marginTop: 10 }}>
          Publish
        </button>
      </div>

      <h3>Messages on-chain:</h3>
      <p><b>Total messages:</b> {count}</p>

      {latestMessage && (
        <p>
          <b>Last from {latestMessage.user.slice(0,6)}...</b>:  
          {latestMessage.text} ({latestMessage.time})
        </p>
      )}
    </div>
  );
}
