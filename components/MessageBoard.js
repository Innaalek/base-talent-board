import { useState, useEffect } from "react";
import { ethers } from "ethers";

const contractAddress = "0x0b4447778f4FE94C5a1ad10D3a3b4Fd3509d2A4D";

const abi = [
  "event MessagePosted(address indexed user, string message, uint256 timestamp)",
  "function postMessage(string calldata _text) external",
  "function messages(uint256) view returns (address user, string text, uint256 timestamp)",
  "function getMessagesCount() external view returns (uint256)",
  "function getLatestMessage() external view returns (tuple(address user, string text, uint256 timestamp))"
];

export default function MessageBoard() {
  const [contract, setContract] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  async function connectWallet() {
    if (!window.ethereum) {
      alert("Install MetaMask or Rabby first!");
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const c = new ethers.Contract(contractAddress, abi, signer);
    setContract(c);
    loadMessages(c);
  }

  async function loadMessages(c) {
    if (!c) return;
    const count = await c.getMessagesCount();
    const temp = [];
    for (let i = 0; i < count; i++) {
      const m = await c.messages(i);
      temp.push({
        from: m.user,
        text: m.text,
        time: new Date(Number(m.timestamp) * 1000).toLocaleString()
      });
    }
    setMessages(temp);
  }

  async function sendMessage() {
    if (!contract) {
      alert("Connect wallet first");
      return;
    }
    if (!message.trim()) return;

    try {
      const tx = await contract.postMessage(message, {
        value: ethers.parseEther("0.000005")
      });
      await tx.wait();
      setMessage("");
      loadMessages(contract);
    } catch (err) {
      alert("Transaction failed");
    }
  }

  useEffect(() => {
    if (!contract) return;
    contract.on("MessagePosted", (from, text, timestamp) => {
      setMessages((prev) => [
        ...prev,
        {
          from,
          text,
          time: new Date(Number(timestamp) * 1000).toLocaleString()
        }
      ]);
    });

    return () => contract.removeAllListeners();
  }, [contract]);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <button onClick={connectWallet}>Connect Wallet</button>

      <div style={{ marginTop: "20px" }}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write a message..."
          style={{ width: "100%", padding: "10px" }}
        />
        <button onClick={sendMessage}>Publish</button>
      </div>

      <h3>Messages on-chain:</h3>
      <ul>
        {messages.map((m, i) => (
          <li key={i}>
            <strong>{m.from.slice(0, 6)}...</strong>: {m.text} <em>({m.time})</em>
          </li>
        ))}
      </ul>
    </div>
  );
}
