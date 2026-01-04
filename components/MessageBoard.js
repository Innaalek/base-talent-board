import { useState } from "react";
import { ethers } from "ethers";

const contractAddress = "0x2E1476Ba7D284e931389710904569FFdd1eC10F1";

const abi = [
  {
    "inputs": [{ "internalType": "string", "name": "text", "type": "string" }],
    "name": "postMessage",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getMessages",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "from", "type": "address" },
          { "internalType": "string", "name": "text", "type": "string" },
          { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
        ],
        "internalType": "tuple[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "from", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "text", "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "NewMessage",
    "type": "event"
  }
];

export default function MessageBoard() {
  const [contract, setContract] = useState(null);
  const [input, setInput] = useState("");
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
    loadMessages(c);
  }

  async function loadMessages(c) {
    const data = await c.getMessages();
    setMessages(data.map(m => ({
      from: m.from,
      text: m.text,
      time: new Date(Number(m.timestamp) * 1000).toLocaleString()
    })));
  }

  async function publishMessage() {
    if (!contract || !input.trim()) return;
    const tx = await contract.postMessage(input);
    await tx.wait();
    setInput("");
    loadMessages(contract);
  }

  return (
    <div className="p-5 font-sans">
      <button className="border px-3 py-1" onClick={connectWallet}>
        Connect Wallet
      </button>

      <textarea
        className="w-full border p-2 mt-3"
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Write a message..."
      />

      <button className="border px-3 py-1 mt-2" onClick={publishMessage}>
        Publish
      </button>

      <h3 className="mt-4 text-lg font-bold">Messages on-chain:</h3>
      <ul className="mt-2 space-y-2">
        {messages.map((m, i) => (
          <li key={i} className="border p-2 rounded">
            <b>{m.from.slice(0, 6)}...</b> — {m.text} <i className="text-sm">({m.time})</i>
          </li>
        ))}
      </ul>
    </div>
  );
}
