import { useState, useEffect } from "react";
import { ethers } from "ethers";

const contractAddress = "0x0b4447778f4FE94C5a1ad10D3a3b4Fd3509d2A4D";

const abi = [
  "event MessagePosted(address indexed from, string text, uint256 timestamp)",
  "function postMessage(string calldata _text) external payable",
  "function getMessages() external view returns (tuple(address from, string text, uint256 timestamp)[])"
];

export default function MessageBoard() {
  const [contract, setContract] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  async function connectWallet() {
    if (!window.ethereum) {
      alert("Install MetaMask or Rabby!");
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const c = new ethers.Contract(contractAddress, abi, signer);
    setContract(c);
    subscribeToEvents(c);
    loadMessages(c);
  }

  function subscribeToEvents(c) {
    c.on("MessagePosted", (from, text, timestamp) => {
      setMessages(prev => [
        ...prev,
        { from, text, time: new Date(Number(timestamp) * 1000).toLocaleString() }
      ]);
    });
  }

  async function loadMessages(c) {
    const data = await c.getMessages();
    setMessages(data.map(m => ({
      from: m.from,
      text: m.text,
      time: new Date(Number(m.timestamp) * 1000).toLocaleString()
    })));
  }

  async function sendMessage() {
    if (!contract || !message.trim()) return;

    try {
      const tx = await contract.postMessage(message, {
        value: ethers.parseEther("0.0001")
      });
      await tx.wait();
      setMessage("");
    } catch (err) {
      alert("Transaction failed!");
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <button onClick={connectWallet}>Connect Wallet</button>

      <div style={{ marginTop: 20 }}>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Write a message..."
          style={{ width: "100%", padding: 10 }}
        />
        <button onClick={sendMessage}>Publish</button>
      </div>

      <h3>Messages on-chain:</h3>
      <ul>
        {messages.map((m, i) => (
          <li key={i}>
            <b>{m.from.slice(0, 6)}...</b>: {m.text} <i>({m.time})</i>
          </li>
        ))}
      </ul>
    </div>
  );
}
