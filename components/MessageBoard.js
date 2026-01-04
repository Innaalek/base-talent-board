import { useState, useEffect } from "react";
import { ethers } from "ethers";

const contractAddress = "0x2E1476Ba7D284e931389710904569FFdd1eC10F1";

const abi = [
  "event MessagePosted(address indexed user, string message, uint256 timestamp)",
  "function postMessage(string calldata text) external",
  "function messages(uint256) public view returns (address user, string text, uint256 timestamp)",
  "function getMessagesCount() external view returns (uint256)",
  "function getLatestMessage() external view returns (tuple(address user, string text, uint256 timestamp))"
];

export default function MessageBoard() {
  const [contract, setContract] = useState(null);
  const [message, setMessage] = useState("");
  const [messagesList, setMessagesList] = useState([]);

  async function connectWallet() {
    if (!window.ethereum) {
      alert("Install MetaMask or Rabby first!");
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    await window.ethereum.request({ method: "eth_requestAccounts" });
    const signer = await provider.getSigner();

    const c = new ethers.Contract(contractAddress, abi, signer);
    setContract(c);
    loadAllMessages(c);

    // слушаем событие и добавляем новое сообщение в UI сразу
    c.on("MessagePosted", (user, text, timestamp) => {
      setMessagesList(prev => [
        {
          from: user,
          text,
          time: new Date(Number(timestamp) * 1000).toLocaleString()
        },
        ...prev
      ]);
    });
  }

  async function loadAllMessages(c) {
    const count = await c.getMessagesCount();
    const temp = [];

    for (let i = count - 1; i >= 0; i--) {
      const m = await c.messages(i);
      temp.push({
        from: m.user,
        text: m.text,
        time: new Date(Number(m.timestamp) * 1000).toLocaleString()
      });
    }

    setMessagesList(temp);
  }

  async function sendMessage() {
    if (!contract) {
      alert("Connect wallet first");
      return;
    }
    if (!message.trim()) return;

    const tx = await contract.postMessage(message);
    await tx.wait();
    setMessage("");
  }

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
        {messagesList.map((m, i) => (
          <li key={i}>
            <strong>{m.from.slice(0, 6)}...</strong>: {m.text} <em>({m.time})</em>
          </li>
        ))}
      </ul>
    </div>
  );
}
