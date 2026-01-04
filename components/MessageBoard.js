import { useState, useEffect } from "react";
import { ethers } from "ethers";

const contractAddress = "0x2E1476Ba7D284e931389710904569FFdd1eC10F1";

const abi = [
  "event NewMessage(address indexed from, string text, uint256 timestamp)",
  "function postMessage(string calldata text) external",
  "function getMessages() public view returns (tuple(address from, string text, uint256 timestamp)[])"
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
    const chainId = (await provider.getNetwork()).chainId;

    if (chainId !== 8453) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x2105" }],
        });
      } catch (err) {
        alert("Please switch to Base Mainnet in your wallet");
        return;
      }
    }

    const signer = await provider.getSigner();
    const c = new ethers.Contract(contractAddress, abi, signer);
    setContract(c);
    loadMessages(c);
  }

  async function loadMessages(c) {
    if (!c) return;
    const msgs = await c.getMessages();
    const formatted = msgs.map((m) => ({
      from: m.from,
      text: m.text,
      time: new Date(Number(m.timestamp) * 1000).toLocaleString(),
    }));
    setMessages(formatted);
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
    loadMessages(contract);
  }

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <button onClick={connectWallet}>
        Connect Wallet
      </button>

      <div style={{ marginTop: "20px" }}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write a message..."
          style={{ width: "100%", padding: "10px" }}
        />
        <button onClick={sendMessage}>
          Publish
        </button>
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
