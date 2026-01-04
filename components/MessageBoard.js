import { useState, useEffect } from "react";
import { ethers } from "ethers";

const contractAddress = "0x2E1476Ba7D284e931389710904569FFdd1eC10F1";

const abi = [
  "event MessagePosted(address indexed user, string message, uint256 timestamp)",
  "function postMessage(string calldata _text) external",
  "function getLatestMessage() external view returns (tuple(address user, string text, uint256 timestamp))",
  "function getMessagesCount() external view returns (uint256)"
];

export default function MessageBoard() {
  const [contract, setContract] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  async function sendMessage() {
    if (!contract) {
      alert("Connect wallet first");
      return;
    }
    if (!message.trim()) return;

    try {
      const tx = await contract.postMessage(message);
      await tx.wait();
      setMessage("");
    } catch (err) {
      alert("Transaction failed: " + err.message);
    }
  }

  async function connectWallet() {
    if (!window.ethereum) {
      alert("Install MetaMask or Rabby!");
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const c = new ethers.Contract(contractAddress, abi, signer);
    setContract(c);
  }

  useEffect(() => {
    if (!contract) return;

    const handler = (user, text, timestamp) => {
      setMessages(prev => [
        { from: user, text, time: new Date(Number(timestamp) * 1000).toLocaleString() },
        ...prev
      ]);
    };

    contract.on("MessagePosted", handler);

    return () => {
      contract.off("MessagePosted", handler);
    };
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
