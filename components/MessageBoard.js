import { useState, useEffect } from "react";
import { ethers } from "ethers";

const contractAddress = "ТВОЙ_КОНТРАКТ_АДРЕС";

const abi = [
  "event MessagePosted(address indexed user, string message, uint256 timestamp)",
  "function postMessage(string _text) external",
  "function getMessages() external view returns (tuple(address user, string text, uint256 timestamp)[])"
];

export default function MessageBoard() {
  const [contract, setContract] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  // 🔹 Автозагрузка сообщений
  useEffect(() => {
    loadMessagesReadonly();
  }, []);

  async function loadMessagesReadonly() {
    if (!window.ethereum) return;

    const provider = new ethers.BrowserProvider(window.ethereum);
    const c = new ethers.Contract(contractAddress, abi, provider);

    const data = await c.getMessages();
    setMessages(
      data.map(m => ({
        user: m.user,
        text: m.text,
        time: new Date(Number(m.timestamp) * 1000).toLocaleString()
      }))
    );
  }

  async function connectWallet() {
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

    const tx = await contract.postMessage(message);
    await tx.wait();

    setMessage("");
    loadMessagesReadonly(); // 🔹 обновляем список
  }

  return (
    <div style={{ padding: 20 }}>
      <button onClick={connectWallet}>Connect Wallet</button>

      <textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Write a message..."
        style={{ width: "100%", marginTop: 10 }}
      />

      <button onClick={publishMessage}>Publish</button>

      <h3>Messages on-chain:</h3>
      <ul>
        {messages.map((m, i) => (
          <li key={i}>
            <b>{m.user.slice(0,6)}...</b>: {m.text} ({m.time})
          </li>
        ))}
      </ul>
    </div>
  );
}
